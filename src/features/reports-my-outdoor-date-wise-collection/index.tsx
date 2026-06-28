import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { useState, useMemo, useEffect } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FileText, DollarSign, TrendingUp, Calendar, CreditCard, Printer } from 'lucide-react'

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

export default function ReportsMyOutdoorDateWiseCollection() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const limit = 10;

  const token = getCookie('accessToken');

  // Fetch date-wise collection (payments made by current user in date range)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-outdoor-date-wise-collection", page, search, startDate, endDate],

    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search,
      });

      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/my-outdoor-invoice/date-wise-collection?${params.toString()}`,
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
        value: paymentCount,
        gradient: "from-blue-600 to-blue-400",
        shadow: "shadow-blue-500/30",
        icon: <CreditCard className="w-6 h-6 text-white" />,
      },
      {
        label: "Total Collected",
        value: `৳${(serverStats.total_collected || 0).toLocaleString()}`,
        gradient: "from-emerald-600 to-emerald-400",
        shadow: "shadow-emerald-500/30",
        icon: <DollarSign className="w-6 h-6 text-white" />,
      },
      {
        label: "Total Discount",
        value: `৳${(serverStats.total_discount || 0).toLocaleString()}`,
        gradient: "from-orange-600 to-orange-400",
        shadow: "shadow-orange-500/30",
        icon: <TrendingUp className="w-6 h-6 text-white" />,
      },
      {
        label: "Gross Bill",
        value: `৳${(serverStats.total_bill || 0).toLocaleString()}`,
        gradient: "from-purple-600 to-purple-400",
        shadow: "shadow-purple-500/30",
        icon: <FileText className="w-6 h-6 text-white" />,
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
                  <span class="font-semibold text-gray-800">৳${Number(invoice.total_amount || 0).toFixed(2)}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Total Discount:</span>
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
            <span class="font-semibold text-purple-600">${data}</span>
          </div>
        `;
      },
      defaultContent: "",
    },
    {
      data: "invoice_prefix",
      title: "Custom ID",
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
      title: "Bill Amount (৳)",
      orderable: true,
      responsivePriority: 4,
      render: (data: any) => `<span class="font-medium text-gray-600">${Number(data || 0).toFixed(2)}</span>`,
      defaultContent: "0.00",
    },
    {
      data: null,
      title: "Discount (৳)",
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
      title: "Collected (৳)",
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

  const handleFilter = () => {
    setPage(1);
    refetch();
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <>
      <AppHeader fixed />

      <main className='p-6 lg:p-10'>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Date-Wise Collection Report</h1>
            <p className="text-sm text-gray-500 mt-1">
              Payments collected by you within a date range
            </p>
          </div>
          <Link to="/dashboard/reports/my/outdoor/date-wise-collection/print">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors">
              <Printer className="w-4 h-4" />
              Print Report
            </button>
          </Link>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter by Date Range</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleFilter}
                className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Apply Filter
              </button>
              <button
                onClick={handleClear}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Clear
              </button>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-500">
                {(startDate || endDate) && (
                  <span>
                    {startDate && <span>From: {startDate}</span>}
                    {startDate && endDate && <span> | </span>}
                    {endDate && <span>To: {endDate}</span>}
                  </span>
                )}
                {!startDate && !endDate && (
                  <span className="text-gray-400">Showing all payments</span>
                )}
              </div>
            </div>
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
                {/* Icon - hidden on mobile/tablet/laptop, visible only on large desktop (xl+) */}
                <div className="hidden xl:block rounded-xl bg-white/20 p-2.5 backdrop-blur-sm flex-shrink-0">
                  {item.icon}
                </div>
              </div>

              {/* Progress/Indicator line */}
              <div className="mt-3 md:mt-4 h-1 w-full rounded-full bg-black/10">
                <div className="h-full w-2/3 rounded-full bg-white/40" />
              </div>
            </div>
          ))}
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Collection Summary</h2>
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
                  ৳{(data?.data?.stats?.total_collected || 0).toLocaleString()}
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
                  -৳{(data?.data?.stats?.total_discount || 0).toLocaleString()}
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
                  ৳{(data?.data?.stats?.total_bill || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading collection data...</div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={data?.data?.items || []}
            meta={data?.data?.meta}
            onPageChange={setPage}
            search={search}
            onSearchChange={setSearch}
          />
        )}
      </main>
    </>
  )
}
