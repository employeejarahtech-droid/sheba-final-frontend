import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod'
import { DataTable } from "@/components/DataTable";
import { Main } from "@/components/layout/main";
import { Activity, Clock, FileText, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { EditLipidProfileForm } from '@/features/pathology/biochemical/lipid-profile/components/EditLipidProfileForm';
import { getCookie } from '@/lib/cookies';
import { useDateFormat } from '@/hooks/use-date-format';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';

const lipidProfileSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/biochemical/lipid-profile/',
)({
  validateSearch: (search) => lipidProfileSearchSchema.parse(search),
  component: LipidProfile,
})

type LipidProfileItem = {
  id: number;
  invoice_id: string;
  patient_name: string;
  created_at: string;
  status: string;
  ref_doctor?: string | null;
};

function LipidProfile() {
  const [open, setOpen] = useState<boolean>(false);
  const [reportId, setReportId] = useState<number>(1);
  const [invoiceId, setInvoiceId] = useState<number>(1);

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
    queryKey: ["lipid-profile", page, limit, search],

    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/lipid-profile?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch lipid profiles");
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


  // Expose edit function to window for onclick handlers
  useEffect(() => {
    (window as any).editLipidProfile = (id: number, invoiceId: number) => {
      setOpen(true);
      setReportId(id);
      setInvoiceId(invoiceId);
    };
  }, [setOpen, setReportId, setInvoiceId]);

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
        ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Passed</span>`
        : status === 'failed'
          ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Failed</span>`
          : `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-yellow-900">Pending</span>`;

      // Build the HTML content
      let htmlContent = `
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-5">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold">Lipid Profile Report</h2>
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
              <p class="font-semibold text-gray-800">Biochemical</p>
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
          <a href="/dashboard/biochemical/lipid-profile/report/${reportId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
            View Report
          </a>
          <button onclick="window.editLipidProfile(${reportId}, ${invoiceId})"
                  class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 h-10 px-5 transition shadow-md">
            Edit
          </button>
        </div>
      `;

      details.innerHTML = htmlContent;

      // Fetch report details
      const resultsContainer = details.querySelector(`#report-results-${reportId}`);
      if (resultsContainer) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/lipid-profile/${reportId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const reportData = data.data;

            // Build test results HTML with Lipid Profile results
            let testResultsHTML = `
              <div class="border rounded-xl p-4 hover:shadow-md transition bg-gray-50">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-sm font-semibold text-gray-700">Report ID: ${reportId}</span>
                  <span class="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                    Lipid Profile
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
                      <td class="px-2 py-2">Total Cholesterol</td>
                      <td class="px-2 py-2 font-medium">${reportData.total_cholesterol || "-"} mg/dL</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">&lt;200 mg/dL</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">HDL Cholesterol</td>
                      <td class="px-2 py-2 font-medium">${reportData.hdl || "-"} mg/dL</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">&gt;40 mg/dL (M), &gt;50 mg/dL (F)</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">LDL Cholesterol</td>
                      <td class="px-2 py-2 font-medium">${reportData.ldl || "-"} mg/dL</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">&lt;100 mg/dL</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">VLDL Cholesterol</td>
                      <td class="px-2 py-2 font-medium">${reportData.vldl || "-"} mg/dL</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">5-40 mg/dL</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Triglycerides</td>
                      <td class="px-2 py-2 font-medium">${reportData.triglycerides || "-"} mg/dL</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">&lt;150 mg/dL</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Cholesterol Ratio</td>
                      <td class="px-2 py-2 font-medium">${reportData.cholesterol_ratio || "-"}</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">&lt;5.0</td>
                    </tr>
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
      render: (data: any, _type: string, row: LipidProfileItem) => {
        const date = fmtDateTime(row.created_at);
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                    type="button"
                    data-invoice-id="${data}"
                    data-patient-name="${(row.patient_name || "-").replace(/"/g, "&quot;")}"
                    data-date="${date}"
                    data-status="${row.status || "Pending"}"
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
      orderable: true,
      defaultContent: "",
      render: (_data: any, _type: string, row: LipidProfileItem) => {
        return row.ref_doctor ? `<span class="text-sm text-gray-700 dark:text-gray-300">${row.ref_doctor}</span>` : `<span class="text-sm text-gray-400">-</span>`;
      },
    },

    {
      data: "created_at",
      title: "Date",
      orderable: true,
      responsivePriority: 3,
      render: (_data: any, _type: string, row: LipidProfileItem) => {
        return `<div>${fmtDateTime(row.created_at)}</div>`;
      },
      defaultContent: "",
    },

    {
      data: "status",
      title: "Status",
      orderable: true,
      responsivePriority: 3,
      render: (_data: any, _type: string, row: LipidProfileItem) => {
        const status = row.status;
        const color =
          status === "passed"
            ? "bg-green-500"
            : status === "failed"
              ? "bg-red-500"
              : "bg-yellow-500";

        return `<span class="${color} text-white inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">${status || `Pending`}</span>`;
      },
      defaultContent: "",
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_data: any, _type: string, row: LipidProfileItem) => {
        return `
          <div class="flex items-center justify-center gap-1.5 whitespace-nowrap">
            <button type="button" onclick="window.editLipidProfile(${row.id}, ${row.invoice_id})" title="Edit"
              class="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 text-xs font-medium h-8 px-2.5 transition">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
              Edit
            </button>
            <a href="/dashboard/pathology/biochemical/lipid-profile/report/${row.id}" target="_blank" rel="noopener noreferrer" title="Print / view report"
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
      <Main fluid>
        <div className="mb-4">
          <h1 className='text-2xl font-bold tracking-tight'>Lipid Profile</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[
            {
              label: "Total Reports",
              value: data?.data?.meta?.total || 0,
              icon: FileText,
              grad: "from-blue-500 to-indigo-500",
              sub: "All time records"
            },
            {
              label: "Completed",
              value: data?.data?.items?.filter((i: any) => i.status === "passed").length || 0,
              icon: Activity,
              grad: "from-emerald-500 to-teal-500",
              sub: "Status: Passed"
            },
            {
              label: "Pending",
              value: data?.data?.items?.filter((i: any) => !i.status || i.status === "pending").length || 0,
              icon: Clock,
              grad: "from-amber-500 to-orange-500",
              sub: "Status: Awaiting"
            },
            {
              label: "Failed",
              value: data?.data?.items?.filter((i: any) => i.status === "failed").length || 0,
              icon: AlertCircle,
              grad: "from-rose-500 to-red-500",
              sub: "Status: Attention"
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
          tableTitle="Lipid Profile"
          columns={columns}
          data={data?.data?.items || []}
          meta={data?.data?.meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
          search={search}
          onSearchChange={setSearch}
          isLoading={isFetching}
        />
        <EditLipidProfileForm open={open} setOpen={setOpen} reportId={reportId} invoiceId={invoiceId} />
      </Main>
    </>

  )
}
