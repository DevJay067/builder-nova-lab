import { cacheGet, cacheSet } from "./redis";

interface PlaceResult {
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating?: number;
  userRatingsTotal?: number;
  placeId: string;
}

export async function findNearbyHospitals(lat: number, lng: number, radius = 5000): Promise<PlaceResult[]> {
  const cacheKey = `nearby:hospitals:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`;
  const cached = await cacheGet<PlaceResult[]>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY not set");

  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: String(radius),
    type: "hospital",
    key: apiKey,
  });

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Google Places error: ${resp.status}`);
  const data = await resp.json();

  const results: PlaceResult[] = (data.results || []).map((r: any) => ({
    name: r.name,
    address: r.vicinity || r.formatted_address,
    location: { lat: r.geometry?.location?.lat, lng: r.geometry?.location?.lng },
    rating: r.rating,
    userRatingsTotal: r.user_ratings_total,
    placeId: r.place_id,
  }));

  await cacheSet(cacheKey, results, 60 * 10);
  return results;
}