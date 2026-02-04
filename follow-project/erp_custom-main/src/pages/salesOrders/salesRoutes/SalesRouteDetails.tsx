
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  MapPin,
  Users,
  Settings,
  Navigation,
  Info,
  // Edit2,
  ShoppingCart,
  DollarSign,
  User,

} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { useGetSalesRouteByIdQuery } from "@/store/features/salesRoute/salesRoute";
import { GoogleMapEmbed } from "@/components/GoogleMapEmbed";
import type { Staff } from "@/types/staff.types";

export default function SalesRouteDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading, isError } = useGetSalesRouteByIdQuery(id as string);
  const route = data?.data;

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading route details...</div>;
  if (isError || !route) return <div className="p-8 text-center text-red-500">Failed to load route details.</div>;

  // Helper to determine status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{route.route_name}</h1>
            <p className="text-muted-foreground flex items-center gap-1 text-sm">
              <MapPin className="h-3 w-3" /> {route.city}, {route.state}
            </p>
          </div>
        </div>
        {/* <Button className="gap-2 shadow-sm">
          <Edit2 className="h-4 w-4" />
          Edit Route
        </Button> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Map & Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-none shadow-md">
            <div className="h-[400px] w-full bg-muted">
              <GoogleMapEmbed
                center={{ lat: route.center_lat, lng: route.center_lng }}
                zoom={route.zoom_level}
                startLocation={{
                  lat: route.center_lat, // Or specific start_lat if you have it
                  lng: route.center_lng,
                  name: route.start_location
                }}
                endLocation={{
                  lat: route.end_lat || route.center_lat,
                  lng: route.end_lng || route.center_lng,
                  name: route.end_location
                }}
                customerMarkers={route.customers?.map((c: any) => ({
                  lat: c.latitude,
                  lng: c.longitude,
                  name: c.name
                }))}
              />
            </div>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Navigation className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Route Path</h3>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="text-center flex-1">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Start Point</p>
                  <p className="font-medium text-sm">{route.start_location}</p>
                </div>
                <div className="h-px flex-1 bg-linear-to-r from-transparent via-border to-transparent relative mx-4">
                  <div className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                </div>
                <div className="text-center flex-1">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">End Point</p>
                  <p className="font-medium text-sm">{route.end_location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {route.description && (
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <h4 className="font-semibold flex items-center gap-2 mb-3 text-sm">
                  <Info className="h-4 w-4 text-primary" />
                  Route Description
                </h4>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {route.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Metadata & Assignments */}
        <div className="space-y-6">
          {/* Geographic Details */}
          <Card className="shadow-sm py-6">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Country" value={route.country} />
                <DetailItem label="Postal Code" value={route.postal_code} />
              </div>
              <Separator className="opacity-50" />
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <Settings className="h-3 w-3" /> Technical Specs
                </h5>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <span className="text-muted-foreground">Radius:</span>
                  <span className="font-mono font-medium text-right">{route.coverage_radius} km</span>
                  <span className="text-muted-foreground">Coordinates:</span>
                  <span className="font-mono font-medium text-right text-[10px]">
                    {route.center_lat}, {route.center_lng}
                  </span>
                  <span className="text-muted-foreground">Zoom:</span>
                  <span className="font-mono font-medium text-right text-[10px]">
                    {route.zoom_level}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>


          <Card className="py-6">
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Assigned Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {route.assignedStaffMembers && route.assignedStaffMembers.length > 0 ? (
                  route.assignedStaffMembers.map((staff: Staff) => (
                    <Link to={`/dashboard/staffs/${staff.id}`} >
                      <Badge key={staff.id} variant="secondary" className="px-3 py-1 gap-1 font-normal">
                        <User className="h-3 w-3" /> {staff.first_name + " " + staff.last_name}
                      </Badge>
                    </Link>

                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No staff assigned</p>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Customer & Orders Section */}
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="py-4 border-b-1 bg-muted/20 gap-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Customers</span>
                <Badge variant="outline" className="font-mono">{route?.customers?.length || 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {route?.customers && route?.customers.length > 0 ? (
                  route?.customers?.map((c: any) => {
                    const totalSpent = c.orders?.reduce((acc: number, curr: any) => acc + curr.total_amount, 0) || 0;
                    const lastOrder = c.orders?.[0];

                    return (
                      <div key={c.id} className="p-4 hover:bg-muted/30 transition-colors space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold leading-none">{c.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">{c.address}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-mono text-muted-foreground">
                              {c.latitude?.toFixed(4)}, {c.longitude?.toFixed(4)}
                            </p>
                          </div>
                        </div>

                        {/* Order Insights Row */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[11px] font-medium text-primary">
                            <ShoppingCart className="h-3 w-3" /> {c.orders?.length || 0} Orders
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-medium text-green-600">
                            <DollarSign className="h-3 w-3" /> ${totalSpent.toLocaleString()}
                          </div>
                          {lastOrder && (
                            <Badge variant="outline" className={`ml-auto text-[9px] px-1.5 h-5 capitalize ${getStatusColor(lastOrder.status)}`}>
                              {lastOrder.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground italic">No customers assigned</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{label}</h4>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

