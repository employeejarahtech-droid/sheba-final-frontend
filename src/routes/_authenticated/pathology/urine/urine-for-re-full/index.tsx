import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod'
import { DataTable } from "@/components/DataTable";
import { useEffect, useState } from 'react';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';
import { FileText, Droplets, Clock, Users } from 'lucide-react';

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute(
  '/_authenticated/pathology/urine/urine-for-re-full/',
)({
  validateSearch: (search) => searchSchema.parse(search),
  component: UrineForReFull,
})

type ReportsItem = {
  id: number;
  invoice_id: number;
  patient_name: string | null;
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
                    data-patient-name="${(row.patient_name || '-').replace(/"/g, '&quot;')}"
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
          <a href="/pathology/urine/urine-for-re-full/report/${reportId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
            View Report
          </a>
          <a href="/pathology/urine/urine-for-re-full/edit/${reportId}"
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
                        <tr class="border-b"><td class="px-2 py-1">Color</td><td class="px-2 py-1 font-medium">${reportData.color || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Appearance</td><td class="px-2 py-1 font-medium">${reportData.appearance || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Sediment</td><td class="px-2 py-1 font-medium">${reportData.sediment || '-'}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Microscopic Examination -->
                  <div>
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">MICROSCOPIC EXAMINATION</h4>
                    <table class="w-full">
                      <tbody>
                        <tr class="border-b"><td class="px-2 py-1">Epithelial Cells</td><td class="px-2 py-1 font-medium">${reportData.epithelial_cells || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">RBC Cells</td><td class="px-2 py-1 font-medium">${reportData.rbc_cells || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Pus Cells</td><td class="px-2 py-1 font-medium">${reportData.pus_cells || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Yeast Cells</td><td class="px-2 py-1 font-medium">${reportData.yeast_cells || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Spermatozoa</td><td class="px-2 py-1 font-medium">${reportData.spermatozoa || '-'}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Crystals -->
                  <div>
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">CRYSTALS</h4>
                    <table class="w-full">
                      <tbody>
                        <tr class="border-b"><td class="px-2 py-1">Uric Acid Crystals</td><td class="px-2 py-1 font-medium">${reportData.uric_acid_crystals || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Calcium Oxalate</td><td class="px-2 py-1 font-medium">${reportData.calcium_oxalate || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Triple Phosphate</td><td class="px-2 py-1 font-medium">${reportData.triple_phosphate || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Amorphous Deposits</td><td class="px-2 py-1 font-medium">${reportData.amorphous_deposits || '-'}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Casts / LPE -->
                  <div>
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">CASTS / LPE</h4>
                    <table class="w-full">
                      <tbody>
                        <tr class="border-b"><td class="px-2 py-1">Hyaline Casts</td><td class="px-2 py-1 font-medium">${reportData.hyaline_casts || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Granular Casts</td><td class="px-2 py-1 font-medium">${reportData.granular_casts || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">RBC Casts</td><td class="px-2 py-1 font-medium">${reportData.rbc_casts || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">WBC Casts</td><td class="px-2 py-1 font-medium">${reportData.wbc_casts || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Epithelial Casts</td><td class="px-2 py-1 font-medium">${reportData.epithelial_casts || '-'}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Chemical Examination (split into 2 columns) -->
                  <div>
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">CHEMICAL EXAMINATION</h4>
                    <table class="w-full">
                      <tbody>
                        <tr class="border-b"><td class="px-2 py-1">Urobilinogen</td><td class="px-2 py-1 font-medium">${reportData.urobilinogen || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Bilirubin</td><td class="px-2 py-1 font-medium">${reportData.bilirubin || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Ketone</td><td class="px-2 py-1 font-medium">${reportData.ketones || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Blood</td><td class="px-2 py-1 font-medium">${reportData.blood || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Protein</td><td class="px-2 py-1 font-medium">${reportData.protein || '-'}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">CHEMICAL EXAMINATION</h4>
                    <table class="w-full">
                      <tbody>
                        <tr class="border-b"><td class="px-2 py-1">Nitrite</td><td class="px-2 py-1 font-medium">${reportData.nitrite || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Leukocytes</td><td class="px-2 py-1 font-medium">${reportData.leukocytes || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Glucose</td><td class="px-2 py-1 font-medium">${reportData.glucose || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Specific Gravity</td><td class="px-2 py-1 font-medium">${reportData.specific_gravity || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Reaction (pH)</td><td class="px-2 py-1 font-medium">${reportData.ph || '-'}</td></tr>
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
                    <span class="text-gray-500">Test Carried out by:</span>
                    <span class="font-medium text-gray-800 ml-2">${reportData.test_carried_out_by}</span>
                  </div>
                ` : ''}
              </div>
            `;

            resultsContainer.innerHTML = testResultsHTML;
          } else {
            resultsContainer.innerHTML = '<div class="text-red-500 text-sm">Failed to load report details</div>';
          }
        } catch (error) {
          resultsContainer.innerHTML = '<div class="text-red-500 text-sm">Failed to load report details</div>';
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

  return (
    <>
      <AppHeader fixed />
      <main>
        <div className="p-4 space-y-3">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Reports */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 to-teal-400 p-6 shadow-lg shadow-teal-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Total Reports</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{urineReData?.data?.meta?.total || 0}</h3>
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

            {/* Urine R/E Tests */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-400 p-6 shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Urine R/E Tests</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{urineReData?.data?.items?.length || 0}</h3>
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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 p-6 shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Recent</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">
                    {urineReData?.data?.items?.filter((i: any) => {
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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 to-teal-500 p-6 shadow-lg shadow-teal-600/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Patients</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{new Set(urineReData?.data?.items?.map((i: any) => i.patient_name)).size || 0}</h3>
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
