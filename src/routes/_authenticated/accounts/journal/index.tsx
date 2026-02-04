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
import { topNav } from '@/data/data';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_authenticated/accounts/journal/')({
    component: JournalEntryPage,
})

type JournalRow = {
    id: string;
    account: string;
    description: string;
    debit: string;
    credit: string;
};

type JournalEntry = {
    id: string;
    date: string;
    voucherNo: string;
    description: string;
    totalDebit: number;
    totalCredit: number;
};

function JournalEntryPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [voucherNo, setVoucherNo] = useState('');
    const [rows, setRows] = useState<JournalRow[]>([
        { id: '1', account: '', description: '', debit: '', credit: '' },
        { id: '2', account: '', description: '', debit: '', credit: '' },
    ]);

    // Sample journal entries for display
    const [journalEntries] = useState<JournalEntry[]>([
        {
            id: '1',
            date: '2026-01-10',
            voucherNo: 'JV-001',
            description: 'Cash received from patient',
            totalDebit: 5000,
            totalCredit: 5000,
        },
        {
            id: '2',
            date: '2026-01-11',
            voucherNo: 'JV-002',
            description: 'Medical supplies purchased',
            totalDebit: 3500,
            totalCredit: 3500,
        },
    ]);

    const addRow = () => {
        const newRow: JournalRow = {
            id: Date.now().toString(),
            account: '',
            description: '',
            debit: '',
            credit: '',
        };
        setRows([...rows, newRow]);
    };

    const removeRow = (id: string) => {
        if (rows.length > 2) {
            setRows(rows.filter(row => row.id !== id));
        }
    };

    const updateRow = (id: string, field: keyof JournalRow, value: string) => {
        setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const calculateTotals = () => {
        const totalDebit = rows.reduce((sum, row) => sum + (parseFloat(row.debit) || 0), 0);
        const totalCredit = rows.reduce((sum, row) => sum + (parseFloat(row.credit) || 0), 0);
        return { totalDebit, totalCredit };
    };

    const { totalDebit, totalCredit } = calculateTotals();
    const isBalanced = totalDebit === totalCredit && totalDebit > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBalanced) {
            alert('Debit and Credit must be equal!');
            return;
        }
        console.log('Journal Entry Submitted:', { date, voucherNo, rows });
        // Reset form
        setVoucherNo('');
        setRows([
            { id: '1', account: '', description: '', debit: '', credit: '' },
            { id: '2', account: '', description: '', debit: '', credit: '' },
        ]);
    };

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
                        <h1 className='text-2xl font-bold tracking-tight'>Journal Entry</h1>
                        <p className='text-muted-foreground'>Record financial transactions with double-entry bookkeeping</p>
                    </div>

                    {/* Journal Entry Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>New Journal Entry</CardTitle>
                            <CardDescription>Enter debit and credit entries for your transaction</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Header Information */}
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
                                        <Label htmlFor="voucherNo">Voucher No.</Label>
                                        <Input
                                            id="voucherNo"
                                            placeholder="JV-001"
                                            value={voucherNo}
                                            onChange={(e) => setVoucherNo(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <Separator />

                                {/* Journal Entry Rows */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold">Transaction Details</Label>
                                        <Button type="button" onClick={addRow} size="sm" variant="outline">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Row
                                        </Button>
                                    </div>

                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[250px]">Account</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead className="w-[150px] text-right">Debit</TableHead>
                                                    <TableHead className="w-[150px] text-right">Credit</TableHead>
                                                    <TableHead className="w-[60px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {rows.map((row) => (
                                                    <TableRow key={row.id}>
                                                        <TableCell>
                                                            <Select
                                                                value={row.account}
                                                                onValueChange={(value) => updateRow(row.id, 'account', value)}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select account" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="cash">Cash</SelectItem>
                                                                    <SelectItem value="bank">Bank</SelectItem>
                                                                    <SelectItem value="accounts-receivable">Accounts Receivable</SelectItem>
                                                                    <SelectItem value="accounts-payable">Accounts Payable</SelectItem>
                                                                    <SelectItem value="revenue">Revenue</SelectItem>
                                                                    <SelectItem value="expenses">Expenses</SelectItem>
                                                                    <SelectItem value="medical-supplies">Medical Supplies</SelectItem>
                                                                    <SelectItem value="equipment">Equipment</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                placeholder="Enter description"
                                                                value={row.description}
                                                                onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                placeholder="0.00"
                                                                className="text-right"
                                                                value={row.debit}
                                                                onChange={(e) => updateRow(row.id, 'debit', e.target.value)}
                                                                step="0.01"
                                                                min="0"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                placeholder="0.00"
                                                                className="text-right"
                                                                value={row.credit}
                                                                onChange={(e) => updateRow(row.id, 'credit', e.target.value)}
                                                                step="0.01"
                                                                min="0"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeRow(row.id)}
                                                                disabled={rows.length <= 2}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {/* Totals Row */}
                                                <TableRow className="font-semibold bg-muted/50">
                                                    <TableCell colSpan={2} className="text-right">Total</TableCell>
                                                    <TableCell className="text-right">
                                                        {totalDebit.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {totalCredit.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Balance Check */}
                                    {totalDebit !== totalCredit && (totalDebit > 0 || totalCredit > 0) && (
                                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                            <p className="text-sm text-destructive font-medium">
                                                ⚠️ Entry is not balanced. Difference: {Math.abs(totalDebit - totalCredit).toFixed(2)}
                                            </p>
                                        </div>
                                    )}

                                    {isBalanced && (
                                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                                ✓ Entry is balanced
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline">Cancel</Button>
                                    <Button type="submit" disabled={!isBalanced}>
                                        Save Journal Entry
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Recent Journal Entries */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Journal Entries</CardTitle>
                            <CardDescription>View and manage your journal entries</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Voucher No.</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Debit</TableHead>
                                        <TableHead className="text-right">Credit</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {journalEntries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell>{entry.date}</TableCell>
                                            <TableCell className="font-medium">{entry.voucherNo}</TableCell>
                                            <TableCell>{entry.description}</TableCell>
                                            <TableCell className="text-right">{entry.totalDebit.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">{entry.totalCredit.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="outline">View</Button>
                                                    <Button size="sm" variant="outline">Edit</Button>
                                                    <Button size="sm" variant="destructive">Delete</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    );
}
