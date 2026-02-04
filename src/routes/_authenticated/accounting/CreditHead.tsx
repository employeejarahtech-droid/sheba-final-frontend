/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { DataTable } from "@/components/dashboard/components/DataTable";
import { Badge } from "@/components/ui/badge";
import {
  useGetAllCreditHeadsQuery,
} from "@/store/features/accounting/accoutntingApiService";
import type { CreditHead } from "@/types/accounting.types";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import AddCreditHeadForm from "./AddCreditHead";
import { Button } from "@/components/ui/button";
import EditCreditHeadForm from "./EditCreditHead";
import { CheckCircle, FolderOpen, XCircle } from "lucide-react";

export default function CreditHead() {
  const [openEditForm, setOpenEditForm] = useState<boolean>(false);
  const [creditHeadId, setCreditHeadId] = useState<number>(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 10;

  const { data, isFetching, isError } = useGetAllCreditHeadsQuery({
    page,
    limit: 10,
    search,
  });
  const creditHeads: CreditHead[] = data?.data || [];

  console.log("creditHeads", data);

  // Stats
  const totalHeads = data?.pagination?.total ?? 0;
  // Approximation if not fetching all, or ideally fetching all for accurate stats if dataset is small
  // For now using total from pagination as total, and calculating active/inactive from current page 
  // which is inaccurate but consistent with other pages unless we fetch all. 
  // Better: fetch all for stats like we did in other pages.
  const { data: allHeadsData } = useGetAllCreditHeadsQuery({ limit: 1000 });
  const allHeads = allHeadsData?.data || [];

  const activeHeads = allHeads.filter(h => h.is_active).length;
  const inactiveHeads = allHeads.filter(h => !h.is_active).length;

  const stats = [
    {
      label: "Total Heads",
      value: totalHeads,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <FolderOpen className="w-6 h-6 text-white" />,
    },
    {
      label: "Active Heads",
      value: activeHeads,
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <CheckCircle className="w-6 h-6 text-white" />,
    },
    {
      label: "Inactive Heads",
      value: inactiveHeads,
      gradient: "from-rose-600 to-rose-400",
      shadow: "shadow-rose-500/30",
      icon: <XCircle className="w-6 h-6 text-white" />,
    },
  ];

  //   const [deleteCreditHead] = useDeleteCreditHeadMutation();

  //  const handleDeleteCreditHead = async (id: number) => {
  //   const confirmed = await new Promise<boolean>((resolve) => {
  //     const toastId = toast.custom(() => (
  //       <div className="flex flex-col items-center gap-4 rounded-md border bg-white p-4 shadow">
  //         <p className="text-sm font-semibold">
  //           Are you sure you want to delete this credit head?
  //         </p>

  //         <div className="flex gap-2 ml-auto">
  //           <button
  //             onClick={() => {
  //               toast.dismiss(toastId);
  //               resolve(false);
  //             }}
  //             className="px-3 py-1 text-sm rounded border"
  //           >
  //             No
  //           </button>

  //           <button
  //             onClick={() => {
  //               toast.dismiss(toastId);
  //               resolve(true);
  //             }}
  //             className="px-3 py-1 text-sm rounded bg-red-600 text-white"
  //           >
  //             Yes
  //           </button>
  //         </div>
  //       </div>
  //     ), {
  //       duration: 10000,
  //     });
  //   });

  //   if (!confirmed) return;

  //   try {
  //     const res = await deleteCreditHead(id).unwrap();
  //     if (res.status) {
  //       toast.success("Credit head deleted successfully");
  //     } else {
  //       toast.error("Failed to delete credit head");
  //     }
  //   } catch (error) {
  //     toast.error(
  //       "Failed to delete credit head" +
  //         (error instanceof Error ? ": " + error.message : "")
  //     );
  //   }
  // };


  const creditHeadColumns: ColumnDef<CreditHead>[] = [
    {
      accessorKey: "id",
      header: "ID",
      meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[60px]" } as any,
    },
    {
      accessorKey: "name",
      header: "Name",
      meta: { className: "md:sticky md:left-[60px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any,
    },
    { accessorKey: "code", header: "Code" },
    { accessorKey: "description", header: "Description" },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.getValue("is_active") as boolean;
        return (
          <Badge className={`${status ? "bg-green-600" : "bg-red-600"}`}>{status ? "Active" : "Inactive"}</Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }: { row: any }) => {
        const creditHeadId = row.original.id;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCreditHeadId(creditHeadId);
                setOpenEditForm(true);
              }}
            >
              Edit
            </Button>
          </div>
        );
      },
    },
  ];

  if (isError) return <p>Error loading incomes</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">List of Credit Heads</h2>
        <AddCreditHeadForm />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
          >
            {/* Background Pattern */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/90">{item.label}</p>
                <h3 className="mt-2 text-3xl font-bold text-white">
                  {item.value}
                </h3>
              </div>
              <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                {item.icon}
              </div>
            </div>

            {/* Progress/Indicator line (optional visual flair) */}
            <div className="mt-4 h-1 w-full rounded-full bg-black/10">
              <div className="h-full w-2/3 rounded-full bg-white/40" />
            </div>
          </div>
        ))}
      </div>

      <DataTable
        columns={creditHeadColumns}
        data={creditHeads}
        pageIndex={page}
        pageSize={limit}
        totalCount={data?.pagination?.total || 0}
        onPageChange={setPage}
        onSearch={(val) => {
          setSearch(val);
          setPage(1);
        }}
        isFetching={isFetching}
      />
      <EditCreditHeadForm
        open={openEditForm}
        setOpen={setOpenEditForm}
        creditHeadId={creditHeadId}
      />
    </div>
  );
}
