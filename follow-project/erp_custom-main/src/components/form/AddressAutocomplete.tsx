/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { useGoogleMapsScript } from "@/hooks/useGoogleMapsScript";
import { cn } from "@/lib/utils";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddressAutocompleteProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onAddressSelect: (details: {
        address: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        latitude: number;
        longitude: number;
    }) => void;
    /** Desired accuracy in meters before stopping watch (default 50) */
    desiredAccuracyMeters?: number;
    /** How long to attempt high-accuracy positioning before falling back (ms, default 15000) */
    geolocationTimeoutMs?: number;
}
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
export const AddressAutocomplete = forwardRef<HTMLInputElement, AddressAutocompleteProps>(
    ({ className, onAddressSelect, value, onChange,  desiredAccuracyMeters = 50, geolocationTimeoutMs = 15000, ...props }, ref) => {
        const { isLoaded, loadError } = useGoogleMapsScript();
        const [inputValue, setInputValue] = useState(value as string || "");
        const [predictions, setPredictions] = useState<any[]>([]);
        const [isOpen, setIsOpen] = useState(false);
        const [isLoading, setIsLoading] = useState(false);
        const [isGeolocating, setIsGeolocating] = useState(false);

        const autocompleteService = useRef<any>(null);
        const placesService = useRef<any>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const geocoderRef = useRef<any>(null);

        // Sync input value with prop value if it changes externally
        useEffect(() => {
            setInputValue((value as string) || "");
        }, [value]);

        useEffect(() => {
            const initServices = async () => {
                if (isLoaded && !autocompleteService.current) {
                    try {
                        let lib: any = {};

                        // 1. Try modern importLibrary
                        if ((window as any).google?.maps?.importLibrary) {
                            lib = await (window as any).google.maps.importLibrary("places");
                        }

                        // 2. Fallback or merge with global legacy namespace
                        if ((window as any).google?.maps?.places) {
                            lib = { ...(window as any).google.maps.places, ...lib };
                        }

                        // Initialize AutocompleteService (for predictions)
                        if (lib.AutocompleteService) {
                            autocompleteService.current = new lib.AutocompleteService();
                        } else {
                            console.warn("AutocompleteService not found in Google Maps library.");
                        }

                        // Initialize PlacesService (for details) OR prepare to use Place class
                        if (lib.PlacesService) {
                            placesService.current = new lib.PlacesService(document.createElement("div"));
                        } else {
                            // If PlacesService is missing, we will use the new Place class directly in the handleSelect logic if available
                            console.warn("PlacesService not found, will attempt to use Place class.");
                        }

                        // Initialize Geocoder for reverse geocoding
                        if ((window as any).google?.maps?.Geocoder) {
                            geocoderRef.current = new (window as any).google.maps.Geocoder();
                        }

                    } catch (err) {
                        console.error("Google Maps Places Service initialization error", err);
                    }
                }
            };

            initServices();
        }, [isLoaded]);

        useEffect(() => {
            const fetchPredictions = async () => {
                if (!inputValue || !autocompleteService.current) {
                    setPredictions([]);
                    setIsOpen(false);
                    return;
                }

                // Don't search if we just selected something (basic heuristic: exact match might be tricky, usually we just let it search or use a flag)
                // For simplicity, we search always on type.

                setIsLoading(true);
                try {
                    const response = await autocompleteService.current.getPlacePredictions({
                        input: inputValue,
                        types: ["address"],
                    });
                    setPredictions(response.predictions);
                    setIsOpen(true);
                } catch (error) {
                    console.error("Error fetching predictions", error);
                    setPredictions([]);
                } finally {
                    setIsLoading(false);
                }
            };

            const debounceTimer = setTimeout(() => {
                // Only search if input has length > 2
                if (inputValue.length > 2) {
                    fetchPredictions();
                } else {
                    setPredictions([]);
                    setIsOpen(false);
                }
            }, 400);

            return () => clearTimeout(debounceTimer);
        }, [inputValue, isLoaded]);

        const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
            setInputValue(e.target.value);
            if (onChange) onChange(e);
            // Re-open if closed manually?
        };

        const handleCurrentLocation = async () => {
            if (!navigator.geolocation) {
                alert("Geolocation is not supported by your browser");
                return;
            }

            if (!geocoderRef.current) {
                alert("Geocoder is not yet initialized");
                return;
            }

            setIsGeolocating(true);

            let watchId: number | null = null;
            let timeoutId: ReturnType<typeof setTimeout> | null = null;

            try {
                let bestPos: GeolocationPosition | null = null;

                const clearWatchAndTimeout = () => {
                    try {
                        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) {
                        /* ignore */
                    }
                    if (timeoutId) clearTimeout(timeoutId);
                };

                const onPosition = (position: GeolocationPosition) => {
                    // prefer reading with smaller accuracy value
                    if (!bestPos || (position.coords.accuracy && position.coords.accuracy < (bestPos.coords.accuracy || Infinity))) {
                        bestPos = position;
                    }

                    // If we reached desired accuracy, stop watching and use it
                    if (position.coords.accuracy && position.coords.accuracy <= desiredAccuracyMeters) {
                        clearWatchAndTimeout();
                        proceedWithPosition(bestPos);
                    }
                };

                const onError = (error: GeolocationPositionError) => {
                    console.error("Geolocation error:", error);
                    // we'll fall back after timeout
                };

                // Start watch to collect multiple readings and choose the most accurate one
                watchId = navigator.geolocation.watchPosition(onPosition, onError, {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: geolocationTimeoutMs,
                });

                // After timeout, stop watching and use best reading (if any) or fallback
                timeoutId = setTimeout(async () => {
                    try {
                        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) {
                        /* ignore */
                    }

                    if (bestPos) {
                        proceedWithPosition(bestPos);
                    } else if (GOOGLE_MAPS_API_KEY) {
                        // Try Google Geolocation Web API as a fallback (may use IP and be less accurate)
                        try {
                            const res = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${GOOGLE_MAPS_API_KEY}`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ considerIp: true }),
                            });

                            if (res.ok) {
                                const json = await res.json();
                                if (json && json.location) {
                                    const { lat, lng } = json.location;
                                    proceedWithCoords(lat, lng);
                                    return;
                                }
                            }
                            console.error("Google Geolocation API failed:", res.statusText || res.status);
                            alert("Could not get a precise location. Please try again or enter address manually.");
                        } catch (err) {
                            console.error("Google Geolocation API error:", err);
                            alert("Could not get a precise location. Please try again or enter address manually.");
                        }
                    } else {
                        alert("Could not get a precise location. Please try again or enter address manually.");
                    }

                    setIsGeolocating(false);
                }, geolocationTimeoutMs + 500); // small buffer

                // Helper: reverse geocode and extract address details
                const proceedWithPosition = (position: GeolocationPosition | null) => {
                    if (!position) {
                        setIsGeolocating(false);
                        alert("Unable to determine location");
                        return;
                    }
                    const { latitude, longitude } = position.coords as any;
                    proceedWithCoords(latitude, longitude);
                };

                const proceedWithCoords = (latitude: number, longitude: number) => {
                    // Reverse geocode to get address details
                    geocoderRef.current.geocode(
                        { location: { lat: latitude, lng: longitude } },
                        (results: any, status: any) => {
                            if (status === (window as any).google.maps.GeocoderStatus.OK && results && results.length > 0) {
                                const placeResult = results[0];

                                // Extract address components
                                let address = "";
                                let city = "";
                                let state = "";
                                let postalCode = "";
                                let country = "";

                                if (placeResult.address_components) {
                                    placeResult.address_components.forEach((component: any) => {
                                        const types = component.types;

                                        if (types.includes("street_number")) {
                                            address += component.long_name + " ";
                                        }
                                        if (types.includes("route")) {
                                            address += component.long_name;
                                        }
                                        if (types.includes("locality")) {
                                            city = component.long_name;
                                        }
                                        if (!city && types.includes("sublocality_level_1")) {
                                            city = component.long_name;
                                        }
                                        if (types.includes("administrative_area_level_1")) {
                                            state = component.long_name;
                                        }
                                        if (types.includes("postal_code")) {
                                            postalCode = component.long_name;
                                        }
                                        if (types.includes("country")) {
                                            country = component.long_name;
                                        }
                                    });
                                }

                                address = address.trim() || placeResult.formatted_address;
                                setInputValue(placeResult.formatted_address);

                                onAddressSelect({
                                    address,
                                    city,
                                    state,
                                    postalCode,
                                    country,
                                    latitude,
                                    longitude,
                                });

                                setIsOpen(false);
                            } else {
                                console.error("Geocoding failed:", status);
                                alert("Could not find address for your location");
                            }
                            setIsGeolocating(false);
                        }
                    );

                    // cleanup
                    try {
                        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) {
                        /* ignore */
                    }
                    if (timeoutId) clearTimeout(timeoutId);
                };

            } catch (error) {
                console.error("Error getting current location:", error);
                alert("Error getting your location");
                setIsGeolocating(false);
            }
        };

        const handleSelectPrediction = async (placeId: string, description: string) => {
            // 1. Update text immediately
            setInputValue(description);
            setIsOpen(false);

            // 2. Get details
            // STRATEGY A: Legacy PlacesService
            if (placesService.current) {
                placesService.current.getDetails({
                    placeId: placeId,
                    fields: ["address_components", "geometry", "name", "formatted_address"]
                }, (place: any, status: any) => {
                    if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place && place.address_components && place.geometry) {
                        processPlaceDetails(place, description);
                    } else {
                        console.error("Places details failed status:", status);
                    }
                });
            }
            // STRATEGY B: Modern 'Place' Class (New API)
            else if ((window as any).google?.maps?.places?.Place) {
                try {
                    const place = new (window as any).google.maps.places.Place({
                        id: placeId,
                    });

                    // Fetch fields
                    // Note: The structure of result might differ slightly, but usually fields map 1:1 for basic data.
                    const result = await place.fetchFields({
                        fields: ['addressComponents', 'location', 'displayName', 'formattedAddress']
                    });

                    const placeData = result.place;

                    // Map new API data to our format
                    // addressComponents -> address_components
                    // location -> geometry.location
                    // displayName -> name

                    const formattedPlace = {
                        address_components: placeData.addressComponents,
                        geometry: {
                            location: placeData.location
                        },
                        name: placeData.displayName,
                        formatted_address: placeData.formattedAddress
                    };

                    processPlaceDetails(formattedPlace, description);

                } catch (error) {
                    console.error("Failed to fetch details using new Place API", error);
                }
            } else {
                console.error("No Places Service available to fetch details.");
            }
        };

        const processPlaceDetails = (place: any, description: string) => {
            let address = "";
            let streetNumber = "";
            let route = "";
            let city = "";
            let state = "";
            let postalCode = "";
            let country = "";

            // Extract address components
            // Handle both snake_case (Legacy) and camelCase (New) if needed, 
            // but we normalized to legacy structure in Strategy B adapter above theoretically.
            // Actually, new API returns specialized objects, let's just be safe.

            const components = place.address_components || place.addressComponents;

            if (components) {
                components.forEach((component: any) => {
                    const types = component.types;

                    if (types.includes("street_number")) {
                        streetNumber = component.longText || component.long_name;
                    }
                    if (types.includes("route")) {
                        route = component.longText || component.long_name;
                    }
                    if (types.includes("locality")) {
                        city = component.longText || component.long_name;
                    }
                    // Fallback for city if locality is missing
                    if (!city && types.includes("sublocality_level_1")) {
                        city = component.longText || component.long_name;
                    }

                    if (types.includes("administrative_area_level_1")) {
                        state = component.longText || component.long_name;
                    }
                    if (types.includes("postal_code")) {
                        postalCode = component.longText || component.long_name;
                    }
                    if (types.includes("country")) {
                        country = component.longText || component.long_name;
                    }
                });
            }

            address = `${streetNumber} ${route}`.trim();
            if (!address && place.name) {
                address = typeof place.name === 'string' ? place.name : place.displayName;
            }
            if (!address) {
                address = description;
            }

            // Normalize location
            let lat = 0;
            let lng = 0;

            if (place.geometry?.location) {
                if (typeof place.geometry.location.lat === 'function') {
                    lat = place.geometry.location.lat();
                    lng = place.geometry.location.lng();
                } else {
                    // New API might return simple numbers?
                    // Actually New API Place.location is a LatLng object usually.
                    lat = place.geometry.location.lat;
                    lng = place.geometry.location.lng;
                    // If they are functions in new API:
                    if (typeof lat === 'function') lat = (place.geometry.location as any).lat();
                    if (typeof lng === 'function') lng = (place.geometry.location as any).lng();
                }
            }

            onAddressSelect({
                address,
                city,
                state,
                postalCode,
                country,
                latitude: lat,
                longitude: lng,
            });
        };

        // Close on click outside
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };

            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, []);

        if (loadError) {
            return (
                <Input
                    ref={ref}
                    placeholder="Error loading maps"
                    disabled
                    className={cn("border-red-500", className)}
                    value={inputValue}
                    onChange={handleInput}
                    {...props}
                />
            );
        }

        return (
            <div className="relative w-full" ref={containerRef}>
                <div className="relative">
                    <div className="flex gap-2">
                        <Input
                            ref={ref}
                            placeholder={props.placeholder || "Start typing address..."}
                            className={className}
                            value={inputValue}
                            onChange={handleInput}
                            autoComplete="off"
                            {...props}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleCurrentLocation}
                            disabled={isGeolocating || !isLoaded}
                            title="Use current location"
                            className="shrink-0"
                        >
                            {isGeolocating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Navigation className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    {(isLoading || isGeolocating) && (
                        <div className="absolute right-12 top-2.5">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>

                {isOpen && predictions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-950 border rounded-md shadow-lg max-h-60 overflow-auto">
                        <ul className="py-1">
                            {predictions.map((prediction) => (
                                <li
                                    key={prediction.place_id}
                                    className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-start gap-2 text-sm"
                                    onClick={() => handleSelectPrediction(prediction.place_id, prediction.description)}
                                >
                                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                                    <span>{prediction.description}</span>
                                </li>
                            ))}
                            <li className="px-4 py-2 border-t text-[10px] text-right text-gray-400">
                                Powered by Google
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        );
    }
);

AddressAutocomplete.displayName = "AddressAutocomplete";



//   old feature code below

// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useEffect, useRef, useState, forwardRef } from "react";
// import { Input } from "@/components/ui/input";
// import { useGoogleMapsScript } from "@/hooks/useGoogleMapsScript";
// import { cn } from "@/lib/utils";
// import { Loader2, MapPin } from "lucide-react";

// interface AddressAutocompleteProps extends React.InputHTMLAttributes<HTMLInputElement> {
//     onAddressSelect: (details: {
//         address: string;
//         city: string;
//         state: string;
//         postalCode: string;
//         country: string;
//         latitude: number;
//         longitude: number;
//     }) => void;
// }

// export const AddressAutocomplete = forwardRef<HTMLInputElement, AddressAutocompleteProps>(
//     ({ className, onAddressSelect, value, onChange, ...props }, ref) => {
//         const { isLoaded, loadError } = useGoogleMapsScript();
//         const [inputValue, setInputValue] = useState(value as string || "");
//         const [predictions, setPredictions] = useState<any[]>([]);
//         const [isOpen, setIsOpen] = useState(false);
//         const [isLoading, setIsLoading] = useState(false);

//         const autocompleteService = useRef<any>(null);
//         const placesService = useRef<any>(null);
//         const containerRef = useRef<HTMLDivElement>(null);

//         // Sync input value with prop value if it changes externally
//         useEffect(() => {
//             setInputValue((value as string) || "");
//         }, [value]);

//         useEffect(() => {
//             const initServices = async () => {
//                 if (isLoaded && !autocompleteService.current) {
//                     try {
//                         let lib: any = {};

//                         // 1. Try modern importLibrary
//                         if ((window as any).google?.maps?.importLibrary) {
//                             lib = await (window as any).google.maps.importLibrary("places");
//                         }

//                         // 2. Fallback or merge with global legacy namespace
//                         if ((window as any).google?.maps?.places) {
//                             lib = { ...(window as any).google.maps.places, ...lib };
//                         }

//                         // Initialize AutocompleteService (for predictions)
//                         if (lib.AutocompleteService) {
//                             autocompleteService.current = new lib.AutocompleteService();
//                         } else {
//                             console.warn("AutocompleteService not found in Google Maps library.");
//                         }

//                         // Initialize PlacesService (for details) OR prepare to use Place class
//                         if (lib.PlacesService) {
//                             placesService.current = new lib.PlacesService(document.createElement("div"));
//                         } else {
//                             // If PlacesService is missing, we will use the new Place class directly in the handleSelect logic if available
//                             console.warn("PlacesService not found, will attempt to use Place class.");
//                         }

//                     } catch (err) {
//                         console.error("Google Maps Places Service initialization error", err);
//                     }
//                 }
//             };

//             initServices();
//         }, [isLoaded]);

//         useEffect(() => {
//             const fetchPredictions = async () => {
//                 if (!inputValue || !autocompleteService.current) {
//                     setPredictions([]);
//                     setIsOpen(false);
//                     return;
//                 }

//                 // Don't search if we just selected something (basic heuristic: exact match might be tricky, usually we just let it search or use a flag)
//                 // For simplicity, we search always on type.

//                 setIsLoading(true);
//                 try {
//                     const response = await autocompleteService.current.getPlacePredictions({
//                         input: inputValue,
//                         types: ["address"],
//                     });
//                     setPredictions(response.predictions);
//                     setIsOpen(true);
//                 } catch (error) {
//                     console.error("Error fetching predictions", error);
//                     setPredictions([]);
//                 } finally {
//                     setIsLoading(false);
//                 }
//             };

//             const debounceTimer = setTimeout(() => {
//                 // Only search if input has length > 2
//                 if (inputValue.length > 2) {
//                     fetchPredictions();
//                 } else {
//                     setPredictions([]);
//                     setIsOpen(false);
//                 }
//             }, 400);

//             return () => clearTimeout(debounceTimer);
//         }, [inputValue, isLoaded]);

//         const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//             setInputValue(e.target.value);
//             if (onChange) onChange(e);
//             // Re-open if closed manually?
//         };

//         const handleSelectPrediction = async (placeId: string, description: string) => {
//             // 1. Update text immediately
//             setInputValue(description);
//             setIsOpen(false);

//             // 2. Get details
//             // STRATEGY A: Legacy PlacesService
//             if (placesService.current) {
//                 placesService.current.getDetails({
//                     placeId: placeId,
//                     fields: ["address_components", "geometry", "name", "formatted_address"]
//                 }, (place: any, status: any) => {
//                     if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place && place.address_components && place.geometry) {
//                         processPlaceDetails(place, description);
//                     } else {
//                         console.error("Places details failed status:", status);
//                     }
//                 });
//             }
//             // STRATEGY B: Modern 'Place' Class (New API)
//             else if ((window as any).google?.maps?.places?.Place) {
//                 try {
//                     const place = new (window as any).google.maps.places.Place({
//                         id: placeId,
//                     });

//                     // Fetch fields
//                     // Note: The structure of result might differ slightly, but usually fields map 1:1 for basic data.
//                     const result = await place.fetchFields({
//                         fields: ['addressComponents', 'location', 'displayName', 'formattedAddress']
//                     });

//                     const placeData = result.place;

//                     // Map new API data to our format
//                     // addressComponents -> address_components
//                     // location -> geometry.location
//                     // displayName -> name

//                     const formattedPlace = {
//                         address_components: placeData.addressComponents,
//                         geometry: {
//                             location: placeData.location
//                         },
//                         name: placeData.displayName,
//                         formatted_address: placeData.formattedAddress
//                     };

//                     processPlaceDetails(formattedPlace, description);

//                 } catch (error) {
//                     console.error("Failed to fetch details using new Place API", error);
//                 }
//             } else {
//                 console.error("No Places Service available to fetch details.");
//             }
//         };

//         const processPlaceDetails = (place: any, description: string) => {
//             let address = "";
//             let streetNumber = "";
//             let route = "";
//             let city = "";
//             let state = "";
//             let postalCode = "";
//             let country = "";

//             // Extract address components
//             // Handle both snake_case (Legacy) and camelCase (New) if needed,
//             // but we normalized to legacy structure in Strategy B adapter above theoretically.
//             // Actually, new API returns specialized objects, let's just be safe.

//             const components = place.address_components || place.addressComponents;

//             if (components) {
//                 components.forEach((component: any) => {
//                     const types = component.types;

//                     if (types.includes("street_number")) {
//                         streetNumber = component.longText || component.long_name;
//                     }
//                     if (types.includes("route")) {
//                         route = component.longText || component.long_name;
//                     }
//                     if (types.includes("locality")) {
//                         city = component.longText || component.long_name;
//                     }
//                     // Fallback for city if locality is missing
//                     if (!city && types.includes("sublocality_level_1")) {
//                         city = component.longText || component.long_name;
//                     }

//                     if (types.includes("administrative_area_level_1")) {
//                         state = component.longText || component.long_name;
//                     }
//                     if (types.includes("postal_code")) {
//                         postalCode = component.longText || component.long_name;
//                     }
//                     if (types.includes("country")) {
//                         country = component.longText || component.long_name;
//                     }
//                 });
//             }

//             address = `${streetNumber} ${route}`.trim();
//             if (!address && place.name) {
//                 address = typeof place.name === 'string' ? place.name : place.displayName;
//             }
//             if (!address) {
//                 address = description;
//             }

//             // Normalize location
//             let lat = 0;
//             let lng = 0;

//             if (place.geometry?.location) {
//                 if (typeof place.geometry.location.lat === 'function') {
//                     lat = place.geometry.location.lat();
//                     lng = place.geometry.location.lng();
//                 } else {
//                     // New API might return simple numbers?
//                     // Actually New API Place.location is a LatLng object usually.
//                     lat = place.geometry.location.lat;
//                     lng = place.geometry.location.lng;
//                     // If they are functions in new API:
//                     if (typeof lat === 'function') lat = (place.geometry.location as any).lat();
//                     if (typeof lng === 'function') lng = (place.geometry.location as any).lng();
//                 }
//             }

//             onAddressSelect({
//                 address,
//                 city,
//                 state,
//                 postalCode,
//                 country,
//                 latitude: lat,
//                 longitude: lng,
//             });
//         };

//         // Close on click outside
//         useEffect(() => {
//             const handleClickOutside = (event: MouseEvent) => {
//                 if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
//                     setIsOpen(false);
//                 }
//             };

//             document.addEventListener("mousedown", handleClickOutside);
//             return () => {
//                 document.removeEventListener("mousedown", handleClickOutside);
//             };
//         }, []);

//         if (loadError) {
//             return (
//                 <Input
//                     ref={ref}
//                     placeholder="Error loading maps"
//                     disabled
//                     className={cn("border-red-500", className)}
//                     value={inputValue}
//                     onChange={handleInput}
//                     {...props}
//                 />
//             );
//         }

//         return (
//             <div className="relative w-full" ref={containerRef}>
//                 <div className="relative">
//                     <Input
//                         ref={ref}
//                         placeholder={props.placeholder || "Start typing address..."}
//                         className={className}
//                         value={inputValue}
//                         onChange={handleInput}
//                         autoComplete="off"
//                         {...props}
//                     />
//                     {isLoading && (
//                         <div className="absolute right-3 top-2.5">
//                             <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
//                         </div>
//                     )}
//                 </div>

//                 {isOpen && predictions.length > 0 && (
//                     <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-950 border rounded-md shadow-lg max-h-60 overflow-auto">
//                         <ul className="py-1">
//                             {predictions.map((prediction) => (
//                                 <li
//                                     key={prediction.place_id}
//                                     className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-start gap-2 text-sm"
//                                     onClick={() => handleSelectPrediction(prediction.place_id, prediction.description)}
//                                 >
//                                     <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
//                                     <span>{prediction.description}</span>
//                                 </li>
//                             ))}
//                             <li className="px-4 py-2 border-t text-[10px] text-right text-gray-400">
//                                 Powered by Google
//                             </li>
//                         </ul>
//                     </div>
//                 )}
//             </div>
//         );
//     }
// );

// AddressAutocomplete.displayName = "AddressAutocomplete";
