import { createFileRoute } from '@tanstack/react-router';
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
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { topNav } from '@/data/data';
import { ArrowUpCircle, Calendar, DollarSign, TrendingDown } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_authenticated/banks/bank-withdrawals/')({
    component: BankWithdrawalsPage,
})

type BankWithdrawal = {
    id: string;
    date: string;
    accountName: string;
    accountNumber: string;
    amount: number;
    withdrawalType: 'cash' | 'cheque' | 'transfer';
    reference: string;
    withdrawnBy: string;
    purpose: string;
    description: string;
    status: 'completed' | 'pending' | 'approved';
};

function BankWithdrawalsPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [withdrawalType, setWithdrawalType] = useState<'cash' | 'cheque' | 'transfer'>('cash');
    const [reference, setReference] = useState('');
    const [withdrawnBy, setWithdrawnBy] = useState('');
    const [purpose, setPurpose] = useState('');
    const [description, setDescription] = useState('');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    const [withdrawals] = useState<BankWithdrawal[]>([
        {
            id: '1',
            date: '2026-01-13',
            accountName: 'Hospital Main Account',
            accountNumber: '1234567890',
            amount: 50000,
            withdrawalType: 'cash',
            reference: 'WD-001',
            withdrawnBy: 'Admin - Fatima',
            purpose: 'Petty Cash',
            description: 'Monthly petty cash withdrawal',
            status: 'completed',
        },
        {
            id: '2',
            date: '2026-01-13',
            accountName: 'Payroll Account',
            accountNumber: '0987654321',
            amount: 500000,
            withdrawalType: 'transfer',
            reference: 'WD-002',
            withdrawnBy: 'HR - Karim',
            purpose: 'Salary Payment',
            description: 'Monthly staff salaries',
            status: 'completed',
        },
        {
            id: '3',
            date: '2026-01-13',
            accountName: 'Hospital Main Account',
            accountNumber: '1234567890',
            amount: 100000,
            withdrawalType: 'cheque',
            reference: 'CHQ-9876',
            withdrawnBy: 'Procurement - Ahmed',
            purpose: 'Equipment Purchase',
            description: 'Medical equipment payment',
            status: 'pending',
        },
    ]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Withdrawal Recorded');
        setAccountId('');
        setAmount('');
        setReference('');
        setWithdrawnBy('');
        setPurpose('');
        setDescription('');
    };

    const filteredWithdrawals = withdrawals.filter(w => w.date === filterDate);
    const totalWithdrawals = filteredWithdrawals.reduce((sum, w) => sum + w.amount, 0);

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
                        <h1 className='text-2xl font-bold tracking-tight'>Bank Withdrawals</h1>
                        <p className='text-muted-foreground'>Record and track bank withdrawals</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Today's Withdrawals</CardTitle>
                                <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{filteredWithdrawals.length}</div>
                                <p className="text-xs text-muted-foreground">transactions</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">৳{totalWithdrawals.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">withdrawn today</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Cash Withdrawals</CardTitle>
                                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{filteredWithdrawals.filter(w => w.withdrawalType === 'cash').length}</div>
                                <p className="text-xs text-muted-foreground">cash transactions</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{filteredWithdrawals.filter(w => w.status === 'pending').length}</div>
                                <p className="text-xs text-muted-foreground">awaiting approval</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Record New Withdrawal</CardTitle>
                            <CardDescription>Enter bank withdrawal details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Withdrawal Date</Label>
                                        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="account">Bank Account</Label>
                                        <Select value={accountId} onValueChange={setAccountId} required>
                                            <SelectTrigger id="account">
                                                <SelectValue placeholder="Select account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Hospital Main Account - 1234567890</SelectItem>
                                                <SelectItem value="2">Payroll Account - 0987654321</SelectItem>
                                                <SelectItem value="3">Emergency Fund - 5555666677</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Amount (৳)</Label>
                                        <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required step="0.01" min="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="withdrawalType">Withdrawal Type</Label>
                                        <Select value={withdrawalType} onValueChange={(value: any) => setWithdrawalType(value)} required>
                                            <SelectTrigger id="withdrawalType">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cash">Cash</SelectItem>
                                                <SelectItem value="cheque">Cheque</SelectItem>
                                                <SelectItem value="transfer">Bank Transfer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reference">Reference/Cheque No.</Label>
                                        <Input id="reference" placeholder="WD-001 or CHQ-1234" value={reference} onChange={(e) => setReference(e.target.value)} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="withdrawnBy">Withdrawn By</Label>
                                        <Input id="withdrawnBy" placeholder="Enter name" value={withdrawnBy} onChange={(e) => setWithdrawnBy(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="purpose">Purpose</Label>
                                        <Select value={purpose} onValueChange={setPurpose} required>
                                            <SelectTrigger id="purpose">
                                                <SelectValue placeholder="Select purpose" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="petty-cash">Petty Cash</SelectItem>
                                                <SelectItem value="salary">Salary Payment</SelectItem>
                                                <SelectItem value="equipment">Equipment Purchase</SelectItem>
                                                <SelectItem value="supplies">Medical Supplies</SelectItem>
                                                <SelectItem value="utilities">Utilities Payment</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" placeholder="Enter withdrawal description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                                </div>

                                <Separator />

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline">Cancel</Button>
                                    <Button type="submit">Record Withdrawal</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Withdrawal Records</CardTitle>
                                    <CardDescription>View and manage bank withdrawals</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="filterDate" className="text-sm">Filter by Date:</Label>
                                    <Input id="filterDate" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-auto" />
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
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Withdrawn By</TableHead>
                                        <TableHead>Purpose</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredWithdrawals.length > 0 ? (
                                        <>
                                            {filteredWithdrawals.map((withdrawal) => (
                                                <TableRow key={withdrawal.id}>
                                                    <TableCell>{withdrawal.date}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{withdrawal.accountName}</div>
                                                        <div className="text-xs text-muted-foreground font-mono">{withdrawal.accountNumber}</div>
                                                    </TableCell>
                                                    <TableCell className="capitalize">{withdrawal.withdrawalType}</TableCell>
                                                    <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">৳{withdrawal.amount.toLocaleString()}</TableCell>
                                                    <TableCell className="font-mono text-sm">{withdrawal.reference}</TableCell>
                                                    <TableCell>{withdrawal.withdrawnBy}</TableCell>
                                                    <TableCell className="capitalize">{withdrawal.purpose.replace('-', ' ')}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={withdrawal.status === 'completed' ? 'default' : withdrawal.status === 'pending' ? 'secondary' : 'outline'}>
                                                            {withdrawal.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="sm" variant="outline">View</Button>
                                                            <Button size="sm" variant="outline">Edit</Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="font-bold bg-red-50 dark:bg-red-950/20">
                                                <TableCell colSpan={3} className="text-right">Total Withdrawals</TableCell>
                                                <TableCell className="text-right text-red-600 dark:text-red-400">৳{totalWithdrawals.toLocaleString()}</TableCell>
                                                <TableCell colSpan={5}></TableCell>
                                            </TableRow>
                                        </>
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                                                No withdrawals found for {filterDate}
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
