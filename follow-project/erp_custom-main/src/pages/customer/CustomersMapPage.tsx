import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useGetCustomerMapsQuery } from "@/store/features/customers/customersApi";

// Default Marker icon fix
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

// Default fallback data ---------------------------
const defaultMapData = {
    total: 3,
    locations: [
        {
            id: 1,
            name: "Rabby Hasan",
            company: "Netmow Group",
            phone: "01700000000",
            email: "rabby@example.com",
            address: "Banani, Dhaka",
            city: "Dhaka",
            coordinates: { lat: 23.7925, lng: 90.4078 }
        },
        {
            id: 2,
            name: "Mahmudul Hasan",
            company: "NextGen IT",
            phone: "01800000000",
            email: "mahmud@example.com",
            address: "Uttara",
            city: "Dhaka",
            coordinates: { lat: 23.8759, lng: 90.3795 }
        },
        {
            id: 3,
            name: "Sadia Akter",
            address: "Chittagong",
            city: "Chattogram",
            coordinates: { lat: 22.3569, lng: 91.7832 }
        }
    ]
};
// -------------------------------------------------

const CustomersMapPage: React.FC = () => {
    const { data } = useGetCustomerMapsQuery();

    // Use API data OR fallback default data
    const mapData = data?.data ?? defaultMapData;

    const customers = mapData.locations;
    const total = mapData.total;

    const defaultCenter: [number, number] = [23.8103, 90.4125];

    const center: [number, number] = customers.length > 0
        ? [customers[0].coordinates.lat, customers[0].coordinates.lng]
        : defaultCenter;

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold mb-4">Customers Map ({total} locations)</h1>

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
                    {customers.map((customer) => (
                        <Marker
                            key={customer.id}
                            position={[customer.coordinates.lat, customer.coordinates.lng]}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <strong>{customer.name}</strong>
                                    {customer.company && <><br />{customer.company}</>}
                                    <br />{customer.address || "-"}
                                    {customer.city && <><br />{customer.city}</>}
                                    {customer.phone && <><br />📱 {customer.phone}</>}
                                    {customer.email && <><br />✉️ {customer.email}</>}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer>

            {customers.length === 0 && (
                <p className="text-center mt-4 text-muted-foreground">
                    No customer locations available
                </p>
            )}
        </div>
    );
};

export default CustomersMapPage;
