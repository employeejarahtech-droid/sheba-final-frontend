/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, UserPlus, Users, CheckCircle2, Package, MapPin, Phone, CreditCard, Clock, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useGetAllSalesOrdersQuery, useGetSalesOrderByIdQuery, useAssignStaffToOrderMutation } from "@/store/features/salesOrder/salesOrder";
import { Input } from "@/components/ui/input";
import type { SalesOrder, SalesOrderItem } from "@/types/salesOrder.types";
import { useGetAllStaffsQuery } from "@/store/features/staffs/staffApiService";
import { useAppSelector } from "@/store/store";
import { selectCurrency } from "@/store/currencySlice";

// Mock Data
const dummyStaff = [
    { id: "S001", name: "Alice Johnson", role: "Sales Rep" },
    { id: "S002", name: "Bob Smith", role: "Driver" },
    { id: "S003", name: "Charlie Brown", role: "Sales Rep" },
    { id: "S004", name: "David Wilson", role: "Driver" },
    { id: "S005", name: "Eve Davis", role: "Manager" },
];

// Initial orders removed to use API data

const OrderManage = () => {
    // Local interface for UI representation
    interface Order {
        total_amount: number;
        id: number | string;
        order_number: string;
        customer: string;
        date: string;
        total: number;
        status: string;
        assignedTo: string[];
        items: { name: string; qty: number; price: number }[];
        address: string;
        contact: string;
    }

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [viewOrderId, setViewOrderId] = useState<string | number | null>(null);
    const [staffSearch, setStaffSearch] = useState("");
    const { data: salesOrderData, isLoading, isFetching } = useGetAllSalesOrdersQuery({ search, page, limit });
    const { data: detailedOrderData, isFetching: isFetchingDetail } = useGetSalesOrderByIdQuery(viewOrderId as string | number, { skip: !viewOrderId });
    const [assignStaff, { isLoading: isAssigning }] = useAssignStaffToOrderMutation();
    const { data: staffData, isFetching: isFetchingStaff } = useGetAllStaffsQuery({ search: staffSearch, limit: 8 });
    // Map API data to local Order interface
    const orders: Order[] = salesOrderData?.data?.map((apiOrder: SalesOrder) => ({
        id: apiOrder.id,
        order_number: apiOrder.order_number,
        customer: apiOrder.customer?.name || "Unknown",
        date: apiOrder.order_date ? new Date(apiOrder.order_date).toLocaleDateString() : "N/A",
        total: Number(apiOrder.total_amount) || 0,
        total_amount: Number(apiOrder.total_amount) || 0,
        status: apiOrder.status,
        assignedTo: (apiOrder.assignedStaff || []).map((staff: any) => staff.id.toString()),
        items: (apiOrder.items || []).map((item: SalesOrderItem) => ({
            name: item.product?.name || "Unknown Item",
            qty: item.quantity,
            price: Number(item.unit_price) || 0
        })),
        address: apiOrder.shipping_address || "No Address Provided",
        contact: apiOrder.customer?.phone || "No Contact"
    })) || [];

    const pagination = salesOrderData?.pagination;
    const [selectedOrders, setSelectedOrders] = useState<(string | number)[]>([]);

    // Dialog State
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

    // View Details State
    const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);

    // Track which orders are being assigned
    const [ordersToAssign, setOrdersToAssign] = useState<(string | number)[]>([]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedOrders(orders.map((o) => o.id));
        } else {
            setSelectedOrders([]);
        }
    };

    const handleSelectRow = (id: string | number, checked: boolean) => {
        if (checked) {
            setSelectedOrders((prev) => [...prev, id]);
        } else {
            setSelectedOrders((prev) => prev.filter((orderId) => orderId !== id));
        }
    };

    const openAssignDialog = (orderIds: (string | number)[]) => {
        setOrdersToAssign(orderIds);

        // If single order, pre-select existing staff (optional but nice)
        if (orderIds.length === 1) {
            const order = orders.find(o => o.id === orderIds[0]);
            if (order) {
                setSelectedStaffIds(order.assignedTo);
            } else {
                setSelectedStaffIds([]);
            }
        } else {
            setSelectedStaffIds([]); // Reset for bulk assignment to avoid confusion
        }

        setIsAssignDialogOpen(true);
    };

    const toggleStaffSelection = (staffId: string) => {
        setSelectedStaffIds(prev =>
            prev.includes(staffId)
                ? prev.filter(id => id !== staffId)
                : [...prev, staffId]
        );
    };

    const handleAssignStaff = async () => {
        if (ordersToAssign.length === 0 || selectedStaffIds.length === 0) {
            toast.error("Please select orders and staff members.");
            return;
        }

        try {
            // If bulk assignment is supported by backend, we should loop or send bulk
            // Assuming the API takes one orderId at a time for now based on the store definition
            // If the backend supports bulk, we should update the store definition.


            const staffIds: number[] = selectedStaffIds.map(id => Number(id));
            for (const orderId of ordersToAssign) {
                await assignStaff({
                    orderId,
                    data: { staff_ids: staffIds }
                }).unwrap();
            }

            toast.success("Staff assigned successfully!");
            setIsAssignDialogOpen(false);
            setOrdersToAssign([]);
            setSelectedOrders([]);
            setSelectedStaffIds([]);
        } catch (error) {
            console.error("Failed to assign staff:", error);
            toast.error("Failed to assign staff. Please try again.");
        }
    };

    const handleViewOrder = (order: Order) => {
        setViewOrderId(order.id);
        setIsViewSheetOpen(true);
    };

    const getStaffDetails = (id: string) => {
        // Try to get from staffData first
        if (staffData?.data) {
            const staff = staffData.data.find((s) => s.id.toString() === id);
            if (staff) {
                return {
                    id: staff.id.toString(),
                    name: `${staff.first_name} ${staff.last_name}`,
                    role: staff.position
                };
            }
        }
        // Fallback to dummy staff
        return dummyStaff.find((s) => s.id === id);
    };


    const currency = useAppSelector(selectCurrency);


    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
                    <p className="text-muted-foreground mt-1">Manage orders, view details, and assign staff.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search orders..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="flex gap-2">
                        {selectedOrders.length > 0 && (
                            <Button
                                variant="secondary"
                                onClick={() => openAssignDialog(selectedOrders)}
                                className="animate-in fade-in slide-in-from-right-5"
                            >
                                <Users className="mr-2 h-4 w-4" />
                                Assign to {selectedOrders.length} Orders
                            </Button>
                        )}
                        {/* <Button>Create New Order</Button> */}
                    </div>
                </div>
            </div>

            <div className="border rounded-md bg-card shadow-sm flex-1">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedOrders.length === orders.length && orders.length > 0}
                                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                />
                            </TableHead>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned Staff</TableHead>
                            <TableHead className="text-right">Total ({currency})</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading || isFetching ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="text-sm text-muted-foreground">Loading orders...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : orders.length > 0 ? (
                            orders.map((order) => (
                                <TableRow key={order.id} className={selectedOrders.includes(order.id) ? "bg-muted/50" : ""}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedOrders.includes(order.id)}
                                            onCheckedChange={(checked) => handleSelectRow(order.id, checked as boolean)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{order.order_number}</TableCell>
                                    <TableCell>{order.customer}</TableCell>
                                    <TableCell>{order.date}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                order.status === "delivered" ? "default" :
                                                    order.status === "pending" ? "secondary" :
                                                        order.status === "cancelled" ? "destructive" : "outline"
                                            }
                                            className={
                                                order.status === "shipped" ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200" : ""
                                            }
                                        >
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {order.assignedTo.length > 0 ? (
                                            <div className="flex items-center -space-x-2 overflow-hidden hover:space-x-1 transition-all duration-300">
                                                {order.assignedTo.map((staffId) => {
                                                    const staff = getStaffDetails(staffId);
                                                    if (!staff) return null;
                                                    return (
                                                        <Avatar key={staffId} className="h-8 w-8 border-2 border-background ring-1 ring-muted" title={staff.name}>
                                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${staff.name}`} />
                                                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                                {staff.name.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic">Unassigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">{(order.total_amount || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="View Details"
                                                onClick={() => handleViewOrder(order)}
                                            >
                                                <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Assign Staff"
                                                onClick={() => openAssignDialog([order.id])}
                                            >
                                                <UserPlus className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <Package className="h-8 w-8 text-muted-foreground opacity-50" />
                                        <p className="text-sm text-muted-foreground">No orders found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                {/* Pagination Controls */}
                {pagination && pagination.totalPage > 1 && (
                    <div className="flex flex-wrap items-center justify-between px-4 py-3 border-t bg-muted/20 gap-3">
                        <div className="text-sm text-muted-foreground">
                            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} orders
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: pagination.totalPage }, (_, i) => i + 1).map((p) => (
                                    <Button
                                        key={p}
                                        variant={page === p ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setPage(p)}
                                        className="h-8 w-8 p-0"
                                    >
                                        {p}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPage))}
                                disabled={page === pagination.totalPage}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Order Sheet */}
            <Sheet open={isViewSheetOpen} onOpenChange={(open) => {
                setIsViewSheetOpen(open);
                if (!open) setViewOrderId(null);
            }}>
                <SheetContent className="sm:max-w-xl">
                    {isFetchingDetail ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground">Fetching order details...</p>
                        </div>
                    ) : detailedOrderData?.data ? (
                        <>
                            <SheetHeader>
                                <div className="flex items-center justify-between">
                                    <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                                        {detailedOrderData.data.order_number}
                                        <Badge variant={detailedOrderData.data.status === "delivered" ? "default" : "secondary"} className="ml-2 text-sm font-normal">
                                            {detailedOrderData.data.status}
                                        </Badge>
                                    </SheetTitle>
                                </div>
                                <SheetDescription>
                                    Order placed on {new Date(detailedOrderData.data.order_date).toLocaleDateString()}
                                </SheetDescription>
                            </SheetHeader>

                            <ScrollArea className="h-[calc(100vh-10rem)] px-4">
                                <div className="space-y-6">
                                    {/* Customer Info */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
                                            <Users className="h-4 w-4" /> Customer Details
                                        </h3>
                                        <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium">Name:</span>
                                                <span className="text-sm">{detailedOrderData.data.customer?.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium">Contact:</span>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Phone className="h-3 w-3" /> {detailedOrderData.data.customer?.phone || "N/A"}
                                                </div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium">Address:</span>
                                                <div className="flex items-center gap-1 text-sm text-right">
                                                    <MapPin className="h-3 w-3" /> {detailedOrderData.data.shipping_address || "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Staff Info (Multiple) */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
                                                <UserPlus className="h-4 w-4" /> Assigned Staff ({(detailedOrderData.data.assignedStaff || []).length})
                                            </h3>
                                        </div>

                                        {(detailedOrderData.data.assignedStaff || []).length > 0 ? (
                                            <div className="bg-muted/30 rounded-lg overflow-hidden flex flex-col">
                                                <ScrollArea className="h-[250px]">
                                                    <div className="p-4 space-y-3">
                                                        {(detailedOrderData.data.assignedStaff || []).map((staff: any) => (
                                                            <div key={staff.id} className="flex items-center justify-between border-b last:border-b-0 pb-3 last:pb-0">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-10 w-10">
                                                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${staff.first_name} ${staff.last_name}`} />
                                                                        <AvatarFallback>{`${staff.first_name.substring(0, 1)}${staff.last_name.substring(0, 1)}`.toUpperCase()}</AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium">{staff.first_name} {staff.last_name}</span>
                                                                        <span className="text-xs text-muted-foreground">{staff.position}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                                    {new Date(staff.OrderStaff.assigned_at).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                                <Button variant="outline" size="sm" className="w-full rounded-none" onClick={() => {
                                                    if (detailedOrderData.data) openAssignDialog([detailedOrderData.data.id]);
                                                }}>
                                                    Reassign Staff
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg">
                                                <span className="text-sm text-muted-foreground italic">No staff assigned yet.</span>
                                                <Button variant="outline" size="sm" onClick={() => {
                                                    if (detailedOrderData.data) openAssignDialog([detailedOrderData.data.id]);
                                                }}>
                                                    Assign Staff
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <Separator />

                                    {/* Items List */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
                                            <Package className="h-4 w-4" /> Order Items
                                        </h3>
                                        <div className="border rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader className="bg-muted/50">
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="h-9">Item</TableHead>
                                                        <TableHead className="h-9 text-right">Qty</TableHead>
                                                        <TableHead className="h-9 text-right">Price</TableHead>
                                                        <TableHead className="h-9 text-right">Total</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {(detailedOrderData.data.items || []).map((item, index) => (
                                                        <TableRow key={index} className="hover:bg-transparent">
                                                            <TableCell className="py-2">{item.product?.name || "Unknown"}</TableCell>
                                                            <TableCell className="text-right py-2">{item.quantity}</TableCell>
                                                            <TableCell className="text-right py-2">${Number(item.unit_price).toLocaleString()}</TableCell>
                                                            <TableCell className="text-right py-2 font-medium">${Number(item.total_price).toLocaleString()}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow className="bg-muted/50 font-medium">
                                                        <TableCell colSpan={3} className="text-right">Grand Total</TableCell>
                                                        <TableCell className="text-right text-primary">${(Number(detailedOrderData.data.total_amount) || 0).toLocaleString()}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Payment Info */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" /> Payment Details
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-muted/30 p-3 rounded-md">
                                                <span className="text-xs text-muted-foreground block text-left">Payment Status</span>
                                                <span className="text-sm font-medium uppercase">{detailedOrderData.data.payment_status}</span>
                                            </div>
                                            <div className="bg-muted/30 p-3 rounded-md">
                                                <span className="text-xs text-muted-foreground block text-left">Delivery Status</span>
                                                <span className="text-sm font-medium flex items-center gap-2 uppercase">
                                                    <Clock className="h-3 w-3" /> {detailedOrderData.data.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Package className="h-10 w-10 opacity-20 mb-2" />
                            <p>Could not load order details.</p>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Assign Dialog - MULTI SELECT */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Staff</DialogTitle>
                        <DialogDescription>
                            Select one or more staff members to assign to {ordersToAssign.length} selected order(s).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search staff by name or position..."
                                className="pl-8"
                                value={staffSearch}
                                onChange={(e) => setStaffSearch(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[250px] border rounded-md p-2">
                            <div className="space-y-1">
                                {isFetchingStaff ? (
                                    <div className="flex items-center justify-center h-32">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : staffData?.data && staffData.data.length > 0 ? (
                                    staffData.data.map((staff) => {
                                        const isSelected = selectedStaffIds.includes(staff.id.toString());
                                        const fullName = `${staff.first_name} ${staff.last_name}`;
                                        return (
                                            <div
                                                key={staff.id}
                                                className={`flex items-center space-x-3 p-2 rounded-md hover:bg-accent cursor-pointer ${isSelected ? 'bg-accent/50' : ''}`}
                                                onClick={() => toggleStaffSelection(staff.id.toString())}
                                            >
                                                <Checkbox
                                                    id={`staff-${staff.id}`}
                                                    checked={isSelected}
                                                    onCheckedChange={() => toggleStaffSelection(staff.id.toString())}
                                                />
                                                <div className="flex items-center gap-3 flex-1">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`} />
                                                        <AvatarFallback>{fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <label
                                                            htmlFor={`staff-${staff.id}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-left"
                                                        >
                                                            {fullName}
                                                        </label>
                                                        <span className="text-xs text-muted-foreground text-left">{staff.position}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                        <Users className="h-8 w-8 opacity-20 mb-1" />
                                        <p className="text-sm">No staff found.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        <div className="mt-2 text-xs text-muted-foreground">
                            {selectedStaffIds.length} staff member{selectedStaffIds.length !== 1 ? 's' : ''} selected
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssignStaff} disabled={isAssigning}>
                            {isAssigning ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Confirm Assignment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OrderManage;
