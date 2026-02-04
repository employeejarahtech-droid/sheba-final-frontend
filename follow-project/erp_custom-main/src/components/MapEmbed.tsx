import type React from "react";

interface MapEmbedProps {
  /** Accepts coordinates from your API */
  center?: {
    lat: number;
    lng: number;
  };
  /** Fallback to a text-based location search */
  location?: string;
  zoom?: number;
  /** Radius is not natively supported by basic iframe embeds, 
      but we include it in props for future JS API integration */
  radius?: number;
  marker?: {
    lat: number;
    lng: number;
  };
  width?: number;
  height?: number;
}




export const MapEmbed: React.FC<MapEmbedProps> = ({
  location = "Cyberjaya, Selangor, Malaysia",
  zoom = 14,
  width = 600,
  height = 400,
}) => {
  const src = `https://maps.google.com/maps?width=${width}&height=${height}&hl=en&q=${encodeURIComponent(
    location
  )}&t=&z=${zoom}&ie=UTF8&iwloc=B&output=embed`;

  return (
    <div className="embed-map-responsive">
      <div className="embed-map-container">
        <iframe
          className="w-full h-[400px]"
          src={src}
          title={`Google Map: ${location}`}
          frameBorder={0}
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
        />
      </div>
    </div>
  );
};
