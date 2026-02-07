# Health Analytics Backend

Production-ready FastAPI backend for real-time watch data sync, nearby hospital lookup via Google Places, and smart alarm tied to sleep cycle.

## Quickstart (Docker)

1. Copy env
```bash
cp .env.example .env
```
2. Set `GOOGLE_MAPS_API_KEY` in `.env`.
3. Run
```bash
docker compose up -d --build
```
4. Open docs: http://localhost:8000/docs

## Local (no Docker)
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## Features
- Real-time WebSocket updates per user via Redis pub/sub
- Watch ingestion API persisting to Postgres
- Nearby hospitals: `/v1/hospitals/nearby?lat=..&lng=..&radius=5000`
- Auth (JWT)
- Smart alarm tied to sleep stages
- Rate limiting & CORS
- JSON logging

## Deploy to Render
- Create a new Web Service from this repo or import `render.yaml` as a Blueprint
- Set `GOOGLE_MAPS_API_KEY` in environment variables
- Render will provision Postgres and Redis per `render.yaml`

## Netlify setup (proxy to backend)
- Add `netlify.toml` to your web app repo, or copy from this repo
- Replace `YOUR-RENDER-BACKEND.onrender.com` with your Render service hostname
- Calls from your frontend to `/api/...` will be proxied to the backend
- WebSocket proxy available at `/ws` -> backend `/ws`