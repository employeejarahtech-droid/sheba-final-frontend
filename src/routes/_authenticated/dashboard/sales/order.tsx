"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from '@tanstack/react-router';
import { Plus, DollarSign, TrendingUp, ShoppingCart } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { getCookie } from "@/lib/cookies";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useCurrency } from '@/hooks/use-currency'
import { DateField } from '@/components/date-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AppHeader } from '@/components/layout/app-header'
import { useCan } from "@/hooks/use-can";

export const Route = createFileRoute('/_authenticated/dashboard/sales/order')({
  component: SalesOrdersPage,
})

function SalesOrdersPage() {
  const can = useCan();
  const canEdit = can('sales.order.edit');
  const canDelete = can('sales.order.delete');
  const { currencySymbol } = useCurrency();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const token = getCookie('accessToken');
  const queryClient = useQueryClient();

  // Date filter presets
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  const toYMD = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const datePresets = useMemo(() => ({
    today: { from: toYMD(today()), to: toYMD(today()) },
    yesterday: (() => { const d = today(); d.setDate(d.getDate() - 1); return { from: toYMD(d), to: toYMD(d) }; })(),
    last7: (() => { const d = today(); d.setDate(d.getDate() - 6); return { from: toYMD(d), to: toYMD(today()) }; })(),
    last15: (() => { const d = today(); d.setDate(d.getDate() - 14); return { from: toYMD(d), to: toYMD(today()) }; })(),
    last30: (() => { const d = today(); d.setDate(d.getDate() - 29); return { from: toYMD(d), to: toYMD(today()) }; })(),
    last45: (() => { const d = today(); d.setDate(d.getDate() - 44); return { from: toYMD(d), to: toYMD(today()) }; })(),
    last60: (() => { const d = today(); d.setDate(d.getDate() - 59); return { from: toYMD(d), to: toYMD(today()) }; })(),
    last90: (() => { const d = today(); d.setDate(d.getDate() - 89); return { from: toYMD(d), to: toYMD(today()) }; })(),
    last180: (() => { const d = today(); d.setDate(d.getDate() - 179); return { from: toYMD(d), to: toYMD(today()) }; })(),
    last365: (() => { const d = today(); d.setDate(d.getDate() - 364); return { from: toYMD(d), to: toYMD(today()) }; })(),
  }), [])
  const activePreset = useMemo(() => {
    if (!from || !to) return 'custom'
    const match = Object.entries(datePresets).find(([, v]) => v.from === from && v.to === to)
    return match ? match[0] : 'custom'
  }, [from, to, datePresets])
  const [presetOpen, setPresetOpen] = useState(false)
  const applyPreset = (key: string) => {
    const p = (datePresets as any)[key]
    if (p) { setFrom(p.from); setTo(p.to); setPage(1) }
    setPresetOpen(false)
  }

  // Fetch sales orders data
  const [salesOrders, setSalesOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchSalesOrders = async () => {
      setIsFetching(true);
      setIsError(false);
      try {
        const response = await api.get('/sales/orders', {
          params: { page, limit, search, start_date: from, end_date: to }
        });
        setSalesOrders(response.data.data || []);
        setTotal(response.data.pagination?.total || 0);
      } catch (err) {
        console.error('Failed to fetch sales orders:', err);
        setIsError(true);
      } finally {
        setIsFetching(false);
      }
    };

    fetchSalesOrders();
  }, [page, limit, search, from, to]);

  // Stats (calculated from current page data)
  const totalSales = salesOrders.reduce((sum: number, item: any) => sum + Number(item.total || 0), 0);
  const currentPageOrders = salesOrders.length;
  const avgOrder = currentPageOrders > 0 ? totalSales / currentPageOrders : 0;

  const stats = [
    { label: "Total Sales", value: `${currencySymbol} ${totalSales.toLocaleString()}`, icon: DollarSign, grad: "from-emerald-500 to-emerald-600" },
    { label: "Total Orders", value: total, icon: ShoppingCart, grad: "from-blue-500 to-blue-600" },
    { label: "Avg. Order", value: `${currencySymbol} ${avgOrder.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp, grad: "from-violet-500 to-violet-600" },
  ];

  // Delete order handler
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this sales order?")) return;

    try {
      await api.delete(`/sales/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Sales order deleted successfully");
      // Refetch data
      // In a real implementation, you'd use React Query similar to the income page
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to delete sales order");
    }
  };

  const columns = useMemo(() => [
    {
      data: null,
      title: "SL",
      orderable: false,
      responsivePriority: 3,
      render: (_data: any, _type: string, _row: any, meta: any) => {
        return meta.row + 1;
      },
      defaultContent: "",
    },
    {
      data: "id",
      title: "Order ID",
      orderable: true,
      responsivePriority: 5,
      defaultContent: "",
    },
    {
      data: "order_number",
      title: "Order Number",
      orderable: true,
      responsivePriority: 1,
      defaultContent: "",
    },
    {
      data: "customer_name",
      title: "Customer",
      orderable: true,
      responsivePriority: 1,
      defaultContent: "",
    },
    {
      data: "total",
      title: `Total (${currencySymbol})`,
      orderable: true,
      responsivePriority: 2,
      render: (data: any) => {
        return Number(data || 0).toFixed(2);
      },
      defaultContent: "0.00",
    },
    {
      data: "order_date",
      title: "Order Date",
      orderable: true,
      responsivePriority: 3,
      render: (data: any) => {
        return data || new Date().toISOString().split('T')[0];
      },
      defaultContent: "",
    },
    {
      data: "status",
      title: "Status",
      orderable: true,
      responsivePriority: 3,
      render: (data: any) => {
        const status = data || "pending";
        let className = "capitalize inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ";
        if (status.toLowerCase() === "completed" || status.toLowerCase() === "delivered") {
          className += "bg-emerald-100 text-emerald-700 border-emerald-200";
        } else if (status.toLowerCase() === "pending") {
          className += "bg-amber-100 text-amber-700 border-amber-200";
        } else if (status.toLowerCase() === "cancelled") {
          className += "bg-rose-100 text-rose-700 border-rose-200";
        } else {
          className += "bg-blue-100 text-blue-700 border-blue-200";
        }
        return '<span class="' + className + '">' + status + '</span>';
      },
      defaultContent: "pending",
    },
    {
      data: "payment_method",
      title: "Payment Method",
      orderable: true,
      responsivePriority: 4,
      defaultContent: "",
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      responsivePriority: 1,
      render: (_data: any, _type: string, row: any) => {
        return `
          <div class="flex gap-2">
            <button
              onclick="window.viewOrder(${row.id})"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
              title="View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            ${canEdit ? `<button
              onclick="window.editOrder(${row.id})"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </button>` : ''}
            ${canDelete ? `<button
              onclick="window.deleteOrder(${row.id})"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 px-3"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>` : ''}
          </div>
        `;
      },
      defaultContent: "",
    },
  ], [canEdit, canDelete, currencySymbol]);

  // Expose functions to window for onclick handlers
  if (typeof window !== 'undefined') {
    (window as any).viewOrder = (id: number) => {
      console.log("View order:", id);
    };
    (window as any).editOrder = (id: number) => {
      console.log("Edit order:", id);
    };
    (window as any).deleteOrder = handleDelete;
  }

  if (isError) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Unable to Load Sales Orders</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The sales orders endpoint may not be available yet. Please ensure the backend API is running and the endpoint is configured.
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-left text-sm">
            <p className="font-mono text-xs text-gray-700 dark:text-gray-300">
              <strong>Endpoint:</strong> GET /api/sales/orders<br />
              <strong>Status:</strong> 404 Not Found
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppHeader fixed />
      <main className=''>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Sales Orders</h1>
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <Button className="flex items-center gap-2">
              <Plus size={18} /> Add Order
            </Button>
          </div>
        </div>

        <div className="space-y-3">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                  <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: ["#10B981","#F97316","#EC4899","#14B8A6","#F59E0B","#3B82F6"][index % 6] }}>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white rounded-lg shadow-lg">
                        <Icon className="w-4 h-4" style={{ color: ["#10B981","#F97316","#EC4899","#14B8A6","#F59E0B","#3B82F6"][index % 6] }} />
                      </div>
                      <CardTitle className="text-sm font-semibold text-white/90">{card.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="text-2xl font-bold">{card.value || 0}</h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <DataTable
            columns={columns}
            data={salesOrders}
            meta={{
              page,
              limit,
              total,
            }}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            isLoading={isFetching}
            filterSlot={
              <div className="flex items-center gap-1.5">
                <Select value={activePreset} onValueChange={applyPreset} open={presetOpen} onOpenChange={setPresetOpen}>
                  <SelectTrigger className="w-[140px] h-9 rounded-md border-gray-200 dark:border-gray-700 bg-transparent text-sm">
                    <SelectValue placeholder="Filter by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="last7">Last 7 days</SelectItem>
                    <SelectItem value="last15">Last 15 days</SelectItem>
                    <SelectItem value="last30">Last 30 days</SelectItem>
                    <SelectItem value="last45">Last 45 days</SelectItem>
                    <SelectItem value="last60">Last 60 days</SelectItem>
                    <SelectItem value="last90">Last 90 days</SelectItem>
                    <SelectItem value="last180">Last 180 days</SelectItem>
                    <SelectItem value="last365">Last 365 days</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
                <DateField value={from} onChange={(v: string) => { setFrom(v); setPresetOpen(false); setPage(1) }} placeholder="From" />
                <span className="text-xs text-muted-foreground">to</span>
                <DateField value={to} onChange={(v: string) => { setTo(v); setPresetOpen(false); setPage(1) }} placeholder="To" />
                {(from || to) && (
                  <Button variant="ghost" size="sm" onClick={() => { setFrom(""); setTo(""); setPage(1) }}>
                    Clear
                  </Button>
                )}
              </div>
            }
          />
        </div>
      </main>
    </>
  );
}
