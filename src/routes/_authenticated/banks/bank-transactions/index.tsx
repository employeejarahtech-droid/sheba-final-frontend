import { createFileRoute } from '@tanstack/react-router'
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { topNav } from '@/data/data';
import { ArrowDownCircle, ArrowUpCircle, Calendar, DollarSign } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_authenticated/banks/bank-transactions/')({
    component: BankTransactionsPage,
})

type BankTransaction = {
    id: string;
    date: string;
    accountName: string;
    accountNumber: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    transactionType: 'cash' | 'cheque' | 'transfer';
    reference: string;
    description: string;
    balance: number;
};

function BankTransactionsPage() {
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterAccount, setFilterAccount] = useState('all');
    const [filterType, setFilterType] = useState('all');

    const [transactions] = useState<BankTransaction[]>([
        {
            id: '1',
            date: '2026-01-13',
            accountName: 'Hospital Main Account',
            accountNumber: '1234567890',
            type: 'deposit',
            amount: 150000,
            transactionType: 'cash',
            reference: 'DEP-001',
            description: 'Patient payments collection',
            balance: 2650000,
        },
        {
            id: '2',
            date: '2026-01-13',
            accountName: 'Hospital Main Account',
            accountNumber: '1234567890',
            type: 'withdrawal',
            amount: 50000,
            transactionType: 'cash',
            reference: 'WD-001',
            description: 'Petty cash withdrawal',
            balance: 2600000,
        },
        {
            id: '3',
            date: '2026-01-13',
            accountName: 'Payroll Account',
            accountNumber: '0987654321',
            type: 'deposit',
            amount: 200000,
            transactionType: 'transfer',
            reference: 'DEP-002',
            description: 'Transfer from main account',
            balance: 1050000,
        },
        {
            id: '4',
            date: '2026-01-13',
            accountName: 'Payroll Account',
            accountNumber: '0987654321',
            type: 'withdrawal',
            amount: 500000,
            transactionType: 'transfer',
            reference: 'WD-002',
            description: 'Monthly staff salaries',
            balance: 550000,
        },
        {
            id: '5',
            date: '2026-01-13',
            accountName: 'Hospital Main Account',
            accountNumber: '1234567890',
            type: 'deposit',
            amount: 75000,
            transactionType: 'cheque',
            reference: 'CHQ-5678',
            description: 'Insurance payment',
            balance: 2675000,
        },
    ]);

    const filteredTransactions = transactions.filter(t => {
        const dateMatch = t.date === filterDate;
        const accountMatch = filterAccount === 'all' || t.accountNumber === filterAccount;
        const typeMatch = filterType === 'all' || t.type === filterType;
        return dateMatch && accountMatch && typeMatch;
    });

    const totalDeposits = filteredTransactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = filteredTransactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
    const netChange = totalDeposits - totalWithdrawals;

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
            <Main>
                <div className="space-y-6">
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight'>Bank Transactions</h1>
                        <p className='text-muted-foreground'>View all bank transactions and account activity</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{filteredTransactions.length}</div>
                                <p className="text-xs text-muted-foreground">for selected date</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                                <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">৳{totalDeposits.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">incoming funds</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
                                <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">৳{totalWithdrawals.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">outgoing funds</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Net Change</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${netChange >= 0 ? `text-green-600 dark:text-green-400` : `text-red-600 dark:text-red-400`}`}>
                                    {netChange >= 0 ? '+' : ''}৳{netChange.toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">today's change</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <CardTitle>Transaction History</CardTitle>
                                    <CardDescription>View and filter bank transactions</CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="filterDate" className="text-sm whitespace-nowrap">Date:</Label>
                                        <Input id="filterDate" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-auto" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="filterAccount" className="text-sm whitespace-nowrap">Account:</Label>
                                        <Select value={filterAccount} onValueChange={setFilterAccount}>
                                            <SelectTrigger id="filterAccount" className="w-[200px]">
                                                <SelectValue placeholder="All Accounts" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Accounts</SelectItem>
                                                <SelectItem value="1234567890">Hospital Main - 1234567890</SelectItem>
                                                <SelectItem value="0987654321">Payroll - 0987654321</SelectItem>
                                                <SelectItem value="5555666677">Emergency - 5555666677</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="filterType" className="text-sm whitespace-nowrap">Type:</Label>
                                        <Select value={filterType} onValueChange={setFilterType}>
                                            <SelectTrigger id="filterType" className="w-[150px]">
                                                <SelectValue placeholder="All Types" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                <SelectItem value="deposit">Deposits</SelectItem>
                                                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Account</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Debit</TableHead>
                                        <TableHead className="text-right">Credit</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.length > 0 ? (
                                        <>
                                            {filteredTransactions.map((transaction) => (
                                                <TableRow key={transaction.id}>
                                                    <TableCell>{transaction.date}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{transaction.accountName}</div>
                                                        <div className="text-xs text-muted-foreground font-mono">{transaction.accountNumber}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={transaction.type === 'deposit' ? 'default' : 'secondary'}>
                                                            {transaction.type === 'deposit' ? (
                                                                <><ArrowDownCircle className="h-3 w-3 mr-1 inline" />Deposit</>
                                                            ) : (
                                                                <><ArrowUpCircle className="h-3 w-3 mr-1 inline" />Withdrawal</>
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="capitalize">{transaction.transactionType}</TableCell>
                                                    <TableCell className="font-mono text-sm">{transaction.reference}</TableCell>
                                                    <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                                                    <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">
                                                        {transaction.type === 'withdrawal' ? '৳${transaction.amount.toLocaleString()}' : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                                                        {transaction.type === 'deposit' ? '৳${transaction.amount.toLocaleString()}' : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">৳{transaction.balance.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" variant="outline">View</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="font-bold bg-muted/50">
                                                <TableCell colSpan={6} className="text-right">Totals</TableCell>
                                                <TableCell className="text-right text-red-600 dark:text-red-400">৳{totalWithdrawals.toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-green-600 dark:text-green-400">৳{totalDeposits.toLocaleString()}</TableCell>
                                                <TableCell className={`text-right ${netChange >= 0 ? `text-green-600 dark:text-green-400` : `text-red-600 dark:text-red-400`}`}>
                                                    {netChange >= 0 ? '+' : ''}৳{netChange.toLocaleString()}
                                                </TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        </>
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                                                No transactions found for the selected filters
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    );
}
