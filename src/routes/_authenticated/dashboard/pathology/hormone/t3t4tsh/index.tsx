import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { ThyroidFunctionTestForm } from '@/features/pathology/special/EditT3T4TshForm';
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
  '/_authenticated/dashboard/pathology/hormone/t3t4tsh/',
)({
  component: T3T4TSH,
  validateSearch: (search) => searchSchema.parse(search),
})


type ReportsItem = {
  id: number;
  invoice_id: number;
  patient_name: string | null;
  created_at: string | null;
  ref_doctor?: string | null;
  status?: string | null;
};

function T3T4TSH() {
  const [reportId, setReportId] = useState<number>(0);
  const [invoiceId, setInvoiceId] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);

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

  const { data: t3t4tshReports, isFetching } = useQuery({
    queryKey: ["t3t4tsh", page, limit, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/t3t4tsh?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch t3t4tsh reports");
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

  // Expose edit function to window for onclick handler
  if (typeof window !== 'undefined') {
    (window as any).editT3T4TSH = (id: number, invId: number) => {
      setOpen(true);
      setReportId(id);
      setInvoiceId(invId);
    };
  }

  const items = t3t4tshReports?.data?.items || [];
  const meta = t3t4tshReports?.data?.meta || { page, limit, total: 0 };

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
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
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
        const date = row.created_at;
        return date ? fmtDateTime(date) : '-';
      },
      defaultContent: '',
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
      title: 'Actions',
      orderable: false,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return `
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="window.editT3T4TSH(${row.id}, ${row.invoice_id})" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              Edit
            </button>
            <a href="/dashboard/pathology/hormone/t3t4tsh/report/${row.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-semibold shadow transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
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
        btn.style.backgroundColor = '#10B981';
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
        <div class="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-5">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold">Thyroid Function Test Report</h2>
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
          <a href="/dashboard/pathology/hormone/t3t4tsh/report/${id}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
            View Report
          </a>
          <button onclick="window.editT3T4TSH(${id}, ${invoiceId})"
                  class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-5 transition shadow-md">
            Edit
          </button>
        </div>
      `;

      details.innerHTML = htmlContent;

      // Fetch report details
      const resultsContainer = details.querySelector(`#report-results-${id}`);
      if (resultsContainer) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/t3t4tsh/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const reportData = data.data;

            // Build test results HTML with T3T4TSH results
            let testResultsHTML = `
              <div class="border rounded-xl p-4 hover:shadow-md transition bg-gray-50">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-sm font-semibold text-gray-700">Report ID: ${id}</span>
                  <span class="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                    Thyroid Function Test
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
                      <td class="px-2 py-2">T3 (Triiodothyronine)</td>
                      <td class="px-2 py-2 font-medium">${reportData.t3 || "-"} ng/dL</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">0.6-1.8 ng/dL</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">T4 (Thyroxine)</td>
                      <td class="px-2 py-2 font-medium">${reportData.t4 || "-"} µg/dL</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">4.5-12.5 µg/dL</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">TSH (Thyroid Stimulating Hormone)</td>
                      <td class="px-2 py-2 font-medium">${reportData.tsh || "-"} µIU/mL</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">0.4-4.2 µIU/mL</td>
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

  // Stats cards (same design as List of Tests)
  const todayCount = items.filter((i: any) => {
    if (!i.created_at) return false;
    const d = new Date(i.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const uniquePatients = new Set(items.map((i: any) => i.patient_name).filter(Boolean)).size;

  const stats = [
    { label: "Total Reports", value: t3t4tshReports?.data?.meta?.total || 0, icon: FileText, grad: "from-blue-500 to-cyan-500" },
    { label: "Current Page", value: items.length, icon: FlaskConical, grad: "from-cyan-500 to-blue-500" },
    { label: "Recent Today", value: todayCount, icon: Clock, grad: "from-sky-500 to-blue-500" },
    { label: "Unique Patients", value: uniquePatients, icon: Users, grad: "from-indigo-500 to-purple-500" },
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
          <DataTable columns={columns} data={items} meta={meta} onPageChange={setPage} search={search} onSearchChange={setSearch} tableTitle="T3 T4 TSH" onLimitChange={setLimit} isLoading={isFetching} />
          <ThyroidFunctionTestForm open={open} setOpen={setOpen} reportId={reportId} invoiceId={invoiceId} />
        </div>
      </main>
    </>
  )
}
