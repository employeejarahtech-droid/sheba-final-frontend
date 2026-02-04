
import { useState, useEffect, useRef, useCallback, type ChangeEvent } from "react";
import { Calendar } from "lucide-react";

interface Order {
    id: string;
    customer: string;
    amount: number;
    status: string;
    date: string;
}

interface Route {
    id: string | number;
    name: string;
    region: string;
    orders?: Order[];
}
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MapPin, Package, ArrowRight, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetSalesOrdersByRouteQuery } from "@/store/features/salesOrder/salesOrder";
import { useAppSelector } from "@/store/store";
import { selectCurrency } from "@/store/currencySlice";

// Expanded Dummy Data for "Lots of Orders" (kept for structure reference if needed, but unused for route list logic)
const dummyRoutes: Route[] = [
    {
        id: "R001",
        name: "Dhaka North Route",
        region: "Dhaka",
        orders: Array.from({ length: 50 }).map((_, i) => ({
            id: `ORD-N${1000 + i}`,
            customer: `Customer ${i + 1}`,
            amount: Math.floor(Math.random() * 10000) + 500,
            status: i % 5 === 0 ? "Delivered" : i % 3 === 0 ? "Processing" : "Pending",
            date: "2024-03-20",
        })),
    },
    // ... (rest of dummy data can stay or be removed, keeping for now to avoid large diffs if used elsewhere)
];


