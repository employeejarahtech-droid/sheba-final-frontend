/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUp, DollarSign, ShoppingCart, Percent, Users, Package, BarChart3, Calendar } from "lucide-react";
import {
  useGetSalesChartDataQuery,
  useGetSalesSummaryQuery,
  useGetTopCustomersQuery,
  useGetTopProductsQuery,
} from "@/store/features/reports/reportApiService";
import { useAppSelector } from "@/store/store";
import { useState } from "react";
import { toast } from "sonner";

// const topProducts = [
//   { sku: "PRD-001", name: "Wireless Mouse", quantity: 120, sales: 3600.5 },
//   { sku: "PRD-002", name: "Mechanical Keyboard", quantity: 80, sales: 6400.0 },
//   { sku: "PRD-003", name: 'HD Monitor 24"', quantity: 45, sales: 13500.75 },
//   { sku: "PRD-004", name: "USB-C Hub", quantity: 150, sales: 4500.25 },
//   { sku: "PRD-005", name: "External SSD 1TB", quantity: 30, sales: 9000.0 },
//   { sku: "PRD-006", name: "Laptop Stand", quantity: 70, sales: 2800.0 },
// ];

// const topCustomers = [
//   { name: "John Doe", sales: 12500.75 },
//   { name: "Jane Smith", sales: 9800.0 },
//   { name: "Acme Corp", sales: 15200.5 },
//   { name: "Global Solutions", sales: 8700.25 },
//   { name: "Alice Johnson", sales: 6400.0 },
//   { name: "Tech Innovators", sales: 11200.0 },
// ];

// const revenueData = [
//   { date: "2025-12-01", amount: 1200 },
//   { date: "2025-12-02", amount: 1500 },
//   { date: "2025-12-03", amount: 900 },
//   { date: "2025-12-04", amount: 1800 },
//   { date: "2025-12-05", amount: 2000 },
//   { date: "2025-12-06", amount: 1700 },
//   { date: "2025-12-07", amount: 2200 },
//   { date: "2025-12-08", amount: 1900 },
//   { date: "2025-12-09", amount: 2100 },
//   { date: "2025-12-10", amount: 2300 },
//   { date: "2025-12-11", amount: 2500 },
//   { date: "2025-12-12", amount: 2000 },
//   { date: "2025-12-13", amount: 2400 },
//   { date: "2025-12-14", amount: 2600 },
//   { date: "2025-12-15", amount: 2800 },
//   { date: "2025-12-16", amount: 3000 },
//   { date: "2025-12-17", amount: 3200 },
//   { date: "2025-12-18", amount: 3400 },
//   { date: "2025-12-19", amount: 3600 },
// ];

function getStartOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function getEndOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
}

function formatChartDate(date: string, period: string) {
  switch (period) {
    case "daily":
      return new Date(date).toLocaleDateString(); // 12 Dec
    case "weekly":
      return date.replace("W", " Week ");
    case "monthly":
      return new Date(date + "-01").toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
    case "quarterly":
      return date; // 2025-Q4
    case "yearly":
      return date; // 2025
    default:
      return date;
  }
}

