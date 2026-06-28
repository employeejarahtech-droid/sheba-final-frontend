import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod'
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from 'react';
import { getCookie } from '@/lib/cookies';
import { useDateFormat } from '@/hooks/use-date-format';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';
import { FileText, Droplets, Clock, Users } from 'lucide-react';

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/urine/urine-for-re-full/',
)({
  validateSearch: (search) => searchSchema.parse(search),
  component: UrineForReFull,
})

type ReportsItem = {
  id: number;
  invoice_id: number;
  patient_name: string | null;
  ref_doctor?: string | null;
  status?: string | null;
  created_at: string | null;
};

function UrineForReFull() {
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

  const { data: urineReData, isFetching } = useQuery({
    queryKey: ["urine-re", page, limit, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/urine-re?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch urine RE reports");
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
        const date = fmtDateTime(row.created_at);
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                    type="button"
                    data-invoice-id="${data}"
                    data-patient-name="${(row.patient_name || "-").replace(/"/g, "&quot;")}"
                    data-date="${date}"
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
      data: "ref_doctor",
      title: "Ref. Doctor",
      defaultContent: "-",
    },
    {
      data: "created_at",
      title: "Date",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return fmtDateTime(row.created_at);
      },
      defaultContent: "",
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
      data: "status",
      title: "Status",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const isComplete = String(row.status || '').toLowerCase() === 'complete';
        const cls = isComplete
          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
          : 'bg-amber-100 text-amber-700 border-amber-200';
        const label = isComplete ? 'Complete' : 'Incomplete';
        return `<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}">${label}</span>`;
      },
      defaultContent: "-",
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return `
          <div class="flex flex-nowrap items-center gap-2">
            <a href="/dashboard/pathology/urine/urine-for-re-full/edit/${row.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>Edit</a>
            <a href="/dashboard/pathology/urine/urine-for-re-full/report/${row.id}" target="_blank" rel="noopener noreferrer" title="Print" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-semibold shadow transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>Print</a>
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
      const reportId = btn.dataset.reportId || '';

      // Create details HTML
      const details = document.createElement('div');
      details.className = 'max-w-4xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden';

      // Format date for header
      const formattedDate = date !== '-' ? date : '';

      // Build the HTML content
      let htmlContent = `
        <!-- Header -->
        <div class="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-5">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold">Urine R/E Full Report</h2>
              <p class="text-sm opacity-90">Invoice #${invoiceId} • ${formattedDate}</p>
            </div>
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
              <p class="font-semibold text-gray-800">Urine Analysis</p>
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
          <a href="/dashboard/pathology/urine/urine-for-re-full/report/${reportId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
            View Report
          </a>
          <a href="/dashboard/pathology/urine/urine-for-re-full/edit/${reportId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 h-10 px-5 transition shadow-md">
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
            `${import.meta.env.VITE_API_URL}/api/urine-re/${reportId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const reportData = data.data;

            // Build test results HTML with all Urine R/E sections
            let testResultsHTML = `
              <div class="border rounded-xl p-4 hover:shadow-md transition bg-gray-50">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-sm font-semibold text-gray-700">Report ID: ${reportId}</span>
                  <span class="text-xs px-3 py-1 rounded-full bg-teal-100 text-teal-700 font-medium">
                    Urine R/E Full
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <!-- Physical Examination -->
                  <div>
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">PHYSICAL EXAMINATION</h4>
                    <table class="w-full">
                      <tbody>
                        <tr class="border-b"><td class="px-2 py-1">Color</td><td class="px-2 py-1 font-medium">${reportData.color || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Appearance</td><td class="px-2 py-1 font-medium">${reportData.appearance || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Sediment</td><td class="px-2 py-1 font-medium">${reportData.sediment || "-"}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Microscopic Examination -->
                  <div>
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">MICROSCOPIC EXAMINATION</h4>
                    <table class="w-full">
                      <tbody>
                        <tr class="border-b"><td class="px-2 py-1">Epithelial Cells</td><td class="px-2 py-1 font-medium">${reportData.epithelial_cells || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">RBC Cells</td><td class="px-2 py-1 font-medium">${reportData.rbc_cells || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Pus Cells</td><td class="px-2 py-1 font-medium">${reportData.pus_cells || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Yeast Cells</td><td class="px-2 py-1 font-medium">${reportData.yeast_cells || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Spermatozoa</td><td class="px-2 py-1 font-medium">${reportData.spermatozoa || "-"}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Crystals -->
                  <div>
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">CRYSTALS</h4>
                    <table class="w-full">
                      <tbody>
                        <tr class="border-b"><td class="px-2 py-1">Uric Acid Crystals</td><td class="px-2 py-1 font-medium">${reportData.uric_acid_crystals || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Calcium Oxalate</td><td class="px-2 py-1 font-medium">${reportData.calcium_oxalate || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Triple Phosphate</td><td class="px-2 py-1 font-medium">${reportData.triple_phosphate || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Amorphous Deposits</td><td class="px-2 py-1 font-medium">${reportData.amorphous_deposits || "-"}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Casts / LPE -->
                  <div>
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">CASTS / LPE</h4>
                    <table class="w-full">
                      <tbody>
                        <tr class="border-b"><td class="px-2 py-1">Hyaline Casts</td><td class="px-2 py-1 font-medium">${reportData.hyaline_casts || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Granular Casts</td><td class="px-2 py-1 font-medium">${reportData.granular_casts || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">RBC Casts</td><td class="px-2 py-1 font-medium">${reportData.rbc_casts || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">WBC Casts</td><td class="px-2 py-1 font-medium">${reportData.wbc_casts || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Epithelial Casts</td><td class="px-2 py-1 font-medium">${reportData.epithelial_casts || "-"}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Chemical Examination (split into 2 columns) -->
                  <div>
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">CHEMICAL EXAMINATION</h4>
                    <table class="w-full">
                      <tbody>
                        <tr class="border-b"><td class="px-2 py-1">Urobilinogen</td><td class="px-2 py-1 font-medium">${reportData.urobilinogen || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Bilirubin</td><td class="px-2 py-1 font-medium">${reportData.bilirubin || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Ketone</td><td class="px-2 py-1 font-medium">${reportData.ketones || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Blood</td><td class="px-2 py-1 font-medium">${reportData.blood || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Protein</td><td class="px-2 py-1 font-medium">${reportData.protein || "-"}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">CHEMICAL EXAMINATION</h4>
                    <table class="w-full">
                      <tbody>
                        <tr class="border-b"><td class="px-2 py-1">Nitrite</td><td class="px-2 py-1 font-medium">${reportData.nitrite || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Leukocytes</td><td class="px-2 py-1 font-medium">${reportData.leukocytes || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Glucose</td><td class="px-2 py-1 font-medium">${reportData.glucose || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Specific Gravity</td><td class="px-2 py-1 font-medium">${reportData.specific_gravity || "-"}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Reaction (pH)</td><td class="px-2 py-1 font-medium">${reportData.ph || "-"}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                ${reportData.remarks ? `
                  <div class="mt-4 pt-4 border-t text-sm">
                    <span class="text-gray-500">Remarks:</span>
                    <span class="font-medium text-gray-800 ml-2">${reportData.remarks}</span>
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
      cell.colSpan = 7;
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
  const items = urineReData?.data?.items || [];
  const todayCount = items.filter((i: any) => {
    if (!i.created_at) return false;
    const d = new Date(i.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const uniquePatients = new Set(items.map((i: any) => i.patient_name)).size;

  const stats = [
    { label: "Total Reports", value: urineReData?.data?.meta?.total || 0, icon: FileText, grad: "from-teal-500 to-cyan-500" },
    { label: "Urine R/E Tests", value: items.length || 0, icon: Droplets, grad: "from-cyan-500 to-blue-500" },
    { label: "Recent", value: todayCount, icon: Clock, grad: "from-emerald-500 to-teal-500" },
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
            tableTitle="Urine R/E Full"
            columns={columns}
            data={urineReData?.data?.items || []}
            meta={urineReData?.data?.meta}
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
