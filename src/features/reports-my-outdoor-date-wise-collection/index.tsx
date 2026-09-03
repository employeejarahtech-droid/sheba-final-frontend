import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { useState, useMemo, useEffect } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FileText, DollarSign, TrendingUp, CreditCard, Printer } from 'lucide-react'
import { DateField } from '@/components/date-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrency } from '@/hooks/use-currency'

type PaymentItem = {
  id: number;
  invoice_prefix: string | null;
  patient_name: string;
  sex: string | null;
  age: string | null;
  age_text: string | null;
  phone: string | null;
  doctor?: {
    id: number;
    doctor_name: string;
  } | null;
  creator?: {
    id: number;
    name: string;
  } | null;
  department?: {
    id: number;
    name: string;
  } | null;
  total_amount: number;
  net_amount: number | null;
  payment_id: number;
  payment_amount: number;
  payment_method: string;
  payment_date: string;
  payment_created_at: string;
  payment_created_by?: {
    id: number;
    name: string;
  } | null;
  created_at: string;
};

interface ReportsMyOutdoorDateWiseCollectionProps {
  page: number
  limit: number
  search: string
  from: string
  to: string
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSearch: (search: string) => void
  setFrom: (from: string) => void
  setTo: (to: string) => void
  endpoint?: string
  title?: string
  subtitle?: string
  printPath?: string
}

