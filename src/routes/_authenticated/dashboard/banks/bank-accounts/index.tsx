import { createFileRoute } from '@tanstack/react-router';
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, CreditCard, DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { AddBankAccountModal } from '@/components/banks/AddBankAccountModal';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';

export const Route = createFileRoute('/_authenticated/dashboard/banks/bank-accounts/')({
    component: BankAccountsPage,
})

type BankAccount = {
    id: number;
    accountName: string;
    accountNumber: string;
    bankName: string;
    branchName: string;
    accountType: 'savings' | 'current' | 'fixed-deposit';
    balance: number;
    currency: string;
    status: 'active' | 'inactive' | 'closed';
    openingDate: string;
};

function BankAccountsPage() {
    const token = getCookie('accessToken');

    const { data: bankAccounts = [], isLoading } = useQuery({
        queryKey: ["bank-accounts"],
        queryFn: async (): Promise<BankAccount[]> => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/bank-accounts`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch bank accounts");
            const json = await res.json();
            return json.data;
        },
        enabled: !!token,
    });

    const totalBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
    const activeAccounts = bankAccounts.filter(acc => acc.status === 'active').length;

    if (isLoading) {
        return (
            <>
                <AppHeader fixed />
                <Main>
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                    </div>
                </Main>
            </>
        );
    }

    return (
        <>
           <AppHeader fixed />
            <Main>
                <div className="space-y-6">
                    <div className='flex items-center justify-between'>
                        <div>
                            <h1 className='text-2xl font-bold tracking-tight'>Bank Accounts</h1>
                            <p className='text-muted-foreground'>Manage hospital bank accounts and view balances</p>
                        </div>
                        <AddBankAccountModal />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Total Accounts */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 p-6 shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
                            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
                            <div className="relative flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Total Accounts</p>
                                    <h3 className="mt-2 text-2xl font-bold text-white">{bankAccounts.length}</h3>
                                </div>
                                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                    <Building2 className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="relative flex justify-between text-white/90 text-sm">
                                <span>Active</span>
                                <span className="font-semibold">{activeAccounts} accounts</span>
                            </div>
                        </div>

                        {/* Total Balance */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 p-6 shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
                            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
                            <div className="relative flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Total Balance</p>
                                    <h3 className="mt-2 text-2xl font-bold text-white">৳{totalBalance.toLocaleString()}</h3>
                                </div>
                                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="relative flex justify-between text-white/90 text-sm">
                                <span>Across all</span>
                                <span className="font-semibold">All accounts</span>
                            </div>
                        </div>

                        {/* Current Accounts */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-violet-400 p-6 shadow-lg shadow-violet-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
                            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
                            <div className="relative flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Current Accounts</p>
                                    <h3 className="mt-2 text-2xl font-bold text-white">{bankAccounts.filter(a => a.accountType === 'current').length}</h3>
                                </div>
                                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                    <CreditCard className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="relative flex justify-between text-white/90 text-sm">
                                <span>Operational</span>
                                <span className="font-semibold">Accounts</span>
                            </div>
                        </div>

                        {/* Savings & FD */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 to-amber-400 p-6 shadow-lg shadow-amber-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
                            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
                            <div className="relative flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Savings & FD</p>
                                    <h3 className="mt-2 text-2xl font-bold text-white">{bankAccounts.filter(a => a.accountType !== 'current').length}</h3>
                                </div>
                                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="relative flex justify-between text-white/90 text-sm">
                                <span>Investment</span>
                                <span className="font-semibold">Accounts</span>
                            </div>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Bank Accounts List</CardTitle>
                            <CardDescription>View and manage all bank accounts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Account Name</TableHead>
                                        <TableHead>Account Number</TableHead>
                                        <TableHead>Bank & Branch</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Opening Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bankAccounts.map((account) => (
                                        <TableRow key={account.id}>
                                            <TableCell className="font-medium">{account.accountName}</TableCell>
                                            <TableCell className="font-mono text-sm">{account.accountNumber}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{account.bankName}</div>
                                                <div className="text-xs text-muted-foreground">{account.branchName}</div>
                                            </TableCell>
                                            <TableCell className="capitalize">{account.accountType.replace('-', ' ')}</TableCell>
                                            <TableCell className="text-right font-semibold">৳{account.balance.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={account.status === 'active' ? 'default' : account.status === 'inactive' ? 'secondary' : 'destructive'}>
                                                    {account.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{account.openingDate}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="outline">View</Button>
                                                    <Button size="sm" variant="outline">Edit</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="font-bold bg-muted/50">
                                        <TableCell colSpan={4} className="text-right">Total Balance</TableCell>
                                        <TableCell className="text-right">৳{totalBalance.toLocaleString()}</TableCell>
                                        <TableCell colSpan={3}></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    );
}
