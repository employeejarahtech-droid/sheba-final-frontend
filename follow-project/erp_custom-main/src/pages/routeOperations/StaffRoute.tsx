/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";


import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Phone, Mail, Truck, User, ArrowRight, ChevronRight, Check, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useGetAllStaffWiseRoutesQuery, type StaffWiseRoutes, } from "@/store/features/staffs/staffApiService";
import { useGetAllSalesRouteQuery, useAssignStaffMutation } from "@/store/features/salesRoute/salesRoute";




const StaffRoute = () => {
    const navigate = useNavigate();

    // Staff Pagination State
    const [staffPage, setStaffPage] = useState(1);
    const [allStaff, setAllStaff] = useState<StaffWiseRoutes[]>([]);
    const [hasMoreStaff, setHasMoreStaff] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole,] = useState<string | null>(null);
    const [explicitSelectedId, setExplicitSelectedId] = useState<string | number | null>(null);

    // Fetch Staff Data
    const { data: routeData, isFetching: isStaffFetching } = useGetAllStaffWiseRoutesQuery({
        page: staffPage,
        limit: 15,
        search: searchTerm
    });

    const handleSearchChange = (val: string) => {
        setSearchTerm(val);
        setStaffPage(1);
        setAllStaff([]);
        setHasMoreStaff(true);
    };

    // const handleFilterRoleChange = (val: string | null) => {
    //     setFilterRole(val);
    //     setStaffPage(1);
    //     setAllStaff([]);
    //     setHasMoreStaff(true);
    // };

    // Append new staff data
    useEffect(() => {
        if (routeData && Array.isArray(routeData.data)) {
            if (routeData.data.length === 0) {
                // eslint-disable-next-line
                setHasMoreStaff(false);
            } else {
                setAllStaff(prev => {
                    if (staffPage === 1) return routeData.data;
                    const existingIds = new Set(prev.map(s => s.id));
                    const newItems = routeData.data.filter(s => !existingIds.has(s.id));
                    return [...prev, ...newItems];
                });
                if (routeData.data.length < 15) setHasMoreStaff(false);
            }
        }
    }, [routeData, staffPage]);

    // Infinite Scroll Observer for Staff
    const staffObserver = useRef<IntersectionObserver | null>(null);
    const lastStaffElementRef = useCallback((node: HTMLButtonElement) => {
        if (isStaffFetching) return;
        if (staffObserver.current) staffObserver.current.disconnect();
        staffObserver.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMoreStaff) {
                setStaffPage(prev => prev + 1);
            }
        });
        if (node) staffObserver.current.observe(node);
    }, [isStaffFetching, hasMoreStaff]);


    // Route Search & Assignment States
    const [routeSearchTerm, setRouteSearchTerm] = useState("");
    const [isAssignModalOpen, setIsAssignModal] = useState(false);
    const [selectedRouteIdToAssign, setSelectedRouteIdToAssign] = useState<number | null>(null);

    // Route Assignment Pagination
    const [assignSearchTerm, setAssignSearchTerm] = useState("");
    const [assignPage, setAssignPage] = useState(1);
    const [allAssignRoutes, setAllAssignRoutes] = useState<any[]>([]);
    const [hasMoreRoutes, setHasMoreRoutes] = useState(true);

    const selectedStaffId = explicitSelectedId ?? (allStaff.length > 0 ? allStaff[0].id : null);

    // Fetch Available Routes
    const { data: allRoutesData, isFetching: isRoutesFetching } = useGetAllSalesRouteQuery({
        search: assignSearchTerm,
        limit: 15,
        page: assignPage
    }, { skip: !isAssignModalOpen });

    const handleAssignSearchChange = (val: string) => {
        setAssignSearchTerm(val);
        setAssignPage(1);
        setAllAssignRoutes([]);
        setHasMoreRoutes(true);
    };

    const handleAssignModalOpenChange = (open: boolean) => {
        setIsAssignModal(open);
        if (open) {
            setAssignPage(1);
            setAllAssignRoutes([]);
            setHasMoreRoutes(true);
            setAssignSearchTerm(""); // Optionally reset search too on open
        }
    };

    // Append routes logic (Handling the response structure properly)
    useEffect(() => {
        // allRoutesData returns { data: [], pagination: {} } based on salesRoute.ts types
        // But let's handle if it returns array directly or checks data property
        const routes = allRoutesData?.data || (Array.isArray(allRoutesData) ? allRoutesData : []);

        if (routes) {
            if (routes.length === 0) {
                // eslint-disable-next-line
                setHasMoreRoutes(false);
            } else {
                setAllAssignRoutes(prev => {
                    if (assignPage === 1) return routes;
                    const existingIds = new Set(prev.map(r => r.id));
                    const newItems = routes.filter((r: any) => !existingIds.has(r.id));
                    return [...prev, ...newItems];
                });
                if (routes.length < 15) setHasMoreRoutes(false);
            }
        }
    }, [allRoutesData, assignPage]);

    // Infinite Scroll Observer for Routes
    const routeObserver = useRef<IntersectionObserver | null>(null);
    const lastRouteElementRef = useCallback((node: HTMLDivElement) => {
        if (isRoutesFetching) return;
        if (routeObserver.current) routeObserver.current.disconnect();
        routeObserver.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMoreRoutes) {
                setAssignPage(prev => prev + 1);
            }
        });
        if (node) routeObserver.current.observe(node);
    }, [isRoutesFetching, hasMoreRoutes]);

    const assignStaff = useAssignStaffMutation()[0];
    const isAssigning = useAssignStaffMutation()[1].isLoading;

    const handleAssignRoute = async () => {
        if (!selectedRouteIdToAssign || !selectedStaffId) return;

        try {
            await assignStaff({
                routeId: selectedRouteIdToAssign,
                body: { staff_ids: [Number(selectedStaffId)] }
            }).unwrap();
            setIsAssignModal(false);
            setSelectedRouteIdToAssign(null);
            // No need to manually refetch, tag invalidation handles it
        } catch (error) {
            console.error("Failed to assign route", error);
        }
    };

    // Client-side filtering logic for the list we have so far (optional, but keep for role since likely not on API)
    const filteredStaff = allStaff.filter(staff => {
        // Search is handled by API, but we keep this just in case for mixed results or instant feedback if typing slow
        // Actually, if API handles search, we can remove the name check here or keep it for safety.
        // Let's rely on API for name search, and CLIENT for role filter (since role param might not exist)
        const matchesRole = filterRole ? staff.role === filterRole : true;
        return matchesRole;
    });

    const selectedStaff = allStaff.find(s => s.id === selectedStaffId);

    // Filter staff's assigned routes locally
    const assignedRoutesFiltered = selectedStaff?.routes.filter(route =>
        route.name.toLowerCase().includes(routeSearchTerm.toLowerCase()) ||
        String(route.id).includes(routeSearchTerm)
    ) || [];

    // Calculate summary stats for selected staff
    const totalOrders = selectedStaff?.routes.reduce((acc, r) => acc + r.orders, 0) || 0;


    return (
        <div className="flex h-[calc(100vh-6rem)] gap-4 overflow-hidden bg-background">
            {/* Left Sidebar: Staff List */}
            <Card className="w-1/3 min-w-[300px] flex flex-col h-full border-r shadow-sm p-2 overflow-hidden">
                <CardHeader className="pb-3 border-b bg-card">
                    <CardTitle className="text-xl font-bold flex items-center justify-between">
                        <span>Staff Directory</span>
                        <Badge variant="outline" className="text-xs font-normal">
                            {filteredStaff.length} Members
                        </Badge>
                    </CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or ID..."
                            className="pl-8 bg-background"
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>
                    {/* Simple Filter Pills */}
                    {/* <div className="flex gap-2 mt-2 overflow-x-auto pb-1 no-scrollbar">
                        <Button
                            variant={filterRole === null ? "default" : "outline"}
                            size="xs"
                            className="h-7 text-xs rounded-full"
                            onClick={() => handleFilterRoleChange(null)}
                        >
                            All
                        </Button>
                        <Button
                            variant={filterRole === "Sales Representative" ? "default" : "outline"}
                            size="xs"
                            className="h-7 text-xs rounded-full whitespace-nowrap"
                            onClick={() => handleFilterRoleChange("Sales Representative")}
                        >
                            Sales Rep
                        </Button>
                        <Button
                            variant={filterRole === "Delivery Driver" ? "default" : "outline"}
                            size="xs"
                            className="h-7 text-xs rounded-full whitespace-nowrap"
                            onClick={() => handleFilterRoleChange("Delivery Driver")}
                        >
                            Drivers
                        </Button>
                    </div> */}
                </CardHeader>
                <ScrollArea className="flex-1 min-h-0 bg-muted/5">
                    <div className="flex flex-col p-2 gap-1">
                        {filteredStaff.map((staff, index) => {
                            const isLastElement = index === filteredStaff.length - 1;
                            return (
                                <button
                                    ref={isLastElement ? lastStaffElementRef : null}
                                    key={staff.id}
                                    onClick={() => setExplicitSelectedId(staff.id)}
                                    className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all hover:bg-accent group
                                        ${selectedStaffId === staff.id ? "bg-accent border-l-4 border-l-primary shadow-sm pl-2" : "border-l-4 border-l-transparent"}
                                    `}
                                >
                                    <Avatar className="h-10 w-10 border bg-background">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${staff.name}`} />
                                        <AvatarFallback>{staff.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className={`font-semibold text-sm truncate ${selectedStaffId === staff.id ? "text-primary" : "text-foreground"}`}>
                                                {staff.name}
                                            </span>
                                            {!staff.active && (
                                                <span className="h-2 w-2 rounded-full bg-muted-foreground/30" title="Inactive" />
                                            )}
                                        </div>
                                        <div className="flex items-center text-xs text-muted-foreground truncate gap-1">
                                            {staff.role === "Delivery Driver" ? <Truck className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                            <span className="truncate">{staff.role}</span>
                                        </div>
                                    </div>
                                    {selectedStaffId === staff.id && (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50" />
                                    )}
                                </button>
                            );
                        })}
                        {isStaffFetching && <div className="p-2 text-center text-xs text-muted-foreground">Loading more...</div>}
                    </div>
                </ScrollArea>
            </Card>

            {/* Right Panel: Detailed View */}
            <Card className="flex-1 flex flex-col h-full shadow-sm overflow-hidden border-none bg-transparent">
                {selectedStaff ? (
                    <div className="flex flex-col h-full gap-4">
                        {/* Profile Header Card */}
                        <div className="bg-card rounded-xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                            <div className="flex items-center gap-5">
                                <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedStaff.name}`} />
                                    <AvatarFallback className="text-xl">{selectedStaff.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-2xl font-bold">{selectedStaff.name}</h2>
                                        <Badge variant={selectedStaff.active ? "default" : "secondary"}>
                                            {selectedStaff.active ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground font-medium flex items-center gap-2 mb-2">
                                        {selectedStaff.role}
                                        <span className="text-muted-foreground/30">•</span>
                                        <span className="text-sm">ID: {selectedStaff.id}</span>
                                    </p>
                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                                            <Mail className="h-3.5 w-3.5" />
                                            {selectedStaff.email}
                                        </div>
                                        <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                                            <Phone className="h-3.5 w-3.5" />
                                            {selectedStaff.phone}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex gap-6 pr-4 border-l pl-6 max-md:border-l-0 max-md:pl-0 max-md:pt-4 max-md:border-t">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{selectedStaff.routes.length}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Assigned Routes</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">{totalOrders}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Active Orders</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{selectedStaff.stats.rating}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Rating</div>
                                </div>
                            </div>
                        </div>

                        {/* Routes Content */}
                        <Card className="flex-1 flex flex-col overflow-hidden border">
                            <CardHeader className="py-4 px-6 border-b bg-muted/5 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Assigned Routes</CardTitle>
                                    <CardDescription>Territories and areas covered by this staff member</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative w-48">
                                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Search Routes..."
                                            className="h-8 pl-8 text-xs bg-background"
                                            value={routeSearchTerm}
                                            onChange={(e) => setRouteSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Dialog open={isAssignModalOpen} onOpenChange={handleAssignModalOpenChange}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" className="gap-2">
                                                <MapPin className="h-4 w-4" /> Assign New Route
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[500px]">
                                            <DialogHeader>
                                                <DialogTitle>Assign New Route</DialogTitle>
                                                <DialogDescription>
                                                    Select a route to assign to {selectedStaff?.name}.
                                                    This will grant them access to all orders within this route.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="py-4 space-y-4">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search available routes..."
                                                        className="pl-9"
                                                        value={assignSearchTerm}
                                                        onChange={(e) => handleAssignSearchChange(e.target.value)}
                                                    />
                                                </div>

                                                <ScrollArea className="h-[300px] border rounded-md p-2">
                                                    {allAssignRoutes.length === 0 && !isRoutesFetching ? (
                                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                                            <MapPin className="h-8 w-8 opacity-20" />
                                                            <p className="text-sm">No routes found</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {allAssignRoutes.map((route, index) => {
                                                                const isLastRoute = index === allAssignRoutes.length - 1;
                                                                const isAlreadyAssigned = selectedStaff?.routes.some(r => r.id === route.id);
                                                                const isSelected = selectedRouteIdToAssign === route.id;

                                                                return (
                                                                    <div
                                                                        ref={isLastRoute ? lastRouteElementRef : null}
                                                                        key={route.id}
                                                                        onClick={() => !isAlreadyAssigned && setSelectedRouteIdToAssign(route.id)}
                                                                        className={`
                                                                            flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                                                                            ${isAlreadyAssigned
                                                                                ? "opacity-50 cursor-not-allowed bg-muted"
                                                                                : isSelected
                                                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                                                    : "hover:bg-accent hover:border-accent-foreground/20"
                                                                            }
                                                                        `}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`p-2 rounded-full ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                                                                <MapPin className="h-4 w-4" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-medium text-sm">{route.route_name}</p>
                                                                                <p className="text-xs text-muted-foreground">ID: {route.id}</p>
                                                                            </div>
                                                                        </div>
                                                                        {isAlreadyAssigned ? (
                                                                            <Badge variant="secondary" className="text-xs">Assigned</Badge>
                                                                        ) : isSelected && (
                                                                            <Check className="h-4 w-4 text-primary" />
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                            {isRoutesFetching && <div className="text-center text-xs text-muted-foreground py-2">Loading more routes...</div>}
                                                        </div>
                                                    )}
                                                </ScrollArea>
                                            </div>

                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => handleAssignModalOpenChange(false)}>Cancel</Button>
                                                <Button
                                                    onClick={handleAssignRoute}
                                                    disabled={!selectedRouteIdToAssign || isAssigning}
                                                >
                                                    {isAssigning ? "Assigning..." : "Assign Route"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardHeader>
                            <ScrollArea className="flex-1 bg-muted/5 p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {assignedRoutesFiltered.map((route) => (
                                        <div
                                            key={route.id}
                                            className="bg-card rounded-lg border p-4 shadow-sm hover:shadow-md transition-all hover:border-primary/50 group"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-primary/10 p-2 rounded-full text-primary">
                                                        <MapPin className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-sm line-clamp-1" title={route.name}>{route.name}</h4>
                                                        <p className="text-xs text-muted-foreground">{route.id}</p>
                                                    </div>
                                                </div>
                                                <Badge variant={route.status === "Active" ? "outline" : "secondary"} className="text-xs">
                                                    {route.status}
                                                </Badge>
                                            </div>

                                            <Separator className="my-3" />

                                            <div className="flex justify-between items-center text-sm">
                                                <div className="text-muted-foreground">
                                                    Current Load: <span className="font-medium text-foreground">{route.orders} Orders</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="xs"
                                                    className="h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => navigate(`/dashboard/sales/sales-routes/${route.id}`)}
                                                >
                                                    View Details <ArrowRight className="ml-1 h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Route Placeholder */}
                                    <div
                                        onClick={() => handleAssignModalOpenChange(true)}
                                        className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[120px] cursor-pointer"
                                    >
                                        <div className="bg-muted p-3 rounded-full mb-2 group-hover:bg-background">
                                            <Plus className="h-5 w-5" />
                                        </div>
                                        <span className="text-sm font-medium">Assign another route</span>
                                    </div>
                                </div>
                            </ScrollArea>
                        </Card>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-card border rounded-xl">
                        <User className="h-16 w-16 opacity-20 mb-4" />
                        <h3 className="text-xl font-medium">No Staff Selected</h3>
                        <p className="max-w-xs text-center mt-2">Select a staff member from the directory to view detailed route assignments and performance stats.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default StaffRoute;
