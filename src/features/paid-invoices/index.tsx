import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { useMemo, useEffect, useState } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'
import { FileText, DollarSign, CheckCircle } from 'lucide-react'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type PaidInvoicesProps = {
  page: number;
  limit: number;
  search: string;
  from: string;
  to: string;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setFrom: (from: string) => void;
  setTo: (to: string) => void;
};

type InvoiceItem = {
  id: number;
  invoice_prefix: string | null;
  patient_name: string;
  phone: string | null;
  age: number | null;
  age_text: string | null;
  sex: string | null;
  doctor?: { name?: string; doctor_name?: string; title?: string | null; qualification?: string | null; speciality?: string | null; } | null;
  reference_doctor: string | null;
  creator?: {
    id: number;
    name: string;
  } | null;
  total_amount: number;
  net_amount: number | null;
  total_paid: number;
  due_amount: number;
  invoice_date: string | null;
  created_at: string;
  created_by?: string | number | null;
  created_by_type?: "staff" | "company_admin" | null;
  delivery_date: string | null;
  delivery_time: string | null;
  is_indoor_patient: boolean | null;
  payments?: {
    id: number;
    amount: number;
    method?: string | null;
    payment_date?: string | null;
    created_at?: string | null;
    creator?: { id: number; name: string } | null;
  }[] | null;
};

