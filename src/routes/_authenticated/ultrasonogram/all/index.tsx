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

export const Route = createFileRoute(
  '/_authenticated/ultrasonogram/all/',
)({
  component: AllUltrasonogramReports,
})


type ReportsItem = {
  id: string;
  receiptId: string;
  patientName: string;
  tests: string[];
  date: string;
};

function AllUltrasonogramReports() {

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  const token = getCookie('accessToken');

  const { data: ultrasonogramAllReports } = useQuery({
    queryKey: ["ultrasonogram-all", page, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ultrasonogram-all?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
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

  console.log('X-Ray All Reports', ultrasonogramAllReports);

  const columns: ColumnDef<ReportsItem>[] = [
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
            <Link to={`/ultrasonogram/all/edit/$id`} params={{ id: item.id }}>
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
          <h1 className='text-2xl font-bold tracking-tight'>All Reports (Ultrasonogram)</h1>
        </div>
        <DataTable columns={columns} data={ultrasonogramAllReports?.data?.items || []} meta={ultrasonogramAllReports?.data?.meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
      </Main>
    </>

  )
}




