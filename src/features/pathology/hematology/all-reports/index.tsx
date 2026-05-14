import { ConfigDrawer } from "@/components/config-drawer";
import { DataTable } from "@/components/DataTable";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { reportsData } from "@/data/data";

const topNav = [
  {
    title: 'Overview',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Customers',
    href: 'dashboard/customers',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Products',
    href: 'dashboard/products',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Settings',
    href: 'dashboard/settings',
    isActive: false,
    disabled: true,
  },
]

type ReportsItem = {
  id: string;
  receiptId: string;
  patientName: string;
  tests: string[];
  date: string;
  status?: string;
};

const reports: ReportsItem[] = reportsData;

export default function AllReportsHematology() {
  const columns = [
    {
      data: "id",
      title: "ID",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return row.id;
      },
      defaultContent: "",
    },
    {
      data: "receiptId",
      title: "Receipt ID",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return row.receiptId;
      },
      defaultContent: "",
    },
    {
      data: "patientName",
      title: "Patient Name",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return row.patientName;
      },
      defaultContent: "",
    },
    {
      data: "tests",
      title: "Tests",
      orderable: false,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return Array.isArray(row.tests) ? row.tests.join(", ") : row.tests;
      },
      defaultContent: "",
    },
    {
      data: "date",
      title: "Date",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return row.date;
      },
      defaultContent: "",
    },
    {
      data: "status",
      title: "Status",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const status = row.status || "pending";
        const color =
          status === "passed"
            ? "bg-green-500"
            : status === "failed"
              ? "bg-red-500"
              : "bg-yellow-500";
        return `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-white ${color}">${status}</span>`;
      },
      defaultContent: "",
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return `
          <div class="flex gap-2">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2"
              onclick="alert('View ${row.id}')"
            >
              View
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 px-4 py-2"
              onclick="alert('Delete ${row.id}')"
            >
              Delete
            </button>
          </div>
        `;
      },
      defaultContent: "",
    },
  ];

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
          <h1 className='text-2xl font-bold tracking-tight'>All Reports (Hematology)</h1>
        </div>
        <DataTable columns={columns} data={reports} />
      </Main>
    </>

  )
}
