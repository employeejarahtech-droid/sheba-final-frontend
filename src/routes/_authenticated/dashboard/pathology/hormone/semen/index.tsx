import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { DataTable } from "@/components/DataTable";
import { useEffect } from 'react';
import { getCookie } from '@/lib/cookies';
import { useDateFormat } from '@/hooks/use-date-format';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';
import { FileText, FlaskConical, Clock, Users } from 'lucide-react';

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
});

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/hormone/semen/',
)({
  component: Semen,
  validateSearch: (search) => searchSchema.parse(search),
})


type ReportsItem = {
  id: number;
  invoice_id: number;
  patient_name: string | null;
  created_at: string | null;
  ref_doctor?: string | null;
};

function Semen() {

  const searchParams: any = Route.useSearch();
  const navigate: any = Route.useNavigate();
  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = searchParams?.search || "";
  const setPage = (newPage: number) => { navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) }); };
  const setSearch = (newSearch: string) => { navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) }); };
  const setLimit = (newLimit: number) => { navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) }); };

  const token = getCookie('accessToken');
  const { formatDateTime: fmtDateTime } = useDateFormat();

  const { data: semenReports, isFetching } = useQuery({
    queryKey: ["semen", page, limit, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/semen?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch semen reports");
      return res.json();
    },
    enabled: !!token,
    placeholderData: (prev) =>
      prev
        ? prev
        : {
          data: {
            items: [],
            total: 0,
          },
        },
  });

  const items = semenReports?.data?.items || [];
  const meta = semenReports?.data?.meta || { page, limit, total: 0 };

  const columns = [
    {
      data: 'id',
      title: 'ID',
      orderable: true,
      render: (data: any, _type: string, row: ReportsItem) => {
        const invoiceId = row.invoice_id || '-';
        const patientName = row.patient_name || '-';
        const date = fmtDateTime(row.created_at);
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                    type="button"
                    data-id="${data}"
                    data-invoice-id="${invoiceId}"
                    data-patient-name="${patientName.replace(/"/g, "&quot;")}"
                    data-date="${date}">+</button>
            <span>${data}</span>
          </div>
        `;
      },
      defaultContent: '',
    },
    {
      data: 'invoice_id',
      title: 'Invoice ID',
      orderable: true,
      defaultContent: '',
    },
    {
      data: 'patient_name',
      title: 'Patient Name',
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const patientName = row.patient_name;
        return patientName || '-';
      },
      defaultContent: '',
    },
    {
      data: 'ref_doctor',
      title: 'Ref. Doctor',
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => row.ref_doctor || '-',
      defaultContent: '',
    },
    {
      data: 'created_at',
      title: 'Date',
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return fmtDateTime(row.created_at);
      },
      defaultContent: '',
    },
    {
      data: null,
      title: 'Actions',
      orderable: false,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return `
          <div class="flex gap-2">
            <a href="/dashboard/pathology/hormone/semen/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
              Edit
            </a>
            <a href="/dashboard/pathology/hormone/semen/report/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
              Print
            </a>
          </div>
        `;
      },
      defaultContent: '',
    },
  ];

  // Handle expand button clicks
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

      // Get data from attributes
      const id = btn.dataset.id || '';
      const invoiceId = btn.dataset.invoiceId || '-';
      const patientName = btn.dataset.patientName || '-';
      const date = btn.dataset.date || '-';

      // Create details HTML
      const details = document.createElement('div');
      details.className = 'max-w-4xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden';

      // Format date for header
      const formattedDate = date !== '-' ? date : '';

      // Build the HTML content
      let htmlContent = `
        <!-- Header -->
        <div class="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-5">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold">Semen Analysis Report</h2>
              <p class="text-sm opacity-90">Invoice #${invoiceId} • ${formattedDate}</p>
            </div>
          </div>
        </div>

        <!-- Patient Info -->
        <div class="p-6 border-b">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <p class="text-gray-500">Report ID</p>
              <p class="font-semibold text-gray-800">${id}</p>
            </div>
            <div>
              <p class="text-gray-500">Invoice ID</p>
              <p class="font-semibold text-gray-800">${invoiceId}</p>
            </div>
            <div>
              <p class="text-gray-500">Patient Name</p>
              <p class="font-semibold text-gray-800">${patientName}</p>
            </div>
            <div>
              <p class="text-gray-500">Date</p>
              <p class="font-semibold text-gray-800">${formattedDate}</p>
            </div>
          </div>
        </div>

        <!-- Report Details Section -->
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-800">Test Results</h3>
          <div id="report-results-${id}" class="space-y-4">
            <div class="text-gray-500 text-sm">Loading report details...</div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <a href="/dashboard/pathology/hormone/semen/report/${id}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
            View Report
          </a>
          <a href="/dashboard/pathology/hormone/semen/edit/${id}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-5 transition shadow-md">
            Edit
          </a>
        </div>
      `;

      details.innerHTML = htmlContent;

      // Fetch report details
      const resultsContainer = details.querySelector(`#report-results-${id}`);
      if (resultsContainer) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/semen/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const reportData = data.data;

            // Build test results HTML with Semen Analysis results
            let testResultsHTML = `
              <div class="border rounded-xl p-4 hover:shadow-md transition bg-gray-50">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-sm font-semibold text-gray-700">Report ID: ${id}</span>
                  <span class="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                    Semen Analysis
                  </span>
                </div>

                <!-- Test Results Table -->
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b">
                      <th class="px-2 py-2 text-left">Test Name</th>
                      <th class="px-2 py-2 text-left">Result</th>
                      <th class="px-2 py-2 text-left">Normal Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b">
                      <td class="px-2 py-2">Volume</td>
                      <td class="px-2 py-2 font-medium">${reportData.volume || "-"} mL</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">1.5-5.0 mL</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Sperm Count</td>
                      <td class="px-2 py-2 font-medium">${reportData.count || "-"} million/mL</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">≥15 million/mL</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Motility</td>
                      <td class="px-2 py-2 font-medium">${reportData.motility || "-"}%</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">≥40% (progressive)</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Morphology</td>
                      <td class="px-2 py-2 font-medium">${reportData.morphology || "-"}%</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">≥4% normal forms</td>
                    </tr>
                    ${reportData.remarks ? `
                    <tr class="border-b">
                      <td class="px-2 py-2">Remarks</td>
                      <td class="px-2 py-2 font-medium" colspan="2">${reportData.remarks}</td>
                    </tr>
                    ` : ''}
                  </tbody>
                </table>

                ${reportData.test_carried_out_by ? `
                  <div class="mt-4 pt-4 border-t text-sm">
                    <span class="text-gray-500">Test Carried Out By:</span>
                    <span class="font-medium text-gray-800 ml-2">${reportData.test_carried_out_by}</span>
                  </div>
                ` : ''}
              </div>
            `;

            resultsContainer.innerHTML = testResultsHTML;
          } else {
            resultsContainer.innerHTML = `<div class="text-red-500 text-sm">Failed to load report details</div>`;
          }
        } catch (error) {
          resultsContainer.innerHTML = `<div class="text-red-500 text-sm">Failed to load report details</div>`;
        }
      }

      // Create new row
      const newRow = document.createElement('tr');
      newRow.className = 'child-row-detail';
      const cell = document.createElement('td');
      cell.className = 'p-4 bg-gray-50';
      cell.colSpan = 6;
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
  }, [token]);

  return (
    <>
      <AppHeader fixed />
      <main>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Reports */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-6 shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Total Reports</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{semenReports?.data?.meta?.total || 0}</h3>
                </div>
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="relative flex justify-between text-white/90 text-sm">
                <span>All Time</span>
                <span className="font-semibold">Records</span>
              </div>
            </div>
            {/* Current Page */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 p-6 shadow-lg shadow-violet-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Current Page</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{items.length}</h3>
                </div>
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  <FlaskConical className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="relative flex justify-between text-white/90 text-sm">
                <span>Page {page}</span>
                <span className="font-semibold">Showing</span>
              </div>
            </div>
            {/* Recent Today */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 p-6 shadow-lg shadow-indigo-600/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Recent Today</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{items.filter((item: ReportsItem) => { const d = item.created_at ? new Date(item.created_at) : null; if (!d) return false; const today = new Date(); return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate(); }).length}</h3>
                </div>
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="relative flex justify-between text-white/90 text-sm">
                <span>Today</span>
                <span className="font-semibold">Reports</span>
              </div>
            </div>
            {/* Unique Patients */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 p-6 shadow-lg shadow-violet-600/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Unique Patients</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{new Set(items.map((item: ReportsItem) => item.patient_name).filter(Boolean)).size}</h3>
                </div>
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="relative flex justify-between text-white/90 text-sm">
                <span>This Page</span>
                <span className="font-semibold">Patients</span>
              </div>
            </div>
          </div>
          <DataTable columns={columns} data={items} meta={meta} onPageChange={setPage} search={search} onSearchChange={setSearch} tableTitle="Semen Analysis" onLimitChange={setLimit} isLoading={isFetching} />
        </div>
      </main>
    </>

  )

}
