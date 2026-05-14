import { createFileRoute } from '@tanstack/react-router';
import { DataTable } from "@/components/DataTable";
import { Main } from "@/components/layout/main";
import { useEffect, useState } from 'react';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';

export const Route = createFileRoute(
  '/_authenticated/pathology/stool/stool-re/',
)({
  component: StoolRe,
})

type ReportItem = {
  id: number;
  invoice_id: number;
  patient_name: string;
  test_result: string | null;
  remarks: string | null;
  test_carried_out_by: string | null;
  created_at: string;
  status: string;
};

function StoolRe() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  const token = getCookie('accessToken');

  const { data } = useQuery({
    queryKey: ["stool-re", page, search],

    queryFn: async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/stool-re?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          console.error('API Response:', res.status, res.statusText);
          return {
            data: {
              items: [],
              meta: {
                page,
                limit,
                total: 0,
              },
            },
          };
        }
        const jsonData = await res.json();
        console.log('Stool R/E API response:', jsonData);
        return jsonData;
      } catch (err) {
        console.error('Error fetching Stool R/E reports:', err);
        return {
          data: {
            items: [],
            meta: {
              page,
              limit,
              total: 0,
            },
          },
        };
      }
    },

    enabled: !!token,
    retry: 0,

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

  // Use only API data (no fallback)
  const items = data?.data?.items || [];
  const meta = data?.data?.meta || { page, limit, total: 0 };

  // Define columns for jQuery DataTable format
  const columns = [
    {
      data: 'invoice_id',
      title: 'Invoice ID',
      className: 'font-mono text-sm',
      render: (data: any, _type: string, row: ReportItem) => {
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
                    data-test-result="${(row.test_result || '-').replace(/"/g, '&quot;')}"
                    data-test-carried-out-by="${(row.test_carried_out_by || '-').replace(/"/g, '&quot;')}"
                    data-status="${status}"
                    data-report-id="${row.id}">+</button>
            <span>${data}</span>
          </div>
        `;
      },
    },
    {
      data: 'patient_name',
      title: 'Patient Name',
      className: 'font-medium',
    },
    {
      data: 'test_result',
      title: 'Test Result',
      render: (data: any) => {
        const value = data as string;
        return `<div class="text-sm">${value || '-'}</div>`;
      },
    },
    {
      data: 'created_at',
      title: 'Date',
      render: (data: any) => {
        const iso = data as string;
        const date = new Date(iso);
        const formatted = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        return `<div class="text-sm">${formatted}</div>`;
      },
    },
    {
      data: 'test_carried_out_by',
      title: 'Test Carried Out By',
      render: (data: any) => {
        const value = data as string;
        return `<div class="text-sm">${value || '-'}</div>`;
      },
    },
    {
      data: 'status',
      title: 'Status',
      render: (data: any) => {
        const status = data as string;
        const color =
          status === "passed"
            ? "bg-green-500"
            : status === "failed"
              ? "bg-red-500"
              : "bg-yellow-500";

        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} text-white border-transparent">${status || 'Pending'}</span>`;
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
        btn.style.backgroundColor = 'black';
        return;
      }

      // Don't expand if already expanded
      if (isExpanded) return;

      // Get data from attributes
      const invoiceId = btn.dataset.invoiceId || '';
      const patientName = btn.dataset.patientName || '-';
      const date = btn.dataset.date || '-';
      const testResult = btn.dataset.testResult || '-';
      const testCarriedOutBy = btn.dataset.testCarriedOutBy || '-';
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
        <div class="bg-gradient-to-r from-stone-600 to-amber-700 text-white px-6 py-5">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold">Stool R/E Report</h2>
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
              <p class="font-semibold text-gray-800">Stool Analysis</p>
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
          <a href="/pathology/stool/stool-re/report/${reportId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
            View Report
          </a>
          <a href="/pathology/stool/stool-re/edit/${reportId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-stone-600 text-white hover:bg-stone-700 h-10 px-5 transition shadow-md">
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
            `${import.meta.env.VITE_API_URL}/api/stool-re/${reportId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const reportData = data.data;

            // Build test results HTML with all Stool R/E sections
            let testResultsHTML = `
              <div class="border rounded-xl p-4 hover:shadow-md transition bg-gray-50">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-sm font-semibold text-gray-700">Report ID: ${reportId}</span>
                  <span class="text-xs px-3 py-1 rounded-full bg-stone-100 text-stone-700 font-medium">
                    Stool R/E
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <!-- Physical Examination -->
                  <div>
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">PHYSICAL EXAMINATION</h4>
                    <table class="w-full">
                      <tbody>
                        <tr class="border-b"><td class="px-2 py-1">Color</td><td class="px-2 py-1 font-medium">${reportData.color || reportData.colour || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Consistency</td><td class="px-2 py-1 font-medium">${reportData.consistency || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Mucous</td><td class="px-2 py-1 font-medium">${reportData.mucous || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Blood</td><td class="px-2 py-1 font-medium">${reportData.blood || reportData.occult_blood || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Helminths</td><td class="px-2 py-1 font-medium">${reportData.helminths || '-'}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Chemical Examination -->
                  <div>
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">CHEMICAL EXAMINATION</h4>
                    <table class="w-full">
                      <tbody>
                        <tr class="border-b"><td class="px-2 py-1">Reaction</td><td class="px-2 py-1 font-medium">${reportData.reaction || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Reducing Substance</td><td class="px-2 py-1 font-medium">${reportData.reducingSubstance || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Occult Blood</td><td class="px-2 py-1 font-medium">${reportData.occultBlood || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Bile Pigments</td><td class="px-2 py-1 font-medium">${reportData.bilePigments || '-'}</td></tr>
                        <tr class="border-b"><td class="px-2 py-1">Bile Salts</td><td class="px-2 py-1 font-medium">${reportData.bileSalts || '-'}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Microscopic Examination (Full Width) -->
                  <div class="md:col-span-2">
                    <h4 class="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">MICROSCOPIC EXAMINATION</h4>
                    <div class="grid grid-cols-2 gap-2">
                      <table class="w-full">
                        <tbody>
                          <tr class="border-b"><td class="px-2 py-1">Ova of</td><td class="px-2 py-1 font-medium">${reportData.ovaOf || '-'}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">Cysts of</td><td class="px-2 py-1 font-medium">${reportData.cystsOf || '-'}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">Larva of</td><td class="px-2 py-1 font-medium">${reportData.larvaOf || '-'}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">Trophozoite of</td><td class="px-2 py-1 font-medium">${reportData.trophozoiteOf || '-'}</td></tr>
                        </tbody>
                      </table>
                      <table class="w-full">
                        <tbody>
                          <tr class="border-b"><td class="px-2 py-1">Pus Cells</td><td class="px-2 py-1 font-medium">${reportData.pusCells || reportData.pus_cells || '-'}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">Epithelial Cells</td><td class="px-2 py-1 font-medium">${reportData.epithelialCells || reportData.epithelium || '-'}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">RBC</td><td class="px-2 py-1 font-medium">${reportData.rbc || '-'}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">Macrophage</td><td class="px-2 py-1 font-medium">${reportData.macrophage || '-'}</td></tr>
                        </tbody>
                      </table>
                      <table class="w-full">
                        <tbody>
                          <tr class="border-b"><td class="px-2 py-1">Vegetable Cells</td><td class="px-2 py-1 font-medium">${reportData.vegetableCells || '-'}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">Undigested Food</td><td class="px-2 py-1 font-medium">${reportData.undigestedFood || '-'}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">Fat Globules</td><td class="px-2 py-1 font-medium">${reportData.fatGlobules || '-'}</td></tr>
                          <tr class="border-b"><td class="px-2 py-1">Others</td><td class="px-2 py-1 font-medium">${reportData.others || '-'}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                ${reportData.remarks || reportData.comments ? `
                  <div class="mt-4 pt-4 border-t text-sm">
                    <span class="text-gray-500">Remarks:</span>
                    <span class="font-medium text-gray-800 ml-2">${reportData.remarks || reportData.comments}</span>
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
      <Main>
        <div className="mb-4">
          <h1 className='text-2xl font-bold tracking-tight'>Stool R/E</h1>
        </div>
        <DataTable columns={columns} data={items} meta={meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
      </Main>
    </>

  )
}
