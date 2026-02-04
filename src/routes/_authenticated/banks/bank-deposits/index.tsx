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
import { ArrowDownCircle, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_authenticated/banks/bank-deposits/')({
  component: BankDepositsPage,
})

type BankDeposit = {
  id: string;
  date: string;
  accountName: string;
  accountNumber: string;
  amount: number;
  depositType: 'cash' | 'cheque' | 'transfer';
  reference: string;
  depositedBy: string;
  description: string;
  status: 'completed' | 'pending' | 'cleared';
};

function BankDepositsPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [depositType, setDepositType] = useState<'cash' | 'cheque' | 'transfer'>('cash');
  const [reference, setReference] = useState('');
  const [depositedBy, setDepositedBy] = useState('');
  const [description, setDescription] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const [deposits] = useState<BankDeposit[]>([
    {
      id: '1',
      date: '2026-01-13',
      accountName: 'Hospital Main Account',
      accountNumber: '1234567890',
      amount: 150000,
      depositType: 'cash',
      reference: 'DEP-001',
      depositedBy: 'Cashier - Ahmed',
      description: 'Patient payments collection',
      status: 'completed',
    },
    {
      id: '2',
      date: '2026-01-13',
      accountName: 'Payroll Account',
      accountNumber: '0987654321',
      amount: 200000,
      depositType: 'transfer',
      reference: 'DEP-002',
      depositedBy: 'Admin - Fatima',
      description: 'Transfer from main account',
      status: 'completed',
    },
    {
      id: '3',
      date: '2026-01-13',
      accountName: 'Hospital Main Account',
      accountNumber: '1234567890',
      amount: 75000,
      depositType: 'cheque',
      reference: 'CHQ-5678',
      depositedBy: 'Accountant - Karim',
      description: 'Insurance payment',
      status: 'pending',
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Deposit Recorded');
    setAccountId('');
    setAmount('');
    setReference('');
    setDepositedBy('');
    setDescription('');
  };

  const filteredDeposits = deposits.filter(d => d.date === filterDate);
  const totalDeposits = filteredDeposits.reduce((sum, d) => sum + d.amount, 0);

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
            <h1 className='text-2xl font-bold tracking-tight'>Bank Deposits</h1>
            <p className='text-muted-foreground'>Record and track bank deposits</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Deposits</CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredDeposits.length}</div>
                <p className="text-xs text-muted-foreground">transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">৳{totalDeposits.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">deposited today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash Deposits</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredDeposits.filter(d => d.depositType === 'cash').length}</div>
                <p className="text-xs text-muted-foreground">cash transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredDeposits.filter(d => d.status === 'pending').length}</div>
                <p className="text-xs text-muted-foreground">awaiting clearance</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Record New Deposit</CardTitle>
              <CardDescription>Enter bank deposit details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Deposit Date</Label>
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
                    <Label htmlFor="depositType">Deposit Type</Label>
                    <Select value={depositType} onValueChange={(value: any) => setDepositType(value)} required>
                      <SelectTrigger id="depositType">
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
                    <Input id="reference" placeholder="DEP-001 or CHQ-1234" value={reference} onChange={(e) => setReference(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositedBy">Deposited By</Label>
                  <Input id="depositedBy" placeholder="Enter name" value={depositedBy} onChange={(e) => setDepositedBy(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Enter deposit description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline">Cancel</Button>
                  <Button type="submit">Record Deposit</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Deposit Records</CardTitle>
                  <CardDescription>View and manage bank deposits</CardDescription>
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
                    <TableHead>Deposited By</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeposits.length > 0 ? (
                    <>
                      {filteredDeposits.map((deposit) => (
                        <TableRow key={deposit.id}>
                          <TableCell>{deposit.date}</TableCell>
                          <TableCell>
                            <div className="font-medium">{deposit.accountName}</div>
                            <div className="text-xs text-muted-foreground font-mono">{deposit.accountNumber}</div>
                          </TableCell>
                          <TableCell className="capitalize">{deposit.depositType}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">৳{deposit.amount.toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-sm">{deposit.reference}</TableCell>
                          <TableCell>{deposit.depositedBy}</TableCell>
                          <TableCell className="max-w-xs truncate">{deposit.description}</TableCell>
                          <TableCell>
                            <Badge variant={deposit.status === 'completed' ? 'default' : deposit.status === 'pending' ? 'secondary' : 'outline'}>
                              {deposit.status}
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
                      <TableRow className="font-bold bg-green-50 dark:bg-green-950/20">
                        <TableCell colSpan={3} className="text-right">Total Deposits</TableCell>
                        <TableCell className="text-right text-green-600 dark:text-green-400">৳{totalDeposits.toLocaleString()}</TableCell>
                        <TableCell colSpan={5}></TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No deposits found for {filterDate}
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