const RouteWiseOrder = () => {
    const [selectedRouteId, setSelectedRouteId] = useState<string | number | null>(null);
    const [routeSearch, setRouteSearch] = useState("");
    const [orderSearch, setOrderSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(1);
    const [allRoutes, setAllRoutes] = useState<Route[]>([]);
    const [hasMore, setHasMore] = useState(true);

    const { data: routeData, isFetching } = useGetSalesOrdersByRouteQuery({
        search: routeSearch,
        page: page,
        limit: 10
    });

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setRouteSearch(e.target.value);
        setPage(1);
        setAllRoutes([]);
        setHasMore(true);
    };

    // Handle data update
    useEffect(() => {
        if (routeData?.data) {
            const returnedRoutes = routeData.data as Route[];
            if (page === 1) {
                setAllRoutes(returnedRoutes);
                // Auto-select first route if none selected
                if (!selectedRouteId && returnedRoutes.length > 0) {
                    setSelectedRouteId(returnedRoutes[0].id);
                }
            } else {
                setAllRoutes(prev => {
                    const newRoutes = returnedRoutes.filter((newR) =>
                        !prev.some(existingR => existingR.id === newR.id)
                    );
                    return [...prev, ...newRoutes];
                });
            }

            if (routeData.pagination) {
                setHasMore(routeData.pagination.page < routeData.pagination.totalPage);
            } else {
                // Fallback if pagination info missing
                setHasMore(routeData.data.length === 10);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeData, page]); // Removed selectedRouteId to avoid loop

    // Intersection Observer for Infinite Scroll
    const observer = useRef<IntersectionObserver | null>(null);
    const lastRouteElementRef = useCallback((node: HTMLButtonElement) => {
        if (isFetching) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isFetching, hasMore]);


    const selectedRoute = allRoutes.find((r) => r.id === selectedRouteId) || (dummyRoutes as unknown as Route[]).find((r) => r.id === selectedRouteId);

    // Filter orders locally for the selected route (assuming API returns orders in the route object)
    // Note: If API doesn't return orders, this needs separate fetching, but following current pattern:
    const filteredOrders = selectedRoute?.orders?.filter((order: Order) => {
        // Search filter
        const matchesSearch = (order.customer && String(order.customer).toLowerCase().includes(orderSearch.toLowerCase())) ||
            (order.id && String(order.id).toLowerCase().includes(orderSearch.toLowerCase()));

        // Date filter
        let matchesDateRange = true;
        if (startDate || endDate) {
            const orderDate = new Date(order.date);
            if (startDate) {
                const start = new Date(startDate);
                matchesDateRange = orderDate >= start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // Include the entire end date
                matchesDateRange = matchesDateRange && orderDate <= end;
            }
        }

        return matchesSearch && matchesDateRange;
    }) || [];

    const totalAmount = filteredOrders?.reduce((sum: number, order: Order) => sum + (order.amount || 0), 0) || 0;
    const currency = useAppSelector(selectCurrency);


    return (
        <div className="flex h-[calc(100vh-6rem)] gap-6 p-6 overflow-hidden bg-background">
            {/* Left Sidebar: Route List */}
            <Card className="w-1/3 flex flex-col h-full border-r shadow-sm p-2">
                <CardHeader className="pb-4 border-b bg-card">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Routes
                    </CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search routes..."
                            className="pl-8 bg-background"
                            value={routeSearch}
                            onChange={handleSearchChange}
                        />
                    </div>
                </CardHeader>
                <ScrollArea className="flex-1 ">
                    <div className="p-3 space-y-2">
                        {allRoutes.map((route, index) => {
                            if (allRoutes.length === index + 1) {
                                return (
                                    <button
                                        ref={lastRouteElementRef}
                                        key={route.id}
                                        onClick={() => setSelectedRouteId(route.id)}
                                        className={`w-full text-left p-3 rounded-lg transition-all border hover:bg-accent group
                                            ${selectedRouteId === route.id
                                                ? "bg-primary/5 border-primary shadow-sm"
                                                : "bg-card border-transparent hover:border-border"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-semibold text-sm ${selectedRouteId === route.id ? "text-primary" : "text-foreground"}`}>
                                                {route.name}
                                            </span>
                                            {route.orders && route.orders.length > 0 && (
                                                <Badge variant={selectedRouteId === route.id ? "default" : "secondary"} className="text-xs">
                                                    {route.orders.length}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{route.region}</span>
                                            {selectedRouteId === route.id && <ArrowRight className="h-3 w-3 animate-pulse text-primary" />}
                                        </div>
                                    </button>
                                );
                            } else {
                                return (
                                    <button
                                        key={route.id}
                                        onClick={() => setSelectedRouteId(route.id)}
                                        className={`w-full text-left p-3 rounded-lg transition-all border hover:bg-accent group
                                            ${selectedRouteId === route.id
                                                ? "bg-primary/5 border-primary shadow-sm"
                                                : "bg-card border-transparent hover:border-border"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-semibold text-sm ${selectedRouteId === route.id ? "text-primary" : "text-foreground"}`}>
                                                {route.name}
                                            </span>
                                            {route.orders && route.orders.length > 0 && (
                                                <Badge variant={selectedRouteId === route.id ? "default" : "secondary"} className="text-xs">
                                                    {route.orders.length}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{route.region}</span>
                                            {selectedRouteId === route.id && <ArrowRight className="h-3 w-3 animate-pulse text-primary" />}
                                        </div>
                                    </button>
                                );
                            }
                        })}

                        {isFetching && (
                            <div className="flex justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        )}

                        {!isFetching && allRoutes.length === 0 && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No routes found.
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t bg-muted/20 text-xs text-center text-muted-foreground">
                    Showing {allRoutes.length} routes
                </div>
            </Card>

            {/* Right Panel: Order Details */}
            <Card className="flex-1 flex flex-col h-full shadow-sm overflow-hidden p-2">
                {selectedRoute ? (
                    <>
                        {/* Header Section */}
                        <CardHeader className="pb-5 border-b bg-card/50 backdrop-blur-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                        {selectedRoute.name}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-2">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {selectedRoute.region}
                                    </CardDescription>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="text-sm text-muted-foreground font-medium">Total Volume</div>
                                    <div className="text-2xl font-bold text-primary flex items-center gap-1">
                                        {currency} {totalAmount.toLocaleString()}

                                    </div>
                                </div>
                            </div>

                            {/* Toolbar */}
                            <div className="flex flex-col gap-4 mt-6 lg:flex-row lg:items-center lg:justify-between">
                                <div className="relative w-full lg:flex-1 lg:max-w-md">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search orders, customers..."
                                        className="pl-8 w-full"
                                        value={orderSearch}
                                        onChange={(e) => setOrderSearch(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-2 border rounded-md px-3 py-2 bg-background">
                                    {/* Icon */}
                                    <Calendar className="h-4 w-4 text-muted-foreground" />

                                    {/* From date */}
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-8 w-[140px] text-sm font-normal cursor-pointer border-none shadow-none focus-visible:ring-0 px-1"
                                    />

                                    {/* Separator */}
                                    <span className="text-muted-foreground text-sm">–</span>

                                    {/* To date */}
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-8 w-[140px] text-sm font-normal cursor-pointer border-none shadow-none focus-visible:ring-0 px-1"
                                    />

                                    {/* Clear button */}
                                    {(startDate || endDate) && (
                                        <button
                                            onClick={() => {
                                                setStartDate("")
                                                setEndDate("")
                                            }}
                                            className="ml-1 text-muted-foreground hover:text-foreground transition"
                                            aria-label="Clear date range"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* <div className="flex gap-2 ml-auto">
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Filter className="h-4 w-4" />
                                        Filter
                                    </Button>
                                    <Button variant="default" size="sm" className="gap-2">
                                        <Package className="h-4 w-4" />
                                        Export List
                                    </Button>
                                </div> */}
                            </div>
                        </CardHeader>

                        {/* Order List Table */}
                        <div className="flex-1 overflow-auto bg-muted/5 px-2">
                            <Table>
                                <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                                    <TableRow>
                                        <TableHead className="w-[100px]">Order ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders && filteredOrders.length > 0 ? (
                                        filteredOrders.map((order) => (
                                            <TableRow key={order.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                                                <TableCell className="font-medium text-primary">{order.id}</TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${order.customer}`} />
                                                            <AvatarFallback>{order.customer.substring(0, 2)}</AvatarFallback>
                                                        </Avatar>
                                                        {order.customer}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{order.date}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            order.status === "Delivered" ? "default" :
                                                                order.status === "Pending" ? "outline" : "secondary"
                                                        }
                                                        className={
                                                            order.status === "Delivered" ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" :
                                                                order.status === "Processing" ? "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200" :
                                                                    "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200"
                                                        }
                                                    >
                                                        {order.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {currency} {order.amount.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <Package className="h-8 w-8 mb-2 opacity-50" />
                                                    <p>No orders found matching your search.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="p-4 border-t bg-card text-xs text-muted-foreground flex justify-between">
                            <span>Total Orders: {filteredOrders?.length || 0}</span>
                            <span>Selected Route: {selectedRoute.id}</span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                        <MapPin className="h-16 w-16 opacity-20" />
                        <div className="text-xl font-medium">No Route Selected</div>
                        <p className="text-sm max-w-xs text-center">Select a route from the sidebar to view its orders and details.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default RouteWiseOrder;
