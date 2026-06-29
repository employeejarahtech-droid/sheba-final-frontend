import { useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { useCan } from '@/hooks/use-can'
import { AppHeader } from '@/components/layout/app-header'




import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DateField } from '@/components/date-field'
import { useState, useEffect, useRef } from 'react'
import { toast } from "sonner"
import { Loader2, ArrowLeft, Check, ChevronsUpDown, Printer, User, FlaskConical, Tag, Wallet, PenLine } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'
import { useDateControls } from '@/hooks/use-date-controls'

const API_URL = import.meta.env.VITE_API_URL

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
        creator?: { id: number; name: string } | null;
    }[];
    discounts: { id: number; amount: string; reason?: string; created_at?: string; creator?: { id: number; name: string } | null }[];
    department_payments?: { department_id: number; amount: string }[];
    department_discounts?: { id: number; department_id: number; discount: string; created_at?: string; creator?: { id: number; name: string } | null }[];
};

export default function DueCollectionDetails() {
    const { invoiceId } = useParams({ from: '/_authenticated/dashboard/outdoor/reception/due-collection/$invoiceId' });
    const token = getCookie('accessToken');
    const can = useCan();
    const canCollect = can('outdoor.reception.due-collection.collection');
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { currencySymbol, format } = useCurrency();
    const { formatDate: fmtDate } = useDateFormat();
    const { isChangeable } = useDateControls();
    const dueDateChangeable = isChangeable('outdoor_due_collection_date_changeable');
    // Settings date format + 12h time, for entry/payment timestamps
    const fmtDateTime = (d: Date) => `${fmtDate(d)} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;


    const [paymentMethod, setPaymentMethod] = useState<string>("");
    const [openPaymentMethod, setOpenPaymentMethod] = useState(false);
    const [discountReason, setDiscountReason] = useState<string>("");
    const [paymentDate, setPaymentDate] = useState<string>("");

    // Department-wise inputs
    const [deptInputs, setDeptInputs] = useState<Record<string, { discount: string; payment: string }>>({});

    // Ref for drag-to-scroll on the department collection table wrapper
    const tableScrollRef = useRef<HTMLDivElement>(null);

    // Fetch payment methods from settings
    const { data: paymentMappings } = useQuery({
        queryKey: ['payment-mappings'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/app-settings/payment-mappings`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch payment mappings')
            const json = await res.json()
            return json.data || {}
        },
        enabled: !!token,
    })

    const paymentMethodOptions: string[] = paymentMappings?.outdoor_test_payment?.methods?.map((m: any) => m.name).filter(Boolean) || ["Cash", "Card", "Mobile Banking"]

    useEffect(() => {
        if (paymentMethodOptions.length > 0 && !paymentMethod) {
            setPaymentMethod(paymentMethodOptions[0])
        }
    }, [paymentMethodOptions])

    const { data: invoice, isLoading, error } = useQuery<InvoiceDetails>({
        queryKey: ["invoice", invoiceId],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${invoiceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch invoice details");
            const json = await res.json();
            console.log('=== Invoice data received ===');
            console.log('Full invoice data:', json.data);
            console.log('Selected tests:', json.data.selected_tests);
            if (json.data.selected_tests && json.data.selected_tests.length > 0) {
                console.log('First test structure:', json.data.selected_tests[0]);
                console.log('First test.category:', json.data.selected_tests[0].test?.category);
                console.log('First test.category.department:', json.data.selected_tests[0].test?.category?.department);
            }
            return json.data;
        },
        enabled: !!invoiceId && !!token
    });

    // Set payment date to invoice date when invoice loads
    useEffect(() => {
        if (invoice?.invoice_date) {
            const invoiceDate = new Date(invoice.invoice_date);
            setPaymentDate(invoiceDate.toISOString().split('T')[0]);
        }
    }, [invoice]);

    // ── Drag-to-scroll on hover for the department collection table ──────────
    useEffect(() => {
        const el = tableScrollRef.current;
        if (!el) return;

        let isDown = false;
        let startX = 0;
        let scrollL = 0;

        const onDown = (e: MouseEvent) => {
            // Don't hijack clicks on interactive elements (inputs, buttons)
            if ((e.target as HTMLElement).closest('a, button, input, select, textarea')) return;
            isDown = true;
            startX = e.pageX - el.offsetLeft;
            scrollL = el.scrollLeft;
            el.style.cursor = 'grabbing';
            el.style.userSelect = 'none';
        };

        const onMove = (e: MouseEvent) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - el.offsetLeft;
            const walk = (x - startX) * 1.5;
            el.scrollLeft = scrollL - walk;
        };

        const onUp = () => {
            isDown = false;
            el.style.cursor = 'grab';
            el.style.userSelect = '';
        };

        el.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        el.style.cursor = 'grab';

        return () => {
            el.removeEventListener('mousedown', onDown);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [invoice]);

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
            console.log('=== collectMutation.mutationFn called ===');
            console.log('Payload:', payload);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outdoor-invoice/due-collection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            console.log('API response status:', res.status);
            if (!res.ok) {
                const errorData = await res.json();
                console.error('API error:', errorData);
                throw new Error(errorData.message || "Failed to collect payment");
            }
            const result = await res.json();
            console.log('API success response:', result);
            return result;
        },
        onSuccess: () => {
            console.log('=== collectMutation.onSuccess called ===');
            toast.success("Payment collected successfully");
            queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
            // Reset department inputs
            setDeptInputs({});
            setDiscountReason("");
        },
        onError: (err) => {
            console.error('=== collectMutation.onError called ===');
            console.error('Error:', err);
            toast.error(err.message);
        }
    });

    // Helper to update department inputs with validation
    const handleDeptInputChange = (dept: string, field: 'discount' | 'payment', value: string) => {
        console.log(`=== handleDeptInputChange called: dept=${dept}, field=${field}, value=${value} ===`);

        // Get department data for validation
        const tests = testsByDept[dept];
        const deptId = tests?.[0]?.test?.category?.department?.id;
        const billTotal = deptTotals[dept] || 0;
        const histDisc = getDeptDiscountAmount(deptId);
        const histPaid = getDeptPaidAmount(deptId, billTotal);

        console.log(`deptId: ${deptId}, billTotal: ${billTotal}, histDisc: ${histDisc}, histPaid: ${histPaid}`);

        // Calculate current due amount
        const discountedTotal = Math.max(0, billTotal - histDisc);
        const currentDue = Math.max(0, discountedTotal - histPaid);
        console.log(`currentDue: ${currentDue}`);

        // Get current input values
        const currentDiscount = field === 'discount' ? value : (deptInputs[dept]?.discount || '0');
        const currentPayment = field === 'payment' ? value : (deptInputs[dept]?.payment || '0');

        // Validate numeric input (allow empty string, positive numbers and decimals)
        if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
            console.log('Invalid numeric input, returning early');
            return; // Invalid input, don't update state
        }

        // Parse numeric values
        const discountAmt = parseFloat(currentDiscount) || 0;
        const paymentAmt = parseFloat(currentPayment) || 0;
        console.log(`discountAmt: ${discountAmt}, paymentAmt: ${paymentAmt}`);

        // Validate discount doesn't exceed current due
        if (field === 'discount' && discountAmt > currentDue) {
            console.log(`Discount validation failed: ${discountAmt} > ${currentDue}`);
            toast.error(`Discount cannot exceed current due (${format(currentDue)}) for ${dept}`);
            return;
        }

        // Validate payment doesn't exceed current due minus discount
        const maxPayment = Math.max(0, currentDue - discountAmt);
        if (field === 'payment' && paymentAmt > maxPayment) {
            console.log(`Payment validation failed: ${paymentAmt} > ${maxPayment}`);
            toast.error(`Payment cannot exceed due amount (${format(maxPayment)}) for ${dept}`);
            return;
        }

        console.log('All validations passed, updating state');
        // All validations passed, update state
        setDeptInputs(prev => {
            const updated = {
                ...prev,
                [dept]: {
                    ...prev[dept],
                    discount: field === 'discount' ? value : (prev[dept]?.discount || ''),
                    payment: field === 'payment' ? value : (prev[dept]?.payment || '')
                }
            };
            console.log('Updated deptInputs:', updated);
            return updated;
        });
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
        console.log('=== handleConfirmCollection called ===');
        console.log('deptInputs:', deptInputs);

        if (!invoice) return;

        // Build department-wise arrays
        const department_payments: { department_id: number; amount: number; method: string }[] = [];
        const department_discounts: { department_id: number; discount: number }[] = [];

        Object.entries(deptInputs).forEach(([deptName, inputs]) => {
            console.log(`Processing department: ${deptName}, inputs:`, inputs);
            const tests = testsByDept[deptName];
            const deptId = tests?.[0]?.test?.category?.department?.id;
            console.log(`deptId for ${deptName}:`, deptId);

            if (deptId) {
                const paymentAmt = parseFloat(inputs.payment || '0');
                const discountAmt = parseFloat(inputs.discount || '0');
                console.log(`paymentAmt: ${paymentAmt}, discountAmt: ${discountAmt}`);

                if (paymentAmt > 0) {
                    department_payments.push({
                        department_id: deptId,
                        amount: paymentAmt,
                        method: paymentMethod
                    });
                    console.log(`Added payment for ${deptName}:`, paymentAmt);
                }

                if (discountAmt > 0) {
                    department_discounts.push({
                        department_id: deptId,
                        discount: discountAmt
                    });
                    console.log(`Added discount for ${deptName}:`, discountAmt);
                }
            }
        });

        console.log('Final department_payments:', department_payments);
        console.log('Final department_discounts:', department_discounts);

        if (department_payments.length === 0 && department_discounts.length === 0) {
            console.error('No payments or discounts to submit');
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
                console.error(`Validation failed for ${deptName}: totalReduction(${totalReduction}) > currentDue(${currentDue})`);
                toast.error(`${deptName}: Total (${format(totalReduction)}) exceeds due amount (${format(currentDue)})`);
                hasInvalidAmount = true;
            }
        });

        if (hasInvalidAmount) {
            console.log('Has invalid amounts, returning early');
            return;
        }

        // Calculate totals
        const totalPayment = department_payments.reduce((sum, p) => sum + p.amount, 0);
        const totalDiscount = department_discounts.reduce((sum, d) => sum + d.discount, 0);

        console.log('About to call collectMutation.mutate with:', {
            invoice_id: invoice.id,
            amount: totalPayment,
            method: paymentMethod,
            discount: totalDiscount,
            discount_reason: discountReason,
            department_payments,
            department_discounts,
            payment_date: paymentDate
        });

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
        console.log('collectMutation.mutate called successfully');
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

    console.log('=== Grouping tests by department ===');
    invoice.selected_tests?.forEach(item => {
        console.log('Processing test item:', item);
        const deptName = item.test?.category?.department?.name || "Uncategorized";
        console.log(`Test: ${item.test?.name}, Department: ${deptName}`);
        if (!testsByDept[deptName]) {
            testsByDept[deptName] = [];
            deptTotals[deptName] = 0;
        }
        testsByDept[deptName].push(item);
        deptTotals[deptName] += parseFloat(item.price) || 0;
    });
    console.log('Final testsByDept:', testsByDept);
    console.log('Final deptTotals:', deptTotals);

    // Calculate total bill across all departments
    const totalBill = Object.values(deptTotals).reduce((sum, val) => sum + val, 0);

    // NOTE: We DON'T distribute global payments proportionally because we don't know
    // which specific departments/tests the payment was for. The payment might have
    // been for tests in a specific department, so distributing it would be wrong.
    // Only use department-wise payments that were explicitly recorded.
    // const _totalGlobalPaid = Math.max(0, totalPaid - totalDeptWisePaid);

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

            <main className='space-y-3'>
                <div className=" flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate({ to: '/dashboard/outdoor/reception/due-collection' })}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate({ to: '/dashboard/outdoor/reception/invoices/$invoiceId', params: { invoiceId: String(invoiceId) } })}
                        className="ml-auto"
                    >
                        <Printer className="mr-2 h-4 w-4" /> Print Invoice
                    </Button>
                </div>

                <div className="space-y-6">
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg font-bold">Invoice #{invoice.id}</CardTitle>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">{fmtDateTime(new Date(invoice.created_at))}</p>
                                    </div>
                                    <Badge variant={dueAmount > 0 ? "destructive" : "default"} className="text-sm px-3 py-1">
                                        {dueAmount > 0 ? "UNPAID" : "PAID"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className='p-2'>
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



                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-b py-1.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-lg">
                                        <FlaskConical className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Test Details</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className='p-2'>
                                {Object.entries(testsByDept).map(([dept, tests]) => (
                                    <div key={dept} className="mb-6 last:mb-0">
                                        <h3 className="font-semibold text-primary mb-2 border-b pb-1">{dept}</h3>
                                        <div className="space-y-2">
                                            {tests.map((t, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <span>{t.test?.name}</span>
                                                    <span className="font-mono">{format(parseFloat(t.price))}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t pt-2 mt-4 flex justify-between items-center font-bold text-lg">
                                    <span>Total Bill</span>
                                    <span>{format(Number(invoice.total_amount))}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b py-1.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-lg">
                                        <Tag className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Discount History</CardTitle>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">All discounts applied to this invoice</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-2">
                                {(() => {
                                    const rawGlobal = invoice.discounts?.filter(d => parseFloat(d.amount) > 0) || [];
                                    const deptDiscounts = invoice.department_discounts?.filter(d => parseFloat(d.discount) > 0) || [];

                                    // De-duplicate due-collection "rollup" rows.
                                    // Each due collection writes the SAME discount to two tables: a single
                                    // global row (the total) AND per-department rows. Showing both double-counts.
                                    // They are created in the same DB transaction, so their created_at timestamps
                                    // coincide (within ~1s). A global discount whose created_at is within ±2s of
                                    // any department discount is a redundant rollup → exclude it. Standalone
                                    // creation-time discounts (no matching dept rows at that moment) stay.
                                    const msOf = (d: { created_at?: string } | undefined) =>
                                        d?.created_at ? new Date(d.created_at).getTime() : NaN;
                                    const globalDiscounts = rawGlobal.filter(g => {
                                        const gMs = msOf(g);
                                        if (isNaN(gMs)) return true; // no timestamp → keep (safe default)
                                        return !deptDiscounts.some(d => {
                                            const dMs = msOf(d);
                                            return !isNaN(dMs) && Math.abs(gMs - dMs) <= 2000;
                                        });
                                    });

                                    const hasDiscounts = globalDiscounts.length > 0 || deptDiscounts.length > 0;

                                    if (!hasDiscounts) {
                                        return <p className="text-sm text-muted-foreground text-center py-4">No discounts recorded</p>;
                                    }

                                    return (
                                        <div className="space-y-4">
                                            <div className="flex justify-between font-medium border-b pb-2 text-xs text-muted-foreground">
                                                <span className="w-1/4">Entry Date</span>
                                                <span className="w-1/4">Reason / Dept</span>
                                                <span className="w-1/4">Discounted by</span>
                                                <span className="w-1/4 text-right">Amount</span>
                                            </div>

                                            {/* Global discounts */}
                                            {globalDiscounts.map((d, idx) => (
                                                <div key={`g-${idx}`} className="flex justify-between items-center text-sm py-1 border-b last:border-0">
                                                    <span className="w-1/4 text-xs text-muted-foreground">
                                                        {d.created_at ? fmtDateTime(new Date(d.created_at)) : '-'}
                                                    </span>
                                                    <span className="w-1/4 text-xs">
                                                        <Badge variant="outline" className="text-xs px-1">{d.reason || 'General'}</Badge>
                                                    </span>
                                                    <span className="w-1/4 text-xs text-muted-foreground">
                                                        {d.creator?.name || '-'}
                                                    </span>
                                                    <span className="w-1/4 text-right font-mono font-semibold text-orange-600">
                                                        -{format(parseFloat(d.amount))}
                                                    </span>
                                                </div>
                                            ))}

                                            {/* Department discounts */}
                                            {deptDiscounts.map((d, idx) => {
                                                const deptName = Object.entries(testsByDept).find(([dept]) => {
                                                    const tests = testsByDept[dept];
                                                    return tests?.[0]?.test?.category?.department?.id === d.department_id;
                                                })?.[0] || `Dept #${d.department_id}`;

                                                return (
                                                    <div key={`d-${idx}`} className="flex justify-between items-center text-sm py-1 border-b last:border-0">
                                                        <span className="w-1/4 text-xs text-muted-foreground">
                                                            {d.created_at ? fmtDateTime(new Date(d.created_at)) : '-'}
                                                        </span>
                                                        <span className="w-1/4 text-xs">
                                                            <Badge variant="outline" className="text-xs px-1">{deptName}</Badge>
                                                        </span>
                                                        <span className="w-1/4 text-xs text-muted-foreground">
                                                            {d.creator?.name || '-'}
                                                        </span>
                                                        <span className="w-1/4 text-right font-mono font-semibold text-orange-600">
                                                            -{format(parseFloat(d.discount))}
                                                        </span>
                                                    </div>
                                                );
                                            })}

                                            <div className="flex justify-between font-bold border-t pt-2 mt-2">
                                                <span className="w-1/2">Total Discount</span>
                                                <span className="w-1/2 text-right font-mono text-orange-600">
                                                    -{format(
                                                        globalDiscounts.reduce((s, d) => s + parseFloat(d.amount), 0) +
                                                        deptDiscounts.reduce((s, d) => s + parseFloat(d.discount), 0)
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-b py-1.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg shadow-lg">
                                        <Wallet className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Payment History</CardTitle>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">All payments received for this invoice</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-2">
                                {invoice.payments && invoice.payments.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between font-medium border-b pb-2 text-xs text-muted-foreground">
                                            <span className="w-1/5">Pay Date</span>
                                            <span className="w-1/5">Entry Date</span>
                                            <span className="w-1/5">Method</span>
                                            <span className="w-1/5">Paid by</span>
                                            <span className="w-1/5 text-right">Amount</span>
                                        </div>
                                        {invoice.payments.map((payment, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm py-1 border-b last:border-0">
                                                <span className="w-1/5 text-xs text-muted-foreground">
                                                    {payment.payment_date
                                                        ? fmtDate(new Date(payment.payment_date))
                                                        : (payment.created_at ? fmtDate(new Date(payment.created_at)) : '-')}
                                                </span>
                                                <span className="w-1/5 text-xs text-muted-foreground">
                                                    {payment.created_at ? fmtDateTime(new Date(payment.created_at)) : 'N/A'}
                                                </span>
                                                <span className="w-1/5 text-xs">
                                                    <Badge variant="outline" className="text-xs px-1">{payment.method || 'Cash'}</Badge>
                                                </span>
                                                <span className="w-1/5 text-xs text-muted-foreground">
                                                    {payment.creator?.name || '-'}
                                                </span>
                                                <span className="w-1/5 text-right font-mono font-semibold text-green-600">
                                                    {format(parseFloat(payment.amount))}
                                                </span>
                                            </div>
                                        ))}

                                        <div className="flex justify-between font-bold border-t pt-2 mt-2">
                                            <span className="w-1/2">Total Paid</span>
                                            <span className="w-1/2 text-right font-mono text-green-600">{format(totalPaid)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No payments recorded yet</p>
                                )}
                            </CardContent>
                        </Card>
                    {/* Department-wise Collection (moved below the 4 cards) */}
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <PenLine className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Department-wise Collection</CardTitle>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Manage discounts and payments per department</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className='p-2'>
                                <div ref={tableScrollRef} className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse" style={{ minWidth: '800px' }}>
                                        <thead>
                                            <tr className="bg-muted text-muted-foreground text-xs uppercase text-right">
                                                <th className="p-2 text-left w-32">Dept<br /><span className="text-[10px] normal-case">(Department Name)</span></th>
                                                <th className="p-2 w-20">Bill ({currencySymbol})<br /><span className="text-[10px] normal-case">(All Bill Amount)</span></th>
                                                <th className="p-2 w-16">Disc ({currencySymbol})<br /><span className="text-[10px] normal-case">(Past Discounts)</span></th>
                                                <th className="p-2 w-24">Disc'd ({currencySymbol})<br /><span className="text-[10px] normal-case">(Discounted Total)</span></th>
                                                <th className="p-2 w-24">Paid Total ({currencySymbol})<br /><span className="text-[10px] normal-case">(Already Paid)</span></th>
                                                <th className="p-2 w-24">Due ({currencySymbol})<br /><span className="text-[10px] normal-case">(Current Due)</span></th>
                                                <th className="p-2 w-24">Discount Now ({currencySymbol})<br /><span className="text-[10px] normal-case">(New Discount)</span></th>
                                                <th className="p-2 w-24">Pay Now ({currencySymbol})<br /><span className="text-[10px] normal-case">(New Payment)</span></th>
                                                <th className="p-2 w-24">Final Due ({currencySymbol})<br /><span className="text-[10px] normal-case">(After Payment)</span></th>
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
                                                                onChange={(e) => {
                                                                    console.log(`Discount input changed for dept="${dept}" value=${e.target.value}`);
                                                                    handleDeptInputChange(dept, 'discount', e.target.value);
                                                                }}
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
                                                                onChange={(e) => {
                                                                    console.log(`Payment input changed for dept="${dept}" value=${e.target.value}`);
                                                                    handleDeptInputChange(dept, 'payment', e.target.value);
                                                                }}
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
                                                        ? paymentMethodOptions.find((method) => method === paymentMethod) || paymentMethod
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
                                                            {paymentMethodOptions.map((method) => (
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
                                        <Label>{dueDateChangeable ? 'Payment Date' : 'Date (Fixed to Invoice Date)'}</Label>
                                        <DateField
                                            value={paymentDate}
                                            onChange={(iso) => setPaymentDate(iso)}
                                            disabled={!dueDateChangeable}
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
                            <CardFooter className="pb-4">
                                {canCollect && (
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={handleConfirmCollection}
                                        disabled={collectMutation.isPending || isFullyPaid}
                                    >
                                        {isFullyPaid ? "Fully Paid" : collectMutation.isPending ? "Processing..." : "Confirm & Collect"}
                                    </Button>
                                )}
                                {isFullyPaid && (
                                    <p className="text-sm text-green-600 text-center mt-2">
                                        ✅ This invoice has been fully paid
                                    </p>
                                )}
                            </CardFooter>
                        </Card>
                </div>
            </main >
        </>
    )
}
