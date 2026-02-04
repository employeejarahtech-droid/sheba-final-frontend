export const geocodeAddress = async (address: string) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`
  );

  console.log('address',address)
  const data = await res.json();
   console.log('location data ==>',data)

  if (data.status === "OK") {
    const location = data.results[0].geometry.location;
    return {
      lat: location.lat,
      lng: location.lng,
    };
  }

  throw new Error("Geocoding failed");
};
