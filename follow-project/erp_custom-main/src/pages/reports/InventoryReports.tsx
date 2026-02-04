"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import {
  useGetInventoryLowStockListQuery,
  useGetInventoryStatusQuery,
  useGetInventoryValuationQuery,
} from "@/store/features/reports/reportApiService";
import { useState } from "react";
import { useAppSelector } from "@/store/store";
import { DollarSign, AlertTriangle, Package, AlertCircle } from "lucide-react";

export type LowStockRow = {
  sku: string;
  product: string;
  stock: number;
  minLevel: number;
};

export default function InventoryReports() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const { data: inventoryValuation } = useGetInventoryValuationQuery();

  const totalValuation = inventoryValuation?.data?.total_Valuation || 0;
  const totalUnits = inventoryValuation?.data?.total_units || 0;

  const { data: lowStockReport } = useGetInventoryStatusQuery();

  const lowStockCount = lowStockReport?.data?.low_stock_count || 0;

  const { data: lowStockItems, isFetching: lowStockItemsIsFetching } =
    useGetInventoryLowStockListQuery({
      page,
      limit,
      search,
    });
  //console.log("Low Stock Items:", lowStockItems);

  const columns: ColumnDef<LowStockRow>[] = [
    { accessorKey: "sku", header: "SKU" },
    { accessorKey: "product", header: "Product" },
    { accessorKey: "stock", header: "Stock" },
    { accessorKey: "minLevel", header: "Min Level" },
  ];

  const currency = useAppSelector((state) => state.currency.value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          Inventory Reports
        </h2>
        <p className="text-muted-foreground mt-2">Track stock valuation, low stock items, and inventory health</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Stock Valuation",
            value: `${currency} ${totalValuation.toLocaleString()}`,
            gradient: "from-blue-600 to-blue-400",
            shadow: "shadow-blue-500/30",
            icon: <DollarSign className="w-6 h-6 text-white" />,
            subtitle: `Total Units: ${totalUnits.toLocaleString()}`,
          },
          {
            label: "Low Stock Items",
            value: lowStockCount,
            gradient: "from-rose-600 to-rose-400",
            shadow: "shadow-rose-500/30",
            icon: <AlertTriangle className="w-6 h-6 text-white" />,
          },
          {
            label: "Total Products",
            value: totalUnits,
            gradient: "from-emerald-600 to-emerald-400",
            shadow: "shadow-emerald-500/30",
            icon: <Package className="w-6 h-6 text-white" />,
          },
        ].map((item, idx) => (
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
                {item.subtitle && (
                  <p className="text-xs text-white/70 mt-1">{item.subtitle}</p>
                )}
              </div>
              <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                {item.icon}
              </div>
            </div>

            {/* Progress/Indicator line */}
            <div className="mt-4 h-1 w-full rounded-full bg-black/10">
              <div className="h-full w-2/3 rounded-full bg-white/40" />
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock List Table */}
      <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg shadow-lg shadow-blue-500/30">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">Low Stock List</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">Items below minimum stock level</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <DataTable
            columns={columns}
            data={lowStockItems?.data || []}
            pageIndex={page - 1}
            pageSize={limit}
            totalCount={lowStockItems?.pagination?.total || 0}
            onPageChange={(newPage) => setPage(newPage + 1)}
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            isFetching={lowStockItemsIsFetching}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// "use client";

// import { useState } from "react";
// import type { ColumnDef } from "@tanstack/react-table";
// import { DataTable } from "@/components/dashboard/components/DataTable";
// import { Card,  CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";

// export type InventoryRow = {
//   item: string;
//   onHand: number;
//   reserved: number;
//   available: number;
//   avgCost: number;
//   valuation: number;
//   status: "ok" | "low";
// };

// const inventoryData: InventoryRow[] = [
//   {
//     item: "Cleanroom Gloves – Size M",
//     onHand: 3200,
//     reserved: 200,
//     available: 3000,
//     avgCost: 1.8,
//     valuation: 5760,
//     status: "ok",
//   },
//   {
//     item: "Safety Helmet – White",
//     onHand: 45,
//     reserved: 10,
//     available: 35,
//     avgCost: 12.5,
//     valuation: 562.5,
//     status: "low",
//   },
// ];

// export default function InventoryReports() {
//   const [asOfDate, setAsOfDate] = useState("");
//   const [pageIndex, setPageIndex] = useState(0);

//   const columns: ColumnDef<InventoryRow>[] = [
//     { accessorKey: "item", header: "Item / Category" },
//     { accessorKey: "onHand", header: "On Hand" },
//     { accessorKey: "reserved", header: "Reserved" },
//     { accessorKey: "available", header: "Available" },
//     { accessorKey: "avgCost", header: "Avg Cost" },
//     { accessorKey: "valuation", header: "Valuation" },
//     {
//       accessorKey: "status",
//       header: "Status",
//       cell: ({ row }) => {
//         const value = row.getValue("status") as string;
//         return (
//           <span
//             className={`px-2 py-1 rounded-full text-xs font-medium ${
//               value === "ok"
//                 ? "bg-green-100 text-green-700"
//                 : "bg-yellow-100 text-yellow-700"
//             }`}
//           >
//             {value === "ok" ? "OK" : "Low"}
//           </span>
//         );
//       },
//     },
//   ];

//   return (
//     <Card className="rounded-2xl shadow-sm p-6 space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <CardTitle className="text-xl font-semibold">
//           Inventory Reports
//         </CardTitle>
//         <Button variant="outline" className="px-5">
//           Export
//         </Button>
//       </div>

//       {/* Filters */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         {/* As of Date */}
//         <div className="flex flex-col gap-2">
//           <label className="text-sm font-medium">As Of Date</label>
//           <Input
//             type="date"
//             value={asOfDate}
//             onChange={(e) => setAsOfDate(e.target.value)}
//             className="h-10"
//           />
//         </div>

//         {/* Warehouse */}
//         <div className="flex flex-col gap-2">
//           <label className="text-sm font-medium">Warehouse</label>
//           <Select defaultValue="all">
//             <SelectTrigger className="h-10">
//               <SelectValue placeholder="All Warehouses" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Warehouses</SelectItem>
//               <SelectItem value="dhaka">Dhaka Warehouse</SelectItem>
//               <SelectItem value="ctg">Chattogram Warehouse</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         {/* Report Type */}
//         <div className="flex flex-col gap-2 md:col-span-1">
//           <label className="text-sm font-medium">Report Type</label>
//           <Select defaultValue="summary">
//             <SelectTrigger className="h-10">
//               <SelectValue placeholder="Stock Summary" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="summary">Stock Summary</SelectItem>
//               <SelectItem value="movement">Movement</SelectItem>
//               <SelectItem value="aging">Aging</SelectItem>
//               <SelectItem value="lowstock">Low Stock</SelectItem>
//               <SelectItem value="valuation">Valuation</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       {/* Table */}
//       <CardContent className="p-0">
//         <DataTable
//           columns={columns}
//           data={inventoryData}
//           pageIndex={pageIndex}
//           pageSize={10}
//           onPageChange={setPageIndex}
//         />

//         <p className="text-gray-500 text-xs mt-4">
//           Uses stock transactions from inventory tables for stock summary,
//           movement, aging, low stock and valuation.
//         </p>
//       </CardContent>
//     </Card>
//   );
// }