export default function ReportsMyOutdoorDateWiseCollection({
  page,
  limit,
  search,
  from,
  to,
  setPage,
  setLimit,
  setSearch,
  setFrom,
  setTo,
  endpoint = '/api/outdoor-invoice/my-outdoor-invoice/date-wise-collection',
  title = 'Date-Wise Collection Report',
  subtitle = 'Payments collected by you within a date range',
  printPath = '/dashboard/reports/my/outdoor/date-wise-collection/print',
}: ReportsMyOutdoorDateWiseCollectionProps) {
  const token = getCookie('accessToken');
  const { currencySymbol } = useCurrency();

  // ---- Date filter presets (mirrors admission-register) ----
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
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

  // Fetch date-wise collection (payments made by current user in date range)
  const { data, isLoading } = useQuery({
    queryKey: ["my-outdoor-date-wise-collection", page, limit, search, from, to],

    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search,
      });

      if (from) params.append('start_date', from);
      if (to) params.append('end_date', to);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}${endpoint}?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch collection data");
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
                limit: 10,
                totalPages: 0
              },
              stats: {
                total_collected: 0,
                payment_count: 0,
                total_bill: 0,
                total_discount: 0,
                invoice_count: 0
              }
            },
          },
  });

  // Calculate stats
  const stats = useMemo(() => {
    const serverStats = data?.data?.stats || {};
    const paymentCount = serverStats.payment_count || 0;

    return [
      {
        label: "Total Payments",
        value: String(paymentCount),
        gradientClass: "from-blue-500 to-indigo-500 shadow-blue-500/20",
        icon: CreditCard,
      },
      {
        label: "Total Collected",
        value: `${currencySymbol} ${(serverStats.total_collected || 0).toLocaleString()}`,
        gradientClass: "from-emerald-500 to-teal-500 shadow-emerald-500/20",
        icon: DollarSign,
      },
      {
        label: "Total Discount",
        value: `${currencySymbol} ${(serverStats.total_discount || 0).toLocaleString()}`,
        gradientClass: "from-amber-500 to-orange-500 shadow-amber-500/20",
        icon: TrendingUp,
      },
      {
        label: "Gross Bill",
        value: `${currencySymbol} ${(serverStats.total_bill || 0).toLocaleString()}`,
        gradientClass: "from-violet-500 to-purple-500 shadow-violet-500/20",
        icon: FileText,
      },
    ];
  }, [data, currencySymbol]);

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
        btn.style.backgroundColor = '#10B981';
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
      cell.colSpan = 12;
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
          : '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">Unpaid</span>';

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
              <td class="py-2 px-3 text-right text-emerald-600 font-medium">${Number(payment.amount).toFixed(2)}</td>
            </tr>
          `;
        }).join('') || '<tr><td colspan="3" class="py-4 text-center text-gray-500">No payments made yet</td></tr>';

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
                  <span class="font-semibold text-gray-800">${currencySymbol} ${Number(invoice.total_amount || 0).toFixed(2)}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Total Discount:</span>
                  <span class="font-semibold text-orange-600">- ${currencySymbol} ${totalDiscounts.toFixed(2)}</span>
                </div>
                <div class="flex justify-between items-center border-t border-gray-300 pt-2">
                  <span class="text-gray-700 font-medium">Net Payable:</span>
                  <span class="font-bold text-lg text-gray-900">${currencySymbol} ${Number(invoice.net_amount || 0).toFixed(2)}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Paid Amount:</span>
                  <span class="font-semibold text-emerald-600">${currencySymbol} ${totalPayments.toFixed(2)}</span>
                </div>
                <div class="flex justify-between items-center border-t-2 border-gray-400 pt-3 mt-2">
                  <span class="text-gray-800 font-bold text-base">Balance Due:</span>
                  <span class="font-bold text-2xl ${dueAmount > 0 ? 'text-red-600' : 'text-emerald-600'}">${currencySymbol} ${dueAmount.toFixed(2)}</span>
                </div>
              </div>
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
  }, [token]);

  const columns = [
    {
      data: "id",
      title: "Invoice ID",
      orderable: true,
      responsivePriority: 1,
      render: (data: any) => {
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                    type="button"
                    data-id="${data}">+</button>
            <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${data}</span>
          </div>
        `;
      },
      defaultContent: "",
    },
    {
      data: "invoice_prefix",
      title: "Admission ID",
      orderable: true,
      responsivePriority: 1,
      render: (data: any) => {
        if (!data) return '<span class="text-muted-foreground text-sm">-</span>';
        return `<span class="font-semibold text-purple-600 dark:text-purple-400">${data}</span>`;
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
      responsivePriority: 2,
      defaultContent: "-",
    },
    {
      data: null,
      title: "Reference Doctor",
      orderable: true,
      responsivePriority: 3,
      render: (_data: any, _type: string, row: PaymentItem) => {
        const doctorName = row.doctor?.doctor_name;
        return doctorName ? `<span class="font-semibold text-blue-600 dark:text-blue-400">Dr. ${doctorName}</span>` : "-";
      },
      defaultContent: "-",
    },
    {
      data: null,
      title: "Department",
      orderable: true,
      responsivePriority: 3,
      render: (_data: any, _type: string, row: PaymentItem) => {
        const deptName = row.department?.name;
        return deptName || "-";
      },
      defaultContent: "-",
    },
    {
      data: "total_amount",
      title: `Bill Amount (${currencySymbol})`,
      orderable: true,
      responsivePriority: 4,
      render: (data: any) => `<span class="font-medium text-gray-600">${Number(data || 0).toFixed(2)}</span>`,
      defaultContent: "0.00",
    },
    {
      data: null,
      title: `Discount (${currencySymbol})`,
      orderable: false,
      responsivePriority: 5,
      render: (_data: any, _type: string, row: PaymentItem) => {
        const total = Number(row.total_amount || 0);
        const net = Number(row.net_amount || 0);
        const discount = total - net;
        return discount > 0
          ? `<span class="text-orange-600 font-medium">-${discount.toFixed(2)}</span>`
          : '<span class="text-gray-400">-</span>';
      },
      defaultContent: "-",
    },
    {
      data: "payment_amount",
      title: `Collected (${currencySymbol})`,
      orderable: true,
      responsivePriority: 2,
      render: (data: any) => `<span class="text-emerald-600 font-bold">${Number(data || 0).toFixed(2)}</span>`,
      defaultContent: "0.00",
    },
    {
      data: "payment_method",
      title: "Payment Method",
      orderable: true,
      responsivePriority: 3,
      render: (data: any) => {
        const method = data || '-';
        const methodColors: Record<string, string> = {
          'Cash': 'bg-green-100 text-green-700',
          'Card': 'bg-blue-100 text-blue-700',
          'Mobile': 'bg-purple-100 text-purple-700',
          'Bank': 'bg-yellow-100 text-yellow-700',
        };
        const colorClass = methodColors[method] || 'bg-gray-100 text-gray-700';
        return `<span class="px-2 py-1 rounded text-xs font-semibold ${colorClass}">${method}</span>`;
      },
      defaultContent: "-",
    },
    {
      data: null,
      title: "Collected By",
      orderable: false,
      responsivePriority: 3,
      render: (_data: any, _type: string, row: PaymentItem) => {
        const collectedBy = row.payment_created_by?.name || row.creator?.name || '-';
        return `<span class="text-sm font-medium text-gray-700">${collectedBy}</span>`;
      },
      defaultContent: "-",
    },
    {
      data: "payment_date",
      title: "Payment Date",
      orderable: true,
      responsivePriority: 3,
      render: (data: any) => {
        if (!data) return "-";
        const date = new Date(data);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
      defaultContent: "-",
    },
    {
      data: "payment_created_at",
      title: "Time",
      orderable: true,
      responsivePriority: 3,
      render: (data: any) => {
        if (!data) return "-";
        const date = new Date(data);
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      },
      defaultContent: "-",
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      responsivePriority: 1,
      render: (_data: any, _type: string, row: PaymentItem) => {
        return `
          <div class="flex gap-2">
            <a href="/dashboard/outdoor/reception/invoices/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
              View Invoice
            </a>
          </div>
        `;
      },
      defaultContent: "",
    },
  ];

  return (
    <>
      <AppHeader fixed />

      <main className=''>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          {stats.map((item) => (
            <SummaryCard
              key={item.label}
              title={item.label}
              value={item.value}
              icon={item.icon}
              gradientClass={item.gradientClass}
            />
          ))}
        </div>

        {/* Collection Summary */}
        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Collection Summary</CardTitle>
                <p className="text-xs text-gray-600 dark:text-gray-400">Payment breakdown for the selected range</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payments</p>
                  <p className="text-xl font-bold text-gray-800">
                    {data?.data?.stats?.payment_count || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Collected</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {currencySymbol} {(data?.data?.stats?.total_collected || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Discount</p>
                  <p className="text-xl font-bold text-orange-600">
                    -{currencySymbol} {(data?.data?.stats?.total_discount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gross Bill</p>
                  <p className="text-xl font-bold text-purple-600">
                    {currencySymbol} {(data?.data?.stats?.total_bill || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <DataTable
          columns={columns}
          data={data?.data?.items || []}
          meta={data?.data?.meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
          search={search}
          onSearchChange={setSearch}
          isLoading={isLoading}
          // Rows already arrive sorted by payment ID DESC from the server
          // (outdoor-invoice.repository.js getDateWiseCollection). Without
          // this, DataTable.tsx's default `order: [[0, 'desc']]` re-sorts
          // client-side by column 0 (Invoice ID) — which also renders raw
          // HTML for that cell, so it isn't even a clean numeric sort.
          defaultOrder={[]}
          filterSlot={
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
              <Link
                to={printPath as any}
                search={{
                  search: search || undefined,
                  start_date: from || undefined,
                  end_date: to || undefined,
                } as any}
              >
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Report
                </Button>
              </Link>
            </div>
          }
        />
      </main>
    </>
  )
}

// ===== Summary Card Component =====
function SummaryCard({
  title,
  value,
  icon: Icon,
  gradientClass,
}: {
  title: string
  value: string
  icon: React.ElementType
  gradientClass: string
}) {
  return (
    <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border'>
      <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0'>
        <div className='flex items-center gap-2.5'>
          <div
            className={`p-2 bg-gradient-to-br ${gradientClass} rounded-lg shadow-lg`}
          >
            <Icon className='h-4 w-4 text-white' />
          </div>
          <div>
            <CardTitle className='text-sm font-semibold'>{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-4'>
        <div className='text-2xl font-bold'>{value}</div>
      </CardContent>
    </Card>
  )
}
