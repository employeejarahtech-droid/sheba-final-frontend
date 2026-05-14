import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { useState, useMemo, useEffect } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { FileText, DollarSign, CheckCircle } from 'lucide-react'

type InvoiceItem = {
  id: number;
  invoice_prefix: string | null;
  patient_name: string;
  phone: string | null;
  age: number | null;
  age_text: string | null;
  sex: string | null;
  doctor?: { name: string; } | null;
  reference_doctor: string | null;
  creator?: {
    id: number;
    name: string;
  } | null;
  total_amount: number;
  net_amount: number | null;
  total_paid: number;
  due_amount: number;
  created_at: string;
  created_by?: string | number | null;
  delivery_date: string | null;
  delivery_time: string | null;
  is_indoor_patient: boolean | null;
};

export default function PaidInvoices() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const token = getCookie('accessToken');

  const { data } = useQuery({
    queryKey: ["paid-invoices", page, limit, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/outdoor-invoice?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&paid_only=true`,
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
        gradient: "from-emerald-600 to-emerald-400",
        shadow: "shadow-emerald-500/30",
        icon: <CheckCircle className="w-6 h-6 text-white" />,
      },
      {
        label: "Total Collected",
        value: `৳${totalPaidAmount.toLocaleString()}`,
        gradient: "from-blue-600 to-blue-400",
        shadow: "shadow-blue-500/30",
        icon: <DollarSign className="w-6 h-6 text-white" />,
      },
    ];
  }, [data]);

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
      cell.colSpan = 11;
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

        const formatDateTime = (date: string | null, time: string | null) => {
          if (!date) return '-';
          const dateStr = formatDate(date);
          return time ? `${dateStr} ${time}` : dateStr;
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
                  <span class="font-semibold text-gray-800">৳${Number(invoice.total_amount || 0).toFixed(2)}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Total Discount <span class="text-xs">(Department-wise)</span>:</span>
                  <span class="font-semibold text-orange-600">- ৳${totalDiscounts.toFixed(2)}</span>
                </div>
                <div class="flex justify-between items-center border-t border-gray-300 pt-2">
                  <span class="text-gray-700 font-medium">Net Payable:</span>
                  <span class="font-bold text-lg text-gray-900">৳${Number(invoice.net_amount || 0).toFixed(2)}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Paid Amount:</span>
                  <span class="font-semibold text-emerald-600">৳${totalPayments.toFixed(2)}</span>
                </div>
                <div class="flex justify-between items-center border-t-2 border-gray-400 pt-3 mt-2">
                  <span class="text-gray-800 font-bold text-base">Balance Due:</span>
                  <span class="font-bold text-2xl ${dueAmount > 0 ? 'text-red-600' : 'text-emerald-600'}">৳${dueAmount.toFixed(2)}</span>
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
              <a href="/outdoor/reception/invoices/${id}"
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
  }, [token]);

  const columns = [
    {
      data: "invoice_prefix",
      title: "Custom ID",
      orderable: true,
      responsivePriority: 1,
      render: (data: any, _type: string, row: InvoiceItem) => {
        const display = data ? `<span class="font-semibold text-emerald-600">${data}</span>` : '<span class="text-muted-foreground text-sm">-</span>';
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
      responsivePriority: 2,
      defaultContent: "-",
    },
    {
      data: null,
      title: "Reference Doctor",
      orderable: true,
      responsivePriority: 3,
      render: (_data: any, _type: string, row: InvoiceItem) => {
        const doctorName = row.doctor?.name;
        const refDoctor = row.reference_doctor;
        return doctorName || refDoctor || "-";
      },
      defaultContent: "-",
    },
    {
      data: "total_amount",
      title: "Total Amount",
      orderable: true,
      responsivePriority: 4,
      render: (data: any) => String(data ?? "-"),
      defaultContent: "-",
    },
    {
      data: "total_paid",
      title: "Paid (৳)",
      orderable: true,
      responsivePriority: 2,
      render: (data: any) => `<span class="text-emerald-600 font-medium">${data ?? 0}</span>`,
      defaultContent: "0",
    },
    {
      data: "created_at",
      title: "Date",
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
            <a href="/outdoor/reception/invoices/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
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

      <main className='p-4'>
       
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          {stats.map((item, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br ${item.gradient} p-4 md:p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
            >
              <div className="absolute -right-4 md:-right-6 -top-4 md:-top-6 h-16 w-16 md:h-24 md:w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-4 md:-bottom-6 -left-4 md:-left-6 h-16 w-16 md:h-24 md:w-24 rounded-full bg-black/10 blur-2xl" />

              <div className="relative flex items-center justify-between gap-2 md:gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[0.6rem] md:text-[0.65rem] lg:text-xs xl:text-sm font-medium text-white/90 leading-tight">{item.label}</p>
                  <h3 className="mt-1 md:mt-2 text-[0.9rem] md:text-[1.1rem] lg:text-lg xl:text-2xl font-bold text-white leading-tight break-words">
                    {item.value || 0}
                  </h3>
                </div>
                <div className="hidden xl:block rounded-xl bg-white/20 p-2.5 backdrop-blur-sm flex-shrink-0">
                  {item.icon}
                </div>
              </div>

              <div className="mt-3 md:mt-4 h-1 w-full rounded-full bg-black/10">
                <div className="h-full w-full rounded-full bg-white/40" />
              </div>
            </div>
          ))}
        </div>

        <DataTable
          tableTitle="Paid Invoices"
          columns={columns}
          data={data?.data?.items || []}
          meta={data?.data?.meta}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          search={search}
          onSearchChange={setSearch}
        />
      </main>
    </>
  )
}
