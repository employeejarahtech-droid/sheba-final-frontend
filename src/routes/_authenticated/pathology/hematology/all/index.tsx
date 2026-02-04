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
import { useState } from 'react';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { topNav } from '@/data/data';
import { Badge } from '@/components/ui/badge';

export const Route = createFileRoute(
  '/_authenticated/pathology/hematology/all/',
)({
  component: AllReportsHematology,
})


type ReportsItem = {
  id: string;
  receiptId: string;
  patientName: string;
  tests: string[];
  date: string;
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
        `${import.meta.env.VITE_API_URL}/api/hematology-all/invoices-only?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
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

  console.log('Hematology All', hematologyAllReports);

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
    {
      accessorKey: "tests",
      header: "Tests",
      // cell: ({ row }) => {
      //   const tests = row.getValue("tests") as string[];
      //   return tests.join(", ");
      // },
    },

    {
      accessorKey: "created_at",
      header: "Date",
    },

    // {
    //   accessorKey: "test_id",
    //   header: "Test",
    //   cell: ({ row }) => {
    //     const tests = row.getValue("test_id");
    //     return tests;
    //   }
    // },

    // {
    //   accessorKey: "test_result",
    //   header: "Test Result",
    // },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string || "passed";
        const color =
          status === "passed"
            ? "bg-green-500"
            : status === "failed"
              ? "bg-red-500"
              : "bg-yellow-500";

        return <Badge className={color + " text-white"}>{status}</Badge>;
      },
    },
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

            <Link to="/pathology/hematology/all/edit/$id" params={{ id: item.id }}>
              <Button size="sm" variant="default">Edit</Button>
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
          <h1 className='text-2xl font-bold tracking-tight'>All Reports (Hematology)</h1>
        </div>
        <DataTable columns={columns} data={hematologyAllReports?.data?.items || []} meta={hematologyAllReports?.data?.meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
      </Main>
    </>

  )
}
