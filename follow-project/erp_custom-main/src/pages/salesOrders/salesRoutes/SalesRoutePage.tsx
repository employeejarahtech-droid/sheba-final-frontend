/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { PlusCircle } from "lucide-react";
import type { SalesRoute } from "@/types/salesRoute.types";
import { useGetAllSalesRouteQuery } from "@/store/features/salesRoute/salesRoute";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Map, MapPin, CheckCircle, XCircle } from "lucide-react";

export default function SalesRoutesPage() {

  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const limit = 10;

  const {
    data: salesRouteData,
    isFetching,
  } = useGetAllSalesRouteQuery({ page, limit, search });

  const salesRoute: SalesRoute[] = salesRouteData?.data || [];

  // Fetch all for stats (simplified frontend calculation)
  const { data: allRoutesData } = useGetAllSalesRouteQuery({ limit: 1000 });
  const allRoutes = allRoutesData?.data || [];

  const totalRoutes = allRoutes.length;
  const activeRoutes = allRoutes.filter((r) => r.is_active).length;
  const inactiveRoutes = allRoutes.filter((r) => !r.is_active).length;
  // TODO: Add Logic for 'Assigned Routes' if applicable on this data model

  const stats = [
    {
      label: "Total Routes",
      value: totalRoutes,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <Map className="w-6 h-6 text-white" />,
    },
    {
      label: "Active Routes",
      value: activeRoutes,
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <CheckCircle className="w-6 h-6 text-white" />,
    },
    {
      label: "Inactive Routes",
      value: inactiveRoutes,
      gradient: "from-rose-600 to-rose-400",
      shadow: "shadow-rose-500/30",
      icon: <XCircle className="w-6 h-6 text-white" />,
    },
    // Placeholder for another stat if needed
    {
      label: "Start Locations",
      // Just counting unique start locations as a proxy for coverage
      value: new Set(allRoutes.map(r => r.start_location).filter(Boolean)).size,
      gradient: "from-violet-600 to-violet-400",
      shadow: "shadow-violet-500/30",
      icon: <MapPin className="w-6 h-6 text-white" />,
    },
  ];







  const RoutesColumns: ColumnDef<SalesRoute>[] = [
    {
      accessorKey: "id",
      header: "ID",
      meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[60px]" } as any,
    },
    {
      accessorKey: "route_name",
      header: "Route Name",
      meta: { className: "md:sticky md:left-[60px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any,
      cell: ({ row }) => (
        <Link
          to={`/dashboard/sales/sales-routes/${row.original.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {row.original.route_name}
        </Link>
      ),
    },

    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.description || "-"}
        </span>
      ),
    },

    // {
    //   accessorKey: "assigned_sales_rep_id",
    //   header: "Sales Rep",
    //   cell: ({ row }) => (
    //     <span className="font-medium">
    //       Rep #{row.original.assigned_sales_rep_id ?? "-"}
    //     </span>
    //   ),
    // },

    {
      accessorKey: "start_location",
      header: "Start Location",
      cell: ({ row }) => row.original.start_location || "-",
    },

    {
      accessorKey: "end_location",
      header: "End Location",
      cell: ({ row }) => row.original.end_location || "-",
    },

    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={
            row.original.is_active
              ? "bg-green-600 text-white"
              : "bg-gray-500 text-white"
          }
        >
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },

    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString(),
    },
    // {
    //   accessorKey: "sataff",
    //   header: "Staff",
    //   cell: () => {


    //     return 0
    //   }

    // },
    // {
    //   accessorKey: "customers",
    //   header: "Customers",
    //   cell: () => {

    //     return 0
    //   }

    // },

    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const route = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link to={`/dashboard/sales/sales-routes/${route.id}`}>
              <Button size="sm" variant="outline-info">
                View
              </Button>
            </Link>
            <Link to={`/dashboard/sales/sales-routes/${route.id}/edit`}>
              <Button size="sm" variant="outline-info">
                Edit
              </Button>
            </Link>
            <Link to={`/dashboard/sales/sales-routes/${route.id}/assign`}>
              <Button size="sm" variant="outline-info">
                Assign
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-5 mb-5">
        <h2 className="text-xl font-bold">Sales Routes</h2>
        <Link to="/dashboard/sales/sales-routes/create">
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none">
            <PlusCircle size={18} />
            New Route
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
      <Card className="shadow-sm py-6">
        <CardContent>


          <DataTable
            columns={RoutesColumns}
            data={salesRoute}
            pageIndex={page - 1}
            pageSize={limit}
            totalCount={salesRouteData?.pagination?.total}
            onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            isFetching={isFetching}
          />



        </CardContent>
      </Card>
    </div>
  );
}
