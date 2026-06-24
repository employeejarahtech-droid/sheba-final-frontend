import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod'
import { DataTable } from "@/components/DataTable";
import { useEffect } from 'react';
import { getCookie } from '@/lib/cookies';
import { useDateFormat } from '@/hooks/use-date-format';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';
import { FileText, CheckCircle, Clock, AlertCircle, Users } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const hematologySearchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pathology/hematology/all/')({
  validateSearch: (search) => hematologySearchSchema.parse(search),
  component: AllReportsHematology,
})


type ReportsItem = {
  ReciptID: number;
  PatientId: number | null;
  PatientName: string | null;
  Date: string | null;
  Tests: string;
  TestNames: string;
  Status: string;
  RefDoctor?: string | null;
};

function AllReportsHematology() {

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

  const { data: hematologyAllReports, isFetching } = useQuery({
    queryKey: ["hematology-all", page, limit, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/hematology-all?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
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
        ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Completed</span>`
        : `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-yellow-900">Pending</span>`;

      // Build the HTML content
      let htmlContent = `
        <!-- Header -->
        <div class="bg-gradient-to-r from-rose-600 to-red-600 text-white px-6 py-5">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold">Hematology Test Receipt</h2>
              <p class="text-sm opacity-90">Receipt ID #${reciptId} &bull; ${formattedDate}</p>
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
              <p class="font-semibold text-gray-800">Hematology</p>
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
          <a href="/dashboard/pathology/hematology/all/report/${reciptId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
            View Report
          </a>
          <a href="/dashboard/pathology/hematology/all/edit/${reciptId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 h-10 px-5 transition shadow-md">
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
            `${import.meta.env.VITE_API_URL}/api/hematology-all/${reciptId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const invoiceData = data.data;
            const hematologyTests = invoiceData?.hematology_all_info || [];

            if (hematologyTests.length > 0) {
              let testResultsHTML = `
                <div class="border rounded-xl p-4 hover:shadow-md transition bg-gray-50">
                  <div class="flex justify-between items-center mb-3">
                    <span class="text-sm font-semibold text-gray-700">Receipt ID: ${reciptId}</span>
                    <span class="text-xs px-3 py-1 rounded-full bg-rose-100 text-rose-700 font-medium">
                      Hematology Tests
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

              hematologyTests.forEach((test: any) => {
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
  }, [token]);

  const columns = [
    {
      data: "ReciptID",
      title: "Receipt ID",
      orderable: true,
      render: (data: any, _type: string, row: ReportsItem) => {
        const date = fmtDateTime(row.Date);
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                    type="button"
                    data-recipt-id="${data}"
                    data-patient-id="${row.PatientId || "-"}"
                    data-patient-name="${(row.PatientName || "-").replace(/"/g, "&quot;")}"
                    data-date="${date}"
                    data-tests="${(row.Tests || "-").replace(/"/g, "&quot;")}"
                    data-status="${row.Status || "-"}">+</button>
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
    },
    {
      data: "PatientName",
      title: "Patient Name",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return row.PatientName || '-';
      },
      defaultContent: "",
    },
    {
      data: "Date",
      title: "Date",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return fmtDateTime(row.Date);
      },
      defaultContent: "",
    },
    {
      data: "RefDoctor",
      title: "Ref. Doctor",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => row.RefDoctor || '-',
      defaultContent: "",
    },
    {
      data: "TestNames",
      title: "Tests",
      orderable: false,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const testNames = row.TestNames || row.Tests || '';
        if (!testNames) return '-';

        const names = testNames.split(',').filter((name: string) => name.trim() !== '');
        return names.map((name: string) =>
          `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1">${name.trim()}</span>`
        ).join('');
      },
      defaultContent: "",
    },
    {
      data: "Status",
      title: "Status",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const status = row.Status || 'Pending';
        const color = status === 'Completed' ? 'bg-green-500' : 'bg-yellow-500';
        return `<span class="${color} text-white inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">${status}</span>`;
      },
      defaultContent: "",
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const id = row.ReciptID;
        return `
          <div class="flex items-center justify-center gap-1.5 whitespace-nowrap">
            <a href="/dashboard/pathology/hematology/all/edit/${id}" title="Edit report"
               class="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 text-xs font-medium h-8 px-2.5 transition">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
              Edit
            </a>
            <a href="/dashboard/pathology/hematology/all/report/${id}" target="_blank" rel="noopener noreferrer" title="Print / view report"
               class="inline-flex items-center gap-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium h-8 px-2.5 transition">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V2h12v7"/><path d="M6 14h12v8H6z"/></svg>
              Print
            </a>
          </div>
        `;
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
            {[
              {
                label: "Total Reports",
                value: hematologyAllReports?.data?.meta?.total || 0,
                icon: FileText,
                grad: "from-blue-500 to-indigo-500",
                sub: "All time records"
              },
              {
                label: "Completed",
                value: hematologyAllReports?.data?.items?.filter((i: any) => i.Status === "Completed").length || 0,
                icon: CheckCircle,
                grad: "from-emerald-500 to-teal-500",
                sub: "Status Done"
              },
              {
                label: "Pending",
                value: hematologyAllReports?.data?.items?.filter((i: any) => !i.Status || i.Status === "Pending").length || 0,
                icon: Clock,
                grad: "from-amber-500 to-orange-500",
                sub: "Status Awaiting"
              },
              {
                label: "Patients",
                value: new Set(hematologyAllReports?.data?.items?.map((i: any) => i.PatientId)).size || 0,
                icon: Users,
                grad: "from-purple-500 to-pink-500",
                sub: "Unique patients"
              }
            ].map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("p-2 bg-gradient-to-br rounded-lg shadow-lg", card.grad)}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-gray-500 dark:text-gray-400">{card.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="text-2xl font-bold">
                      {card.value.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <DataTable
            tableTitle="All Reports (Hematology)"
            columns={columns}
            data={hematologyAllReports?.data?.items || []}
            meta={hematologyAllReports?.data?.meta}
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
