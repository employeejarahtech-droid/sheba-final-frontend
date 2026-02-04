/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

let loadScriptPromise: Promise<void> | null = null;

export const useGoogleMapsScript = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState<Error | null>(null);

    useEffect(() => {
        if ((window as any).google?.maps?.places) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsLoaded(true);
            return;
        }

        if (!loadScriptPromise) {
            loadScriptPromise = new Promise<void>((resolve, reject) => {
                const callbackName = "initGoogleMapsCallback";
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                window[callbackName] = () => resolve();

                const script = document.createElement("script");
                script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=${LIBRARIES.join(
                    ","
                )}&loading=async&callback=${callbackName}`;
                script.async = true;
                script.defer = true;
                // script.onload = () => resolve(); // Not reliable with loading=async + callback
                script.onerror = (error) => reject(new Error(`Failed to load Google Maps script: ${error}`));
                document.head.appendChild(script);
            });
        }

        loadScriptPromise
            .then(() => setIsLoaded(true))
            .catch((err) => setLoadError(err));
    }, []);

    return { isLoaded, loadError };
};
