import { useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Loader2, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import {
    useAddAccountingAccountMutation,
    useGetAccountingAccountsQuery,
} from '@/features/accounting/accountingQueries';
import { accountingService } from '@/features/accounting/accountingService';
import { NestedAccountSelect } from '@/components/accounting/NestedAccountSelect';
import type { ChartOfAccount } from '@/types/accounting.types';

const BANK_RE = /bank/i;
const bankInName = (a?: ChartOfAccount | null): boolean => !!a && BANK_RE.test(a.name || '');

/**
 * Creates a bank account in the Chart of Accounts. The Bank Accounts list shows
 * ASSET accounts that have "Bank" in their name or ancestry, so this modal
 * guarantees the new account is placed under a bank group (creating a
 * "Bank Accounts" group if none exists) — it will always appear in the list.
 */
export function AddBankAccountModal() {
    const [open, setOpen] = useState(false);
    const [accountName, setAccountName] = useState('');
    const [parentId, setParentId] = useState<number | null>(null);
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [code, setCode] = useState('');

    const { data: accountsData } = useGetAccountingAccountsQuery({ page: 1, limit: 1000 });
    const { mutateAsync: addAccount, isPending } = useAddAccountingAccountMutation();

    const accounts: ChartOfAccount[] = accountsData?.data ?? [];

    // Default parent = an existing bank group (ASSET, "bank" in name, has children).
    const defaultBankParent = useMemo(() => {
        const accs = accountsData?.data ?? [];
        const hasChildren = new Set<number>();
        accs.forEach((a) => { if (a.parent_id) hasChildren.add(a.parent_id); });
        return accs.find((a) => a.type === 'ASSET' && bankInName(a) && hasChildren.has(a.id)) || null;
    }, [accountsData]);

    // True if `id` or any of its ancestors has "Bank" in the name.
    const isInBankLineage = (id: number | null): boolean => {
        if (!id) return false;
        const byId = new Map(accounts.map((a) => [a.id, a]));
        let cur: ChartOfAccount | undefined = byId.get(id);
        while (cur) {
            if (bankInName(cur)) return true;
            cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
        }
        return false;
    };

    // Find an existing bank group, or create a "Bank Accounts" group; return its id.
    const ensureBankGroup = async (): Promise<number> => {
        const hasChildren = new Set<number>();
        accounts.forEach((a) => { if (a.parent_id) hasChildren.add(a.parent_id); });
        const existing =
            accounts.find((a) => a.type === 'ASSET' && bankInName(a) && hasChildren.has(a.id)) ||
            accounts.find((a) => a.type === 'ASSET' && bankInName(a));
        if (existing) return existing.id;

        const codeRes = await accountingService.getNextAccountCode({ type: 'ASSET' });
        const res = await addAccount({
            name: 'Bank Accounts',
            code: codeRes?.data?.code || '',
            type: 'ASSET',
            description: 'Bank accounts group',
            is_active: true,
        } as Partial<ChartOfAccount>);
        const newId = (res as unknown as { data?: { id?: number } })?.data?.id;
        if (!newId) throw new Error('Could not create the "Bank Accounts" group');
        return newId;
    };

    const fetchCode = (pid: number | null) => {
        const params = pid ? { parent_id: pid } : { type: 'ASSET' };
        accountingService
            .getNextAccountCode(params)
            .then((res) => setCode(res?.data?.code || ''))
            .catch(() => setCode(''));
    };

    // On open: default the parent (if a bank group exists) + pre-fetch the code.
    // On close: reset the form.
    useEffect(() => {
        if (!open) {
            setAccountName('');
            setParentId(null);
            setDescription('');
            setIsActive(true);
            setCode('');
            return;
        }
        if (!parentId && defaultBankParent) setParentId(defaultBankParent.id);
        if (!code) fetchCode(parentId ?? defaultBankParent?.id ?? null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleParentChange = (id: number | null) => {
        setParentId(id);
        setCode('');
        fetchCode(id);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Guarantee the account appears in the Bank Accounts list by ensuring
            // a bank-named ancestor. If the chosen parent isn't in a bank lineage,
            // place it under a (possibly new) "Bank Accounts" group.
            let targetParentId = parentId;
            if (!isInBankLineage(targetParentId)) {
                targetParentId = await ensureBankGroup();
            }
            let finalCode = code;
            if (targetParentId && targetParentId !== parentId) {
                const r = await accountingService.getNextAccountCode({ parent_id: targetParentId });
                finalCode = r?.data?.code || code;
            }
            await addAccount({
                name: accountName,
                code: finalCode,
                type: 'ASSET',
                ...(targetParentId ? { parent_id: targetParentId } : {}),
                description: description || null,
                is_active: isActive,
            } as Partial<ChartOfAccount>);
            toast.success('Bank account created successfully');
            setOpen(false);
        } catch (err) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                || (err instanceof Error ? err.message : null)
                || 'Failed to create bank account';
            toast.error(msg);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5 py-2.5 font-medium shadow-lg transition-all active:scale-95">
                    <Plus size={18} /> Add Bank Account
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-primary" /> Add Bank Account
                    </DialogTitle>
                    <DialogDescription>
                        Creates a bank account in the Chart of Accounts. It is placed under a bank group so it always appears in this list.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="accountName">Account Name *</Label>
                        <Input
                            id="accountName"
                            placeholder="e.g., City Bank — Main Branch"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Parent Account</Label>
                        <NestedAccountSelect
                            value={parentId}
                            onChange={(id) => handleParentChange(id)}
                            placeholder="Defaults to your bank group — change if needed..."
                            filterType={["ASSET"]}
                        />
                        <p className="text-xs text-muted-foreground">
                            The account is grouped under a bank parent so it shows in the Bank Accounts list.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">GL Code</Label>
                            <Input
                                id="code"
                                value={code}
                                readOnly
                                placeholder="auto"
                                className="bg-muted font-mono cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={isActive ? 'active' : 'inactive'} onValueChange={(v) => setIsActive(v === 'active')}>
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            placeholder="Optional notes (e.g., account purpose)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <Separator />

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending || !accountName.trim()}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Add Bank Account'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
