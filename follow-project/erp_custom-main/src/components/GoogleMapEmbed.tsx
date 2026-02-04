
"use client";

import { useMemo } from "react";
import {
    GoogleMap,
    useJsApiLoader,
    MarkerF,
    PolylineF,
} from "@react-google-maps/api";

interface MapEmbedProps {
    center: { lat: number; lng: number };
    zoom: number;
    startLocation: { lat: number; lng: number; name: string };
    endLocation: { lat: number; lng: number; name: string };
    customerMarkers?: Array<{ lat: number; lng: number; name: string }>;
}

const containerStyle = { width: "100%", height: "100%" };

export const GoogleMapEmbed = ({ center, zoom, startLocation, endLocation, customerMarkers = [] }: MapEmbedProps) => {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    });

    // Create the sequential path: Start -> Customers -> End
    const routePath = useMemo(() => {
        return [
            { lat: startLocation.lat, lng: startLocation.lng },
            ...customerMarkers.map(c => ({ lat: c.lat, lng: c.lng })),
            { lat: endLocation.lat, lng: endLocation.lng }
        ];
    }, [startLocation, endLocation, customerMarkers]);

    if (!isLoaded) return <div className="w-full h-full bg-muted animate-pulse" />;

    return (
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={zoom}>

            {/* 1. The GPS Tracking Line (The Route) */}
            <PolylineF
                path={routePath}
                options={{
                    strokeColor: "#3b82f6", // Vibrant Blue
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                    icons: [
                        {
                            icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
                            offset: "0",
                            repeat: "20px", // Dotted effect
                        },
                        {
                            // Directional arrows like GPS
                            icon: { path: "M -2,0 0,2 2,0", strokeColor: "#ffffff", strokeWeight: 2 },
                            offset: "50%",
                            repeat: "50px",
                        }
                    ],
                }}
            />

            {/* 2. Start Marker (Green) */}
            <MarkerF
                position={startLocation}
                label="START"
                icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
            />

            {/* 3. Sequential Customer Markers */}
            {customerMarkers.map((customer, index) => (
                <MarkerF
                    key={index}
                    position={{ lat: customer.lat, lng: customer.lng }}
                    label={(index + 1).toString()} // Shows visit order
                    title={customer.name}
                />
            ))}

            {/* 4. End Marker (Flag/Finish) */}
            <MarkerF
                position={endLocation}
                label="END"
                icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            />

        </GoogleMap>
    );
};






/* 
  -------------- uses example  ------------------------

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


*/