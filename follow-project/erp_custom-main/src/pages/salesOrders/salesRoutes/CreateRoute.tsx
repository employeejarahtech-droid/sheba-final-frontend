/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Maximize, Navigation, Route, CheckCircle2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { AddressAutocomplete } from "@/components/form/AddressAutocomplete";
import { useAddSalesRouteMutation } from "@/store/features/salesRoute/salesRoute";
import { Textarea } from "@/components/ui/textarea";

// ---------------- Schema ----------------
const FormSchema = z.object({
  routeName: z.string().min(1, "Required"),
  zoomLevel: z.number().min(1).max(22),
  description: z.string().optional(),
  country: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  end_location: z.string(),
  start_location: z.string(),
  postalCode: z.string(),
  centerLat: z.number(),
  centerLng: z.number(),
  coverageRadius: z.number(),

  // End Location Details
  // End Location Details
  endLat: z.number().optional(),
  endLng: z.number().optional(),
  endCity: z.string().optional(),
  endState: z.string().optional(),
  endCountry: z.string().optional(),
  endPostalCode: z.string().optional(),
});

export default function CreateRoutePage() {
  const navigate = useNavigate();
  const [addRoute] = useAddSalesRouteMutation();

  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null); // Ref for the visual radius circle
  const [map, setMap] = useState<any>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      routeName: "",
      zoomLevel: 12,
      description: "",
      country: "",
      state: "",
      city: "",
      postalCode: "",
      centerLat: 2.9253,
      centerLng: 101.6559,
      coverageRadius: 5,
      start_location: '',
      end_location: '',
      endLat: undefined,
      endLng: undefined,
      endCity: "",
      endState: "",
      endCountry: "",
      endPostalCode: "",
    },
  });

  // Watchers for reactive map updates
  const watchLat = form.watch("centerLat");
  const watchLng = form.watch("centerLng");
  const watchZoom = form.watch("zoomLevel");
  const watchRadius = form.watch("coverageRadius");

  // ---------------- 1. Initialize Map ----------------
  useEffect(() => {
    if (!window.google || !mapRef.current || map) return;

    const initialPos = { lat: watchLat, lng: watchLng };
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: initialPos,
      zoom: watchZoom,
      mapTypeControl: false,
      streetViewControl: false,
    });

    // Main marker (Start Location / Center)
    const marker = new window.google.maps.Marker({
      map: mapInstance,
      position: initialPos,
      draggable: true,
      icon: {
        path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 5,
        fillColor: "#2563eb",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#ffffff",
      },
    });

    // Geofence Circle Overlay
    const circle = new window.google.maps.Circle({
      map: mapInstance,
      center: initialPos,
      radius: watchRadius * 1000, // km to meters
      fillColor: "#3b82f6",
      fillOpacity: 0.2,
      strokeColor: "#2563eb",
      strokeOpacity: 0.5,
      strokeWeight: 2,
    });

    // Event: Sync form when marker is dragged
    marker.addListener("dragend", (e: any) => {
      form.setValue("centerLat", e.latLng.lat());
      form.setValue("centerLng", e.latLng.lng());
    });

    markerRef.current = marker;
    circleRef.current = circle;
    setMap(mapInstance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // ---------------- 2. Update Map on Form Changes ----------------
  useEffect(() => {
    if (map && markerRef.current && circleRef.current) {
      const newPos = { lat: watchLat, lng: watchLng };
      markerRef.current.setPosition(newPos);
      circleRef.current.setCenter(newPos);
      circleRef.current.setRadius(watchRadius * 1000); // meters
      map.panTo(newPos);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchLat, watchLng, watchRadius]);

  useEffect(() => {
    if (map) map.setZoom(watchZoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchZoom]);

  // ---------------- 3. Handlers ----------------
  const handleAddressSelection = (details: any, fieldName: string) => {
    form.setValue(fieldName as any, details.address);

    if (fieldName === "start_location") {
      if (details.city) form.setValue("city", details.city);
      if (details.state) form.setValue("state", details.state);
      if (details.country) form.setValue("country", details.country);
      if (details.postalCode) form.setValue("postalCode", details.postalCode);
      form.setValue("centerLat", details.latitude);
      form.setValue("centerLng", details.longitude);
    }

    if (fieldName === "end_location") {
      if (details.city) form.setValue("endCity", details.city);
      if (details.state) form.setValue("endState", details.state);
      if (details.country) form.setValue("endCountry", details.country);
      if (details.postalCode) form.setValue("endPostalCode", details.postalCode);
      form.setValue("endLat", details.latitude);
      form.setValue("endLng", details.longitude);
    }
  };

  const useBoundsRadius = () => {
    if (!map) return;
    const bounds = map.getBounds();
    if (!bounds) return;
    const center = bounds.getCenter();
    const ne = bounds.getNorthEast();
    const R = 6371; // Earth radius in km
    const dLat = ((ne.lat() - center.lat()) * Math.PI) / 180;
    const dLng = ((ne.lng() - center.lng()) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(center.lat() * Math.PI / 180) * Math.cos(ne.lat() * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const distance = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    form.setValue("coverageRadius", Number(distance.toFixed(2)));
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      const res = await addRoute(data).unwrap();
      if (res.status) {
        toast.success(res.message || 'Route added successfully');
        navigate('/dashboard/sales/sales-routes');
      }
    } catch (err) {
      toast.error("An error occurred while creating the route");
    }
  };

  return (
    <div className="w-full pb-10">
      <Card className="w-full overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
              <Route className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100">Create Sales Route</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Define your delivery or sales territory with geofencing</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT: FORM INPUTS */}
                <div className="lg:col-span-5 space-y-6">

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="routeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700">Route Name</FormLabel>
                          <FormControl><Input placeholder="e.g. Klang Valley Central" {...field} className="h-11" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Locations Section - Split into two boxes */}
                  <div className="space-y-6">
                    {/* START POINT BOX */}
                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4">
                      <div className="flex items-center gap-2 text-blue-800 font-semibold border-b border-blue-200 pb-2 mb-2">
                        <Navigation className="w-4 h-4" /> Start Point
                      </div>

                      <FormField
                        control={form.control}
                        name="start_location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-600">Full Address (Search)</FormLabel>
                            <FormControl>
                              <AddressAutocomplete
                                {...field}
                                onAddressSelect={(d) => handleAddressSelection(d, "start_location")}
                                placeholder="Search start location..."
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="centerLat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">Latitude</FormLabel>
                              <FormControl><Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="h-8 text-xs bg-white" /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="centerLng"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">Longitude</FormLabel>
                              <FormControl><Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="h-8 text-xs bg-white" /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {["city", "state", "country", "postalCode"].map((name) => (
                          <FormField
                            key={name}
                            control={form.control}
                            name={name as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="capitalize text-[10px] text-muted-foreground">{name === 'postalCode' ? 'Postal Code' : name}</FormLabel>
                                <FormControl><Input className="h-8 text-xs bg-white" {...field} readOnly /></FormControl>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {/* DESTINATION POINT BOX */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                      <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-200 pb-2 mb-2">
                        <MapPin className="w-4 h-4" /> Destination Point
                      </div>

                      <FormField
                        control={form.control}
                        name="end_location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-600">Full Address (Search)</FormLabel>
                            <FormControl>
                              <AddressAutocomplete
                                {...field}
                                onAddressSelect={(d) => handleAddressSelection(d, "end_location")}
                                placeholder="Search destination..."
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="endLat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">Latitude</FormLabel>
                              <FormControl><Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="h-8 text-xs bg-white" /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="endLng"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">Longitude</FormLabel>
                              <FormControl><Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="h-8 text-xs bg-white" /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { name: "endCity", label: "City" },
                          { name: "endState", label: "State" },
                          { name: "endCountry", label: "Country" },
                          { name: "endPostalCode", label: "Postal Code" }
                        ].map((item) => (
                          <FormField
                            key={item.name}
                            control={form.control}
                            name={item.name as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] text-muted-foreground">{item.label}</FormLabel>
                                <FormControl><Input className="h-8 text-xs bg-white" {...field} readOnly /></FormControl>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Zoom and Radius */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="zoomLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Default Zoom</FormLabel>
                          <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="coverageRadius"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Radius (km)</FormLabel>
                          <FormControl><Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter description"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* RIGHT: INTERACTIVE MAP */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      Territory Visualization
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={useBoundsRadius} className="text-[10px] h-7 bg-white">
                      <Maximize className="w-3 h-3 mr-1" /> Fit Radius to Map
                    </Button>
                  </div>

                  <div className="relative group">
                    <div
                      ref={mapRef}
                      className="w-full h-[550px] rounded-2xl border-4 border-white shadow-2xl bg-slate-100"
                    />
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-[10px] border shadow-sm">
                      <strong>Tip:</strong> Drag the center marker to fine-tune the territory center.
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex justify-end items-center gap-4 pt-8 border-t">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-10 py-3 font-semibold text-white shadow-lg shadow-blue-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/50 active:translate-y-0 active:shadow-lg"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Save Route</span>
                </button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}












// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { z } from "zod";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";

// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";

// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
// import { MapEmbed } from "@/components/MapEmbed";
// import { useAddSalesRouteMutation } from "@/store/features/salesRoute/salesRoute";
// import { toast } from "sonner";
// import { useNavigate } from "react-router";
// import { ArrowLeft } from "lucide-react";

// // ---------------- Schema ----------------
// const FormSchema = z.object({
//   routeName: z.string().min(1),
//   zoomLevel: z.number(),
//   description: z.string().optional(),
//   country: z.string(),
//   state: z.string(),
//   city: z.string(),
//   end_location: z.string(),
//   start_location: z.string(),
//   postalCode: z.string(),
//   centerLat: z.number(),
//   centerLng: z.number(),
//   coverageRadius: z.number(),
// });



// export default function CreateRoutePage() {
//   const navigate = useNavigate()
//   const [addRoute] = useAddSalesRouteMutation();

//   //   const mapRef = useRef(null);
//   //   const markerRef = useRef(null);
//   //   const [map, setMap] = useState(null);

//   const form = useForm({
//     resolver: zodResolver(FormSchema),
//     defaultValues: {
//       routeName: "",
//       zoomLevel: 12,
//       description: "",
//       country: "Malaysia",
//       state: "Selangor",
//       city: "Cyberjaya",
//       postalCode: "63000",
//       centerLat: 2.9253,
//       centerLng: 101.6559,
//       coverageRadius: 5,
//       start_location: '',
//       end_location: ''

//     },
//   });

//   //   const watchLat = form.watch("centerLat");
//   //   const watchLng = form.watch("centerLng");
//   //   const watchZoom = form.watch("zoomLevel");

//   //   // ---------------- MAP INIT ----------------
//   //   useEffect(() => {
//   //     if (!window.google || !mapRef.current) return;

//   //     const initialCenter = {
//   //       lat: watchLat,
//   //       lng: watchLng,
//   //     };

//   //     const mapInstance = new window.google.maps.Map(mapRef.current, {
//   //       center: initialCenter,
//   //       zoom: watchZoom,
//   //     });

//   //     const marker = new window.google.maps.Marker({
//   //       map: mapInstance,
//   //       position: initialCenter,
//   //       draggable: true,
//   //     });

//   //     marker.addListener("dragend", (e) => {
//   //       form.setValue("centerLat", e.latLng.lat());
//   //       form.setValue("centerLng", e.latLng.lng());
//   //     });

//   //     markerRef.current = marker;
//   //     setMap(mapInstance);
//   //   }, []);

//   // ---------------- Use Pin Location ----------------
//   //   const usePinLocation = () => {
//   //     if (!markerRef.current) return;
//   //     const pos = markerRef.current.getPosition();
//   //     form.setValue("centerLat", pos.lat());
//   //     form.setValue("centerLng", pos.lng());
//   //   };

//   // ---------------- Use Map Bounds Radius ----------------
//   //   const useBoundsRadius = () => {
//   //     if (!map) return;

//   //     const bounds = map.getBounds();
//   //     if (!bounds) return;

//   //     const center = bounds.getCenter();
//   //     const ne = bounds.getNorthEast();

//   //     // Haversine formula
//   //     const R = 6371;
//   //     const dLat = ((ne.lat() - center.lat()) * Math.PI) / 180;
//   //     const dLng = ((ne.lng() - center.lng()) * Math.PI) / 180;

//   //     const lat1 = center.lat() * (Math.PI / 180);
//   //     const lat2 = ne.lat() * (Math.PI / 180);

//   //     const a =
//   //       Math.sin(dLat / 2) ** 2 +
//   //       Math.cos(lat1) *
//   //         Math.cos(lat2) *
//   //         Math.sin(dLng / 2) ** 2;

//   //     const distance = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//   //     form.setValue("coverageRadius", Number(distance.toFixed(2)));
//   //   };

//   // ---------------- Submit Payload ----------------
//   const onSubmit = async (data: z.infer<typeof FormSchema>) => {



//     const res = await addRoute(data).unwrap()

//     if (res.status) {
//       toast.success(res.message || 'Route add successfull')
//       navigate('/dashboard/sales/sales-routes')
//     }

//   };




//   return (
//     <div className="w-full">
//       <Card className="w-full shadow-md">
//         {/* ---------- Header ---------- */}
//         <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
//           <Button
//             variant="outline"
//             onClick={() => navigate(-1)}
//             className="flex items-center gap-2 w-fit"
//           >
//             <ArrowLeft className="h-4 w-4" />
//             Back
//           </Button>

//           <CardTitle className="text-xl sm:text-2xl font-semibold">
//             Create Route
//           </CardTitle>
//         </CardHeader>

//         <CardContent>
//           <Form {...form}>
//             <form
//               onSubmit={form.handleSubmit(onSubmit)}
//               className="space-y-4"
//             >
//               {/* ---------- Row 1 ---------- */}
//               <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
//                 <div className="sm:col-span-9">
//                   <FormField
//                     control={form.control}
//                     name="routeName"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Route Name</FormLabel>
//                         <FormControl>
//                           <Input placeholder="e.g. Cyberjaya Road" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="sm:col-span-3">
//                   <FormField
//                     control={form.control}
//                     name="zoomLevel"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Zoom Level</FormLabel>
//                         <FormControl>
//                           <Input
//                             type="number"
//                             {...field}
//                             onChange={(e) =>
//                               field.onChange(Number(e.target.value))
//                             }
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>
//               </div>

//               {/* ---------- Description ---------- */}
//               <FormField
//                 control={form.control}
//                 name="description"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Description</FormLabel>
//                     <FormControl>
//                       <Textarea placeholder="Optional" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* ---------- Row 2 ---------- */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                 {["country", "state", "city", "postalCode"].map((name) => (
//                   <FormField
//                     key={name}
//                     control={form.control}
//                     name={name as any}
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel className="capitalize">{name}</FormLabel>
//                         <FormControl>
//                           <Input {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 ))}
//               </div>

//               {/* ---------- Start / End Location ---------- */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <FormField
//                   control={form.control}
//                   name="start_location"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Start Location</FormLabel>
//                       <FormControl>
//                         <Input placeholder="e.g. Cyberjaya Gate" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="end_location"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>End Location</FormLabel>
//                       <FormControl>
//                         <Input placeholder="e.g. Putrajaya Sentral" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               {/* ---------- Lat / Lng ---------- */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <FormField
//                   control={form.control}
//                   name="centerLat"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Center Latitude</FormLabel>
//                       <FormControl>
//                         <Input
//                           type="number"
//                           step="0.0001"
//                           {...field}
//                           onChange={(e) =>
//                             field.onChange(Number(e.target.value))
//                           }
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="centerLng"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Center Longitude</FormLabel>
//                       <FormControl>
//                         <Input
//                           type="number"
//                           step="0.0001"
//                           {...field}
//                           onChange={(e) =>
//                             field.onChange(Number(e.target.value))
//                           }
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               {/* ---------- Coverage Radius ---------- */}
//               <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
//                 <div className="md:col-span-3">
//                   <FormField
//                     control={form.control}
//                     name="coverageRadius"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Coverage Radius (km)</FormLabel>
//                         <FormControl>
//                           <Input
//                             type="number"
//                             {...field}
//                             onChange={(e) =>
//                               field.onChange(Number(e.target.value))
//                             }
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="md:col-span-9 flex flex-col sm:flex-row gap-3">
//                   <Button type="button">Use Pin Location</Button>
//                   <Button type="button">Use Map Bounds Radius</Button>
//                 </div>
//               </div>

//               {/* ---------- Map ---------- */}
//               <div className="h-[250px] sm:h-[350px] md:h-[450px] w-full">
//                 <MapEmbed />
//               </div>

//               {/* ---------- Submit ---------- */}
//               <div className="flex justify-end">
//                 <Button type="submit" className="w-full sm:w-auto">
//                   Create
//                 </Button>
//               </div>
//             </form>
//           </Form>
//         </CardContent>
//       </Card>
//     </div>

//   );
// }




