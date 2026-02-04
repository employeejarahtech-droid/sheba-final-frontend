import { createFileRoute, Link } from '@tanstack/react-router';
import { ConfigDrawer } from "@/components/config-drawer";
import { DataTable } from "@/components/DataTable";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { getCookie } from '@/lib/cookies';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';


export const Route = createFileRoute(
  '/_authenticated/pathology/biochemical/all/',
)({
  component: AllReportsBiochemical,
})

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
};

function AllReportsBiochemical() {

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  const token = getCookie('accessToken');

  const { data: biochemicalAllReports } = useQuery({
    queryKey: ["biochemical-all", page, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/biochemical-all?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
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

  console.log('BioChemical All', biochemicalAllReports);


  const columns: ColumnDef<ReportsItem>[] = [
    // Row selection

    {
      accessorKey: "invoice_id",
      header: "Receipt ID",
    },
    {
      accessorKey: "patient_name",
      header: "Patient Name",
    },

    // // ✅ FIXED Tests column
    // {
    //   accessorKey: "tests",
    //   header: "Tests",
    //   cell: ({ row }) => {
    //     const tests = row.getValue("tests") as string[];
    //     return tests.join(", ");
    //   },
    // },

    {
      accessorKey: "created_at",
      header: "Date",
    },

    {
      accessorKey: "test_id",
      header: "Test",
      cell: ({ row }) => {
        const tests = row.getValue("test_id");
        return tests;
      }
    },

    {
      accessorKey: "test_result",
      header: "Test Result",
    },

    // {
    //   accessorKey: "status",
    //   header: "Status",
    //   cell: ({ row }) => {
    //     const status = row.getValue("status") as string;
    //     const color =
    //       status === "passed"
    //         ? "bg-green-500"
    //         : status === "failed"
    //           ? "bg-red-500"
    //           : "bg-yellow-500";

    //     return <Badge className={color + " text-white"}>{status}</Badge>;
    //   },
    // },
    // Actions Column
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;

        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => alert("View " + item.id)}>
              View
            </Button>
            <Link to={`/pathology/biochemical/all/edit/$reportId`} params={{ reportId: item.id }}>
              <Button size="sm" variant="default">
                Edit
              </Button>
            </Link>
            <Button size="sm" variant="destructive" onClick={() => alert("Delete " + item.id)}>
              Delete
            </Button>
          </div>
        );
      },
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
          <h1 className='text-2xl font-bold tracking-tight'>All Reports (Biochemical)</h1>
        </div>
        <DataTable columns={columns} data={biochemicalAllReports?.data.items || []} meta={biochemicalAllReports?.data?.meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
      </Main>
    </>

  )
}

