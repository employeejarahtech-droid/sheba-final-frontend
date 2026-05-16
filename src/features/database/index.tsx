import { AppHeader } from '@/components/layout/app-header'

import { DataTable } from '@/components/DataTable'
import { useState, useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Database, Check, ChevronsUpDown, HardDrive, Table2, Layers } from 'lucide-react'
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

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function DatabaseBrowser() {
    const [selectedTable, setSelectedTable] = useState<string>("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [open, setOpen] = useState(false);
    const token = getCookie('accessToken');

    // Fetch Database Stats
    const { data: statsData } = useQuery({
        queryKey: ["db-stats"],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/database/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch stats");
            return res.json();
        },
        enabled: !!token
    });

    const stats = statsData?.data;

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
        queryKey: ["db-table-data", selectedTable, page, limit],
        queryFn: async () => {
            if (!selectedTable) return { data: { items: [], meta: { total: 0, page: 1, limit } } };
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/database/tables/${selectedTable}?page=${page}&limit=${limit}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch table data");
            const json = await res.json();
            return { data: json.data };
        },
        enabled: !!selectedTable && !!token
    });

    const rows = tableData?.data?.items || [];
    const meta = tableData?.data?.meta || { total: 0, page: 1, limit: 10 };

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
            <AppHeader fixed />

            <main className='p-4'>
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Database className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Database Browser</h1>
                        <p className="text-muted-foreground">View and inspect database tables</p>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Database Size */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 p-6 shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
                        <div className="relative flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Database Size</p>
                                <h3 className="mt-2 text-2xl font-bold text-white">
                                    {stats ? `${stats.size_mb} MB` : '—'}
                                </h3>
                            </div>
                            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                <HardDrive className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="relative flex justify-between text-white/90 text-sm">
                            <span>{stats?.database || 'Loading...'}</span>
                            <span className="font-semibold">{stats ? formatBytes(stats.size_bytes) : ''}</span>
                        </div>
                    </div>

                    {/* Total Tables */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-violet-400 p-6 shadow-lg shadow-violet-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
                        <div className="relative flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Total Tables</p>
                                <h3 className="mt-2 text-2xl font-bold text-white">
                                    {stats?.total_tables ?? '—'}
                                </h3>
                            </div>
                            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                <Table2 className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="relative flex justify-between text-white/90 text-sm">
                            <span>MySQL</span>
                            <span className="font-semibold">Tables</span>
                        </div>
                    </div>

                    {/* Total Rows */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 p-6 shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
                        <div className="relative flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Total Rows</p>
                                <h3 className="mt-2 text-2xl font-bold text-white">
                                    {stats?.tables ? stats.tables.reduce((sum: number, t: any) => sum + (Number(t.rows) || 0), 0).toLocaleString() : '—'}
                                </h3>
                            </div>
                            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                <Layers className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="relative flex justify-between text-white/90 text-sm">
                            <span>Across all</span>
                            <span className="font-semibold">Records</span>
                        </div>
                    </div>
                </div>

                {/* Table Selector */}
                <div className="rounded-md border overflow-hidden mb-4">
                    <div className="p-4 bg-card">
                        <div className="max-w-md w-full">
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
                                                                setPage(1)
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
                    </div>
                </div>

                {selectedTable && (
                    <div>
                        {isLoadingData ? (
                            <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={rows}
                                meta={meta}
                                onPageChange={setPage}
                                onLimitChange={(newLimit) => {
                                    setLimit(newLimit);
                                    setPage(1);
                                }}
                                search=""
                                onSearchChange={() => { }}
                                filterSlot={<h3 className="text-sm font-medium">Data: {selectedTable}</h3>}
                            />
                        )}
                    </div>
                )}
            </main>
        </>
    )
}
