import { createFileRoute } from '@tanstack/react-router';
import { ConfigDrawer } from "@/components/config-drawer";
import { DataTable } from "@/components/DataTable";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { useState, useEffect } from 'react';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { EditUrineForSugarForm } from '@/features/pathology/urine/EditUrineForSugarForm';
import { topNav } from '@/data/data';

export const Route = createFileRoute(
  '/_authenticated/pathology/urine/urine-for-sugar/',
)({
  component: UrineForSugar,
})

type ReportsItem = {
  id: number;
  invoice_id: number;
  patient_name: string | null;
  created_at: string | null;
  status: string | null;
  test_carried_out_by: string | null;
};

function UrineForSugar() {

  const [open, setOpen] = useState<boolean>(false);
  const [reportId, setReportId] = useState<number>(0);
  const [invoiceId, setInvoiceId] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const token = getCookie('accessToken');

  const { data: urineSugarData } = useQuery({
    queryKey: ["urine-sugar", page, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/urine-sugar?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch urine sugar reports");
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
              page,
              limit,
              total: 0,
            },
          },
        },
  });

  const columns = [
    {
      data: "invoice_id",
      title: "Invoice ID",
      orderable: true,
      render: (data: any, _type: string, row: ReportsItem) => {
        const date = row.created_at ? new Date(row.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }) : '-';
        const status = row.status || 'Pending';
        const testCarriedOutBy = row.test_carried_out_by || '-';
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                    type="button"
                    data-invoice-id="${data}"
                    data-patient-name="${(row.patient_name || '-').replace(/"/g, '&quot;')}"
                    data-date="${date}"
                    data-test-carried-out-by="${testCarriedOutBy.replace(/"/g, '&quot;')}"
                    data-status="${status}"
                    data-report-id="${row.id}">+</button>
            <span>${data}</span>
          </div>
        `;
      },
      defaultContent: "",
    },
    {
      data: "patient_name",
      title: "Patient Name",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const patientName = row.patient_name;
        return patientName || '-';
      },
      defaultContent: "",
    },
    {
      data: "created_at",
      title: "Date",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const date = row.created_at;
        return date ? new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }) : '-';
      },
      defaultContent: "",
    },
    {
      data: "test_carried_out_by",
      title: "Test Carried Out By",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const testCarriedOutBy = row.test_carried_out_by;
        return testCarriedOutBy || '-';
      },
      defaultContent: "",
    },
    {
      data: "status",
      title: "Status",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const status = row.status;
        const color = status === 'Completed' ? 'bg-green-500' : status === 'Pending' ? 'bg-yellow-500' : 'bg-gray-500';
        return `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${color} text-white">${status || 'Pending'}</span>`;
      },
      defaultContent: "",
    },
  ];

  // Handle expand button clicks
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
      const invoiceId = btn.dataset.invoiceId || '';
      const patientName = btn.dataset.patientName || '-';
      const date = btn.dataset.date || '-';
      const testCarriedOutBy = btn.dataset.testCarriedOutBy || '-';
      const status = btn.dataset.status || '-';
      const reportId = btn.dataset.reportId || '';

      // Create details HTML
      const details = document.createElement('ul');
      details.className = 'grid grid-cols-2 gap-2 text-sm';
      details.innerHTML = `
        <li><strong>Invoice ID:</strong> ${invoiceId}</li>
        <li><strong>Patient Name:</strong> ${patientName}</li>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>Test Carried Out By:</strong> ${testCarriedOutBy}</li>
        <li><strong>Status:</strong> ${status}</li>
        <li class='col-span-2'><strong>Actions:</strong>
          <button
            class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2 mr-2"
            onclick="window.editUrineSugar(${reportId}, ${invoiceId})"
          >
            Edit
          </button>
          <a href="/pathology/urine/urine-for-sugar/report/${reportId}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
            View Report
          </a>
        </li>
      `;

      // Create new row
      const newRow = document.createElement('tr');
      newRow.className = 'child-row-detail';
      const cell = document.createElement('td');
      cell.className = 'p-4 bg-muted/50';
      cell.colSpan = 8;
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

  // Expose edit function to window for onclick handler
  if (typeof window !== 'undefined') {
    (window as any).editUrineSugar = (id: number, invoiceId: number) => {
      setOpen(true);
      setReportId(id);
      setInvoiceId(invoiceId);
    };
  }

  return (
    <>
      <Header fixed>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="mb-4">
          <h1 className='text-2xl font-bold tracking-tight'>Urine For Sugar</h1>
        </div>
        <DataTable columns={columns} data={urineSugarData?.data?.items || []} meta={urineSugarData?.data?.meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
        <EditUrineForSugarForm open={open} setOpen={setOpen} reportId={reportId} invoiceId={invoiceId} />
      </Main>
    </>

  )
}
