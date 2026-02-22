import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { useState, useMemo, useEffect } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { FileText, DollarSign } from 'lucide-react'

type InvoiceItem = {
  id: number;
  patient_name: string;
  phone: string | null;
  doctor?: { doctor_name: string; };
  total_amount: number;
  discount: number;
  net_amount: number | null;
  total_paid: number;
  due_amount: number;
  invoice_date: string;
  status: string;
};

export default function DueCollection() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  const token = getCookie('accessToken');

  const { data } = useQuery({
    queryKey: ["due-invoices", page, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/outdoor-invoice?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&due_only=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
    enabled: !!token,
    placeholderData: (prev) => prev ? prev : { data: { rows: [], total: 0 } },
  });

  // Calculate stats for the current view (filtered by due_only)
  const stats = useMemo(() => {
    const invoices = data?.data?.items || [];
    const totalDueInvoices = data?.data?.meta?.total || 0;

    const totalDueAmount = invoices.reduce((sum: number, inv: InvoiceItem) => sum + Number(inv.due_amount || 0), 0);

    return [
      {
        label: "Due Invoices",
        value: totalDueInvoices,
        gradient: "from-red-600 to-red-400",
        shadow: "shadow-red-500/30",
        icon: <FileText className="w-6 h-6 text-white" />,
      },
      {
        label: "Total Due Amount (Page)",
        value: `৳${totalDueAmount.toLocaleString()}`,
        gradient: "from-orange-600 to-orange-400",
        shadow: "shadow-orange-500/30",
        icon: <DollarSign className="w-6 h-6 text-white" />,
      },
    ];
  }, [data]);

  // Handle expand button clicks using event delegation
  useEffect(() => {
    const handleExpandClick = (e: Event) => {
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

      // Get data from attributes
      const patient = btn.dataset.patient || '-';
      const phone = btn.dataset.phone || '-';
      const doctor = btn.dataset.doctor || '-';
      const total = btn.dataset.total || '0';
      const discount = btn.dataset.discount || '0';
      const net = btn.dataset.net || '0';
      const paid = btn.dataset.paid || '0';
      const due = btn.dataset.due || '0';
      const date = btn.dataset.date || '-';
      const status = btn.dataset.status || '-';
      const id = btn.dataset.id || '';

      // Create details HTML
      const details = document.createElement('ul');
      details.className = 'grid grid-cols-2 gap-2 text-sm';
      details.innerHTML = `
        <li><strong>Patient:</strong> ${patient}</li>
        <li><strong>Phone:</strong> ${phone}</li>
        <li><strong>Ref Doctor:</strong> ${doctor}</li>
        <li><strong>Total:</strong> ৳${total}</li>
        <li><strong>Discount:</strong> ৳${discount}</li>
        <li><strong>Net:</strong> ৳${net}</li>
        <li><strong>Paid:</strong> <span class='text-emerald-600'>৳${paid}</span></li>
        <li><strong>Due:</strong> <span class='text-red-600 font-bold'>৳${due}</span></li>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>Status:</strong> ${status}</li>
        <li class='col-span-2'><strong>Actions:</strong>
          <a href='/outdoor/reception/due-collection/${id}' class='inline-flex items-center justify-center rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 h-8 px-4 py-2'>Collect Due</a>
        </li>
      `;

      // Create new row
      const newRow = document.createElement('tr');
      newRow.className = 'child-row-detail';
      const cell = document.createElement('td');
      cell.className = 'p-4 bg-muted/50';
      cell.colSpan = 10;
      cell.appendChild(details);
      newRow.appendChild(cell);

      row.parentNode?.insertBefore(newRow, row.nextSibling);
      row.classList.add('expanded');
      btn.textContent = '−';
      btn.style.backgroundColor = '#dc2626';
    };

    // Add event listener to document for delegation
    document.addEventListener('click', handleExpandClick);

    return () => {
      document.removeEventListener('click', handleExpandClick);
    };
  }, []);

  const columns = [
    {
      data: "id",
      title: "Invoice ID",
      className: "font-mono text-sm",
      render: (data: any, _type: string, row: InvoiceItem) => {
        // Store row data as JSON string in data attribute (escaped properly)
        const discount = (row.discount || 0).toFixed(2);
        const status = Number(row.due_amount || 0) > 0 ? 'Due' : 'Paid';
        const dateStr = row.invoice_date ? new Date(row.invoice_date).toLocaleDateString() : '-';

        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                    type="button"
                    data-patient="${(row.patient_name || '-').replace(/"/g, '&quot;')}"
                    data-phone="${(row.phone || '-').replace(/"/g, '&quot;')}"
                    data-doctor="${((row.doctor?.doctor_name || '-')).replace(/"/g, '&quot;')}"
                    data-total="${row.total_amount || 0}"
                    data-discount="${discount}"
                    data-net="${row.net_amount || 0}"
                    data-paid="${row.total_paid || 0}"
                    data-due="${row.due_amount || 0}"
                    data-date="${dateStr}"
                    data-status="${status}"
                    data-id="${row.id}">+</button>
            <span>${data}</span>
          </div>
        `;
      },
    },
    {
      data: "patient_name",
      title: "Patient Name",
      className: "font-medium",
    },
    {
      data: "phone",
      title: "Phone",
      render: (data: any) => {
        return data || '-';
      },
    },
    {
      data: null,
      title: "Ref. Doctor",
      render: (_data: any, _type: string, row: InvoiceItem) => {
        const doctor = (row as any).doctor;
        return doctor?.doctor_name || '-';
      },
    },
    {
      data: "total_amount",
      title: "Total Amount",
      render: (data: any) => {
        return data ? parseFloat(data).toFixed(2) : '0.00';
      },
    },
    {
      data: "discount",
      title: "Discount",
      render: (data: any) => {
        return data ? parseFloat(data).toFixed(2) : '0.00';
      },
    },
    {
      data: "total_paid",
      title: "Paid (৳)",
      render: (data: any) => {
        const paid = data ? parseFloat(data).toFixed(2) : '0.00';
        return `<div class="text-emerald-600 font-medium">${paid}</div>`;
      },
    },
    {
      data: "due_amount",
      title: "Due (৳)",
      render: (data: any) => {
        const due = data ? parseFloat(data).toFixed(2) : '0.00';
        return `<div class="text-red-600 font-bold">${due}</div>`;
      },
    },
    {
      data: "invoice_date",
      title: "Date",
      render: (data: any) => {
        const date = new Date(data);
        return date.toLocaleDateString();
      },
    },
    {
      data: "status",
      title: "Status",
      orderable: false,
      render: (_data: any, _type: string, row: InvoiceItem) => {
        const due = parseFloat((row as any).due_amount || 0);
        const statusClass = due > 0
          ? 'bg-red-100 text-red-700'
          : 'bg-green-100 text-green-700';
        return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${statusClass}">
          ${due > 0 ? 'Due' : 'Paid'}
        </span>`;
      },
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      render: (_data: any, _type: string, row: InvoiceItem) => {
        const id = (row as any).id;
        return `<a href="/outdoor/reception/due-collection/${id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
          Collect Due
        </a>`;
      },
    },
  ];

  return (
    <>
      <AppHeader fixed />

      <main className='p-6 lg:p-10'>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Due Collection List</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
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
                    {item.value}
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

        <DataTable
          columns={columns}
          data={data?.data?.items || []}
          meta={data?.data?.meta}
          onPageChange={setPage}
          search={search}
          onSearchChange={setSearch}
        />
      </main>
    </>
  )
}
