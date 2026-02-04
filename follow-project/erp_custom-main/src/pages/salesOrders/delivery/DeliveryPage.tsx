"use client";

import { useState } from "react";
import { Link } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useGetAllSalesOrdersQuery,
  useUpdateSalesOrderStatusMutation,
} from "@/store/features/salesOrder/salesOrder";
import type { SalesOrder } from "@/types/salesOrder.types";

// ================= ZOD SCHEMA =================

const deliverySchema = z
  .object({
    status: z.enum([
      "pending",
      "in_transit",
      "delivered",
      "failed",
      "returned",
      "confirmed",
    ]),
    delivery_date: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const requiredStatuses = [
        "pending",
        "in_transit",
        "delivered",
        "failed",
        "returned",
        "confirmed",
      ];
      if (requiredStatuses.includes(data.status)) {
        return !!data.delivery_date;
      }
      return true;
    },
    {
      path: ["delivery_date"],
      message: "Delivery date is required for this status",
    }
  );

type DeliveryFormValues = z.infer<typeof deliverySchema>;

// ================= COMPONENT =================

export default function DeliveryPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [openModal, setOpenModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  const { data, isLoading } = useGetAllSalesOrdersQuery({
    page,
    limit,
    search,
  });

  const [updateOrder] = useUpdateSalesOrderStatusMutation();

  const orders = data?.data ?? [];

  // Stats calculation (frontend)
  const { data: allOrdersData } = useGetAllSalesOrdersQuery({ limit: 1000 });
  const allOrders = allOrdersData?.data || [];

  const totalDeliveries = allOrders.length;
  const inTransit = allOrders.filter((o) => o.delivery_status === "in_transit").length;
  const delivered = allOrders.filter((o) => o.delivery_status === "delivered").length;
  const pending = allOrders.filter((o) => o.delivery_status === "pending").length;

  const stats = [
    {
      label: "Total Deliveries",
      value: totalDeliveries,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <Truck className="w-6 h-6 text-white" />,
    },
    {
      label: "In Transit",
      value: inTransit,
      gradient: "from-purple-600 to-purple-400",
      shadow: "shadow-purple-500/30",
      icon: <Clock className="w-6 h-6 text-white" />,
    },
    {
      label: "Delivered",
      value: delivered,
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <CheckCircle className="w-6 h-6 text-white" />,
    },
    {
      label: "Pending",
      value: pending,
      gradient: "from-amber-600 to-amber-400",
      shadow: "shadow-amber-500/30",
      icon: <AlertTriangle className="w-6 h-6 text-white" />,
    },
  ];

  // ================= RHF =================

  const form = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      status: "pending",
      delivery_date: "",
      notes: "",
    },
  });

  // ================= HANDLERS =================

  const handleOpenModal = (order: SalesOrder) => {
    setSelectedOrder(order);

    const deliveryDateValue = order.delivery?.delivery_date
      ? new Date(order.delivery.delivery_date).toISOString().split("T")[0]
      : "";

    form.reset({
      status:
        order.delivery_status ?? ("pending" as DeliveryFormValues["status"]),
      delivery_date: deliveryDateValue,
      notes: order.delivery?.notes ?? "",
    });

    setOpenModal(true);
  };

  const handleUpdate = async (values: DeliveryFormValues) => {
    if (!selectedOrder) return;

    try {
      const payload = {
        status: values.status,
        delivery_date: values.delivery_date || undefined,
        notes: values.notes,
      };

      await updateOrder({
        orderId: selectedOrder.id,
        orderData: payload,
      }).unwrap();

      toast.success("Order updated successfully!");
      setOpenModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order.");
    }
  };

  // ================= TABLE COLUMNS =================

  const OrderColumns: ColumnDef<SalesOrder>[] = [
    {
      accessorKey: "order_number",
      header: "Order #",
      meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[120px]" } as any,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.order_number}</span>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      meta: { className: "md:sticky md:left-[120px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any,
      cell: ({ row }) => (
        <div className="font-semibold">{row.original.customer?.name}</div>
      ),
    },
    {
      accessorKey: "total_amount",
      header: () => (
        <div className="text-right">Total Amount (RM)</div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          {parseFloat(row.original.total_amount).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "delivery.delivery_date",
      header: "Delivery Date",
      cell: ({ row }) => {
        const d = row.original.delivery?.delivery_date;
        return d ? new Date(d).toLocaleDateString() : "—";
      },
    },
    {
      accessorKey: "delivery_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.delivery_status;

        const colors: Record<string, string> = {
          pending: "bg-yellow-600",
          confirmed: "bg-blue-600",
          in_transit: "bg-purple-600",
          delivered: "bg-green-600",
          failed: "bg-red-600",
          returned: "bg-gray-600",
        };

        return (
          <Badge className={`${colors[status]} text-white capitalize`}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex gap-2 flex-wrap">
            <Link to={`/dashboard/sales/orders/${item.id}`}>
              <Button size="sm" variant="outline-info">
                View
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenModal(item)}
            >
              Delivery Action
            </Button>
          </div>
        );
      },
    },
  ];

  // ================= RENDER =================

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Delivery Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

      <Card className="py-6">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Delivery - Ready to Dispatch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={OrderColumns}
            data={orders}
            pageIndex={page - 1}
            pageSize={limit}
            totalCount={data?.pagination?.total ?? 0}
            onPageChange={(i) => setPage(i + 1)}
            onSearch={(v) => {
              setSearch(v);
              setPage(1);
            }}
            isFetching={isLoading}
          />
        </CardContent>
      </Card>

      {/* ===== MODAL ===== */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Delivery Status</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleUpdate)}>
            <div className="space-y-4 mt-2">
              {/* Status */}
              <div>
                <label className="block font-semibold mb-1">Status</label>
                <Select
                  // eslint-disable-next-line react-hooks/incompatible-library
                  value={form.watch("status")}
                  onValueChange={(v) =>
                    form.setValue("status", v as DeliveryFormValues["status"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Date */}
              <div>
                <label className="block font-semibold mb-1">
                  Delivery Date
                  {["in_transit", "delivered", "confirmed"].includes(
                    form.watch("status")
                  ) && <span className="text-red-500 ml-1">*</span>}
                </label>

                <Input type="date" {...form.register("delivery_date")} />

                {form.formState.errors.delivery_date && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.delivery_date.message}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold mb-1">Notes</label>
                <Textarea {...form.register("notes")} />
              </div>
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={form.formState.isSubmitting}
              >
                Update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
