import { AppHeader } from '@/components/layout/app-header'
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/DataTable'
import { useState, useMemo, useEffect } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { useCurrency } from '@/hooks/use-currency'
import { FileText, DollarSign, TrendingUp, User, Filter, Check } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { DateField } from "@/components/date-field"
import { useDateFormat } from "@/hooks/use-date-format"
import { cn } from "@/lib/utils"

type UserInvoicesProps = {
    page: number;
    limit: number;
    search: string;
    statusFilter: string;
    selectedUser: string;
    from: string;
    to: string;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setSearch: (search: string) => void;
    setStatusFilter: (status: string) => void;
    setSelectedUser: (user: string) => void;
    setFrom: (from: string) => void;
    setTo: (to: string) => void;
};

type InvoiceItem = {
    id: number;
    invoice_prefix: string | null;
    patient_name: string;
    sex: string | null;
    age: number | null;
    phone: string | null;
    reference_doctor: string | null;
    doctor?: {
        doctor_name: string;
    } | null;
    creator?: {
        id: number;
        name: string;
    } | null;
    total_amount: number;
    net_amount: number | null;
    total_paid: number;
    due_amount: number;
    invoice_date: string | null;
    delivery_date: string | null;
    created_at: string;
    created_by?: string | number | null;
    status: string | null;
};

type UserInfo = {
    id: number;
    name: string;
    email?: string;
};

