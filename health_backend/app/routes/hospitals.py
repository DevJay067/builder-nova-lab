from fastapi import APIRouter, HTTPException, Query
import httpx
from ..settings import settings

router = APIRouter()

PLACES_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

@router.get("/nearby")
async def nearby_hospitals(lat: float = Query(...), lng: float = Query(...), radius: int = 5000):
	if not settings.GOOGLE_MAPS_API_KEY:
		raise HTTPException(status_code=500, detail="Google API key not configured")
	params = {
		"location": f"{lat},{lng}",
		"radius": radius,
		"type": "hospital",
		"key": settings.GOOGLE_MAPS_API_KEY,
	}
	async with httpx.AsyncClient(timeout=10) as client:
		resp = await client.get(PLACES_URL, params=params)
		resp.raise_for_status()
		data = resp.json()
		results = []
		for r in data.get("results", [])[:20]:
			results.append({
				"name": r.get("name"),
				"address": r.get("vicinity") or r.get("formatted_address"),
				"location": r.get("geometry", {}).get("location"),
				"place_id": r.get("place_id"),
				"rating": r.get("rating"),
				"user_ratings_total": r.get("user_ratings_total"),
			})
		return {"hospitals": results}