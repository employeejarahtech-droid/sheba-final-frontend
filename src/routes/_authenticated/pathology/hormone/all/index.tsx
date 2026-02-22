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

export const Route = createFileRoute(
  '/_authenticated/pathology/hormone/all/',
)({
  component: AllHormones,
})


type ReportsItem = {
  ReciptID: number;
  PatientId: number | null;
  PatientName: string | null;
  Date: string | null;
  Tests: string;
  Status: string;
};

function AllHormones() {

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  const token = getCookie('accessToken');

  const { data: hormoneAllReports } = useQuery({
    queryKey: ["hormon-all", page, search],
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
                    data-patient-id="${row.PatientId || '-'}"
                    data-patient-name="${(row.PatientName || '-').replace(/"/g, '&quot;')}"
                    data-date="${date}"
                    data-tests="${(row.Tests || '-').replace(/"/g, '&quot;')}"
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
      data: 'Tests',
      title: 'Hormone Record IDs',
      render: (data: any) => {
        const tests = data as string;
        if (!tests) return '-';

        // Split comma-separated IDs and display as badges
        const testIds = tests.split(',').filter(id => id.trim() !== '');
        return testIds.map((id) =>
          `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 mr-1 mb-1">${id.trim()}</span>`
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
        return `<span class="${statusColor}">${status || 'Pending'}</span>`;
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
            <a href="/pathology/hormone/all/edit/${row.ReciptID}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
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
          <a href="/pathology/hormone/all/edit/${reciptId}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
            Edit
          </a>
        </li>
      `;

      // Create new row
      const newRow = document.createElement('tr');
      newRow.className = 'child-row-detail';
      const cell = document.createElement('td');
      cell.className = 'p-4 bg-muted/50';
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
  }, []);

  return (
    <>
      <Header>
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
          <h1 className='text-2xl font-bold tracking-tight'>All Reports (Hormones)</h1>
        </div>
        <DataTable columns={columns} data={items} meta={meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
      </Main>
    </>

  )

}
