"use client";

import { useState } from "react";
import { DataTable } from "@/components/dashboard/components/DataTable";
import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetAccountsReceivableReportQuery,
  useGetSalesReportByCustomerQuery,
} from "@/store/features/reports/reportApiService";
import { useAppSelector } from "@/store/store";
import { Users, DollarSign, AlertCircle } from "lucide-react";

/* ------------------------ TABLE COLUMNS ------------------------ */

interface SalesCustomer {
  customer: string;
  orders: number;
  sales: number;
}

interface AR {
  invoiceNumber: string;
  customer: string;
  date: string;
  due: string;
  total: number;
  paid: number;
  balance: number;
}

/* ------------------------ MAIN COMPONENT ------------------------ */

export default function CustomerReports() {
  const [start, setStart] = useState("2025-12-01");
  const [end, setEnd] = useState("2025-12-19");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;



  const [accountsReceivablePage, setAccountsReceivablePage] = useState(1);
  const [accountsReceivableSearch, setAccountsReceivableSearch] = useState("");
  const [accountsReceivableLimit] = useState(10);

  const currency = useAppSelector((state) => state.currency.value);

  const { data: salesByCustomerData, isFetching: salesByCustomerIsFetching } =
    useGetSalesReportByCustomerQuery({ page, limit, search });

  console.log("Sales by Customer Data:", salesByCustomerData);

  // Calculate stats
  const totalCustomers = salesByCustomerData?.pagination?.total || 0;
  const totalSales = salesByCustomerData?.data?.reduce(
    (sum: number, item: SalesCustomer) => sum + Number(item.sales),
    0
  ) || 0;

  const {
    data: accountsReceivableData,
    isFetching: accountsReceivableIsFetching,
  } = useGetAccountsReceivableReportQuery({
    page: accountsReceivablePage,
    limit: accountsReceivableLimit,
    search: accountsReceivableSearch,
  });

  console.log("Accounts Receivable Data:", accountsReceivableData);
  const totalOutstanding = accountsReceivableData?.data?.reduce(
    (sum: number, item: AR) => sum + Number(item.balance),
    0
  ) || 0;

  const stats = [
    {
      label: "Total Customers",
      value: totalCustomers,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <Users className="w-6 h-6 text-white" />,
    },
    {
      label: "Total Sales",
      value: `${currency} ${totalSales.toLocaleString()}`,
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <DollarSign className="w-6 h-6 text-white" />,
    },
    {
      label: "Outstanding Balance",
      value: `${currency} ${totalOutstanding.toLocaleString()}`,
      gradient: "from-rose-600 to-rose-400",
      shadow: "shadow-rose-500/30",
      icon: <AlertCircle className="w-6 h-6 text-white" />,
    },
  ];

  const salesColumns: ColumnDef<SalesCustomer>[] = [
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("customer")}</span>
      ),
    },
    { accessorKey: "orders", header: "Orders" },
    {
      accessorKey: "sales",
      header: () => <div className="text-right">Sales ({currency})</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {Number(row.getValue("sales") || 0).toFixed(2)}
        </div>
      ),
    },
  ];

  const arColumns: ColumnDef<AR>[] = [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice #",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("invoiceNumber")}</span>
      ),
    },
    { accessorKey: "customer", header: "Customer" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "due", header: "Due" },
    {
      accessorKey: "total",
      header: () => <div className="text-right">Total ({currency})</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {Number(row.getValue("total") || 0).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "paid",
      header: () => <div className="text-right">Paid ({currency})</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {Number(row.getValue("paid") || 0).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "balance",
      header: () => <div className="text-right">Balance ({currency})</div>,
      cell: ({ row }) => {
        const val = Number(row.getValue("balance") || 0);
        return (
          <div className="text-right">
            <Badge className={val > 0 ? "bg-red-500" : "bg-green-500"}>
              {val.toFixed(2)}
            </Badge>
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* ---------------- HEADER ---------------- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 ">
        {/* Title */}
        <h1 className="text-2xl font-bold">Customer Reports</h1>

        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Start Date */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Start Date</label>
            <Input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full sm:w-auto"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">End Date</label>
            <Input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full sm:w-auto"
            />
          </div>

          {/* Filter Button */}
          <button
            className="mt-2 sm:mt-6 self-start sm:self-auto rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none"
          >
            Filter
          </button>
        </div>
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

            {/* Progress/Indicator line */}
            <div className="mt-4 h-1 w-full rounded-full bg-black/10">
              <div className="h-full w-2/3 rounded-full bg-white/40" />
            </div>
          </div>
        ))}
      </div>

      {/* ---------------- CARDS GRID ---------------- */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sales by Customer */}
        <Card className="pt-6">
          <CardHeader className="flex justify-between">
            <CardTitle>Sales by Customer</CardTitle>
            <span className="text-sm text-muted-foreground">
              {start} → {end}
            </span>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={salesColumns}
              data={salesByCustomerData?.data || []}
              pageIndex={page - 1}
              pageSize={limit}
              totalCount={salesByCustomerData?.pagination?.total || 0}
              onPageChange={(newPage) => setPage(newPage + 1)}
              onSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              isFetching={salesByCustomerIsFetching}
            />
          </CardContent>
        </Card>

        {/* Accounts Receivable */}
        <Card className="pt-6">
          <CardHeader className="flex justify-between">
            <CardTitle>Accounts Receivable</CardTitle>
            <span className="text-sm text-muted-foreground">Open invoices</span>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={arColumns}
              data={accountsReceivableData?.data || []}
              pageIndex={accountsReceivablePage - 1}
              pageSize={limit}
              totalCount={accountsReceivableData?.pagination?.total || 0}
              onPageChange={(newPage) => setAccountsReceivablePage(newPage + 1)}
              onSearch={(val) => {
                setAccountsReceivableSearch(val);
                setAccountsReceivablePage(1);
              }}
              isFetching={accountsReceivableIsFetching}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// import { useState } from "react";
// import { DataTable } from "@/components/dashboard/components/DataTable";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import type { ColumnDef } from "@tanstack/react-table";

// /* ---------------------------------------------------------------------- */
// /*                              SAMPLE DATA                               */
// /* ---------------------------------------------------------------------- */

// const salesByCustomer = [
//   { customer: "Modern Enterprises", orders: 1, sales: 4300.0 },
//   { customer: "Arif R.", orders: 1, sales: 487.5 },
//   { customer: "Tech Solutions Sdn Bhd", orders: 0, sales: 0.0 },
//   { customer: "Global Trading Co", orders: 0, sales: 0.0 },
//   { customer: "Innovative Systems", orders: 0, sales: 0.0 },
//   { customer: "Office Hub Malaysia", orders: 0, sales: 0.0 },
//   { customer: "Digital Works Sdn Bhd", orders: 0, sales: 0.0 },
//   { customer: "Smart Office Solutions", orders: 0, sales: 0.0 },
//   { customer: "Premier Business Group", orders: 0, sales: 0.0 },
//   { customer: "Muzahid Khan", orders: 0, sales: 0.0 },
// ];

// const accountsReceivable = [
//   {
//     invoiceNumber: "INV-20251012-D72F5C",
//     customer: "Modern Enterprises",
//     date: "2025-10-12",
//     due: "2025-10-19",
//     total: 1325,
//     paid: 0,
//     balance: 1325,
//   },
//   {
//     invoiceNumber: "INV2025003",
//     customer: "Innovative Systems",
//     date: "2025-10-03",
//     due: "2025-11-02",
//     total: 715.5,
//     paid: 0,
//     balance: 715.5,
//   },
//   {
//     invoiceNumber: "INV2025004",
//     customer: "Office Hub Malaysia",
//     date: "2025-10-04",
//     due: "2025-11-03",
//     total: 918.4,
//     paid: 0,
//     balance: 918.4,
//   },
//   {
//     invoiceNumber: "INV2025005",
//     customer: "Modern Enterprises",
//     date: "2025-10-05",
//     due: "2025-11-04",
//     total: 1325,
//     paid: 0,
//     balance: 1325,
//   },
//   {
//     invoiceNumber: "INV-20251110-63F242",
//     customer: "Tech Solutions Sdn Bhd",
//     date: "2025-11-10",
//     due: "2025-11-10",
//     total: 836.5,
//     paid: 0,
//     balance: 836.5,
//   },
// ];

// /* ---------------------------------------------------------------------- */
// /*                        SALES BY CUSTOMER COLUMNS                       */
// /* ---------------------------------------------------------------------- */

// interface SalesCustomer {
//   customer: string;
//   orders: number;
//   sales: number;
// }

// const salesColumns: ColumnDef<SalesCustomer>[] = [
//   {
//     accessorKey: "customer",
//     header: "Customer",
//     cell: ({ row }) => <span className="font-medium">{row.getValue("customer")}</span>,
//   },
//   {
//     accessorKey: "orders",
//     header: "Orders",
//   },
//   {
//     accessorKey: "sales",
//     header: "Sales (RM)",
//     cell: ({ row }) => {
//       const val = row.getValue("sales") as number;
//       return <span>RM {val.toFixed(2)}</span>;
//     },
//   },
// ];

// /* ---------------------------------------------------------------------- */
// /*                         ACCOUNTS RECEIVABLE COLUMNS                    */
// /* ---------------------------------------------------------------------- */

// interface AR {
//   invoiceNumber: string;
//   customer: string;
//   date: string;
//   due: string;
//   total: number;
//   paid: number;
//   balance: number;
// }

// const arColumns: ColumnDef<AR>[] = [
//   {
//     accessorKey: "invoiceNumber",
//     header: "Invoice #",
//     cell: ({ row }) => <span className="font-medium">{row.getValue("invoiceNumber")}</span>,
//   },
//   {
//     accessorKey: "customer",
//     header: "Customer",
//   },
//   {
//     accessorKey: "date",
//     header: "Date",
//   },
//   {
//     accessorKey: "due",
//     header: "Due",
//   },
//   {
//     accessorKey: "total",
//     header: "Total",
//     cell: ({ row }) => <span>RM {(row.getValue("total") as number).toFixed(2)}</span>,
//   },
//   {
//     accessorKey: "paid",
//     header: "Paid",
//     cell: ({ row }) => <span>RM {(row.getValue("paid") as number).toFixed(2)}</span>,
//   },
//   {
//     accessorKey: "balance",
//     header: "Balance",
//     cell: ({ row }) => {
//       const value = row.getValue("balance") as number;
//       return (
//         <Badge className={value > 0 ? "bg-red-500" : "bg-green-500"}>
//           RM {value.toFixed(2)}
//         </Badge>
//       );
//     },
//   },
// ];

// /* ---------------------------------------------------------------------- */
// /*                                PAGE UI                                 */
// /* ---------------------------------------------------------------------- */

// export default function CustomerReports() {
//   const [start, setStart] = useState("2025-11-01");
//   const [end, setEnd] = useState("2025-11-26");

//   return (
//     <div className="w-full space-y-10">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold tracking-tight">Customer Reports</h1>
//       </div>

//       {/* ---------------- FILTER BAR ---------------- */}
//       <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
//         <div>
//           <label className="text-sm font-medium">Start Date</label>
//           <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
//         </div>

//         <div>
//           <label className="text-sm font-medium">End Date</label>
//           <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
//         </div>

//         <Button variant="info" className="mt-6">
//           Apply Filter
//         </Button>
//       </div>

//       {/* ---------------- SALES BY CUSTOMER ---------------- */}
//       <div className="space-y-3">
//         <h2 className="text-xl font-semibold">Sales by Customer</h2>
//         <DataTable
//           columns={salesColumns}
//           data={salesByCustomer}
//         />
//       </div>

//       {/* ---------------- ACCOUNTS RECEIVABLE ---------------- */}
//       <div className="space-y-3">
//         <h2 className="text-xl font-semibold">Accounts Receivable (Open Invoices)</h2>
//         <DataTable
//           columns={arColumns}
//           data={accountsReceivable}
//         />
//       </div>
//     </div>
//   );
// }
