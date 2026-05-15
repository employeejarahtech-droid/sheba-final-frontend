import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useGetAccountingAccountsQuery } from "@/features/accounting/accountingQueries";
import type { ChartOfAccount } from "@/types/accounting.types";

interface TreeNode {
    account: ChartOfAccount;
    children: TreeNode[];
}

function buildTree(accounts: ChartOfAccount[]): TreeNode[] {
    const map = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];

    accounts.forEach((acc) => {
        map.set(acc.id, { account: acc, children: [] });
    });

    accounts.forEach((acc) => {
        const node = map.get(acc.id)!;
        if (acc.parent_id && map.has(acc.parent_id)) {
            map.get(acc.parent_id)!.children.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
}

function flattenTree(nodes: TreeNode[], depth = 0): { account: ChartOfAccount; depth: number }[] {
    const result: { account: ChartOfAccount; depth: number }[] = [];
    nodes.forEach((node) => {
        result.push({ account: node.account, depth });
        result.push(...flattenTree(node.children, depth + 1));
    });
    return result;
}

interface NestedAccountSelectProps {
    value?: number | null;
    onChange: (id: number | null, account: ChartOfAccount | null) => void;
    placeholder?: string;
    filterType?: string[];
    leafOnly?: boolean;
}

export function NestedAccountSelect({
    value,
    onChange,
    placeholder = "Select account",
    filterType,
    leafOnly = false,
}: NestedAccountSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const { data: accountsData } = useGetAccountingAccountsQuery({
        page: 1,
        limit: 500,
    });

    const flatList = useMemo(() => {
        let accounts = accountsData?.data || [];

        if (filterType && filterType.length > 0) {
            const allowedIds = new Set<number>();
            const allowedParentIds = new Set<number>();

            // Collect matching accounts and all their ancestors
            const collect = (accs: ChartOfAccount[]) => {
                accs.forEach((acc) => {
                    if (filterType.includes(acc.type?.toUpperCase())) {
                        allowedIds.add(acc.id);
                        if (acc.parent_id) allowedParentIds.add(acc.parent_id);
                    }
                });
            };
            collect(accounts);

            // Resolve ancestor chain
            const idMap = new Map(accounts.map((a) => [a.id, a]));
            const resolveAncestors = (id: number) => {
                const acc = idMap.get(id);
                if (acc && acc.parent_id && !allowedIds.has(acc.parent_id)) {
                    allowedIds.add(acc.parent_id);
                    resolveAncestors(acc.parent_id);
                }
            };
            allowedIds.forEach(resolveAncestors);

            accounts = accounts.filter((a) => allowedIds.has(a.id));
        }

        const tree = buildTree(accounts);
        const flat = flattenTree(tree);

        if (leafOnly) {
            const parentIds = new Set(
                accounts.filter((a) => a.parent_id === null || accounts.some((c) => c.parent_id === a.id)).map((a) => a.id)
            );
            // Keep items that have no children in the tree
            const hasChildren = new Set<number>();
            accounts.forEach((a) => {
                if (a.parent_id) hasChildren.add(a.parent_id);
            });
            return flat.filter((f) => !hasChildren.has(f.account.id));
        }

        return flat;
    }, [accountsData, filterType, leafOnly]);

    const filtered = useMemo(() => {
        if (!search) return flatList;
        const q = search.toLowerCase();
        return flatList.filter(
            (f) =>
                f.account.name.toLowerCase().includes(q) ||
                f.account.code.toLowerCase().includes(q) ||
                f.account.type?.toLowerCase().includes(q)
        );
    }, [flatList, search]);

    const selectedAccount = flatList.find((f) => f.account.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                >
                    {selectedAccount ? (
                        <span className="truncate">
                            {selectedAccount.account.code} — {selectedAccount.account.name}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                        className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                        placeholder="Search by code, name, or type..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div
                    className="max-h-[300px] overflow-y-auto p-1"
                    onWheel={(e) => e.stopPropagation()}
                >
                    {filtered.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No account found.</p>
                    ) : (
                        filtered.map((item) => (
                            <button
                                key={item.account.id}
                                type="button"
                                className={cn(
                                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                    value === item.account.id && "bg-accent"
                                )}
                                style={{ paddingLeft: `${item.depth * 20 + 8}px` }}
                                onClick={() => {
                                    onChange(item.account.id, item.account);
                                    setOpen(false);
                                    setSearch("");
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4 shrink-0",
                                        value === item.account.id ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {item.depth > 0 && (
                                    <span className="mr-1 text-muted-foreground text-xs">└</span>
                                )}
                                <span className="font-mono text-xs text-muted-foreground mr-1.5">
                                    {item.account.code}
                                </span>
                                <span className="truncate">{item.account.name}</span>
                                <span className="ml-auto text-[10px] text-muted-foreground uppercase tracking-wider">
                                    {item.account.type}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
