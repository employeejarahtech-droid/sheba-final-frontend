import { Header } from '@/components/layout/header'
import { TopNav } from '@/components/layout/top-nav'
import { topNav } from '@/data/data'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from '@/components/DataTable'
import { useState, useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Database, Check, ChevronsUpDown } from 'lucide-react'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default function DatabaseBrowser() {
    const [selectedTable, setSelectedTable] = useState<string>("");
    const [page, setPage] = useState(1);
    const [open, setOpen] = useState(false);
    const token = getCookie('accessToken');

    // Fetch Tables
    const { data: tablesData, isLoading: isLoadingTables } = useQuery({
        queryKey: ["db-tables"],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/database/tables`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch tables");
            return res.json();
        },
        enabled: !!token
    });

    const tables = tablesData?.data || [];

    // Fetch Table Data
    const { data: tableData, isLoading: isLoadingData } = useQuery({
        queryKey: ["db-table-data", selectedTable, page],
        queryFn: async () => {
            if (!selectedTable) return { data: { items: [], meta: { total: 0, page: 1, limit: 10 } } };
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/database/tables/${selectedTable}?page=${page}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch table data");
            const json = await res.json();
            return { data: json.data }; // Match structure expected by useQuery
        },
        enabled: !!selectedTable && !!token
    });

    const rows = tableData?.data?.items || [];
    const meta = tableData?.data?.meta || { total: 0, page: 1, limit: 10 };

    // Generate columns dynamically from the first row keys (jQuery DataTables format)
    const columns = useMemo(() => {
        if (!rows.length) return [];
        const firstRow = rows[0];
        return Object.keys(firstRow).map((key) => ({
            data: key,
            title: key,
            orderable: true,
            render: (data: any, _type: string, _row: any) => {
                if (typeof data === 'object' && data !== null) {
                    return JSON.stringify(data);
                }
                return String(data ?? "");
            },
            defaultContent: "",
        }));
    }, [rows]);

    return (
        <>
            <Header fixed>
                <TopNav links={topNav} />
                <div className='ms-auto flex items-center space-x-4'>
                    <Search />
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>

            <main className='p-6 lg:p-10'>
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Database className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Database Browser</h1>
                        <p className="text-muted-foreground">View and inspect database tables</p>
                    </div>
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Select Table</CardTitle>
                        <CardDescription>Choose a table to view its records</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-w-md">
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-full justify-between"
                                    >
                                        {selectedTable
                                            ? tables.find((t: string) => t === selectedTable)
                                            : "Select table..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search table..." />
                                        <CommandList>
                                            <CommandEmpty>No table found.</CommandEmpty>
                                            <CommandGroup>
                                                {isLoadingTables ? (
                                                    <div className="p-2 flex justify-center"><Loader2 className="animate-spin h-4 w-4" /></div>
                                                ) : (
                                                    tables.map((table: string) => (
                                                        <CommandItem
                                                            key={table}
                                                            value={table}
                                                            onSelect={(currentValue) => {
                                                                setSelectedTable(currentValue === selectedTable ? "" : currentValue)
                                                                setOpen(false)
                                                                setPage(1) // Reset page on table change
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedTable === table ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {table}
                                                        </CommandItem>
                                                    ))
                                                )}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </CardContent>
                </Card>

                {selectedTable && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Data: {selectedTable}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoadingData ? (
                                <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
                            ) : (
                                <div className="rounded-md border">
                                    <DataTable
                                        columns={columns}
                                        data={rows}
                                        meta={meta}
                                        onPageChange={setPage}
                                        search=""
                                        onSearchChange={() => { }}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </main>
        </>
    )
}
