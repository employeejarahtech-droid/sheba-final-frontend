import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod'
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from 'react';
import { getCookie } from '@/lib/cookies';
import { useDateFormat } from '@/hooks/use-date-format';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';
import { FileText, Microscope, Clock, Users } from 'lucide-react';

const stoolReSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/stool/stool-re/',
)({
  validateSearch: (search) => stoolReSearchSchema.parse(search),
  component: StoolRe,
})

type ReportItem = {
  id: number;
  invoice_id: number;
  patient_name: string;
  ref_doctor?: string | null;
  test_result: string | null;
  remarks: string | null;
  test_carried_out_by: string | null;
  created_at: string;
  status: string;
};

function StoolRe() {
  const searchParams: any = Route.useSearch();
  const navigate: any = Route.useNavigate();

  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = searchParams?.search || "";

  const setPage = (newPage: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
  };
  const setSearch = (newSearch: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
  };
  const setLimit = (newLimit: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
  };

  const token = getCookie('accessToken');
  const { formatDateTime: fmtDateTime } = useDateFormat();

  const { data, isFetching } = useQuery({
    queryKey: ["stool-re", page, limit, search],

    queryFn: async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/stool-re?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          return {
            data: {
              items: [],
              meta: {
                page,
                limit,
                total: 0,
              },
            },
          };
        }
        return await res.json();
      } catch (err) {
        return {
          data: {
            items: [],
            meta: {
              page,
              limit,
              total: 0,
            },
          },
        };
      }
    },

    enabled: !!token,
    retry: 0,

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

  // Use only API data (no fallback)
  const items = data?.data?.items || [];
  const meta = data?.data?.meta || { page, limit, total: 0 };

  // Define columns for jQuery DataTable format
  const columns = [
    {
      data: 'invoice_id',
      title: 'Invoice ID',
      className: 'font-mono text-sm',
      render: (data: any, _type: string, row: ReportItem) => {
        const date = fmtDateTime(row.created_at);
        const status = row.status || 'Pending';
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                    type="button"
                    data-invoice-id="${data}"
                    data-patient-name="${(row.patient_name || "-").replace(/"/g, "&quot;")}"
                    data-date="${date}"
                    data-test-result="${(row.test_result || "-").replace(/"/g, "&quot;")}"
                    data-test-carried-out-by="${(row.test_carried_out_by || "-").replace(/"/g, "&quot;")}"
                    data-status="${status}"
                    data-report-id="${row.id}">+</button>
            <span>${data}</span>
          </div>
        `;
      },
    },
    {
      data: 'patient_name',
      title: 'Patient Name',
      className: 'font-medium',
    },
    {
      data: 'ref_doctor',
      title: 'Ref. Doctor',
      defaultContent: '-',
    },
    {
      data: 'test_result',
      title: 'Test Result',
      render: (data: any) => {
        const value = data as string;
        return `<div class="text-sm">${value || `-`}</div>`;
      },
    },
    {
      data: 'created_at',
      title: 'Date',
      render: (data: any) => {
        const formatted = fmtDateTime(data);
        return `<div class="text-sm">${formatted}</div>`;
      },
    },
    {
      data: 'test_carried_out_by',
      title: 'Test Carried Out By',
      render: (data: any) => {
        const value = data as string;
        return `<div class="text-sm">${value || `-`}</div>`;
      },
    },
    {
      data: 'status',
      title: 'Status',
      render: (data: any) => {
        const isComplete = String(data || '').toLowerCase() === 'complete';
        const cls = isComplete
          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
          : 'bg-amber-100 text-amber-700 border-amber-200';
        const label = isComplete ? 'Complete' : 'Incomplete';

        return `<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}">${label}</span>`;
      },
    },
    {
      data: null,
      title: 'Actions',
      orderable: false,
      render: (_data: any, _type: string, row: ReportItem) => {
        return `
          <div class="flex flex-nowrap items-center gap-2">
            <a href="/dashboard/pathology/stool/stool-re/edit/${row.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>Edit</a>
            <a href="/dashboard/pathology/stool/stool-re/report/${row.id}" target="_blank" rel="noopener noreferrer" title="Print" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-semibold shadow transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>Print</a>
          </div>
        `;
      },
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
        btn.style.backgroundColor = '#10B981';
        return;
      }

      // Don't expand if already expanded
      if (isExpanded) return;

      // Get data from attributes
      const invoiceId = btn.dataset.invoiceId || '';
      const patientName = btn.dataset.patientName || '-';
      const date = btn.dataset.date || '-';
      const testResult = btn.dataset.testResult || '-';
      const testCarriedOutBy = btn.dataset.testCarriedOutBy || '-';
      const status = btn.dataset.status || '-';
      const reportId = btn.dataset.reportId || '';

      // Create details HTML
      const details = document.createElement('div');
      details.className = 'max-w-4xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden';

      // Format date for header
      const formattedDate = date !== '-' ? date : '';

      // Status badge
      const isComplete = String(status || '').toLowerCase() === 'complete';
      const statusBadge = isComplete
        ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Complete</span>`
        : `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Incomplete</span>`;

      // Build the HTML content
      let htmlContent = `
        <!-- Header -->
        <div class="bg-gradient-to-r from-stone-600 to-amber-700 text-white px-6 py-5">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold">Stool R/E Report</h2>
              <p class="text-sm opacity-90">Invoice #${invoiceId} &bull; ${formattedDate}</p>
            </div>
            ${statusBadge}
          </div>
        </div>

        <!-- Patient Info -->
        <div class="p-6 border-b">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
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
            <div>
              <p class="text-gray-500">Department</p>
              <p class="font-semibold text-gray-800">Stool Analysis</p>
            </div>
          </div>
        </div>

        <!-- Report Details Section -->
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-800">Test Results</h3>
          <div id="report-results-${reportId}" class="space-y-4">
            <div class="text-gray-500 text-sm">Loading report details...</div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <a href="/dashboard/pathology/stool/stool-re/report/${reportId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
            View Report
          </a>
          <a href="/dashboard/pathology/stool/stool-re/edit/${reportId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-stone-600 text-white hover:bg-stone-700 h-10 px-5 transition shadow-md">
            Edit
          </a>
        </div>
      `;

      details.innerHTML = htmlContent;

      // Fetch report details
      const resultsContainer = details.querySelector(`#report-results-${reportId}`);
      if (resultsContainer) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/stool-re/${reportId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const reportData = data.data;

            // Build test results HTML with all Stool R/E sections
            let testResultsHTML = `
              <div class="border rounded-xl p-4 hover:shadow-md transition bg-gray-50">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-sm font-semibold text-gray-700">Report ID: ${reportId}</span>
                  <span class="text-xs px-3 py-1 rounded-full bg-stone-100 text-stone-700 font-medium">
                    Stool R/E
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <!-- Physical Examination -->
                  <div>
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">PHYSICAL EXAMINATION</h4>
                    <table class="w-full">
                      <tbody>
                        <tr class="border-b"><td class="px-2 py-1">Color</td><td class="px-2 py-1 font-medium">${reportData.color || reportData.colour || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Consistency</td><td class="px-2 py-1 font-medium">${reportData.consistency || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Mucous</td><td class="px-2 py-1 font-medium">${reportData.mucous || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Blood</td><td class="px-2 py-1 font-medium">${reportData.blood || reportData.occult_blood || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Helminths</td><td class="px-2 py-1 font-medium">${reportData.helminths || "-"}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Chemical Examination -->
                  <div>
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">CHEMICAL EXAMINATION</h4>
                    <table class="w-full">
                      <tbody>
                        <tr class="border-b"><td class="px-2 py-1">Reaction</td><td class="px-2 py-1 font-medium">${reportData.reaction || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Reducing Substance</td><td class="px-2 py-1 font-medium">${reportData.reducingSubstance || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Occult Blood</td><td class="px-2 py-1 font-medium">${reportData.occultBlood || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Bile Pigments</td><td class="px-2 py-1 font-medium">${reportData.bilePigments || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Bile Salts</td><td class="px-2 py-1 font-medium">${reportData.bileSalts || "-"}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Microscopic Examination (Full Width) -->
                  <div class="md:col-span-2">
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">MICROSCOPIC EXAMINATION</h4>
                    <div class="grid grid-cols-2 gap-2">
                      <table class="w-full">
                        <tbody>
                          <tr class="border-b"><td class="px-2 py-1">Ova of</td><td class="px-2 py-1 font-medium">${reportData.ovaOf || "-"}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">Cysts of</td><td class="px-2 py-1 font-medium">${reportData.cystsOf || "-"}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">Larva of</td><td class="px-2 py-1 font-medium">${reportData.larvaOf || "-"}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">Trophozoite of</td><td class="px-2 py-1 font-medium">${reportData.trophozoiteOf || "-"}</td></tr>
                        </tbody>
                      </table>
                      <table class="w-full">
                        <tbody>
                          <tr class="border-b"><td class="px-2 py-1">Pus Cells</td><td class="px-2 py-1 font-medium">${reportData.pusCells || reportData.pus_cells || "-"}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">Epithelial Cells</td><td class="px-2 py-1 font-medium">${reportData.epithelialCells || reportData.epithelium || "-"}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">RBC</td><td class="px-2 py-1 font-medium">${reportData.rbc || "-"}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">Macrophage</td><td class="px-2 py-1 font-medium">${reportData.macrophage || "-"}</td></tr>
                        </tbody>
                      </table>
                      <table class="w-full">
                        <tbody>
                          <tr class="border-b"><td class="px-2 py-1">Vegetable Cells</td><td class="px-2 py-1 font-medium">${reportData.vegetableCells || "-"}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">Undigested Food</td><td class="px-2 py-1 font-medium">${reportData.undigestedFood || "-"}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">Fat Globules</td><td class="px-2 py-1 font-medium">${reportData.fatGlobules || "-"}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">Others</td><td class="px-2 py-1 font-medium">${reportData.others || "-"}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                ${reportData.remarks || reportData.comments ? `
                  <div class="mt-4 pt-4 border-t text-sm">
                    <span class="text-gray-500">Remarks:</span>
                    <span class="font-medium text-gray-800 ml-2">${reportData.remarks || reportData.comments}</span>
                  </div>
                ` : ''}

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
      cell.colSpan = 10;
      cell.appendChild(details);
      newRow.appendChild(cell);

      row.parentNode?.insertBefore(newRow, row.nextSibling);
      row.classList.add('expanded');
      btn.textContent = '-';
      btn.style.backgroundColor = '#dc2626';
    };

    // Add event listener to document for delegation
    document.addEventListener('click', handleExpandClick);

    return () => {
      document.removeEventListener('click', handleExpandClick);
    };
  }, [token]);

  // Stats cards (same design as List of Tests)
  const todayCount = items.filter((i: any) => {
    if (!i.created_at) return false;
    const d = new Date(i.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const uniquePatients = new Set(items.map((i: any) => i.patient_name)).size;

  const stats = [
    { label: "Total Reports", value: data?.data?.meta?.total || 0, icon: FileText, grad: "from-stone-500 to-amber-500" },
    { label: "Page Items", value: items.length || 0, icon: Microscope, grad: "from-amber-500 to-orange-500" },
    { label: "Recent", value: todayCount, icon: Clock, grad: "from-amber-500 to-yellow-500" },
    { label: "Patients", value: uniquePatients, icon: Users, grad: "from-indigo-500 to-purple-500" },
  ];

  return (
    <>
      <AppHeader fixed />
      <main>
        <div className="p-4 space-y-3">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
                    <h3 className="text-2xl font-bold">{card.value || 0}</h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <DataTable
            tableTitle="Stool R/E"
            columns={columns}
            data={items}
            meta={meta}
            onPageChange={setPage}
            onLimitChange={setLimit}
            search={search}
            onSearchChange={setSearch}
            isLoading={isFetching}
          />
        </div>
      </main>
    </>

  )
}
