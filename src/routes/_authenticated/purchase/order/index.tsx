import { createFileRoute, Link } from '@tanstack/react-router'
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import {
    useGetAllPurchaseOrdersQuery,
    useUpdatePurchaseOrderMutation,
    useDeletePurchaseOrderMutation,
    type PurchaseOrder
} from "@/features/purchase/api/purchaseQueries";

import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, Trash2, FileText, CheckCircle, Clock, XCircle, PlusCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { topNav } from "@/data/data";

export const Route = createFileRoute('/_authenticated/purchase/order/')({
    component: PurchaseOrdersList,
})

// Simple confirmation modal
function ConfirmModal({
    open,
    onClose,
    onConfirm,
    message,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    message: string;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Confirm Action</h3>
                <p className="mb-6 text-muted-foreground">{message}</p>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="rounded-lg">
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} className="rounded-lg">
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* COMPONENT */
export default function PurchaseOrdersList() {
    const [page, setPage] = useState<number>(1);
    const [search, setSearch] = useState<string>("");
    const limit = 10;

    const { data: purchaseOrderData } = useGetAllPurchaseOrdersQuery({ page, limit, search });
    const purchaseOrders = purchaseOrderData?.data || [];
    console.log('purchaseOrders', purchaseOrders);
    const pagination = purchaseOrderData?.pagination ?? {
        total: 0,
        page: 1,
        limit: 10,
        totalPage: 1,
    };

    // Calculate stats from current page or fetch stats separately if needed.
    // For now using the pagination total and filtering visible items as a proxy or just showing 0 for others to avoid extra calls if not requested.
    // Better: Fetch usage stats or just use simple stats.
    // Since backend doesn't support stats endpoint yet, I'll just use total.

    // Actually, let's keep it simple.

    const totalPOs = pagination.total;
    // We can't easily get others without fetching all. Let's assume stats are for current page or fetch all for stats.
    // Fetching all for stats:
    const { data: allPOData } = useGetAllPurchaseOrdersQuery({ page: 1, limit: 1000 });
    const allPOs = allPOData?.data || [];

    const approvedPOs = allPOs.filter((po: any) => po.status === "approved" || po.status === "received").length;

    const pendingPOs = allPOs.filter((po: any) => po.status === "pending").length;

    const rejectedPOs = allPOs.filter((po: any) => po.status === "rejected").length;

    const stats = [
        {
            label: "Total Orders",
            value: totalPOs,
            gradient: "from-blue-600 to-blue-400",
            shadow: "shadow-blue-500/30",
            icon: <FileText className="w-6 h-6 text-white" />,
        },
        {
            label: "Approved/Received",
            value: approvedPOs,
            gradient: "from-emerald-600 to-emerald-400",
            shadow: "shadow-emerald-500/30",
            icon: <CheckCircle className="w-6 h-6 text-white" />,
        },
        {
            label: "Pending Orders",
            value: pendingPOs,
            gradient: "from-amber-600 to-amber-400",
            shadow: "shadow-amber-500/30",
            icon: <Clock className="w-6 h-6 text-white" />,
        },
        {
            label: "Rejected Orders",
            value: rejectedPOs,
            gradient: "from-rose-600 to-rose-400",
            shadow: "shadow-rose-500/30",
            icon: <XCircle className="w-6 h-6 text-white" />,
        },
    ];

    // Dummy currency for now
    const currency = "BDT";

    const deletePurchaseOrder = useDeletePurchaseOrderMutation();
    const updatePurchaseOrder = useUpdatePurchaseOrderMutation();

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPOId, setSelectedPOId] = useState<number | null>(null);

    /* DELETE HANDLER */
    const handleDelete = useCallback(async () => {
        if (!selectedPOId) return;

        try {
            const res = await deletePurchaseOrder.mutateAsync(selectedPOId);
            if (res.status) {
                toast.success("Purchase Order Deleted Successfully");
            } else {
                toast.error(res?.message || "Delete failed");
            }
        } catch (error: any) {
            toast.error(error.message || "Delete failed");
        } finally {
            setModalOpen(false);
            setSelectedPOId(null);
        }
    }, [selectedPOId, deletePurchaseOrder]);

    const handleApprove = async (id: number) => {
        try {
            const res = await updatePurchaseOrder.mutateAsync({ id, body: { status: "approved" } });
            if (res.status) {
                toast.success("Purchase Order Approved Successfully");
            } else {
                toast.error(res?.message || "Approve failed");
            }
        } catch (error: any) {
            toast.error(error.message || "Approve failed");
        }
    };

    /* COLUMNS */
    const poColumns: ColumnDef<PurchaseOrder>[] = [
        {
            accessorKey: "po_number",
            header: "PO Number",
            meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[120px]" } as any
        },
        {
            accessorKey: "supplier",
            header: "Supplier",
            meta: { className: "md:sticky md:left-[120px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any,
            cell: ({ row }) => `${row.original.supplier?.name || "N/A"}`,
        },
        {
            accessorKey: "order_date",
            header: "Order Date",
            cell: ({ row }) => new Date(row.original.order_date as string).toLocaleDateString(),
        },
        {
            accessorKey: "expected_delivery_date",
            header: "Expected Delivery Date",
            cell: ({ row }) => new Date(row.original.expected_delivery_date as string).toLocaleDateString(),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;

                const color =
                    status === "pending"
                        ? "bg-yellow-500"
                        : status === "approved"
                            ? "bg-blue-600"
                            : status === "rejected"
                                ? "bg-red-600"
                                : "bg-green-600";

                return <Badge className={`${color} text-white capitalize`}>{status}</Badge>;
            },
        },
        {
            accessorKey: "total_amount",
            header: () => <div className="text-right">Total Price ({currency})</div>,
            cell: ({ row }) => (
                <div className="text-right">{(row.original.total_amount || 0).toFixed(2)}</div>
            ),
        },
        {
            accessorKey: "discount_amount",
            header: () => (
                <div className="text-right">Total Discount ({currency})</div>
            ),
            cell: ({ row }) => (
                <div className="text-right">
                    {(row.original.discount_amount || 0).toFixed(2)}
                </div>
            ),
        },
        {
            accessorKey: "tax_amount",
            header: () => <div className="text-right">Tax Amount ({currency})</div>,
            cell: ({ row }) => (
                <div className="text-right">{(row.original.tax_amount || 0).toFixed(2)}</div>
            ),
        },
        {
            accessorKey: "total_payable_amount",
            header: () => <div className="text-right">Total Payable ({currency})</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    {(row.original.total_payable_amount || 0).toFixed(2)}
                </div>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const po = row.original;
                const isEditable = !["approved", "received", "delivered"].includes(po.status); // hide for approved, received, delivered
                const isPending = po.status === "pending";

                return (
                    <div className="flex gap-2">
                        {isPending && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-600 border-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                                onClick={() => handleApprove(Number(po.id))}
                                disabled={updatePurchaseOrder.isPending}
                                title="Approve Order"
                            >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                            </Button>
                        )}

                        <Link to="/purchase/order/$id" params={{ id: String(po.id) }}>
                            <Button size="sm" variant="outline" className="hover:bg-primary hover:text-white transition-colors">
                                <Eye className="w-4 h-4 mr-1" /> View
                            </Button>
                        </Link>

                        {isEditable && (
                            <>
                                <Link to="/purchase/order/$id/edit" params={{ id: String(po.id) }}>
                                    <Button size="sm" variant="outline" className="hover:bg-primary/90 hover:text-white transition-colors">
                                        <Edit className="w-4 h-4 mr-1" /> Edit
                                    </Button>
                                </Link>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white transition-colors"
                                    onClick={() => {
                                        setSelectedPOId(Number(po.id));
                                        setModalOpen(true);
                                    }}
                                    disabled={deletePurchaseOrder.isPending}
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    {deletePurchaseOrder.isPending ? "Deleting..." : "Delete"}
                                </Button>
                            </>
                        )}
                    </div>
                );
            },
        }
    ];

    return (
        <>
            <Header fixed>
                <TopNav links={topNav} />
                <div className="ms-auto flex items-center space-x-4">
                    <Search />
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>
            <main className="p-6 lg:p-10">
                <div className="w-full space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-red-500 font-mono border border-red-200 bg-red-50 px-2 py-1 rounded">
                                Debug: Loaded {purchaseOrders.length} | Total {pagination.total}
                            </span>
                            <Button asChild>
                                <Link to="/purchase/order/create">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create Order
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                    <Card className="border shadow-xl overflow-hidden pb-2">
                        <CardHeader className="border-b bg-muted/30 pb-4">
                            <CardTitle className="text-xl font-bold">All Purchase Orders</CardTitle>
                            <CardDescription>Manage and monitor your supply chain procurement</CardDescription>
                        </CardHeader>

                        <CardContent>
                            <DataTable
                                columns={poColumns}
                                data={purchaseOrders}
                                meta={{
                                    page: page,
                                    limit: limit,
                                    total: pagination.total,
                                }}
                                onPageChange={(newPageIndex) => setPage(newPageIndex)}
                                search={search}
                                onSearchChange={(value) => {
                                    setSearch(value);
                                    setPage(1);
                                }}
                            />
                        </CardContent>
                    </Card>

                    {/* Delete confirmation modal */}
                    <ConfirmModal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onConfirm={handleDelete}
                        message="Are you sure you want to delete this purchase order? This action cannot be undone."
                    />
                </div>
            </main>
        </>
    );
}