export default function SalesReportsPage() {
  const [startDate, setStartDate] = useState(getStartOfCurrentMonth());
  const [endDate, setEndDate] = useState(getEndOfCurrentMonth());
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [limit] = useState(10);

  const [productsPage, setProductsPage] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [productsLimit] = useState(10);

  const currency = useAppSelector((state) => state.currency.value);

  const { data: salesSummary, isLoading: salesSummaryIsLoading } =
    useGetSalesSummaryQuery({
      start_date: startDate,
      end_date: endDate,
    });

  const summary = salesSummary?.data?.summary;

  const { data: revenueChartData } = useGetSalesChartDataQuery({
    start_date: startDate,
    end_date: endDate,
  });
  console.log("revenueChartData ==>", revenueChartData);

  const revenueData =
    revenueChartData?.data.data.map((item) => ({
      date: formatChartDate(item.date, revenueChartData.data.period),
      amount: item.amount,
      orders: item.order_count,
    })) ?? [];

  const { data: topProductsData, isFetching: topProductsIsFetching } =
    useGetTopProductsQuery({
      page: productsPage,
      limit: productsLimit,
      search: productSearch,
    });
  const topProducts = topProductsData?.data || [];

  const topProductsColumns: ColumnDef<any>[] = [
    { accessorKey: "sku", header: "SKU" },
    { accessorKey: "name", header: "Product" },
    {
      accessorKey: "total_quantity_sold",
      header: "Qty",
      cell: (info) => (info.getValue() as number).toLocaleString(),
      meta: { textAlign: "right" },
    },
    {
      accessorKey: "total_revenue",
      header: () => <div className="text-right">Sales ({currency})</div>,
      cell: (info) => (
        <div className="text-right">
          {(info.getValue() as number).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      ),
      meta: { textAlign: "right" },
    },
  ];

  const { data: topCustomersData, isFetching: topCustomersIsFetching } =
    useGetTopCustomersQuery({
      page,
      limit,
      search,
    });
  const topCustomers = topCustomersData?.data || [];

  const topCustomersColumns: ColumnDef<any>[] = [
    { accessorKey: "name", header: "Customer" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "order_count",
      header: "Orders",
      cell: (row) => (row.getValue() as number).toLocaleString(),
    },
    {
      accessorKey: "total_spent",
      header: () => <div className="text-right">Sales ({currency})</div>,
      cell: (row) => (
        <div className="text-right">
          {(row.getValue() as number).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      ),
    },
  ];

  const formatCurrency = (value?: number) =>
    `${currency} ${(value ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Sales Reports
          </h1>
          <p className="text-muted-foreground mt-2">Analyze sales performance, revenue, and top products</p>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col">
            <label className="text-sm text-muted-foreground">From</label>
            <Input
              type="date"
              className="w-36 block"
              value={tempStartDate}
              onChange={(e) => setTempStartDate(e.target.value)}

            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-muted-foreground">To</label>
            <Input
              type="date"
              className="w-36 block"
              value={tempEndDate}
              onChange={(e) => setTempEndDate(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              if (!tempStartDate || !tempEndDate) return;

              if (tempStartDate > tempEndDate) {
                toast.info("From date cannot be after To date");
                return;
              }

              setStartDate(tempStartDate);
              setEndDate(tempEndDate);
            }}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[
          {
            label: "Orders",
            value: salesSummaryIsLoading ? "—" : String(summary?.total_orders ?? 0),
            gradient: "from-blue-600 to-blue-400",
            shadow: "shadow-blue-500/30",
            icon: <ShoppingCart className="w-6 h-6 text-white" />,
          },
          {
            label: "Revenue",
            value: salesSummaryIsLoading ? "—" : formatCurrency(summary?.total_sales),
            gradient: "from-emerald-600 to-emerald-400",
            shadow: "shadow-emerald-500/30",
            icon: <DollarSign className="w-6 h-6 text-white" />,
          },
          {
            label: "Tax",
            value: salesSummaryIsLoading ? "—" : formatCurrency(summary?.total_tax),
            gradient: "from-amber-600 to-amber-400",
            shadow: "shadow-amber-500/30",
            icon: <ArrowUp className="w-6 h-6 text-white" />,
          },
          {
            label: "Discounts",
            value: salesSummaryIsLoading ? "—" : formatCurrency(summary?.total_discount),
            gradient: "from-rose-600 to-rose-400",
            shadow: "shadow-rose-500/30",
            icon: <Percent className="w-6 h-6 text-white" />,
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
                <h3 className="mt-2 text-2xl font-bold text-white">
                  {item.value}
                </h3>
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

      {/* Chart + Top Customers */}
      <div className="">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg shadow-lg shadow-blue-500/30">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">Revenue by Day</CardTitle>
                  <p className="text-sm text-gray-500 mt-0.5">Daily revenue performance</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/50 rounded-lg border text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{startDate} → {endDate}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] py-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenueData}
                margin={{ top: 10, right: 30, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${currency}${value}`}
                />
                <Tooltip
                  formatter={(value) => {
                    const num = typeof value === "number" ? value : 0;
                    return `${currency} ${num.toFixed(2)}`;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg shadow-lg shadow-blue-500/30">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">Top Customers</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">Highest spending customers</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          {topCustomers?.length > 0 ? (
            <DataTable
              data={topCustomers}
              columns={topCustomersColumns}
              pageIndex={page - 1}
              pageSize={limit}
              totalCount={topCustomersData?.pagination?.total || 0}
              onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
              onSearch={(value) => {
                setSearch(value);
                setPage(1);
              }}
              isFetching={topCustomersIsFetching}
            />
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              No data
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg shadow-lg shadow-blue-500/30">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">Top Products</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">Best selling items</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <DataTable
            data={topProducts}
            columns={topProductsColumns}
            pageIndex={productsPage - 1}
            totalCount={topProductsData?.pagination?.total || 0}
            onPageChange={(newPageIndex) => setProductsPage(newPageIndex + 1)}
            onSearch={(value) => {
              setProductSearch(value);
              setProductsPage(1);
            }}
            isFetching={topProductsIsFetching}
          />
        </CardContent>
      </Card>
    </div>
  );
}



//   Privious code or design

// import { useState } from "react";
// import { Card, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { DataTable } from "@/components/dashboard/components/DataTable";
// import type { ColumnDef } from "@tanstack/react-table";
// import { ReportRangeButtons } from "@/components/reports/ReportRangeButtons";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// // ---------------------- MOCK DATA (Designed like screenshot) ----------------------

// const salesByDate = [
//   { key: "2025-01-01", invoices: 12, amount: 18500, returns: 1200, net: 17300, margin: "32.4%" },
//   { key: "2025-01-02", invoices: 9, amount: 12900, returns: 0, net: 12900, margin: "29.1%" },
// ];

// const purchasesBySupplier = [
//   { key: "ABC Supplier", bills: 8, amount: 28000, returns: 1500, net: 26500 },
//   { key: "XYZ Trading", bills: 5, amount: 14750, returns: 0, net: 14750 },
// ];

// // -----------------------------------------------------------------------------------

// export default function ReportsAnalytics() {
//   const [start, setStart] = useState("");
//   const [end, setEnd] = useState("");

//   const salesColumns: ColumnDef<any>[] = [
//     { accessorKey: "key", header: "Key" },
//     { accessorKey: "invoices", header: "Invoices" },
//     { accessorKey: "amount", header: "Sales Amount" },
//     { accessorKey: "returns", header: "Returns" },
//     { accessorKey: "net", header: "Net Sales" },
//     { accessorKey: "margin", header: "Margin %" },
//   ];

//   const purchaseColumns: ColumnDef<any>[] = [
//     { accessorKey: "key", header: "Key" },
//     { accessorKey: "bills", header: "Bills" },
//     { accessorKey: "amount", header: "Purchase Amount" },
//     { accessorKey: "returns", header: "Returns" },
//     { accessorKey: "net", header: "Net Purchases" },
//   ];

//   return (
//     <div className="space-y-8">
//       {/* Title */}
//       <h2 className="text-3xl font-bold">Sales Reports & Analytics</h2>
//       <p className="text-gray-500 mb-4 max-w-3xl">
//         Analyze sales, purchases, inventory, accounting, HR & payroll, CRM and projects with flexible filters
//         and export options.
//       </p>

//       {/* BUSINESS SNAPSHOT */}
//       <Card className="rounded-2xl shadow-sm p-6">
//         <div className="flex justify-between items-center">
//           <h2 className="text-2xl font-semibold">Business Snapshot</h2>
//           <ReportRangeButtons />
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
//           <div>
//             <p className="text-gray-500 text-sm">Total Sales</p>
//             <p className="text-3xl font-semibold">245,320.00</p>
//             <p className="text-xs text-gray-400">From sales invoices within selected period.</p>
//           </div>

//           <div>
//             <p className="text-gray-500 text-sm">Gross Profit</p>
//             <p className="text-3xl font-semibold">72,480.00</p>
//             <p className="text-xs text-gray-400">Sales – cost of goods sold.</p>
//           </div>

//           <div>
//             <p className="text-gray-500 text-sm">Total Purchases</p>
//             <p className="text-3xl font-semibold">158,900.00</p>
//             <p className="text-xs text-gray-400">From purchase invoices within selected period.</p>
//           </div>
//         </div>
//       </Card>

//       {/* SALES REPORTS */}
//       <Card className="rounded-2xl shadow-sm p-6">
//         <CardHeader className="px-0 flex  justify-between items-center ">
//           <CardTitle>Sales Reports</CardTitle>
//           <Button className="h-10 mt-6">Export</Button>
//         </CardHeader>

//         {/* FILTERS */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {/* DATE RANGE */}
//           <div className="flex flex-col gap-2">
//             <label className="text-sm font-medium">Date Range</label>
//             <div className="flex gap-2">
//               <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
//               <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
//             </div>
//           </div>

//           {/* GROUP BY */}
//           <div className="flex flex-col gap-2">
//             <label className="text-sm font-medium">Group By</label>
//             <Select defaultValue="date">
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="Select" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="date">By Date</SelectItem>
//                 <SelectItem value="product">By Product</SelectItem>
//                 <SelectItem value="customer">By Customer</SelectItem>
//                 <SelectItem value="category">By Category</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           {/* BRANCH */}
//           <div className="flex flex-col gap-2">
//             <label className="text-sm font-medium">Branch</label>
//             <Select defaultValue="all">
//               <SelectTrigger>
//                 <SelectValue placeholder="Select Branch" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Branches</SelectItem>
//                 <SelectItem value="dhaka">Dhaka</SelectItem>
//                 <SelectItem value="ctg">Chattogram</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </div>

//         {/* Table */}
//         <div className="mt-6">
//           <DataTable data={salesByDate} columns={salesColumns} pageSize={5} />
//         </div>

//         <p className="text-gray-400 text-xs mt-4">
//           Supports: Sales by Date / Period, Sales by Customer, Product, Category, Salesperson, Sales Return Summary,
//           Profitability.
//         </p>
//       </Card>

//       {/* PURCHASE REPORTS */}
//       <Card className="rounded-2xl shadow-sm p-6">

//         <CardHeader className="px-0 flex  justify-between items-center ">
//           <CardTitle>Purchase Reports</CardTitle>
//           <Button className="h-10 mt-6">Export</Button>
//         </CardHeader>

//         {/* FILTERS */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {/* DATE RANGE */}
//           <div className="flex flex-col gap-2">
//             <label className="text-sm font-medium">Date Range</label>
//             <div className="flex gap-2">
//               <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
//               <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
//             </div>
//           </div>

//           {/* GROUP BY */}
//           <div className="flex flex-col gap-2">
//             <label className="text-sm font-medium">Group By</label>
//             <Select defaultValue="date">
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="Select" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="date">By Date</SelectItem>
//                 <SelectItem value="product">By Product</SelectItem>
//                 <SelectItem value="customer">By Customer</SelectItem>
//                 <SelectItem value="category">By Category</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           {/* BRANCH */}
//           <div className="flex flex-col gap-2">
//             <label className="text-sm font-medium">Branch</label>
//             <Select defaultValue="all">
//               <SelectTrigger>
//                 <SelectValue placeholder="Select Branch" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Branches</SelectItem>
//                 <SelectItem value="dhaka">Dhaka</SelectItem>
//                 <SelectItem value="ctg">Chattogram</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </div>

//         <div className="mt-6">
//           <DataTable data={purchasesBySupplier} columns={purchaseColumns} pageSize={5} />
//         </div>

//         <p className="text-gray-400 text-xs mt-4">
//           Supports: Purchase by Date / Period, Supplier, Product / Category, Purchase Returns.
//         </p>
//       </Card>
//     </div>
//   );
// }
