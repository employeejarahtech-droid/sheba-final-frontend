import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod'
import { DataTable } from "@/components/DataTable";
import { useMemo, useEffect } from 'react';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';
import { FileText, Clock, Users, ScanLine } from 'lucide-react';

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute(
  '/_authenticated/ultrasonogram/all/',
)({
  validateSearch: (search) => searchSchema.parse(search),
  component: AllUltrasonogramReports,
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

function AllUltrasonogramReports() {
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

  const { data: ultrasonogramAllReports, isFetching } = useQuery({
    queryKey: ["ultrasonogram-all", page, limit, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ultrasonogram-all?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
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

  const columns = useMemo(() => [
    {
      data: "ReciptID",
      title: "Receipt ID",
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
                    data-patient-id="${row.PatientId || '-'}"
                    data-patient-name="${(row.PatientName || '-').replace(/"/g, '&quot;')}"
                    data-date="${date}"
                    data-tests="${(row.Tests || '-').replace(/"/g, '&quot;')}"
                    data-status="${status}">+</button>
            <span>${data}</span>
          </div>
        `;
      },
      defaultContent: "",
    },
    {
      data: "PatientId",
      title: "Patient ID",
      orderable: true,
      defaultContent: "",
      render: (data: any) => data || '-',
    },
    {
      data: "PatientName",
      title: "Patient Name",
      orderable: true,
      defaultContent: "",
      render: (data: any) => data || '-',
    },
    {
      data: "Date",
      title: "Date",
      orderable: true,
      defaultContent: "",
      render: (data: any) => data ? new Date(data).toLocaleDateString() : '-',
    },
    {
      data: "TestNames",
      title: "Tests",
      orderable: false,
      defaultContent: "",
      render: (data: any, _type: string, row: ReportsItem) => {
        const testNames = data || row.Tests || '';
        if (!testNames) return '-';
        const names = testNames.split(',').filter((name: string) => name.trim() !== '');
        return names.map((name: string) =>
          `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1">${name.trim()}</span>`
        ).join('');
      },
    },
    {
      data: "Status",
      title: "Status",
      orderable: true,
      defaultContent: "",
      render: (data: any) => {
        const statusColor = data === 'Completed' ? 'text-green-600' : 'text-yellow-600';
        return `<span class="${statusColor}">${data}</span>`;
      },
    },
  ], []);

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

      // Fetch individual Ultrasonogram test details from API
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/ultrasonogram-all/${reciptId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error('Failed to fetch Ultrasonogram details');

        const data = await res.json();
        const ultrasonogramTests = data.data?.ultrasonogram_all_info || [];

        // Create test cards HTML
        const testCards = ultrasonogramTests.map((test: any) => `
          <div class="border rounded-xl p-4 hover:shadow-md transition bg-gray-50">
            <div class="flex justify-between items-start mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-sm font-semibold text-gray-700">Test ID: ${test.test_id || '-'}</span>
                  <span class="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">Pending</span>
                </div>
                <div class="text-sm">
                  <p class="text-gray-500">Test Name</p>
                  <p class="font-medium text-gray-800">${test.test_name || '-'}</p>
                </div>
              </div>
            </div>
            <div class="text-sm mb-3">
              <p class="text-gray-500">Test Result</p>
              <p class="font-medium text-gray-800 whitespace-pre-wrap">${test.test_result || 'Pending...'}</p>
            </div>
            <div class="flex gap-2 pt-3 border-t">
              <a href="/ultrasonogram/all/edit/builder/${test.serial_id || test.id}" class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 h-8 px-4 transition shadow-sm">
                Edit
              </a>
              <a href="/ultrasonogram/all/print/${test.serial_id || test.id}" class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-8 px-4 transition shadow-sm">
                Print
              </a>
            </div>
          </div>
        `).join('');

        // Extract data for display
        const invoiceInfo = data.data?.invoice_information || {};
        const patientId = btn.dataset.patientId || '-';
        const patientName = invoiceInfo.patient_name || btn.dataset.patientName || '-';
        const formattedDate = invoiceInfo.invoice_date ? new Date(invoiceInfo.invoice_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : btn.dataset.date || '-';
        const status = btn.dataset.status || 'Pending';
        const statusBadge = status === 'Completed'
          ? '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Completed</span>'
          : '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-yellow-900">Pending</span>';

        // Create card-style details HTML
        const details = document.createElement('div');
        details.className = 'max-w-4xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden';

        // Build the HTML content
        let htmlContent = `
          <!-- Header -->
          <div class="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-5">
            <div class="flex justify-between items-center">
              <div>
                <h2 class="text-xl font-semibold">Ultrasonogram Examination Report</h2>
                <p class="text-sm opacity-90">Receipt ID #${reciptId} • ${formattedDate}</p>
              </div>
              ${statusBadge}
            </div>
          </div>

          <!-- Patient Info -->
          <div class="p-6 border-b">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div>
                <p class="text-gray-500">Receipt ID</p>
                <p class="font-semibold text-gray-800">${reciptId}</p>
              </div>
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
            </div>
          </div>

          <!-- Tests Section -->
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-4 text-gray-800">Ultrasonogram Examinations</h3>
            <div class="space-y-4">
              ${testCards || '<div class="text-gray-500 text-sm">No Ultrasonogram tests found</div>'}
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <a href="/ultrasonogram/all/edit/${reciptId}"
               class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 h-10 px-5 transition shadow-md">
              Edit All
            </a>
          </div>
        `;

        details.innerHTML = htmlContent;

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
      } catch (error) {
        // silently handle error
      }
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
                  <h3 className="mt-2 text-2xl font-bold text-white">{ultrasonogramAllReports?.data?.meta?.total || 0}</h3>
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

            {/* Ultrasonogram Tests */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-400 p-6 shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Ultrasonogram</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{ultrasonogramAllReports?.data?.items?.length || 0}</h3>
                </div>
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  <ScanLine className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="relative flex justify-between text-white/90 text-sm">
                <span>Current</span>
                <span className="font-semibold">Page</span>
              </div>
            </div>

            {/* Recent */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-400 p-6 shadow-lg shadow-teal-400/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Recent</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">
                    {ultrasonogramAllReports?.data?.items?.filter((i: any) => {
                      if (!i.Date) return false;
                      const d = new Date(i.Date);
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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-400 p-6 shadow-lg shadow-cyan-400/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Patients</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{new Set(ultrasonogramAllReports?.data?.items?.map((i: any) => i.PatientName)).size || 0}</h3>
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
            tableTitle="All Reports (Ultrasonogram)"
            columns={columns}
            data={ultrasonogramAllReports?.data?.items || []}
            meta={{ page, limit, total: ultrasonogramAllReports?.data?.meta?.total || 0 }}
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
