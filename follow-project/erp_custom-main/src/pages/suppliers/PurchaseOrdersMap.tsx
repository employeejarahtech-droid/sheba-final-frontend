"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useGetPurchaseMapsQuery } from "@/store/features/purchaseOrder/purchaseOrderApiService";


// Fix default marker icons
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Default fallback data
const defaultMapData = {
    total: 0,
    locations: [],
};

const PurchaseOrdersMapPage: React.FC = () => {
    const { data } =   useGetPurchaseMapsQuery();

    const mapData = data?.data ?? defaultMapData;
    const locations = mapData.locations;
    const total = mapData.total;

    const defaultCenter: [number, number] = [23.8103, 90.4125];
    const center: [number, number] = locations.length > 0 && locations[0].coordinates.lat && locations[0].coordinates.lng
        ? [locations[0].coordinates.lat, locations[0].coordinates.lng]
        : defaultCenter;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">
                Purchase Orders Map ({total} locations)
            </h1>

            <MapContainer
                center={center}
                zoom={6}
                scrollWheelZoom={true}
                className="w-full h-[600px] z-0 rounded-lg shadow"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                />

                <MarkerClusterGroup>
                    {locations
                        .filter(loc => loc.coordinates.lat && loc.coordinates.lng) // filter only valid coordinates
                        .map(loc => (
                        <Marker
                            key={loc.id}
                            position={[loc.coordinates.lat!, loc.coordinates.lng!]}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <strong>{loc.po_number}</strong>
                                    <br />
                                    Status: {loc.status}
                                    <br />
                                    Total: RM {loc.total_amount.toFixed(2)}
                                    <br />
                                    Order Date: {new Date(loc.order_date).toLocaleDateString()}
                                    <br />
                                    Expected Delivery: {new Date(loc.expected_delivery_date).toLocaleDateString()}
                                    <hr className="my-1" />
                                    <strong>Supplier:</strong> {loc.supplier.name}
                                    <br />
                                    Contact: {loc.supplier.contact_person || "-"}
                                    <br />
                                    Phone: {loc.supplier.phone || "-"}
                                    <br />
                                    Email: {loc.supplier.email || "-"}
                                    <br />
                                    Address: {loc.supplier.address || "-"}
                                    <br />
                                    City: {loc.supplier.city || "-"}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer>

            {locations.length === 0 && (
                <p className="text-center mt-4 text-muted-foreground">
                    No purchase order locations available
                </p>
            )}
        </div>
    );
};

export default PurchaseOrdersMapPage;
