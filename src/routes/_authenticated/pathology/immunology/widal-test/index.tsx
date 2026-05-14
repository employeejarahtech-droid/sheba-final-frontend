import { createFileRoute } from '@tanstack/react-router';
import { DataTable } from "@/components/DataTable";
import { Main } from "@/components/layout/main";
import { useState, useEffect } from 'react';
import { WidalTestForm } from '@/features/pathology/immunology/EditWidalTestForm';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';

export const Route = createFileRoute(
  '/_authenticated/pathology/immunology/widal-test/',
)({
  component: WidalTest,
})


type ReportsItem = {
  id: number;
  invoice_id: number;
  patient_name: string;
  created_at: string;
  status: string;
};

function WidalTest() {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [reportId, setReportId] = useState<number>(0);
  const [invoiceId, setInvoiceId] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const token = getCookie('accessToken');

  const { data } = useQuery({
    queryKey: ["widal", page, search],

    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/widal?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch blood for tcdc reports");
      return res.json(); // MUST match placeholderData
    },

    enabled: !!token,

    // ⭐ Perfect smooth pagination
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


  //console.log(data?.data);

  // Expose edit function to window
  useEffect(() => {
    (window as any).editWidalTest = (id: number, invoiceId: number) => {
      setReportId(id);
      setInvoiceId(invoiceId);
      setIsDrawerOpen(true);
    };
  }, [setReportId, setInvoiceId]);

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
        ? '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Passed</span>'
        : status === 'failed'
          ? '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Failed</span>'
          : '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Pending</span>';

      // Build the HTML content
      let htmlContent = `
        <!-- Header -->
        <div class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-5">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold">Widal Test Report</h2>
              <p class="text-sm opacity-90">Invoice #${invoiceId} • ${formattedDate}</p>
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
              <p class="font-semibold text-gray-800">Immunology</p>
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
          <a href="/pathology/immunology/widal-test/report/${reportId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
            View Report
          </a>
          <button onclick="window.editWidalTest(${reportId}, ${invoiceId})"
                  class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 h-10 px-5 transition shadow-md">
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
            `${import.meta.env.VITE_API_URL}/api/widal/${reportId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const reportData = data.data;

            // Build test results HTML with 5 Salmonella antigen tests
            let testResultsHTML = `
              <div class="border rounded-xl p-4 hover:shadow-md transition bg-gray-50">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-sm font-semibold text-gray-700">Report ID: ${reportId}</span>
                  <span class="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                    Widal Test
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
                      <td class="px-2 py-2">Salmonella Typhi O</td>
                      <td class="px-2 py-2 font-medium">${reportData.s_typhi_o || 'N/A'}</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">&lt;1:80</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Salmonella Typhi H</td>
                      <td class="px-2 py-2 font-medium">${reportData.s_typhi_h || 'N/A'}</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">&lt;1:80</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Salmonella Paratyphi A</td>
                      <td class="px-2 py-2 font-medium">${reportData.s_paratyphi_a || 'N/A'}</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">&lt;1:80</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Salmonella Paratyphi B</td>
                      <td class="px-2 py-2 font-medium">${reportData.s_paratyphi_b || 'N/A'}</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">&lt;1:80</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Salmonella Paratyphi C</td>
                      <td class="px-2 py-2 font-medium">${reportData.s_paratyphi_c || 'N/A'}</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">&lt;1:80</td>
                    </tr>
                  </tbody>
                </table>

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
        const status = row.status || 'Pending';
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                    type="button"
                    data-invoice-id="${data}"
                    data-patient-name="${(row.patient_name || '-').replace(/"/g, '&quot;')}"
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
      data: "created_at",
      title: "Date",
      orderable: true,
      responsivePriority: 2,
      defaultContent: "",
      render: (_data: any, _type: string, row: ReportsItem) => {
        const iso = row.created_at;
        const date = new Date(iso);

        const formatted = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return `<div>${formatted}</div>`; // Example: Nov 23, 2025
      },
    },

    {
      data: "status",
      title: "Status",
      orderable: true,
      responsivePriority: 3,
      defaultContent: "",
      render: (_data: any, _type: string, row: ReportsItem) => {
        const status = row.status || 'Pending';
        const color =
          status === "passed"
            ? "bg-green-500"
            : status === "failed"
              ? "bg-red-500"
              : "bg-yellow-500";

        return `<span class="${color} text-white inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">${status}</span>`;
      },
    },

  ];

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="mb-4">
          <h1 className='text-2xl font-bold tracking-tight'>Widal Test</h1>
        </div>
        <DataTable columns={columns} data={data?.data?.items || []} meta={data?.data?.meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
        <WidalTestForm open={isDrawerOpen} setOpen={setIsDrawerOpen} reportId={reportId} invoiceId={invoiceId} />
      </Main>
    </>

  )
}
