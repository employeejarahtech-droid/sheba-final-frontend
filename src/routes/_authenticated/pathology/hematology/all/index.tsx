import { createFileRoute } from '@tanstack/react-router';
import { ConfigDrawer } from "@/components/config-drawer";
import { DataTable } from "@/components/DataTable";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { useState, useEffect } from 'react';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { topNav } from '@/data/data';

export const Route = createFileRoute('/_authenticated/pathology/hematology/all/')({
  component: AllReportsHematology,
})


type ReportsItem = {
  ReciptID: number;
  PatientId: number | null;
  PatientName: string | null;
  Date: string | null;
  Tests: string;
  Status: string;
};

function AllReportsHematology() {

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  const token = getCookie('accessToken');

  const { data: hematologyAllReports } = useQuery({
    queryKey: ["hematology-all", page, search],
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
            total: 0,
          },
        },
  });


  // Handle expand button clicks
  useEffect(() => {
    const handleExpandClick = (e: Event) => {
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
      const details = document.createElement('ul');
      details.className = 'grid grid-cols-2 gap-2 text-sm';
      details.innerHTML = `
        <li><strong>Receipt ID:</strong> ${reciptId}</li>
        <li><strong>Patient ID:</strong> ${patientId}</li>
        <li><strong>Patient Name:</strong> ${patientName}</li>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>Tests:</strong> ${tests}</li>
        <li><strong>Status:</strong> ${status}</li>
        <li class='col-span-2'><strong>Actions:</strong>
          <button class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2 mr-2" onclick="window.location.href='/pathology/hematology/all/report/${reciptId}'">
            View Report
          </button>
          <a href="/pathology/hematology/all/edit/${reciptId}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
            Edit
          </a>
        </li>
      `;

      // Create new row
      const newRow = document.createElement('tr');
      newRow.className = 'child-row-detail';
      const cell = document.createElement('td');
      cell.className = 'p-4 bg-muted/50';
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
  }, []);

  const columns = [
    {
      data: "ReciptID",
      title: "Receipt ID",
      orderable: true,
      render: (data: any, _type: string, row: ReportsItem) => {
        const date = row.Date ? new Date(row.Date).toLocaleDateString() : '-';
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                    type="button"
                    data-recipt-id="${data}"
                    data-patient-id="${row.PatientId || '-'}"
                    data-patient-name="${(row.PatientName || '-').replace(/"/g, '&quot;')}"
                    data-date="${date}"
                    data-tests="${(row.Tests || '-').replace(/"/g, '&quot;')}"
                    data-status="${row.Status || '-'}">+</button>
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
        const patientName = row.PatientName;
        return patientName || '-';
      },
      defaultContent: "",
    },
    {
      data: "Date",
      title: "Date",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const date = row.Date;
        return date ? new Date(date).toLocaleDateString() : '-';
      },
      defaultContent: "",
    },
    {
      data: "Tests",
      title: "Hematology Record IDs",
      orderable: false,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const tests = row.Tests;
        if (!tests) return '-';

        // Split comma-separated IDs and display as badges
        const testIds = tests.split(',').filter(id => id.trim() !== '');
        const badges = testIds.map(id =>
          `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer" title="Hematology Record ID: ${id.trim()}">${id.trim()}</span>`
        ).join('');

        return `<div class="flex flex-wrap gap-1">${badges}</div>`;
      },
      defaultContent: "",
    },
    {
      data: "Status",
      title: "Status",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const status = row.Status;
        const statusColor = status === 'Completed' ? 'text-green-600' : 'text-yellow-600';
        return `<span class="${statusColor}">${status}</span>`;
      },
      defaultContent: "",
    },
  ];

  return (
    <>
      <Header fixed>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="mb-4">
          <h1 className='text-2xl font-bold tracking-tight'>All Reports (Hematology)</h1>
        </div>
        <DataTable columns={columns} data={hematologyAllReports?.data?.items || []} meta={hematologyAllReports?.data?.meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
      </Main>
    </>

  )
}
