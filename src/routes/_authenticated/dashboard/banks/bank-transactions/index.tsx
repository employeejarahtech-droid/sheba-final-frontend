import { createFileRoute } from '@tanstack/react-router'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowDownCircle, ArrowUpCircle, Calendar, DollarSign, Landmark } from 'lucide-react';
import { useState } from 'react';
import { useCurrency } from '@/hooks/use-currency';

export const Route = createFileRoute('/_authenticated/dashboard/banks/bank-transactions/')({
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
    const { format } = useCurrency();
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
            <AppHeader fixed />
            <Main>
                <div className="space-y-6">
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight'>Bank Transactions</h1>
                        <p className='text-muted-foreground'>View all bank transactions and account activity</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {[
                            { label: 'Total Transactions', value: String(filteredTransactions.length), sub: 'for selected date', icon: Calendar, grad: 'from-blue-500 to-indigo-500' },
                            { label: 'Total Deposits', value: format(totalDeposits), sub: 'incoming funds', icon: ArrowDownCircle, grad: 'from-emerald-500 to-teal-500' },
                            { label: 'Total Withdrawals', value: format(totalWithdrawals), sub: 'outgoing funds', icon: ArrowUpCircle, grad: 'from-rose-500 to-red-500' },
                            { label: 'Net Change', value: `${netChange >= 0 ? '+' : ''}${format(netChange)}`, sub: "today's change", icon: DollarSign, grad: netChange >= 0 ? 'from-emerald-500 to-teal-500' : 'from-rose-500 to-red-500' },
                        ].map((card) => {
                            const Icon = card.icon;
                            return (
                                <Card key={card.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-2 bg-gradient-to-br ${card.grad} rounded-lg shadow-lg`}>
                                                <Icon className="w-4 h-4 text-white" />
                                            </div>
                                            <CardTitle className="text-sm font-semibold text-gray-500 dark:text-gray-400">{card.label}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <h3 className="text-2xl font-bold">{card.value}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2.5 px-4 gap-0">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <Landmark className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Transaction History</CardTitle>
                                        <CardDescription className="text-xs text-gray-600 dark:text-gray-400">View and filter bank transactions</CardDescription>
                                    </div>
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
                        <CardContent className="p-4">
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
                                                        {transaction.type === 'withdrawal' ? format(transaction.amount) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                                                        {transaction.type === 'deposit' ? format(transaction.amount) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">{format(transaction.balance)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" variant="outline">View</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="font-bold bg-muted/50">
                                                <TableCell colSpan={6} className="text-right">Totals</TableCell>
                                                <TableCell className="text-right text-red-600 dark:text-red-400">{format(totalWithdrawals)}</TableCell>
                                                <TableCell className="text-right text-green-600 dark:text-green-400">{format(totalDeposits)}</TableCell>
                                                <TableCell className={`text-right ${netChange >= 0 ? `text-green-600 dark:text-green-400` : `text-red-600 dark:text-red-400`}`}>
                                                    {netChange >= 0 ? '+' : ''}{format(netChange)}
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
