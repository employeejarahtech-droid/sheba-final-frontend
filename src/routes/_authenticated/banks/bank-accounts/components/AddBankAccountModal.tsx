import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus } from 'lucide-react';

export function AddBankAccountModal() {
    const [open, setOpen] = useState(false);
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [bankName, setBankName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [accountType, setAccountType] = useState<'savings' | 'current' | 'fixed-deposit'>('current');
    const [initialBalance, setInitialBalance] = useState('');
    const [openingDate, setOpeningDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Bank Account Created', {
            accountName,
            accountNumber,
            bankName,
            branchName,
            accountType,
            initialBalance,
            openingDate
        });

        // Reset form
        setAccountName('');
        setAccountNumber('');
        setBankName('');
        setBranchName('');
        setInitialBalance('');
        setOpeningDate(new Date().toISOString().split('T')[0]);

        // Close modal
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5 py-2.5 font-medium shadow-lg transition-all active:scale-95">
                    <Plus size={18} /> Add New Account
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Bank Account</DialogTitle>
                    <DialogDescription>
                        Register a new bank account for the hospital
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="accountName">Account Name</Label>
                            <Input id="accountName" placeholder="e.g., Hospital Main Account" value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="accountNumber">Account Number</Label>
                            <Input id="accountNumber" placeholder="Enter account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Select value={bankName} onValueChange={setBankName} required>
                                <SelectTrigger id="bankName">
                                    <SelectValue placeholder="Select bank" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sonali">Sonali Bank</SelectItem>
                                    <SelectItem value="dbbl">Dutch-Bangla Bank</SelectItem>
                                    <SelectItem value="brac">BRAC Bank</SelectItem>
                                    <SelectItem value="city">City Bank</SelectItem>
                                    <SelectItem value="eastern">Eastern Bank</SelectItem>
                                    <SelectItem value="islami">Islami Bank</SelectItem>
                                    <SelectItem value="standard">Standard Chartered</SelectItem>
                                    <SelectItem value="hsbc">HSBC</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="branchName">Branch Name</Label>
                            <Input id="branchName" placeholder="Enter branch name" value={branchName} onChange={(e) => setBranchName(e.target.value)} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="accountType">Account Type</Label>
                            <Select value={accountType} onValueChange={(value: any) => setAccountType(value)} required>
                                <SelectTrigger id="accountType">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="current">Current Account</SelectItem>
                                    <SelectItem value="savings">Savings Account</SelectItem>
                                    <SelectItem value="fixed-deposit">Fixed Deposit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="initialBalance">Initial Balance (৳)</Label>
                            <Input id="initialBalance" type="number" placeholder="0.00" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} step="0.01" min="0" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="openingDate">Opening Date</Label>
                        <Input id="openingDate" type="date" value={openingDate} onChange={(e) => setOpeningDate(e.target.value)} required />
                    </div>

                    <Separator />

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit">Add Bank Account</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