export default function PaidInvoices({ page, limit, search, from, to, setPage, setLimit, setSearch, setFrom, setTo }: PaidInvoicesProps) {
  const token = getCookie('accessToken');
  const { currency, currencySymbol, format } = useCurrency();
  const fmtNum = (v: any) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const { dateFormat, formatDate: fmtDate } = useDateFormat();

  const { data, isFetching } = useQuery({
    queryKey: ["paid-invoices", page, limit, search, from, to],
    queryFn: async () => {
      const fromParam = from ? `&from=${encodeURIComponent(from)}` : "";
      const toParam = to ? `&to=${encodeURIComponent(to)}` : "";
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/outdoor-invoice?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=paid${fromParam}${toParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
    enabled: !!token,
    placeholderData: (prev) => prev ? prev : { data: { items: [], meta: { total: 0, page: 1, limit: 10 } } },
  });

  // Calculate stats
  const stats = useMemo(() => {
    const invoices = data?.data?.items || [];
    const totalPaidInvoices = data?.data?.meta?.total || 0;
    const totalPaidAmount = invoices.reduce((sum: number, inv: InvoiceItem) => sum + Number(inv.total_paid || 0), 0);

    return [
      {
        label: "Paid Invoices",
        value: totalPaidInvoices,
        icon: CheckCircle,
        grad: "from-emerald-500 to-teal-500",
      },
      {
        label: `Total Collected (${currency})`,
        value: fmtNum(totalPaidAmount),
        icon: DollarSign,
        grad: "from-blue-500 to-indigo-500",
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
        <div class="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-4">
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

          // Map department_id to name
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

        // Format dates (settings date format)
        const formatDate = (dateString: string | null) => {
          if (!dateString) return '-';
          const date = new Date(dateString);
          return fmtDate(date);
        };

        const formatDateTime = (date: string | null, time: string | null) => {
          if (!date) return '-';
          const dateStr = formatDate(date);
          return time ? `${dateStr} ${time}` : dateStr;
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
            <td class="py-2 px-3 text-right">${Number(test.price || 0).toFixed(2)}</td>
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

        // Build department-wise breakdown HTML from calculated data
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
              <!-- Department Discounts -->
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

              <!-- Payments -->
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
                  <span class="text-gray-600">Total Discount <span class="text-xs">(Department-wise)</span>:</span>
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
                ${isPaid ? `
                <div class="mt-3 pt-3 border-t border-emerald-200">
                  <p class="text-emerald-700 text-sm font-medium text-center">
                    ✓ This invoice is fully paid. Department-wise payment breakdown ensures accurate revenue tracking.
                  </p>
                </div>
                ` : ''}
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t">
              <a href="/dashboard/outdoor/reception/invoices/${id}"
                 class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
                Print Invoice
              </a>
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
        const display = data ? `<span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${data}</span>` : '<span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">-</span>';
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
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
      render: (_data: any, type: string, row: InvoiceItem) => {
        const d: any = row.doctor;
        const refDoctor = row.reference_doctor;
        const name = d?.doctor_name || d?.name;
        const plain = name || refDoctor || "-";
        if (type === 'sort' || type === 'filter' || type === 'type') return plain;
        const esc = (s: any) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        if (name) {
          const subtitle = [d.qualification || d.title, d.speciality].filter(Boolean).join(' - ');
          return `<div class="flex flex-col"><span class="font-semibold text-blue-600 dark:text-blue-400">Dr. ${esc(name)}</span>${subtitle ? `<span class="text-xs text-muted-foreground">${esc(subtitle)}</span>` : ''}</div>`;
        }
        return refDoctor ? `<span class="font-medium text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-0.5 rounded w-fit">${esc(refDoctor)}</span>` : "-";
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
        return discount > 0 ? discount.toFixed(2) : "-";
      },
      defaultContent: "-",
    },
    {
      data: "total_paid",
      title: `Paid (${currencySymbol})`,
      orderable: true,
      responsivePriority: 2,
      render: (data: any, _type: string, row: InvoiceItem) => {
        const total = `<span class="text-emerald-600 font-medium">${data ?? 0}</span>`;
        const payments = row.payments || [];
        // Only break the total down when there's more than one payment —
        // a single payment already equals the total, so listing it again
        // underneath would just be noise.
        if (payments.length <= 1) return total;
        const breakdown = payments.map((p) => {
          const dt = p.created_at ? new Date(p.created_at) : (p.payment_date ? new Date(p.payment_date) : null);
          if (!dt) return `<div class="text-[11px] text-muted-foreground">${fmtNum(p.amount)}</div>`;
          const dateStr = fmtDate(dt);
          const timeStr = p.created_at
            ? dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            : '';
          const when = timeStr ? `${dateStr} ${timeStr}` : dateStr;
          return `<div class="text-[11px] text-muted-foreground whitespace-nowrap">${when} (${fmtNum(p.amount)})</div>`;
        }).join('');
        return `<div class="space-y-0.5">${total}${breakdown}</div>`;
      },
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
      title: "Delivery Date & Time",
      orderable: true,
      responsivePriority: 3,
      render: (data: any, _type: string, row: InvoiceItem) => {
        if (!data) return "-";
        const date = new Date(data);
        if (Number.isNaN(date.getTime())) return "-";
        const dateStr = fmtDate(date);
        let timeStr = "";
        if (row.delivery_time) {
          const cleanTime = row.delivery_time.trim();
          if (/am|pm/i.test(cleanTime)) {
            timeStr = cleanTime;
          } else {
            const match = cleanTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
            if (match) {
              let hours = parseInt(match[1], 10);
              const minutes = match[2];
              const ampm = hours >= 12 ? 'PM' : 'AM';
              hours = hours % 12;
              hours = hours ? hours : 12; // the hour '0' should be '12'
              timeStr = `${hours}:${minutes} ${ampm}`;
            } else {
              timeStr = cleanTime;
            }
          }
        }
        return timeStr ? `${dateStr} ${timeStr}` : dateStr;
      },
      defaultContent: "-",
    },
    {
      data: null,
      title: "Paid History",
      orderable: false, // computed from payments, not a real sortable DB column
      responsivePriority: 5,
      render: (_data: any, _type: string, row: InvoiceItem) => {
        const payments = [...(row.payments || [])].sort((a, b) => {
          const da = a.payment_date || a.created_at || '';
          const db = b.payment_date || b.created_at || '';
          return new Date(db).getTime() - new Date(da).getTime();
        });
        if (payments.length === 0) {
          return `<span class="text-xs text-muted-foreground italic">No payments</span>`;
        }
        const rows = payments.map((p) => {
          const dt = p.created_at ? new Date(p.created_at) : (p.payment_date ? new Date(p.payment_date) : null);
          const dateStr = dt ? fmtDate(dt) : '-';
          const timeStr = dt && p.created_at
            ? dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            : "";
          const when = timeStr ? `${dateStr} ${timeStr}` : dateStr;
          const method = p.method ? ` · ${p.method}` : '';
          const collectedBy = p.creator?.name
            ? `<div class="text-muted-foreground/80">Collected by: ${p.creator.name.replace(/</g, '&lt;')}</div>`
            : '';
          return `
            <li class="whitespace-nowrap">
              <div class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground">${when}${method}</span>
                <span class="text-emerald-600 font-medium">${fmtNum(p.amount)}</span>
              </div>
              ${collectedBy}
            </li>
          `;
        }).join('');
        return `<ul class="text-[11px] space-y-1 max-h-32 overflow-y-auto pr-1 border-l-2 border-emerald-200 dark:border-emerald-900 pl-2">${rows}</ul>`;
      },
      defaultContent: "-",
    },
    {
      data: null,
      title: "Created By",
      orderable: true,
      responsivePriority: 4,
      render: (_data: any, _type: string, row: InvoiceItem) => {
        // Check if creator object exists with name
        if (row.creator?.name) {
          return `<span class="text-sm font-medium">${row.creator.name}</span>`;
        }
        // Fallback to showing created_by ID or dash
        const value = row.created_by || '-';
        return `<span class="text-sm text-muted-foreground">${value}</span>`;
      },
      defaultContent: "-",
    },
    {
      data: null,
      title: "Create Type",
      orderable: false, // computed, not a real sortable DB column
      responsivePriority: 5,
      render: (_data: any, _type: string, row: InvoiceItem) => {
        if (!row.created_by_type) return `<span class="text-sm text-muted-foreground">-</span>`;
        const isAdmin = row.created_by_type === 'company_admin';
        const label = isAdmin ? 'Admin' : 'Staff';
        const classes = isAdmin
          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400'
          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
        return `<span class="${classes} px-2 py-0.5 rounded text-xs font-semibold">${label}</span>`;
      },
      defaultContent: "-",
    },
    {
      data: null,
      title: "Status",
      orderable: true,
      responsivePriority: 1,
      render: (_data: any, _type: string, row: InvoiceItem) => {
        return `<span class="bg-emerald-500 text-white px-2 py-1 rounded text-xs font-semibold">PAID</span>`;
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
       
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {stats.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][index % 6] }}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-lg shadow-lg">
                      <Icon className="w-4 h-4" style={{ color: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][index % 6] }} />
                    </div>
                    <CardTitle className="text-sm font-semibold text-white/90">{card.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="text-2xl font-bold">{card.value}</h3>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DataTable
          key={dateFormat}
          tableTitle="Paid Invoices"
          hideExport
          columns={columns}
          data={data?.data?.items || []}
          meta={data?.data?.meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
          search={search}
          onSearchChange={setSearch}
          isLoading={isFetching}
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
            </div>
          }
        />
      </main>
    </>
  )
}
