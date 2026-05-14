import { createFileRoute } from '@tanstack/react-router';
import { DataTable } from "@/components/DataTable";
import { Main } from "@/components/layout/main";
import { useState, useEffect, useMemo } from 'react';
import { EditBloodGroupForm } from '@/features/pathology/immunology/EditBloodGroupForm';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { bloodGroupReports } from '@/data/data';
import { AppHeader } from '@/components/layout/app-header';

export const Route = createFileRoute(
  '/_authenticated/pathology/immunology/blood-group/',
)({
  component: BloodGroup,
})


type ReportItem = {
  id: number;
  invoice_id: number;
  patientName: string;
  patient_name: string;
  tests: string[];
  date: string;
  created_at: string;
  status?: string;
  test_carried_out_by?: string;
};

function BloodGroup() {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [reportId, setReportId] = useState<number>(0);
  const [invoiceId, setInvoiceId] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const token = getCookie('accessToken');

  const { data } = useQuery({
    queryKey: ["blood-group", page, search],

    queryFn: async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/blood-group?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          console.error('API Response:', res.status, res.statusText);
          // Return empty structure instead of throwing
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
        console.log('Blood group API response:', jsonData);
        return jsonData;
      } catch (err) {
        console.error('Error fetching blood group reports:', err);
        // Return empty structure instead of throwing
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
    retry: 0, // Don't retry on failure, use fallback immediately

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

  // Fallback to static data if API fails
  const items = useMemo(() => {
    if (data?.data?.items && data.data.items.length > 0) {
      return data.data.items;
    }
    // Use static data as fallback
    return bloodGroupReports;
  }, [data]);

  const meta = useMemo(() => {
    if (data?.data?.meta) {
      return data.data.meta;
    }
    // Use static data meta
    return {
      page,
      limit,
      total: bloodGroupReports.length,
    };
  }, [data, page, limit]);


  //console.log(data?.data);

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
        const rowData = JSON.stringify(row).replace(/"/g, '&quot;');
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                    type="button"
                    data-invoice-id="${data}"
                    data-patient-name="${(row.patient_name || '-').replace(/"/g, '&quot;')}"
                    data-date="${date}"
                    data-test-carried-out-by="${(row.test_carried_out_by || '-').replace(/"/g, '&quot;')}"
                    data-status="${status}"
                    data-report-id="${row.id}"
                    data-row-data='${rowData}'>+</button>
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

  // Set up edit button handlers
  useEffect(() => {
    const handleEditClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const button = target.closest('.edit-blood-group-btn');
      if (button) {
        const rowData = (button as HTMLElement).getAttribute('data-row');
        if (rowData) {
          const item: ReportItem = JSON.parse(rowData);
          setIsDrawerOpen(true);
          setReportId(Number(item.id));
          setInvoiceId(Number(item.invoice_id));
        }
      }
    };

    document.addEventListener('click', handleEditClick);

    return () => {
      document.removeEventListener('click', handleEditClick);
    };
  }, []);

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
        <div class="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-5">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold">Blood Group Report</h2>
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
          <a href="/pathology/immunology/blood-group/report/${reportId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
            View Report
          </a>
          <button class="edit-blood-group-btn inline-flex items-center justify-center rounded-lg text-sm font-medium bg-pink-600 text-white hover:bg-pink-700 h-10 px-5 transition shadow-md" data-row='${btn.dataset.rowData}'>
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
            `${import.meta.env.VITE_API_URL}/api/blood-group/${reportId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const reportData = data.data;

            // Calculate full blood group
            const fullBloodGroup = (reportData.blood_group && reportData.rh_factor)
              ? `${reportData.blood_group} ${reportData.rh_factor}`
              : 'Pending';

            // Build test results HTML with Blood Group and Rh Factor
            let testResultsHTML = `
              <div class="border rounded-xl p-4 hover:shadow-md transition bg-gray-50">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-sm font-semibold text-gray-700">Report ID: ${reportId}</span>
                  <span class="text-xs px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-medium">
                    Blood Group
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
                      <td class="px-2 py-2">Blood Group (ABO)</td>
                      <td class="px-2 py-2 font-medium">${reportData.blood_group || 'Pending'}</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">A, B, AB, O</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-2 py-2">Rh Factor</td>
                      <td class="px-2 py-2 font-medium">${reportData.rh_factor || 'Pending'}</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">Positive, Negative</td>
                    </tr>
                    <tr class="border-b bg-pink-50">
                      <td class="px-2 py-2 font-semibold">Final Blood Group</td>
                      <td class="px-2 py-2 font-semibold">${fullBloodGroup}</td>
                      <td class="px-2 py-2 text-gray-600 text-xs">--</td>
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
      cell.colSpan = 9;
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
          <h1 className='text-2xl font-bold tracking-tight'>Blood Group</h1>
        </div>
        <DataTable columns={columns} data={items} meta={meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
        <EditBloodGroupForm open={isDrawerOpen} setOpen={setIsDrawerOpen} reportId={reportId} invoiceId={invoiceId} />
      </Main>
    </>

  )
}