export default function UserInvoices({ page, limit, search, statusFilter, selectedUser, from, to, setPage, setLimit, setSearch, setStatusFilter, setSelectedUser, setFrom, setTo }: UserInvoicesProps) {
    const [openFilter, setOpenFilter] = useState(false);

    const token = getCookie('accessToken');
    const { currency, currencySymbol, format } = useCurrency();
    const fmtNum = (v: any) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const { dateFormat, formatDate: fmtDate } = useDateFormat();

    // Fetch users who have created invoices
    const { data: usersData } = useQuery({
        queryKey: ["invoice-users"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/users`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch users");
            return res.json();
        },
        enabled: !!token,
    });

    // Fetch invoices
    const { data, isFetching } = useQuery({
        queryKey: ["user-invoices", page, limit, search, statusFilter, selectedUser, from, to],

        queryFn: async () => {
            const statusParam = statusFilter !== "all" ? `&status=${statusFilter}` : "";
            const userParam = selectedUser !== "all" ? `&user_id=${selectedUser}` : "";
            const fromParam = from ? `&from=${encodeURIComponent(from)}` : "";
            const toParam = to ? `&to=${encodeURIComponent(to)}` : "";
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/outdoor-invoice?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${statusParam}${userParam}${fromParam}${toParam}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) throw new Error("Failed to fetch invoices");
            return res.json();
        },

        enabled: !!token,

        placeholderData: (prev) =>
            prev
                ? prev
                : {
                    data: {
                        items: [],
                        meta: {
                            total: 0,
                            page: 1,
                            limit: 10
                        },
                        stats: {
                            total_bill: 0,
                            total_discount: 0,
                            total_paid: 0,
                            total_due: 0
                        }
                    },
                },
    });

    // Calculate stats
    const stats = useMemo(() => {
        const serverStats = data?.data?.stats || {};
        const totalInvoices = data?.data?.meta?.total || 0;

        return [
            {
                label: "Total Invoices",
                value: totalInvoices,
                gradient: "from-blue-600 to-blue-400",
                shadow: "shadow-blue-500/30",
                icon: <FileText className="w-6 h-6 text-white" />,
            },
            {
                label: `Total Bill (${currency})`,
                value: fmtNum(serverStats.total_bill || 0),
                gradient: "from-emerald-600 to-emerald-400",
                shadow: "shadow-emerald-500/30",
                icon: <DollarSign className="w-6 h-6 text-white" />,
            },
            {
                label: `Total Paid (${currency})`,
                value: fmtNum(serverStats.total_paid || 0),
                gradient: "from-amber-600 to-amber-400",
                shadow: "shadow-amber-500/30",
                icon: <TrendingUp className="w-6 h-6 text-white" />,
            },
            {
                label: `Total Due (${currency})`,
                value: fmtNum(serverStats.total_due || 0),
                gradient: "from-red-600 to-red-400",
                shadow: "shadow-red-500/30",
                icon: <DollarSign className="w-6 h-6 text-white" />,
            },
        ];
    }, [data, currencySymbol]);

    // ---- Date filter presets (Filter By) ----
    const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
    // Format as LOCAL YYYY-MM-DD. Do NOT use toISOString() — it converts to UTC and
    // shifts the date back one day in timezones east of UTC (e.g. UTC+6 → off-by-one).
    const toYMD = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };
    const datePresets = useMemo(() => ({
        today: { label: 'Today', from: toYMD(today()), to: toYMD(today()) },
        yesterday: (() => { const d = today(); d.setDate(d.getDate() - 1); return { label: 'Yesterday', from: toYMD(d), to: toYMD(d) }; })(),
        last7: { label: 'Last 7 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 6); return d; })()), to: toYMD(today()) },
        last15: { label: 'Last 15 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 14); return d; })()), to: toYMD(today()) },
        last30: { label: 'Last 30 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 29); return d; })()), to: toYMD(today()) },
        last45: { label: 'Last 45 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 44); return d; })()), to: toYMD(today()) },
        last60: { label: 'Last 60 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 59); return d; })()), to: toYMD(today()) },
        last90: { label: 'Last 90 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 89); return d; })()), to: toYMD(today()) },
        last180: { label: 'Last 180 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 179); return d; })()), to: toYMD(today()) },
        last365: { label: 'Last 365 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 364); return d; })()), to: toYMD(today()) },
    }), []);
    // Detect which preset (if any) currently matches the from/to in the URL
    const activePreset = useMemo(() => {
        if (!from || !to) return 'custom';
        const match = Object.entries(datePresets).find(([, v]) => v.from === from && v.to === to);
        return match ? match[0] : 'custom';
    }, [from, to, datePresets]);
    const [presetOpen, setPresetOpen] = useState(false);
    const applyPreset = (key: string) => {
        const p = (datePresets as any)[key];
        if (p) { setFrom(p.from); setTo(p.to); }
        setPresetOpen(false);
    };

    // Handle expand button clicks using event delegation
    useEffect(() => {
        const handleExpandClick = async (e: Event) => {
            const button = (e.target as HTMLElement).closest('.expand-btn');
            if (!button) return;

            const btn = button as HTMLButtonElement;
            const row = btn.closest('tr');
            if (!row) return;

            const isExpanded = row.classList.contains('expanded');
            const nextRow = row.nextElementSibling;

            // Toggle collapse
            if (nextRow && nextRow.classList.contains('child-row-detail')) {
                nextRow.remove();
                row.classList.remove('expanded');
                btn.textContent = '+';
                btn.style.backgroundColor = 'black';
                return;
            }

            // Don't expand if already expanded
            if (isExpanded) return;

            const id = btn.dataset.id || '';

            // Create details HTML with loading state
            const details = document.createElement('div');
            details.className = 'max-w-4xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden';

            details.innerHTML = `
                <!-- Header -->
                <div class="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-4">
                    <h2 class="text-xl font-semibold">Invoice Details</h2>
                    <p class="text-sm opacity-90">Invoice #${id}</p>
                </div>

                <!-- Body -->
                <div class="p-6">
                    <div id="invoice-details-${id}" class="text-gray-500 text-sm">
                        Loading invoice details...
                    </div>
                </div>
            `;

            // Create new row
            const newRow = document.createElement('tr');
            newRow.className = 'child-row-detail';
            const cell = document.createElement('td');
            cell.className = 'p-4 bg-gray-50';
            cell.colSpan = row.cells.length;
            cell.appendChild(details);
            newRow.appendChild(cell);

            row.parentNode?.insertBefore(newRow, row.nextSibling);
            row.classList.add('expanded');
            btn.textContent = '−';
            btn.style.backgroundColor = '#dc2626';

            // Fetch invoice details
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error("Failed to fetch invoice details");

                const result = await res.json();
                const invoice = result.data;

                // Calculate totals
                const totalDiscounts = invoice.department_discounts?.reduce((total: number, discount: any) => total + Number(discount.discount), 0) || 0;
                const totalPayments = invoice.payments?.reduce((total: number, payment: any) => total + Number(payment.amount), 0) || 0;
                const dueAmount = Number(invoice.net_amount) - totalPayments;

                // Calculate department-wise breakdown from selected_tests
                const departmentMap = new Map<string, { gross: number; discount: number; paid: number; department_id?: number; }>();
                const departmentIdToName = new Map<number, string>();

                // Initialize from selected_tests
                invoice.selected_tests?.forEach((test: any) => {
                    const deptName = test.department?.name || test.department_name || 'Unknown';
                    const deptId = test.department?.id || test.department_id;
                    const price = Number(test.price || 0);

                    if (deptId && !departmentIdToName.has(deptId)) {
                        departmentIdToName.set(deptId, deptName);
                    }

                    if (!departmentMap.has(deptName)) {
                        departmentMap.set(deptName, { gross: 0, discount: 0, paid: 0, department_id: deptId });
                    }

                    const dept = departmentMap.get(deptName)!;
                    dept.gross += price;
                });

                // Add discounts from department_discounts
                invoice.department_discounts?.forEach((discount: any) => {
                    let deptName = discount.department?.name || discount.department_name || discount.department?.department_name;
                    if (!deptName && discount.department_id) {
                        deptName = departmentIdToName.get(discount.department_id);
                    }
                    deptName = deptName || discount.department || `Department ID: ${discount.department_id}` || 'Unknown';

                    const discountAmount = Number(discount.discount || 0);

                    if (departmentMap.has(deptName)) {
                        const dept = departmentMap.get(deptName)!;
                        dept.discount += discountAmount;
                    }
                });

                // Add payments from department_payments if available
                if (invoice.department_payments) {
                    invoice.department_payments.forEach((payment: any) => {
                        let deptName = payment.department?.name || payment.department_name || payment.department?.department_name;
                        if (!deptName && payment.department_id) {
                            deptName = departmentIdToName.get(payment.department_id);
                        }
                        deptName = deptName || payment.department || `Department ID: ${payment.department_id}` || 'Unknown';

                        const paidAmount = Number(payment.amount || 0);

                        if (departmentMap.has(deptName)) {
                            const dept = departmentMap.get(deptName)!;
                            dept.paid += paidAmount;
                        }
                    });
                }

                // Format dates
                const formatDate = (dateString: string | null) => {
                    if (!dateString) return '-';
                    const date = new Date(dateString);
                    return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    });
                };

                const isPaid = dueAmount === 0;
                const statusBadge = isPaid
                    ? '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-600">Paid</span>'
                    : '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">Due</span>';

                // Build tests table HTML
                const testsTableHTML = invoice.selected_tests?.map((test: any, index: number) => `
                    <tr class="border-b">
                        <td class="py-2 px-3 text-center">${index + 1}</td>
                        <td class="py-2 px-3">${test.test?.name || '-'}</td>
                        <td class="py-2 px-3 text-right">${Number(test.price).toFixed(2)}</td>
                        <td class="py-2 px-3 text-center">${test.department?.name || '-'}</td>
                    </tr>
                `).join('') || '<tr><td colspan="4" class="py-4 text-center text-gray-500">No tests found</td></tr>';

                // Build payments table HTML
                const paymentsTableHTML = invoice.payments?.map((payment: any) => {
                    const method = payment.payment_method || payment.method || payment.paymentMethod || payment.transaction_type || payment.type || payment.payment_type || '-';
                    const paymentDate = payment.payment_date || payment.date || payment.created_at || payment.paid_at;

                    return `
                    <tr class="border-b">
                        <td class="py-2 px-3">${formatDate(paymentDate)}</td>
                        <td class="py-2 px-3">${method}</td>
                        <td class="py-2 px-3">${payment.creator?.name || '-'}</td>
                        <td class="py-2 px-3 text-right text-emerald-600 font-medium">${Number(payment.amount).toFixed(2)}</td>
                    </tr>
                    `;
                }).join('') || '<tr><td colspan="4" class="py-4 text-center text-gray-500">No payments made yet</td></tr>';

                // Build discounts table HTML
                const discountsTableHTML = invoice.department_discounts?.map((discount: any) => {
                    let deptName = discount.department?.name || discount.department_name || discount.department?.department_name;
                    if (!deptName && discount.department_id) {
                        deptName = departmentIdToName.get(discount.department_id);
                    }
                    deptName = deptName || discount.department || `Department ID: ${discount.department_id}` || 'Unknown';

                    return `
                    <tr class="border-b">
                        <td class="py-2 px-3">${deptName}</td>
                        <td class="py-2 px-3">${discount.creator?.name || '-'}</td>
                        <td class="py-2 px-3 text-right text-orange-600 font-medium">${Number(discount.discount).toFixed(2)}</td>
                    </tr>
                    `;
                }).join('') || '';

                // Build department-wise breakdown HTML
                const departmentBreakdownHTML = departmentMap.size > 0
                    ? Array.from(departmentMap.entries()).map(([deptName, data]) => {
                        const net = data.gross - data.discount;
                        const due = net - data.paid;

                        return `
                        <tr class="border-b">
                            <td class="py-2 px-3">${deptName}</td>
                            <td class="py-2 px-3 text-right">${data.gross.toFixed(2)}</td>
                            <td class="py-2 px-3 text-right text-orange-600">${data.discount.toFixed(2)}</td>
                            <td class="py-2 px-3 text-right font-semibold">${net.toFixed(2)}</td>
                            <td class="py-2 px-3 text-right text-emerald-600">${data.paid.toFixed(2)}</td>
                            <td class="py-2 px-3 text-right text-red-600 font-semibold">${due.toFixed(2)}</td>
                        </tr>
                        `;
                    }).join('')
                    : '<tr><td colspan="6" class="py-4 text-center text-gray-500">No department breakdown available</td></tr>';

                // Format delivery date and time
                const formatDateTime = (date: string | null, time: string | null) => {
                    if (!date) return '-';
                    const dateStr = formatDate(date);
                    return time ? `${dateStr} ${time}` : dateStr;
                };

                const invoiceDetailsHTML = `
                    <div class="space-y-6">
                        <!-- Patient Information -->
                        <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-sm border-b pb-6">
                            <div>
                                <p class="text-gray-500">Invoice ID</p>
                                <p class="font-semibold text-gray-800">${invoice.invoice_prefix || invoice.id || '-'}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Status</p>
                                ${statusBadge}
                            </div>
                            <div>
                                <p class="text-gray-500">Patient Name</p>
                                <p class="font-semibold text-gray-800">${invoice.patient_name || '-'}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Phone</p>
                                <p class="font-semibold text-gray-800">${invoice.phone || '-'}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Age / Sex</p>
                                <p class="font-semibold text-gray-800">${invoice.age ? `${invoice.age} ${invoice.age_text || ''}` : '-'} / ${invoice.sex?.toUpperCase() || '-'}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Reference Doctor</p>
                                <p class="font-semibold text-gray-800">${invoice.doctor?.name || invoice.reference_doctor || '-'}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Invoice Date</p>
                                <p class="font-semibold text-gray-800">${formatDate(invoice.created_at)}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Delivery Date</p>
                                <p class="font-semibold text-gray-800">${formatDateTime(invoice.delivery_date, invoice.delivery_time)}</p>
                            </div>
                            ${invoice.is_indoor_patient ? `
                            <div class="col-span-2">
                                <p class="text-gray-500">Patient Type</p>
                                <p class="font-semibold text-blue-600">Indoor Patient (Admitted)</p>
                            </div>
                            ` : ''}
                        </div>

                        <!-- Selected Tests -->
                        <div>
                            <h3 class="text-lg font-semibold mb-3 text-gray-800">Selected Tests</h3>
                            <table class="w-full text-sm border">
                                <thead>
                                    <tr class="bg-gray-50">
                                        <th class="py-2 border text-center px-3 w-16">SL</th>
                                        <th class="py-2 border text-left px-3">Test Name</th>
                                        <th class="py-2 border text-right px-3 w-24">Price</th>
                                        <th class="py-2 border text-center px-3 w-32">Department</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${testsTableHTML}
                                </tbody>
                            </table>
                        </div>

                        <!-- Department-wise Breakdown -->
                        <div>
                            <h3 class="text-lg font-semibold mb-3 text-gray-800">Department Breakdown</h3>
                            <div class="overflow-x-auto">
                                <table class="w-full text-sm border">
                                    <thead>
                                        <tr class="bg-gray-50">
                                            <th class="py-2 border text-left px-3">Department</th>
                                            <th class="py-2 border text-right px-3 w-20">Gross</th>
                                            <th class="py-2 border text-right px-3 w-20">Discount</th>
                                            <th class="py-2 border text-right px-3 w-20">Net</th>
                                            <th class="py-2 border text-right px-3 w-20">Paid</th>
                                            <th class="py-2 border text-right px-3 w-20">Due</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${departmentBreakdownHTML}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Discounts and Payments -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            ${discountsTableHTML ? `
                            <div>
                                <h3 class="text-lg font-semibold mb-3 text-gray-800">Department Discounts</h3>
                                <table class="w-full text-sm border">
                                    <thead>
                                        <tr class="bg-gray-50">
                                            <th class="py-2 border text-left px-3">Department</th>
                                            <th class="py-2 border text-left px-3">Discounted by</th>
                                            <th class="py-2 border text-right px-3 w-24">Discount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${discountsTableHTML}
                                    </tbody>
                                </table>
                            </div>
                            ` : ''}

                            <div>
                                <h3 class="text-lg font-semibold mb-3 text-gray-800">Payment History</h3>
                                <table class="w-full text-sm border">
                                    <thead>
                                        <tr class="bg-gray-50">
                                            <th class="py-2 border text-left px-3">Date</th>
                                            <th class="py-2 border text-left px-3">Method</th>
                                            <th class="py-2 border text-left px-3">Paid by</th>
                                            <th class="py-2 border text-right px-3 w-24">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${paymentsTableHTML}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Invoice Status Summary -->
                        <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200">
                            <h3 class="text-lg font-semibold mb-4 text-gray-800">Invoice Status Summary</h3>
                            <div class="space-y-3 text-sm">
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600">Gross Total:</span>
                                    <span class="font-semibold text-gray-800">${format(Number(invoice.total_amount || 0))}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600">Total Discount:</span>
                                    <span class="font-semibold text-orange-600">- ${format(totalDiscounts)}</span>
                                </div>
                                <div class="flex justify-between items-center border-t border-gray-300 pt-2">
                                    <span class="text-gray-700 font-medium">Net Payable:</span>
                                    <span class="font-bold text-lg text-gray-900">${format(Number(invoice.net_amount || 0))}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600">Paid Amount:</span>
                                    <span class="font-semibold text-emerald-600">${format(totalPayments)}</span>
                                </div>
                                <div class="flex justify-between items-center border-t-2 border-gray-400 pt-3 mt-2">
                                    <span class="text-gray-800 font-bold text-base">Balance Due:</span>
                                    <span class="font-bold text-2xl ${dueAmount > 0 ? 'text-red-600' : 'text-emerald-600'}">${format(dueAmount)}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex justify-end gap-3 pt-4 border-t">
                            <a href="/dashboard/outdoor/reception/invoices/${id}"
                               class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
                                Print Invoice
                            </a>
                            ${!isPaid ? `
                            <a href="/dashboard/outdoor/reception/due-collection/${id}"
                               class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 h-10 px-5 transition shadow-md">
                                Pay Now
                            </a>
                            ` : ''}
                        </div>
                    </div>
                `;

                // Update DOM with invoice details
                const container = document.getElementById(`invoice-details-${id}`);
                if (container) {
                    container.innerHTML = invoiceDetailsHTML;
                }
            } catch (error) {
                console.error('Error fetching invoice details:', error);
                const container = document.getElementById(`invoice-details-${id}`);
                if (container) {
                    container.innerHTML = `
                        <div class="text-red-500 text-sm">
                            Failed to load invoice details. Please try again.
                        </div>
                    `;
                }
            }
        };

        // Add event listener to document for delegation
        document.addEventListener('click', handleExpandClick);

        return () => {
            document.removeEventListener('click', handleExpandClick);
        };
    }, [token, currencySymbol]);


    const columns = [
        {
            data: "invoice_prefix",
            title: "Custom ID",
            orderable: true,
            responsivePriority: 1,
            render: (data: any, _type: string, row: InvoiceItem) => {
                const display = data ? `<span class="font-semibold text-purple-600">${data}</span>` : '<span class="text-muted-foreground text-sm">-</span>';
                return `
                    <div class="flex items-center gap-2">
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                                type="button"
                                data-id="${row.id}">+</button>
                        ${display}
                    </div>
                `;
            },
            defaultContent: "-",
        },
        {
            data: "patient_name",
            title: "Patient Name",
            orderable: true,
            responsivePriority: 1,
            defaultContent: "",
        },
        {
            data: "phone",
            title: "Phone",
            orderable: true,
            className: "dt-head-left dt-body-left",
            responsivePriority: 2,
            defaultContent: "-",
        },
        {
            data: null,
            title: "Reference Doctor",
            orderable: true,
            responsivePriority: 3,
            render: (_data: any, _type: string, row: InvoiceItem) => {
                const doctorName = row.doctor?.doctor_name;
                const refDoctor = row.reference_doctor;
                return doctorName || refDoctor || "-";
            },
            defaultContent: "-",
        },
        {
            data: "total_amount",
            title: `Total Amount (${currencySymbol})`,
            orderable: true,
            responsivePriority: 4,
            render: (data: any) => String(data ?? "-"),
            defaultContent: "-",
        },
        {
            data: null,
            title: `Discount (${currencySymbol})`,
            orderable: false,
            responsivePriority: 5,
            render: (_data: any, _type: string, row: InvoiceItem) => {
                const total = Number(row.total_amount || 0);
                const net = Number(row.net_amount || 0);
                const discount = total - net;
                return String(discount > 0 ? discount : "-");
            },
            defaultContent: "-",
        },
        {
            data: "total_paid",
            title: `Paid (${currencySymbol})`,
            orderable: true,
            responsivePriority: 2,
            render: (data: any) => `<span class="text-emerald-600 font-medium">${data ?? 0}</span>`,
            defaultContent: "0",
        },
        {
            data: "due_amount",
            title: `Due (${currencySymbol})`,
            orderable: true,
            responsivePriority: 2,
            render: (data: any) => `<span class="text-red-600 font-bold">${data ?? 0}</span>`,
            defaultContent: "0",
        },
        {
            data: null,
            title: "Inv. Date and Time",
            orderable: true,
            responsivePriority: 3,
            render: (_data: any, _type: string, row: InvoiceItem) => {
                const invDate = row.invoice_date ? new Date(row.invoice_date) : null;
                const created = row.created_at ? new Date(row.created_at) : null;
                if (!invDate && !created) return "-";
                const dateStr = invDate ? fmtDate(invDate) : (created ? fmtDate(created) : "-");
                const timeStr = created
                    ? created.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                    : "";
                return timeStr ? `${dateStr} ${timeStr}` : dateStr;
            },
            defaultContent: "-",
        },
        {
            data: "delivery_date",
            title: "Delivery Date",
            orderable: true,
            responsivePriority: 3,
            render: (data: any) => {
                if (!data) return "-";
                const date = new Date(data);
                return fmtDate(date);
            },
            defaultContent: "-",
        },
        {
            data: null,
            title: "Created By",
            orderable: true,
            responsivePriority: 3,
            render: (_data: any, _type: string, row: InvoiceItem) => {
                if (row.creator?.name) {
                    return `<span class="text-sm font-medium">${row.creator.name}</span>`;
                }
                const value = row.created_by || '-';
                return `<span class="text-sm text-muted-foreground">${value}</span>`;
            },
            defaultContent: "-",
        },
        {
            data: null,
            title: "Status",
            orderable: true,
            responsivePriority: 1,
            render: (_data: any, _type: string, row: InvoiceItem) => {
                const dueAmount = Number(row.due_amount || 0);
                const isPaid = dueAmount === 0;
                const status = isPaid ? "paid" : "due";
                const bgColor = isPaid ? "bg-emerald-500" : "bg-red-500";
                return `<span class="${bgColor} text-white px-2 py-1 rounded text-xs font-semibold">${status.toUpperCase()}</span>`;
            },
            defaultContent: "",
        },
        {
            data: null,
            title: "Actions",
            orderable: false,
            responsivePriority: 1,
            render: (_data: any, _type: string, row: InvoiceItem) => {
                return `
                    <div class="flex gap-2">
                        <a href="/dashboard/outdoor/reception/invoices/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
                            Print
                        </a>
                        <a href="/dashboard/outdoor/reception/due-collection/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 h-8 px-4 py-2">
                            Pay Now
                        </a>
                    </div>
                `;
            },
            defaultContent: "",
        },
    ];

    const users = usersData?.data || [];

    return <>
        <AppHeader fixed />

        <main className='p-4'>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                <h1 className="text-2xl font-bold tracking-tight">Invoices by Users</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">Filter by User:</span>
                    </div>
                    <Select value={selectedUser} onValueChange={(value) => {
                        setSelectedUser(value);
                    }}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="All Users" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            {users.map((user: UserInfo) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.name} {user.email && `(${user.email})`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedUser !== "all" && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSelectedUser("all");
                            }}
                        >
                            Clear Filter
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                {stats.map((item, idx) => (
                    <div
                        key={idx}
                        className={`relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br ${item.gradient} p-4 md:p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
                    >
                        {/* Background Pattern */}
                        <div className="absolute -right-4 md:-right-6 -top-4 md:-top-6 h-16 w-16 md:h-24 md:w-24 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute -bottom-4 md:-bottom-6 -left-4 md:-left-6 h-16 w-16 md:h-24 md:w-24 rounded-full bg-black/10 blur-2xl" />

                        <div className="relative flex items-center justify-between gap-2 md:gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-[0.6rem] md:text-[0.65rem] lg:text-xs xl:text-sm font-medium text-white/90 leading-tight">{item.label}</p>
                                <h3 className="mt-1 md:mt-2 text-[0.9rem] md:text-[1.1rem] lg:text-lg xl:text-2xl font-bold text-white leading-tight break-words">
                                    {item.value || 0}
                                </h3>
                            </div>
                        </div>

                        {/* Progress/Indicator line */}
                        <div className="mt-3 md:mt-4 h-1 w-full rounded-full bg-black/10">
                            <div className="h-full w-2/3 rounded-full bg-white/40" />
                        </div>
                    </div>
                ))}
            </div>

            <DataTable
                key={dateFormat}
                columns={columns}
                data={data?.data?.items || []}
                meta={data?.data?.meta}
                onPageChange={setPage}
                onLimitChange={setLimit}
                search={search}
                onSearchChange={setSearch}
                isLoading={isFetching}
                hideExport
                filterSlot={
                    <>
                        <Popover open={openFilter} onOpenChange={setOpenFilter}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Filter className="mr-2 h-4 w-4" />
                                    {statusFilter !== "all" ? `Status: ${statusFilter === "unpaid" ? "Due" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}` : "Filter Status"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                                <Command>
                                    <CommandInput placeholder="Search status..." />
                                    <CommandList>
                                        <CommandEmpty>No status found.</CommandEmpty>
                                        <CommandGroup>
                                            {["all", "paid", "unpaid"].map((status) => (
                                                <CommandItem
                                                    key={status}
                                                    value={status}
                                                    onSelect={(currentValue) => {
                                                        setStatusFilter(currentValue === statusFilter ? "all" : currentValue)
                                                        setOpenFilter(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            statusFilter === status ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {status === "all" ? "All Status" : status === "unpaid" ? "Due" : status.charAt(0).toUpperCase() + status.slice(1)}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <div className="flex items-center gap-1.5">
                            <Select value={activePreset} onValueChange={applyPreset} open={presetOpen} onOpenChange={setPresetOpen}>
                                <SelectTrigger className="w-[140px] h-9 rounded-md border-gray-200 dark:border-gray-700 bg-transparent text-sm">
                                    <SelectValue placeholder="Filter by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="yesterday">Yesterday</SelectItem>
                                    <SelectItem value="last7">Last 7 days</SelectItem>
                                    <SelectItem value="last15">Last 15 days</SelectItem>
                                    <SelectItem value="last30">Last 30 days</SelectItem>
                                    <SelectItem value="last45">Last 45 days</SelectItem>
                                    <SelectItem value="last60">Last 60 days</SelectItem>
                                    <SelectItem value="last90">Last 90 days</SelectItem>
                                    <SelectItem value="last180">Last 180 days</SelectItem>
                                    <SelectItem value="last365">Last 365 days</SelectItem>
                                    <SelectItem value="custom">Custom range</SelectItem>
                                </SelectContent>
                            </Select>
                            <DateField
                                value={from}
                                onChange={(v: string) => { setFrom(v); setPresetOpen(false); }}
                                placeholder="From"
                            />
                            <span className="text-xs text-muted-foreground">to</span>
                            <DateField
                                value={to}
                                onChange={(v: string) => { setTo(v); setPresetOpen(false); }}
                                placeholder="To"
                            />
                            {(from || to) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setFrom(""); setTo(""); }}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </>
                }
            />
        </main>
    </>
}
