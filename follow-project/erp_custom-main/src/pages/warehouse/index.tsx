

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { warehouseOrders } from "@/data/data";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import type { WarehouseOrder } from "@/types/types";

export default function WarehouseOrdersPage() {

   const warehouseColumns: ColumnDef<WarehouseOrder>[] = [
    {
      accessorKey: "orderId",
      header: "Order #",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("orderId")}</span>
      ),
    },

    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold">{row.getValue("customer")}</div>
        </div>
      ),
    },

    {
      accessorKey: "total",
      header: "Total (RM)",
      cell: ({ row }) => row.getValue("total"),
    },

    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => row.getValue("date"),
    },

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;

        const color =
          status === "confirmed"
            ? "bg-green-500"
            : status === "Sent"
            ? "bg-blue-500"
            : "bg-gray-500";

        return <Badge className={`${color} capitalize`}>{status}</Badge>;
      },
    },

    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link to={`/dashboard/orders/${order.orderId}`}>
              <Button size="sm" variant="outline-info">View</Button>
            </Link>
          </div>
        );
      },
    },
  ]; 

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Warehouse – Ready for Picking</CardTitle>
        </CardHeader>

        <CardContent>
          <DataTable columns={warehouseColumns} data={warehouseOrders} />
        </CardContent>
      </Card>
    </div>
  );
}

