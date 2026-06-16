import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { DataTable } from "@/components/DataTable";
import { useEffect, useState } from 'react';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';
import { FileText, FlaskConical, Clock, Users } from 'lucide-react';

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
});

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/hormone/all/',
)({
  component: AllHormones,
  validateSearch: (search) => searchSchema.parse(search),
})


type ReportsItem = {
  ReciptID: number;
  PatientId: number | null;
  PatientName: string | null;
  Date: string | null;
  Tests: string;
  TestNames: string;
  Status: string;
};

function AllHormones() {

  const searchParams: any = Route.useSearch();
  const navigate: any = Route.useNavigate();
  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = searchParams?.search || "";
  const setPage = (newPage: number) => { navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) }); };
  const setSearch = (newSearch: string) => { navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) }); };
  const setLimit = (newLimit: number) => { navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) }); };

  const token = getCookie('accessToken');

  const { data: hormoneAllReports, isFetching } = useQuery({
    queryKey: ["hormon-all", page, limit, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/hormon-all?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch tests");
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

  const items = hormoneAllReports?.data?.items || [];
  const meta = hormoneAllReports?.data?.meta || { page, limit, total: 0 };

  const columns = [
    {
      data: 'ReciptID',
      title: 'Receipt ID',
      orderable: true,
      render: (data: any, _type: string, row: ReportsItem) => {
        const date = row.Date ? new Date(row.Date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) : '-';
        const status = row.Status || 'Pending';
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                    type="button"
                    data-recipt-id="${data}"
                    data-patient-id="${row.PatientId || "-"}"
                    data-patient-name="${(row.PatientName || "-").replace(/"/g, "&quot;")}"
                    data-date="${date}"
                    data-tests="${(row.Tests || "-").replace(/"/g, "&quot;")}"
                    data-status="${status}">+</button>
            <span>${data}</span>
          </div>
        `;
      },
      defaultContent: '',
    },
    {
      data: 'PatientId',
      title: 'Patient ID',
      orderable: true,
      defaultContent: '',
    },
    {
      data: 'PatientName',
      title: 'Patient Name',
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const patientName = row.PatientName;
        return patientName || '-';
      },
      defaultContent: '',
    },
    {
      data: 'Date',
      title: 'Date',
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const date = row.Date;
        return date ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) : '-';
      },
      defaultContent: '',
    },
    {
      data: 'TestNames',
      title: 'Tests',
      render: (data: any, _type: string, row: ReportsItem) => {
        const testNames = data || row.Tests || '';
        if (!testNames) return '-';

        // Split comma-separated test names and display as badges
        const names = testNames.split(',').filter(name => name.trim() !== '');
        return names.map((name) =>
          <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1">${name.trim()}</span>
        ).join('');
      },
      orderable: false,
      defaultContent: '',
    },
    {
      data: 'Status',
      title: 'Status',
      orderable: true,
      render: (data: any) => {
        const status = data as string;
        const statusColor = status === 'Completed' ? 'text-green-600' : 'text-yellow-600';
        return <span class="${statusColor}">${status || `Pending`}</span>;
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
            <a href="/dashboard/hormone/all/edit/${row.ReciptID}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
              Edit
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
      const reciptId = btn.dataset.reciptId || '';
      const patientId = btn.dataset.patientId || '-';
      const patientName = btn.dataset.patientName || '-';
      const date = btn.dataset.date || '-';
      const tests = btn.dataset.tests || '-';
      const status = btn.dataset.status || '-';

      // Create details HTML
      const details = document.createElement('div');
      details.className = 'max-w-4xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden';

      // Format date for header
      const formattedDate = date !== '-' ? date : '';

      // Status badge
      const statusBadge = status === 'Completed'
? <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Completed</span>
        : <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-yellow-900">Pending</span>;

      // Build the HTML content
      let htmlContent = `
        <!-- Header -->
        <div class="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-5">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold">Hormone Test Receipt</h2>
              <p class="text-sm opacity-90">Receipt ID #${reciptId} • ${formattedDate}</p>
            </div>
            ${statusBadge}
          </div>
        </div>

        <!-- Patient Info -->
        <div class="p-6 border-b">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <p class="text-gray-500">Patient ID</p>
              <p class="font-semibold text-gray-800">${patientId}</p>
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
              <p class="font-semibold text-gray-800">Hormone</p>
            </div>
          </div>
        </div>

        <!-- Tests Section -->
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-800">Test Results</h3>
          <div id="tests-container-${reciptId}" class="space-y-4">
            <div class="text-gray-500 text-sm">Loading report details...</div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <a href="/dashboard/hormone/all/report/${reciptId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
            View Report
          </a>
          <a href="/dashboard/hormone/all/edit/${reciptId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 h-10 px-5 transition shadow-md">
            Edit
          </a>
        </div>
      `;

      details.innerHTML = htmlContent;

      // Fetch and display test details
      const testsContainer = details.querySelector(`#tests-container-${reciptId}`);
      if (testsContainer) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/hormon-all/${reciptId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const invoiceData = data.data;
            const hormoneTests = invoiceData?.hormon_all_info || [];

            if (hormoneTests.length > 0) {
              // Build test results table similar to report format
              let testResultsHTML = `
                <div class="border rounded-xl p-4 hover:shadow-md transition bg-gray-50">
                  <div class="flex justify-between items-center mb-3">
                    <span class="text-sm font-semibold text-gray-700">Receipt ID: ${reciptId}</span>
                    <span class="text-xs px-3 py-1 rounded-full bg-violet-100 text-violet-700 font-medium">
                      Hormone Tests
                    </span>
                  </div>

                  <!-- Test Results Table -->
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b">
                        <th class="px-2 py-2 text-left w-[40%]">Test Name</th>
                        <th class="px-2 py-2 text-left w-[60%]">Test Result</th>
                      </tr>
                    </thead>
                    <tbody>
              `;

              hormoneTests.forEach((test: any) => {
                testResultsHTML += `
                  <tr class="border-b">
                    <td class="px-2 py-2">${test.test_name || "-"}</td>
                    <td class="px-2 py-2 font-medium whitespace-pre-wrap">${test.test_result || "-"}</td>
                  </tr>
                `;
              });

              testResultsHTML += `
                    </tbody>
                  </table>
                </div>
              `;

              testsContainer.innerHTML = testResultsHTML;
            } else {
              testsContainer.innerHTML = `<div class="text-gray-500 text-sm">No tests found</div>`;
            }
          } else {
            testsContainer.innerHTML = `<div class="text-red-500 text-sm">Failed to load report details</div>`;
          }
        } catch (error) {
          testsContainer.innerHTML = `<div class="text-red-500 text-sm">Failed to load report details</div>`;
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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 shadow-lg shadow-violet-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Total Reports</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{hormoneAllReports?.data?.meta?.total || 0}</h3>
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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 p-6 shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 p-6 shadow-lg shadow-violet-600/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Recent Today</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{items.filter((item: ReportsItem) => { const d = item.Date ? new Date(item.Date) : null; if (!d) return false; const today = new Date(); return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate(); }).length}</h3>
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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-violet-500 p-6 shadow-lg shadow-purple-600/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Unique Patients</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{new Set(items.map((item: ReportsItem) => item.PatientId).filter(Boolean)).size}</h3>
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
          <DataTable columns={columns} data={items} meta={meta} onPageChange={setPage} search={search} onSearchChange={setSearch} tableTitle="All Reports (Hormones)" onLimitChange={setLimit} isLoading={isFetching} />
        </div>
      </main>
    </>

  )

}
