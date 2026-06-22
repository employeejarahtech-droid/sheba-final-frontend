import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod'
import { DataTable } from "@/components/DataTable";
import { getCookie } from '@/lib/cookies';
import { useDateFormat } from '@/hooks/use-date-format';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { FileText, Microscope, Clock, Users } from 'lucide-react';

const cbcPbfSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/hematology/cbc-with-pbf/',
)({
  validateSearch: (search) => cbcPbfSearchSchema.parse(search),
  component: CBCWithPBF,
})


type CBCItem = {
  id: string;
  invoice_id: number;
  patient_name: string;
  ref_doctor?: string | null;
  created_at: string;
  status: string;
};


function CBCWithPBF() {

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

  // Tenant date format (from company settings) + 12h time — matches the rest of the app.
  const { formatDateTime: fmtDateTime } = useDateFormat();

  const { data, isFetching } = useQuery({
    queryKey: ["cbc-pbf", page, limit, search],

    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cbc-pbf?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
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
      const status = btn.dataset.status || '-';
      const reportId = btn.dataset.reportId || '';

      // Create details HTML
      const details = document.createElement('div');
      details.className = 'max-w-4xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden';

      // Format date for header
      const formattedDate = date !== '-' ? date : '';

      // Status badge
      const statusBadge = status === 'passed'
? <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Passed</span>
        : status === 'failed'
? <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Failed</span>
          : <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Pending</span>;

      // Build the HTML content
      let htmlContent = `
        <!-- Header -->
        <div class="bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white px-6 py-5">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold">CBC With PBF Report</h2>
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
          <a href="/dashboard/pathology/hematology/cbc-with-pbf/report/${reportId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
            View Report
          </a>
          <a href="/dashboard/pathology/hematology/cbc-with-pbf/edit/${reportId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-fuchsia-600 text-white hover:bg-fuchsia-700 h-10 px-5 transition shadow-md">
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
            `${import.meta.env.VITE_API_URL}/api/cbc-pbf/${reportId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const reportData = data.data;

            // Build test results HTML with Hematology Indices, RBC Indices, Differential Count, and PBF Findings
            let testResultsHTML = `
              <div class="border rounded-xl p-4 hover:shadow-md transition bg-gray-50">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-sm font-semibold text-gray-700">Report ID: ${reportId}</span>
                  <span class="text-xs px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 font-medium">
                    CBC With PBF
                  </span>
                </div>

                <!-- Hematology Indices -->
                <h4 class="text-sm font-semibold text-gray-700 mb-2 mt-3">Hematology Indices</h4>
                <table class="w-full text-xs mb-3">
                  <tbody>
                    <tr class="border-b">
                      <td class="px-2 py-1">Hemoglobin</td>
                      <td class="px-2 py-1 font-medium">${reportData.hemoglobin || "Pending"} g/dL</td>
                      <td class="px-2 py-1 text-gray-600 text-xs">13.0-17.0 (M), 11.5-15.5 (F)</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-1">RBC Count</td>
                      <td class="px-2 py-1 font-medium">${reportData.rbc_count || "Pending"} M/cmm</td>
                      <td class="px-2 py-1 text-gray-600 text-xs">4.5-5.9 (M), 4.0-5.2 (F)</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-1">WBC Count</td>
                      <td class="px-2 py-1 font-medium">${reportData.wbc_count || "Pending"}/cmm</td>
                      <td class="px-2 py-1 text-gray-600 text-xs">4000-11000</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-1">Platelets</td>
                      <td class="px-2 py-1 font-medium">${reportData.platelets || "Pending"}/cmm</td>
                      <td class="px-2 py-1 text-gray-600 text-xs">150000-400000</td>
                    </tr>
                  </tbody>
                </table>

                <!-- RBC Indices -->
                <h4 class="text-sm font-semibold text-gray-700 mb-2 mt-3">RBC Indices</h4>
                <table class="w-full text-xs mb-3">
                  <tbody>
                    <tr class="border-b">
                      <td class="px-2 py-1">HCT</td>
                      <td class="px-2 py-1 font-medium">${reportData.hct || "Pending"} %</td>
                      <td class="px-2 py-1 text-gray-600 text-xs">40-50 (M), 36-46 (F)</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-1">MCV</td>
                      <td class="px-2 py-1 font-medium">${reportData.mcv || "Pending"} fL</td>
                      <td class="px-2 py-1 text-gray-600 text-xs">80-100</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-1">MCH</td>
                      <td class="px-2 py-1 font-medium">${reportData.mch || "Pending"} pg</td>
                      <td class="px-2 py-1 text-gray-600 text-xs">27-33</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-1">MCHC</td>
                      <td class="px-2 py-1 font-medium">${reportData.mchc || "Pending"} g/dL</td>
                      <td class="px-2 py-1 text-gray-600 text-xs">32-36</td>
                    </tr>
                  </tbody>
                </table>

                <!-- Differential Count -->
                <h4 class="text-sm font-semibold text-gray-700 mb-2 mt-3">Differential Count</h4>
                <table class="w-full text-xs mb-3">
                  <tbody>
                    <tr class="border-b">
                      <td class="px-2 py-1">Neutrophils</td>
                      <td class="px-2 py-1 font-medium">${reportData.neutrophils || "Pending"} %</td>
                      <td class="px-2 py-1 text-gray-600 text-xs">40-75</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-1">Lymphocytes</td>
                      <td class="px-2 py-1 font-medium">${reportData.lymphocytes || "Pending"} %</td>
                      <td class="px-2 py-1 text-gray-600 text-xs">20-45</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-1">Monocytes</td>
                      <td class="px-2 py-1 font-medium">${reportData.monocytes || "Pending"} %</td>
                      <td class="px-2 py-1 text-gray-600 text-xs">2-10</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-1">Eosinophils</td>
                      <td class="px-2 py-1 font-medium">${reportData.eosinophils || "Pending"} %</td>
                      <td class="px-2 py-1 text-gray-600 text-xs">0-6</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-1">Basophils</td>
                      <td class="px-2 py-1 font-medium">${reportData.basophils || "Pending"} %</td>
                      <td class="px-2 py-1 text-gray-600 text-xs">0-2</td>
                    </tr>
                  </tbody>
                </table>

                ${reportData.pbf_findings ? `
                  <div class="mt-3 pt-3 border-t">
                    <h4 class="text-sm font-semibold text-gray-700 mb-2">PBF Findings</h4>
                    <p class="text-xs px-2 py-2 bg-gray-100 rounded">${reportData.pbf_findings}</p>
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
        const date = fmtDateTime(row.created_at);
        const status = row.status || 'Pending';
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                    type="button"
                    data-invoice-id="${data}"
                    data-patient-name="${(row.patient_name || "-").replace(/"/g, "&quot;")}"
                    data-date="${date}"
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
      responsivePriority: 1,
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
      responsivePriority: 3,
      render: (_data: any, _type: string, row: CBCItem) => {
        return `<div>${fmtDateTime(row.created_at)}</div>`;
      },
      defaultContent: "",
    },
    {
      data: "status",
      title: "Status",
      orderable: true,
      responsivePriority: 4,
      render: (_data: any, _type: string, row: CBCItem) => {
        const status = row.status || 'Pending';
        const color =
          status === "passed"
            ? "bg-green-500"
            : status === "failed"
              ? "bg-red-500"
              : "bg-yellow-500";

        return `<span class="${color} text-white inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">${status}</span>`;
      },
      defaultContent: "",
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      render: (_data: any, _type: string, row: any) => `
        <div class="flex items-center justify-center gap-1.5 whitespace-nowrap">
          <a href="/dashboard/pathology/hematology/cbc-with-pbf/edit/${row.id}" title="Edit" class="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 text-xs font-medium h-8 px-2.5 transition">Edit</a>
          <a href="/dashboard/pathology/hematology/cbc-with-pbf/report/${row.id}" target="_blank" rel="noopener noreferrer" title="Print" class="inline-flex items-center gap-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium h-8 px-2.5 transition">Print</a>
        </div>
      `,
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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-600 to-fuchsia-400 p-6 shadow-lg shadow-fuchsia-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
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

            {/* CBC Tests */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600 to-pink-400 p-6 shadow-lg shadow-pink-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">CBC Tests</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{data?.data?.items?.length || 0}</h3>
                </div>
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  <Microscope className="w-6 h-6 text-white" />
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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 p-6 shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
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
            tableTitle="CBC With PBF"
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
