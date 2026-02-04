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
import { topNav } from '@/data/data';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_authenticated/accounts/daily-credit/')({
  component: DailyCreditPage,
})

type CreditEntry = {
  id: string;
  date: string;
  account: string;
  description: string;
  amount: number;
  paymentMethod: string;
  category: string;
  reference: string;
};

function DailyCreditPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [account, setAccount] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [category, setCategory] = useState('');
  const [reference, setReference] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  // Sample credit entries for display
  const [creditEntries] = useState<CreditEntry[]>([
    {
      id: '1',
      date: '2026-01-13',
      account: 'Patient Revenue',
      description: 'Payment received from patient consultation',
      amount: 3500,
      paymentMethod: 'Cash',
      category: 'Revenue',
      reference: 'RCP-3001',
    },
    {
      id: '2',
      date: '2026-01-13',
      account: 'Laboratory Revenue',
      description: 'Blood test and X-ray charges',
      amount: 2800,
      paymentMethod: 'Mobile Banking',
      category: 'Revenue',
      reference: 'RCP-3002',
    },
    {
      id: '3',
      date: '2026-01-13',
      account: 'Pharmacy Revenue',
      description: 'Medicine sales',
      amount: 4200,
      paymentMethod: 'Cash',
      category: 'Revenue',
      reference: 'RCP-3003',
    },
    {
      id: '4',
      date: '2026-01-12',
      account: 'Insurance Claim',
      description: 'Insurance reimbursement received',
      amount: 15000,
      paymentMethod: 'Bank Transfer',
      category: 'Insurance',
      reference: 'INS-CLM-089',
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Credit Entry Submitted:', {
      date,
      account,
      description,
      amount,
      paymentMethod,
      category,
      reference,
    });
    // Reset form
    setAccount('');
    setDescription('');
    setAmount('');
    setPaymentMethod('');
    setCategory('');
    setReference('');
  };

  // Filter entries by selected date
  const filteredEntries = creditEntries.filter(entry => entry.date === filterDate);
  const totalCredit = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);

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
          {/* Page Header */}
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Daily Credit</h1>
            <p className='text-muted-foreground'>Record and track daily credit transactions</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Credits</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredEntries.length}</div>
                <p className="text-xs text-muted-foreground">transactions recorded</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">৳{totalCredit.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">for selected date</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Selected Date</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{new Date(filterDate).getDate()}</div>
                <p className="text-xs text-muted-foreground">{new Date(filterDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </CardContent>
            </Card>
          </div>

          {/* Credit Entry Form */}
          <Card>
            <CardHeader>
              <CardTitle>Record New Credit</CardTitle>
              <CardDescription>Enter details of the credit transaction</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account">Account</Label>
                    <Select value={account} onValueChange={setAccount} required>
                      <SelectTrigger id="account">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient-revenue">Patient Revenue</SelectItem>
                        <SelectItem value="laboratory-revenue">Laboratory Revenue</SelectItem>
                        <SelectItem value="pharmacy-revenue">Pharmacy Revenue</SelectItem>
                        <SelectItem value="surgery-revenue">Surgery Revenue</SelectItem>
                        <SelectItem value="insurance-claim">Insurance Claim</SelectItem>
                        <SelectItem value="consultation-fees">Consultation Fees</SelectItem>
                        <SelectItem value="other-income">Other Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter transaction description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (৳)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                      <SelectTrigger id="paymentMethod">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="credit-card">Credit Card</SelectItem>
                        <SelectItem value="mobile-banking">Mobile Banking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue">Revenue</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="refund">Refund</SelectItem>
                        <SelectItem value="donation">Donation</SelectItem>
                        <SelectItem value="grant">Grant</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">Reference/Receipt No.</Label>
                  <Input
                    id="reference"
                    placeholder="RCP-001 or REF-001"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline">Cancel</Button>
                  <Button type="submit">Save Credit Entry</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Daily Credit Records */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Daily Credit Records</CardTitle>
                  <CardDescription>View and manage credit transactions</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="filterDate" className="text-sm">Filter by Date:</Label>
                  <Input
                    id="filterDate"
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.length > 0 ? (
                      <>
                        {filteredEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{entry.date}</TableCell>
                            <TableCell className="font-medium">{entry.account}</TableCell>
                            <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                            <TableCell>{entry.category}</TableCell>
                            <TableCell>{entry.paymentMethod}</TableCell>
                            <TableCell className="font-mono text-sm">{entry.reference}</TableCell>
                            <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">৳{entry.amount.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline">View</Button>
                                <Button size="sm" variant="outline">Edit</Button>
                                <Button size="sm" variant="destructive">Delete</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Total Row */}
                        <TableRow className="font-bold bg-green-50 dark:bg-green-950/20">
                          <TableCell colSpan={6} className="text-right">Total Credit</TableCell>
                          <TableCell className="text-right text-green-600 dark:text-green-400">৳{totalCredit.toFixed(2)}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No credit entries found for {filterDate}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}
