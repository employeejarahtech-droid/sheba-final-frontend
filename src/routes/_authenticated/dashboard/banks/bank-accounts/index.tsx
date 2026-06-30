import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { AppHeader } from '@/components/layout/app-header';
import { DataTable } from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Wallet, Landmark, AlertTriangle } from 'lucide-react';
import { AddBankAccountModal } from '@/components/banks/AddBankAccountModal';
import { useCurrency } from '@/hooks/use-currency';
import {
    useGetAccountingAccountsQuery,
    useGetTrialBalanceQuery,
} from '@/features/accounting/accountingQueries';
import type { ChartOfAccount } from '@/types/accounting.types';

export const Route = createFileRoute('/_authenticated/dashboard/banks/bank-accounts/')({
    component: BankAccountsPage,
})

type TrialItem = { id: number; debit?: string | number; credit?: string | number };

type BankAccount = {
    id: number;
    name: string;
    code: string;
    isActive: boolean;
    isProtected: boolean;
    balance: number;
};

const fmt = (n: number) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function BankAccountsPage() {
    const { currencySymbol } = useCurrency();
    const [search, setSearch] = useState('');

    // Bank accounts live in the Chart of Accounts: ASSET accounts under the
    // "Bank Balances" (code 1200) group. Balances come from the trial balance
    // (the journal) — the same source the rest of accounting uses.
    const { data: accountsData, isLoading: accountsLoading } = useGetAccountingAccountsQuery({ page: 1, limit: 1000 });
    const { data: trialBalanceData, isLoading: tbLoading } = useGetTrialBalanceQuery();
    const isLoading = accountsLoading || tbLoading;

    const bankAccounts: BankAccount[] = useMemo(() => {
        const accounts: ChartOfAccount[] = accountsData?.data ?? [];
        const trialItems: TrialItem[] =
            ((trialBalanceData as { trial_balance?: TrialItem[] } | undefined)?.trial_balance) ?? [];

        // A "bank account" is any ASSET account that has "Bank" in its own name
        // OR in an ancestor's name. This is robust across chart variants
        // (1100 "Bank", 1200 "Bank Balances", 1210 "Bank — Operating Account",
        // a user-created "City Bank", or any account nested under a bank group).
        const byId = new Map(accounts.map((a) => [a.id, a]));
        const bankInName = (a?: ChartOfAccount | null) => !!a && /bank/i.test(a.name || '');
        const hasBankAncestor = (a: ChartOfAccount): boolean => {
            let cur: ChartOfAccount | undefined = a.parent_id ? byId.get(a.parent_id) : undefined;
            while (cur) {
                if (bankInName(cur)) return true;
                cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
            }
            return false;
        };

        const balanceById = new Map<number, number>();
        for (const it of trialItems) {
            balanceById.set(it.id, parseFloat(String(it.debit ?? 0)) - parseFloat(String(it.credit ?? 0)));
        }

        return accounts
            .filter((a) => a.type?.toUpperCase() === 'ASSET' && (bankInName(a) || hasBankAncestor(a)))
            .map((a) => ({
                id: a.id,
                name: a.name,
                code: a.code,
                isActive: a.is_active !== false,
                isProtected: !!a.is_protected,
                balance: balanceById.get(a.id) ?? 0,
            }))
            .sort((a, b) => a.code.localeCompare(b.code));
    }, [accountsData, trialBalanceData]);

    const filtered = useMemo(() => {
        if (!search.trim()) return bankAccounts;
        const q = search.toLowerCase();
        return bankAccounts.filter((a) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q));
    }, [bankAccounts, search]);

    const totalBalance = bankAccounts.reduce((s, a) => s + a.balance, 0);
    const activeCount = bankAccounts.filter((a) => a.isActive).length;
    const inactiveCount = bankAccounts.length - activeCount;

    const stats = useMemo(() => [
        { label: 'Bank Accounts', value: String(bankAccounts.length), icon: Building2, color: '#3B82F6' },
        { label: 'Total Balance', value: `${currencySymbol} ${fmt(totalBalance)}`, icon: Wallet, color: '#10B981' },
        { label: 'Active', value: String(activeCount), icon: Landmark, color: '#8B5CF6' },
        { label: 'Inactive', value: String(inactiveCount), icon: AlertTriangle, color: '#F59E0B' },
    ], [bankAccounts.length, totalBalance, activeCount, inactiveCount, currencySymbol]);

    const columns = [
        {
            data: 'code',
            title: 'Code',
            render: (d: number | string) => `<span class="font-mono text-xs text-muted-foreground">${d}</span>`,
        },
        {
            data: 'name',
            title: 'Account',
            render: (_d: unknown, _type: string, row: BankAccount) =>
                `<span class="font-medium">${row.name}</span>${row.isProtected ? '<span class="ml-2 text-[10px] font-semibold text-amber-600">Protected</span>' : ''}`,
        },
        {
            data: 'balance',
            title: 'Balance',
            className: 'text-right',
            render: (d: number | string) => {
                const v = Number(d) || 0;
                return `<span class="font-mono font-semibold ${v < 0 ? 'text-red-600' : ''}">${currencySymbol} ${fmt(v)}</span>`;
            },
        },
        {
            data: 'isActive',
            title: 'Status',
            render: (d: boolean) => d
                ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Active</span>'
                : '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Inactive</span>',
        },
        {
            data: null,
            title: 'Actions',
            orderable: false,
            render: (_d: unknown, _type: string, row: BankAccount) => `
                <div class="flex gap-2 justify-end">
                    <a href="/dashboard/accounting/reports/ledger?account_id=${row.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors">Ledger</a>
                    <a href="/dashboard/accounting/accounts" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition-colors">Edit</a>
                </div>`,
        },
    ]

    return (
        <>
            <AppHeader fixed />

            <main className="">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={index} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: stat.color }}>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-white rounded-lg shadow-lg">
                                            <Icon className="w-4 h-4" style={{ color: stat.color }} />
                                        </div>
                                        <CardTitle className="text-sm font-semibold text-white/90">{stat.label}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <DataTable
                    tableTitle="Bank Accounts List"
                    columns={columns}
                    data={filtered}
                    meta={{ total: filtered.length, page: 1, limit: 100 }}
                    search={search}
                    onSearchChange={setSearch}
                    isLoading={isLoading}
                    filterSlot={<AddBankAccountModal />}
                />
            </main>
        </>
    );
}
