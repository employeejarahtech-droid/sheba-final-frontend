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
import { Plus, Loader2 } from 'lucide-react';
import { getCookie } from '@/lib/cookies';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/use-currency';
import { NestedAccountSelect } from '@/components/accounting/NestedAccountSelect';

export function AddBankAccountModal() {
    const { currency, currencySymbol } = useCurrency();
    const [open, setOpen] = useState(false);
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [bankName, setBankName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [accountType, setAccountType] = useState<'savings' | 'current' | 'fixed-deposit'>('current');
    const [status, setStatus] = useState<'active' | 'inactive' | 'closed'>('active');
    const [openingDate, setOpeningDate] = useState(new Date().toISOString().split('T')[0]);
    const [glAccountId, setGlAccountId] = useState<number | null>(null);

    const token = getCookie('accessToken');
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/bank-accounts`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                }
            );
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to create bank account');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
            toast.success('Bank account created successfully!');
            setOpen(false);
            // Reset form
            setAccountName('');
            setAccountNumber('');
            setBankName('');
            setBranchName('');
            setStatus('active');
            setAccountType('current');
            setOpeningDate(new Date().toISOString().split('T')[0]);
            setGlAccountId(null);
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create bank account');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const accountData = {
            account_name: accountName,
            account_number: accountNumber,
            bank_name: bankName,
            branch_name: branchName,
            account_type: accountType,
            balance: 0,
            currency: currency,
            status: status,
            opening_date: openingDate,
            ...(glAccountId ? { gl_account_id: glAccountId } : {}),
        };

        createMutation.mutate(accountData);
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
                    {/* Account Information */}
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Account Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="accountName">Account Name *</Label>
                                <Input
                                    id="accountName"
                                    placeholder="e.g., Hospital Main Account"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountNumber">Account Number *</Label>
                                <Input
                                    id="accountNumber"
                                    placeholder="Enter account number"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bank Information */}
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Bank Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bankName">Bank Name *</Label>
                                <Input
                                    id="bankName"
                                    placeholder="e.g., Sonali Bank"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="branchName">Branch Name *</Label>
                                <Input
                                    id="branchName"
                                    placeholder="e.g., Dhaka Main Branch"
                                    value={branchName}
                                    onChange={(e) => setBranchName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Account Type & Balance */}
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Account Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="accountType">Account Type *</Label>
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
                                <Label>GL Account (Chart of Accounts)</Label>
                                <NestedAccountSelect
                                    value={glAccountId}
                                    onChange={(id) => setGlAccountId(id)}
                                    placeholder="Link to GL account..."
                                    filterType={["ASSET"]}
                                    leafOnly
                                />
                                <p className="text-xs text-muted-foreground">Link this bank to a Chart of Accounts entry</p>
                            </div>
                        </div>
                    </div>

                    {/* Status & Date */}
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Additional Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="openingDate">Opening Date *</Label>
                                <Input
                                    id="openingDate"
                                    type="date"
                                    value={openingDate}
                                    onChange={(e) => setOpeningDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={createMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Add Bank Account'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
