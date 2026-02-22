import { createFileRoute } from '@tanstack/react-router';
import { ConfigDrawer } from "@/components/config-drawer";
import { DataTable } from "@/components/DataTable";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { useState, useMemo, useEffect } from 'react';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { topNav } from '@/data/data';

export const Route = createFileRoute('/_authenticated/ecg/all/')({
  component: AllECGReports,
})


type ReportsItem = {
  ReciptID: number;
  PatientId: number | null;
  PatientName: string | null;
  Date: string | null;
  Tests: string;
  Status: string;
};

function AllECGReports() {

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  const token = getCookie('accessToken');

  const { data: ecgAllReports } = useQuery({
    queryKey: ["ecg-all", page, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ecg-all?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
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
      data: "Tests",
      title: "ECG Record IDs",
      orderable: false,
      defaultContent: "",
      render: (data: any) => {
        if (!data) return '-';
        const testIds = data.split(',').filter((id: string) => id.trim() !== '');
        return testIds.map((id: string) =>
          `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 mr-1">${id.trim()}</span>`
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
          <button class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2 mr-2" onclick="alert('View ${reciptId}')">View</button>
          <a href="/ecg/all/edit/${reciptId}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">Edit</a>
        </li>
      `;

      // Create new row
      const newRow = document.createElement('tr');
      newRow.className = 'child-row-detail';
      const cell = document.createElement('td');
      cell.className = 'p-4 bg-muted/50';
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
          <h1 className='text-2xl font-bold tracking-tight'>All Reports (ECG)</h1>
        </div>
        <DataTable columns={columns} data={ecgAllReports?.data?.items || []} meta={{ page, limit, total: ecgAllReports?.data?.meta?.total || 0 }} onPageChange={setPage} search={search} onSearchChange={setSearch} />
      </Main>
    </>

  )
}



