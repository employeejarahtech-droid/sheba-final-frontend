import { useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'




import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from 'react'
import { toast } from "sonner"
import { Loader2, ArrowLeft, Check, ChevronsUpDown, Printer } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

type TestItem = {
    id: number;
    test: {
        name: string;
        category: {
            name: string;
            department: {
                id: number;
                name: string;
            }
        }
    };
    price: string;
};

type InvoiceDetails = {
    id: number;
    patient_name: string;
    sex: string | null;
    age: string | null;
    phone: string | null;
    created_at: string;
    invoice_date: string;
    total_amount: number;
    net_amount: number;
    doctor: {
        doctor_name: string;
    } | null;
    selected_tests: TestItem[];
    payments: {
        id: number;
        amount: string;
        method: string;
        created_at: string;
        payment_date?: string;
    }[];
    discounts: { amount: string }[];
    department_payments?: { department_id: number; amount: string }[];
    department_discounts?: { department_id: number; discount: string }[];
};

export default function DueCollectionDetails() {
    const { invoiceId } = useParams({ from: '/_authenticated/outdoor/reception/due-collection/$invoiceId' });
    const token = getCookie('accessToken');
    const queryClient = useQueryClient();
    const navigate = useNavigate();


    const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
    const [openPaymentMethod, setOpenPaymentMethod] = useState(false);
    const [discountReason, setDiscountReason] = useState<string>("");
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Department-wise inputs
    const [deptInputs, setDeptInputs] = useState<Record<string, { discount: string; payment: string }>>({});

    const { data: invoice, isLoading, error } = useQuery<InvoiceDetails>({
        queryKey: ["invoice", invoiceId],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${invoiceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch invoice details");
            const json = await res.json();
            return json.data;
        },
        enabled: !!invoiceId && !!token
    });

    const collectMutation = useMutation({
        mutationFn: async (payload: {
            invoice_id: number;
            amount: number;
            method: string;
            discount?: number;
            discount_reason?: string;
            department_payments?: { department_id: number; amount: number; method: string }[];
            department_discounts?: { department_id: number; discount: number }[];
            payment_date?: string;
        }) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outdoor-invoice/due-collection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to collect payment");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Payment collected successfully");
            queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
            // Reset department inputs
            setDeptInputs({});
            setDiscountReason("");
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    // Helper to update department inputs with validation
    const handleDeptInputChange = (dept: string, field: 'discount' | 'payment', value: string) => {
        // Get department data for validation
        const tests = testsByDept[dept];
        const deptId = tests?.[0]?.test?.category?.department?.id;
        const billTotal = deptTotals[dept] || 0;
        const histDisc = getDeptDiscountAmount(deptId);
        const histPaid = getDeptPaidAmount(deptId, billTotal);

        // Calculate current due amount
        const discountedTotal = Math.max(0, billTotal - histDisc);
        const currentDue = Math.max(0, discountedTotal - histPaid);

        // Get current input values
        const currentDiscount = field === 'discount' ? value : (deptInputs[dept]?.discount || '0');
        const currentPayment = field === 'payment' ? value : (deptInputs[dept]?.payment || '0');

        // Validate numeric input (allow empty string, positive numbers and decimals)
        if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
            return; // Invalid input, don't update state
        }

        // Parse numeric values
        const discountAmt = parseFloat(currentDiscount) || 0;
        const paymentAmt = parseFloat(currentPayment) || 0;

        // Validate discount doesn't exceed current due
        if (field === 'discount' && discountAmt > currentDue) {
            toast.error(`Discount cannot exceed current due (৳${currentDue.toFixed(0)}) for ${dept}`);
            return;
        }

        // Validate payment doesn't exceed current due minus discount
        const maxPayment = Math.max(0, currentDue - discountAmt);
        if (field === 'payment' && paymentAmt > maxPayment) {
            toast.error(`Payment cannot exceed due amount (৳${maxPayment.toFixed(0)}) for ${dept}`);
            return;
        }

        // All validations passed, update state
        setDeptInputs(prev => ({
            ...prev,
            [dept]: {
                ...prev[dept],
                discount: field === 'discount' ? value : (prev[dept]?.discount || ''),
                payment: field === 'payment' ? value : (prev[dept]?.payment || '')
            }
        }));
    };

    // Helper to calculate total input
    const calculateTotalInput = (field: 'discount' | 'payment'): string => {
        const total = Object.values(deptInputs).reduce((sum, input) => {
            const val = parseFloat(input?.[field] || '0') || 0;
            return sum + val;
        }, 0);
        return total.toFixed(0);
    };

    const handleConfirmCollection = () => {
        if (!invoice) return;

        // Build department-wise arrays
        const department_payments: { department_id: number; amount: number; method: string }[] = [];
        const department_discounts: { department_id: number; discount: number }[] = [];

        Object.entries(deptInputs).forEach(([deptName, inputs]) => {
            const tests = testsByDept[deptName];
            const deptId = tests?.[0]?.test?.category?.department?.id;

            if (deptId) {
                const paymentAmt = parseFloat(inputs.payment || '0');
                const discountAmt = parseFloat(inputs.discount || '0');

                if (paymentAmt > 0) {
                    department_payments.push({
                        department_id: deptId,
                        amount: paymentAmt,
                        method: paymentMethod
                    });
                }

                if (discountAmt > 0) {
                    department_discounts.push({
                        department_id: deptId,
                        discount: discountAmt
                    });
                }
            }
        });

        if (department_payments.length === 0 && department_discounts.length === 0) {
            toast.error("Please enter at least one payment or discount");
            return;
        }

        // Final validation: Check each department's amounts don't exceed due
        let hasInvalidAmount = false;
        Object.entries(deptInputs).forEach(([deptName, inputs]) => {
            const tests = testsByDept[deptName];
            const deptId = tests?.[0]?.test?.category?.department?.id;
            const billTotal = deptTotals[deptName] || 0;
            const histDisc = getDeptDiscountAmount(deptId);
            const histPaid = getDeptPaidAmount(deptId, billTotal);
            const discountedTotal = Math.max(0, billTotal - histDisc);
            const currentDue = Math.max(0, discountedTotal - histPaid);

            const discountAmt = parseFloat(inputs.discount || '0');
            const paymentAmt = parseFloat(inputs.payment || '0');
            const totalReduction = discountAmt + paymentAmt;

            if (totalReduction > currentDue) {
                toast.error(`${deptName}: Total (৳${totalReduction}) exceeds due amount (৳${currentDue})`);
                hasInvalidAmount = true;
            }
        });

        if (hasInvalidAmount) {
            return;
        }

        // Calculate totals
        const totalPayment = department_payments.reduce((sum, p) => sum + p.amount, 0);
        const totalDiscount = department_discounts.reduce((sum, d) => sum + d.discount, 0);

        collectMutation.mutate({
            invoice_id: invoice.id,
            amount: totalPayment,
            method: paymentMethod,
            discount: totalDiscount,
            discount_reason: discountReason,
            department_payments,
            department_discounts,
            payment_date: paymentDate
        });
    };

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    if (error) return <div className="p-10 text-red-500">Error loading invoice: {(error as Error).message}</div>;
    if (!invoice) return <div className="p-10">Invoice not found</div>;

    // Calculations
    const totalPaid = invoice.payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
    const dueAmount = Math.max(0, invoice.net_amount - totalPaid);

    // Group tests by department
    const testsByDept: Record<string, TestItem[]> = {};
    const deptTotals: Record<string, number> = {};

    invoice.selected_tests?.forEach(item => {
        const deptName = item.test?.category?.department?.name || "Uncategorized";
        if (!testsByDept[deptName]) {
            testsByDept[deptName] = [];
            deptTotals[deptName] = 0;
        }
        testsByDept[deptName].push(item);
        deptTotals[deptName] += parseFloat(item.price) || 0;
    });

    // Calculate total bill across all departments
    const totalBill = Object.values(deptTotals).reduce((sum, val) => sum + val, 0);

    // Calculate total department-wise payments already recorded
    const totalDeptWisePaid = invoice.department_payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

    // NOTE: We DON'T distribute global payments proportionally because we don't know
    // which specific departments/tests the payment was for. The payment might have
    // been for tests in a specific department, so distributing it would be wrong.
    // Only use department-wise payments that were explicitly recorded.
    const _totalGlobalPaid = Math.max(0, totalPaid - totalDeptWisePaid);

    // Helper to get department-wise paid amount
    const getDeptPaidAmount = (deptId: number | undefined, _deptBillTotal: number): number => {
        // Only count department-specific payments from database
        // Do NOT include proportional global payments
        const deptSpecificPaid = invoice.department_payments
            ?.filter(p => p.department_id === deptId)
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

        return deptSpecificPaid;
    };

    // Helper to get department-wise discount amount
    const getDeptDiscountAmount = (deptId: number | undefined): number => {
        const discounts = invoice.department_discounts || [];

        // Filter by department_id - handle both defined and undefined cases
        const deptDiscounts = deptId === undefined || deptId === null
            ? discounts.filter(d => !d.department_id || d.department_id === null)
            : discounts.filter(d => d.department_id === deptId);

        return deptDiscounts.reduce((sum, d) => sum + (parseFloat(d.discount) || 0), 0);
    };

    // Calculate total due across all departments
    const totalDueAcrossAllDepts = Object.entries(deptTotals).reduce((sum, [dept]) => {
        const tests = testsByDept[dept];
        const deptId = tests?.[0]?.test?.category?.department?.id;
        const histDisc = getDeptDiscountAmount(deptId);
        const histPaid = getDeptPaidAmount(deptTotals[dept], deptId);
        const discountedTotal = Math.max(0, deptTotals[dept] - histDisc);
        const currentDue = Math.max(0, discountedTotal - histPaid);
        return sum + currentDue;
    }, 0);

    const isFullyPaid = totalDueAcrossAllDepts === 0;

    return (
        <>
            <AppHeader fixed />

            <main className='p-6 lg:p-10'>
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate({ to: '/outdoor/reception/due-collection' })}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.open(`/outdoor/reception/invoices/${invoiceId}`, '_blank')}
                        className="ml-auto"
                    >
                        <Printer className="mr-2 h-4 w-4" /> Print Invoice
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: Invoice Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl">Invoice #{invoice.id}</CardTitle>
                                        <CardDescription>{new Date(invoice.created_at).toLocaleString()}</CardDescription>
                                    </div>
                                    <Badge variant={dueAmount > 0 ? "destructive" : "default"} className="text-lg px-4 py-1">
                                        {dueAmount > 0 ? "UNPAID" : "PAID"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Patient Name</p>
                                        <p className="font-medium text-lg">{invoice.patient_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Phone</p>
                                        <p className="font-medium">{invoice.phone || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Age / Sex</p>
                                        <p className="font-medium">{invoice.age || "-"} / {invoice.sex || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Ref. Doctor</p>
                                        <p className="font-medium">{invoice.doctor?.doctor_name || "N/A"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>



                        <Card>
                            <CardHeader>
                                <CardTitle>Test Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {Object.entries(testsByDept).map(([dept, tests]) => (
                                    <div key={dept} className="mb-6 last:mb-0">
                                        <h3 className="font-semibold text-primary mb-2 border-b pb-1">{dept}</h3>
                                        <div className="space-y-2">
                                            {tests.map((t, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <span>{t.test?.name}</span>
                                                    <span className="font-mono">৳{parseFloat(t.price).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t pt-2 mt-4 flex justify-between items-center font-bold text-lg">
                                    <span>Total Bill</span>
                                    <span>৳{Number(invoice.total_amount).toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Payment History</CardTitle>
                                <CardDescription>All payments received for this invoice</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {invoice.payments && invoice.payments.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between font-medium border-b pb-2 text-xs text-muted-foreground">
                                            <span className="w-1/4">Pay Date</span>
                                            <span className="w-1/4">Entry Date</span>
                                            <span className="w-1/4">Method</span>
                                            <span className="w-1/4 text-right">Amount</span>
                                        </div>
                                        {invoice.payments.map((payment, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm py-1 border-b last:border-0">
                                                <span className="w-1/4 text-xs text-muted-foreground">
                                                    {payment.payment_date
                                                        ? new Date(payment.payment_date).toLocaleDateString('en-GB')
                                                        : (payment.created_at ? new Date(payment.created_at).toLocaleDateString('en-GB') : '-')}
                                                </span>
                                                <span className="w-1/4 text-xs text-muted-foreground">
                                                    {payment.created_at ? new Date(payment.created_at).toLocaleString('en-GB', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    }).replace(',', '') : 'N/A'}
                                                </span>
                                                <span className="w-1/4 text-xs">
                                                    <Badge variant="outline" className="text-xs px-1">{payment.method || 'Cash'}</Badge>
                                                </span>
                                                <span className="w-1/4 text-right font-mono font-semibold text-green-600">
                                                    ৳{parseFloat(payment.amount).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}

                                        <div className="flex justify-between font-bold border-t pt-2 mt-2">
                                            <span className="w-1/2">Total Paid</span>
                                            <span className="w-1/2 text-right font-mono text-green-600">৳{totalPaid.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No payments recorded yet</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Payment Action */}
                    <div className="lg:col-span-8 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Department-wise Collection</CardTitle>
                                <CardDescription>Manage discounts and payments per department</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-muted text-muted-foreground text-xs uppercase text-right">
                                                <th className="p-2 text-left w-32">Dept<br /><span className="text-[10px] normal-case">(Department Name)</span></th>
                                                <th className="p-2 w-20">Bill (৳)<br /><span className="text-[10px] normal-case">(All Bill Amount)</span></th>
                                                <th className="p-2 w-16">Disc (৳)<br /><span className="text-[10px] normal-case">(Past Discounts)</span></th>
                                                <th className="p-2 w-24">Disc'd (৳)<br /><span className="text-[10px] normal-case">(Discounted Total)</span></th>
                                                <th className="p-2 w-24">Paid Total (৳)<br /><span className="text-[10px] normal-case">(Already Paid)</span></th>
                                                <th className="p-2 w-24">Due (৳)<br /><span className="text-[10px] normal-case">(Current Due)</span></th>
                                                <th className="p-2 w-24">Discount Now (৳)<br /><span className="text-[10px] normal-case">(New Discount)</span></th>
                                                <th className="p-2 w-24">Pay Now (৳)<br /><span className="text-[10px] normal-case">(New Payment)</span></th>
                                                <th className="p-2 w-24">Final Due (৳)<br /><span className="text-[10px] normal-case">(After Payment)</span></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(deptTotals).map(([dept, billTotal], idx) => {
                                                // Find Dept ID
                                                const tests = testsByDept[dept];
                                                const deptId = tests?.[0]?.test?.category?.department?.id;

                                                // Historical Data (using helper functions for proper calculation)
                                                const histDisc = getDeptDiscountAmount(deptId);
                                                const histPaid = getDeptPaidAmount(deptId, billTotal);

                                                // Inputs
                                                const inputDisc = parseFloat(deptInputs[dept]?.discount || "0");
                                                const inputPay = parseFloat(deptInputs[dept]?.payment || "0");

                                                // Calculations with safeguards to prevent negative values
                                                const discountedTotal = Math.max(0, billTotal - histDisc);
                                                const currentDue = Math.max(0, discountedTotal - histPaid);
                                                const finalDue = Math.max(0, currentDue - inputDisc - inputPay);

                                                const isInvalid = finalDue < 0;
                                                const hasInvalidDiscount = histDisc > billTotal;
                                                const isPaidOff = currentDue === 0;

                                                return (
                                                    <tr key={idx} className={`border-b last:border-0 hover:bg-muted/50 ${hasInvalidDiscount ? 'bg-red-50 dark:bg-red-950/20' : ''}`}>
                                                        <td className="p-2 font-medium text-left">{dept}</td>
                                                        <td className="p-2 text-right">{billTotal.toFixed(0)}</td>
                                                        <td className={`p-2 text-right text-muted-foreground ${hasInvalidDiscount ? 'text-red-600 font-bold' : ''}`}>
                                                            {histDisc.toFixed(0)}
                                                            {hasInvalidDiscount && <span className="block text-[10px]">⚠️ Invalid!</span>}
                                                        </td>
                                                        <td className={`p-2 text-right ${hasInvalidDiscount ? 'text-red-600 font-bold' : ''}`}>
                                                            {discountedTotal.toFixed(0)}
                                                        </td>
                                                        <td className="p-2 text-right text-green-600">{histPaid.toFixed(0)}</td>
                                                        <td className={`p-2 text-right font-semibold ${hasInvalidDiscount ? 'text-red-600' : 'text-orange-600'}`}>
                                                            {currentDue.toFixed(0)}
                                                        </td>
                                                        <td className="p-2">
                                                            <Input
                                                                className="h-7 text-right p-1"
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={deptInputs[dept]?.discount || ''}
                                                                onChange={(e) => handleDeptInputChange(dept, 'discount', e.target.value)}
                                                                placeholder="0"
                                                                disabled={isPaidOff}
                                                                onKeyPress={(e) => {
                                                                    // Prevent negative sign
                                                                    if (e.key === '-') {
                                                                        e.preventDefault();
                                                                    }
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <Input
                                                                className={`h-7 text-right p-1 ${isInvalid ? 'border-red-500' : ''} ${isPaidOff ? 'opacity-50' : ''}`}
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={deptInputs[dept]?.payment || ''}
                                                                onChange={(e) => handleDeptInputChange(dept, 'payment', e.target.value)}
                                                                placeholder="0"
                                                                disabled={isPaidOff}
                                                                onKeyPress={(e) => {
                                                                    // Prevent negative sign
                                                                    if (e.key === '-') {
                                                                        e.preventDefault();
                                                                    }
                                                                }}
                                                            />
                                                        </td>
                                                        <td className={`p-2 text-right font-bold ${isInvalid ? 'text-red-600' : 'text-blue-600'}`}>
                                                            {finalDue.toFixed(0)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-muted/50 font-bold text-xs uppercase">
                                            <tr>
                                                <td className="p-2 text-left">Total</td>
                                                <td className="p-2 text-right">{totalBill.toFixed(0)}</td>
                                                <td className="p-2 text-right">
                                                    {(Object.entries(deptTotals).reduce((sum, [dept]) => {
                                                        const tests = testsByDept[dept];
                                                        const deptId = tests?.[0]?.test?.category?.department?.id;
                                                        return sum + getDeptDiscountAmount(deptId);
                                                    }, 0)).toFixed(0)}
                                                </td>
                                                <td className="p-2 text-right">
                                                    {(totalBill - Object.entries(deptTotals).reduce((sum, [dept]) => {
                                                        const tests = testsByDept[dept];
                                                        const deptId = tests?.[0]?.test?.category?.department?.id;
                                                        return sum + getDeptDiscountAmount(deptId);
                                                    }, 0)).toFixed(0)}
                                                </td>
                                                <td className="p-2 text-right text-green-600">
                                                    {totalPaid.toFixed(0)}
                                                </td>
                                                <td className="p-2 text-right text-orange-600">
                                                    {(totalBill - Object.entries(deptTotals).reduce((sum, [dept]) => {
                                                        const tests = testsByDept[dept];
                                                        const deptId = tests?.[0]?.test?.category?.department?.id;
                                                        return sum + getDeptDiscountAmount(deptId);
                                                    }, 0) - totalPaid).toFixed(0)}
                                                </td>
                                                <td className="p-2 text-right text-blue-600">
                                                    {calculateTotalInput('discount')}
                                                </td>
                                                <td className="p-2 text-right text-green-600">
                                                    {calculateTotalInput('payment')}
                                                </td>
                                                <td className="p-2 text-right text-blue-600">
                                                    {(
                                                        (totalBill - Object.entries(deptTotals).reduce((sum, [dept]) => {
                                                            const tests = testsByDept[dept];
                                                            const deptId = tests?.[0]?.test?.category?.department?.id;
                                                            return sum + getDeptDiscountAmount(deptId);
                                                        }, 0) - totalPaid) -
                                                        parseFloat(calculateTotalInput('discount')) -
                                                        parseFloat(calculateTotalInput('payment'))
                                                    ).toFixed(0)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Global Payment Inputs */}
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Payment Method</Label>
                                        <Popover open={openPaymentMethod} onOpenChange={setOpenPaymentMethod}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openPaymentMethod}
                                                    className="w-full justify-between"
                                                >
                                                    {paymentMethod
                                                        ? ["Cash", "Card", "Mobile Banking"].find((method) => method === paymentMethod) || paymentMethod
                                                        : "Select method..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search method..." />
                                                    <CommandList>
                                                        <CommandEmpty>No method found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {["Cash", "Card", "Mobile Banking"].map((method) => (
                                                                <CommandItem
                                                                    key={method}
                                                                    value={method}
                                                                    onSelect={(currentValue) => {
                                                                        setPaymentMethod(currentValue === paymentMethod ? "" : currentValue)
                                                                        setOpenPaymentMethod(false)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            paymentMethod === method ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {method}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input
                                            type="date"
                                            value={paymentDate}
                                            onChange={(e) => setPaymentDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label>Reason (Optional)</Label>
                                        <Input
                                            value={discountReason}
                                            onChange={(e) => setDiscountReason(e.target.value)}
                                            placeholder="Reason for discount"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handleConfirmCollection}
                                    disabled={collectMutation.isPending || isFullyPaid}
                                >
                                    {isFullyPaid ? "Fully Paid" : collectMutation.isPending ? "Processing..." : "Confirm & Collect"}
                                </Button>
                                {isFullyPaid && (
                                    <p className="text-sm text-green-600 text-center mt-2">
                                        ✅ This invoice has been fully paid
                                    </p>
                                )}
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </main >
        </>
    )
}
