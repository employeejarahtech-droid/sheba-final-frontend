import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod'
import { DataTable } from "@/components/DataTable";
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { FileText, Droplets, Clock, Users } from 'lucide-react';

const cbcSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/hematology/cbc-short/',
)({
  validateSearch: (search) => cbcSearchSchema.parse(search),
  component: CBCShort,
})

type CBCItem = {
  id: number;
  invoice_id: number;
  patient_name: string;
  created_at: string;
};

function CBCShort() {

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

  const { data, isFetching } = useQuery({
    queryKey: ["cbc", page, limit, search],

    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cbc?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch cbc data");
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
        <div class="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-5">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold">CBC Short Report</h2>
              <p class="text-sm opacity-90">Invoice #${invoiceId} &bull; ${formattedDate}</p>
            </div>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
              Hematology
            </span>
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
              <p class="font-semibold text-gray-800">Hematology</p>
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
          <a href="/dashboard/hematology/cbc-short/report/${reportId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
            View Report
          </a>
          <a href="/dashboard/hematology/cbc-short/edit/${reportId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 h-10 px-5 transition shadow-md">
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
            `${import.meta.env.VITE_API_URL}/api/cbc/${reportId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const reportData = data.data;

            // Build test results HTML
            const testResultsHTML = `
              <div class="border rounded-xl p-4 hover:shadow-md transition bg-gray-50">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-sm font-semibold text-gray-700">Report ID: ${reportId}</span>
                  <span class="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                    CBC Short Test
                  </span>
                </div>

                <!-- Test Results Table -->
                <table class="w-full text-xs">
                  <thead>
                    <tr class="border-b">
                      <th class="px-2 py-2 text-left">Test Name</th>
                      <th class="px-2 py-2 text-left">Result</th>
                      <th class="px-2 py-2 text-left">Normal Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b">
                      <td class="px-2 py-2">Hemoglobin (Hb)</td>
                      <td class="px-2 py-2 font-medium">${reportData.hemoglobin || "Pending"} g/dL</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">M: 13.5-17.5, F: 12.0-15.5 g/dL</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">RBC Count</td>
                      <td class="px-2 py-2 font-medium">${reportData.rbc_count || "Pending"} M/cmm</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">M: 4.5-5.9, F: 4.0-5.1 M/cmm</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">WBC Count</td>
                      <td class="px-2 py-2 font-medium">${reportData.wbc_count || "Pending"} /cmm</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">4,000-11,000 /cmm</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Platelets</td>
                      <td class="px-2 py-2 font-medium">${reportData.platelets || "Pending"} /cmm</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">1,50,000-4,50,000 /cmm</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Hematocrit (HCT)</td>
                      <td class="px-2 py-2 font-medium">${reportData.hct || "Pending"} %</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">M: 41-53%, F: 36-46%</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">MCV</td>
                      <td class="px-2 py-2 font-medium">${reportData.mcv || "Pending"} fL</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">80-100 fL</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">MCH</td>
                      <td class="px-2 py-2 font-medium">${reportData.mch || "Pending"} pg</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">27-34 pg</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">MCHC</td>
                      <td class="px-2 py-2 font-medium">${reportData.mchc || "Pending"} g/dL</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">32-36 g/dL</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Neutrophils</td>
                      <td class="px-2 py-2 font-medium">${reportData.neutrophils || "Pending"} %</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">40-75 %</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Lymphocytes</td>
                      <td class="px-2 py-2 font-medium">${reportData.lymphocytes || "Pending"} %</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">20-45 %</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Monocytes</td>
                      <td class="px-2 py-2 font-medium">${reportData.monocytes || "Pending"} %</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">2-10 %</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Eosinophils</td>
                      <td class="px-2 py-2 font-medium">${reportData.eosinophils || "Pending"} %</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">0-6 %</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Basophils</td>
                      <td class="px-2 py-2 font-medium">${reportData.basophils || "Pending"} %</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">0-1 %</td>
                    </tr>
                  </tbody>
                </table>

                ${reportData.test_carried_out_by ? `
                  <div class="mt-4 pt-4 border-t text-sm">
                    <span class="text-gray-500">Test Carried out by:</span>
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

  const columns = [
    {
      data: "invoice_id",
      title: "Invoice ID",
      orderable: true,
      responsivePriority: 2,
      render: (data: any, _type: string, row: CBCItem) => {
        const date = row.created_at ? new Date(row.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }) : '-';
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
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
      responsivePriority: 1,
      defaultContent: "",
    },
    {
      data: "created_at",
      title: "Date",
      orderable: true,
      responsivePriority: 3,
      render: (_data: any, _type: string, row: CBCItem) => {
        const iso = row.created_at;
        const date = new Date(iso);

        const formatted = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return `<div>${formatted}</div>`;
      },
      defaultContent: "",
    },
  ];

  return (
    <>
      <AppHeader fixed />
      <main>
        <div className="p-4 space-y-3">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Reports */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 to-orange-400 p-6 shadow-lg shadow-orange-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Total Reports</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{data?.data?.meta?.total || 0}</h3>
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

            {/* Blood Tests */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-red-400 p-6 shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Blood Tests</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{data?.data?.items?.length || 0}</h3>
                </div>
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  <Droplets className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="relative flex justify-between text-white/90 text-sm">
                <span>Current</span>
                <span className="font-semibold">Page</span>
              </div>
            </div>

            {/* Recent */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 to-teal-400 p-6 shadow-lg shadow-teal-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Recent</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">
                    {data?.data?.items?.filter((i: any) => {
                      if (!i.created_at) return false;
                      const d = new Date(i.created_at);
                      const now = new Date();
                      return d.toDateString() === now.toDateString();
                    }).length || 0}
                  </h3>
                </div>
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="relative flex justify-between text-white/90 text-sm">
                <span>Today</span>
                <span className="font-semibold">Added</span>
              </div>
            </div>

            {/* Patients */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-400 p-6 shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Patients</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{new Set(data?.data?.items?.map((i: any) => i.patient_name)).size || 0}</h3>
                </div>
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="relative flex justify-between text-white/90 text-sm">
                <span>Unique</span>
                <span className="font-semibold">Patients</span>
              </div>
            </div>
          </div>

          <DataTable
            tableTitle="CBC Short"
            columns={columns}
            data={data?.data?.items || []}
            meta={data?.data?.meta}
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
