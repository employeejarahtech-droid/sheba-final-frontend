import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { MapEmbed } from "@/components/MapEmbed";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export default function RouteDetails() {
  return (
    <div className="w-full h-screen p-4 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Downtown Area</h1>
          <p className="text-sm text-muted-foreground">
            Central business district
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/dashboard/sales/sales-routes">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to routes
            </Button>
          </Link>
          <Link to={`/dashboard/sales-routes/${1}/assign`}>
            <Button>Assign</Button>
          </Link>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-row gap-4 overflow-hidden">
        {/* Map */}
        <div className="w-full max-w-[calc(100%-360px)]">
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <MapEmbed />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[360px] flex flex-col gap-4 overflow-y-auto pr-2">
          {/* Area Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Area Details</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>
                <strong>Country:</strong> Malaysia
              </p>
              <p>
                <strong>State:</strong> Wilayah Persekutuan
              </p>
              <p>
                <strong>City:</strong> Kuala Lumpur
              </p>
              <p>
                <strong>Center:</strong> - , -
              </p>
            </CardContent>
          </Card>

          {/* Assigned Staff */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Staff</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              No staff assigned
            </CardContent>
          </Card>

          {/* Assigned Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Assigned Customers (2)
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Customers with coordinates will appear on the map.
              </p>
            </CardHeader>

            <CardContent className="text-sm space-y-4">
              <div>
                <p className="font-medium">Arif R.</p>
              </div>

              <Separator />

              <div>
                <p className="font-medium">Modern Enterprises</p>
                <p className="text-xs text-muted-foreground">
                  (5.41640000, 100.33270000)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
