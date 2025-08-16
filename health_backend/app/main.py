import os
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from .settings import settings
from .logging import configure_logging
from .routes import auth, watch, hospitals, ws, alarms

configure_logging()

app = FastAPI(
	title="Health Analytics API",
	version="1.0.0",
	default_response_class=ORJSONResponse,
)

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(auth.router, prefix="/v1/auth", tags=["auth"])
app.include_router(watch.router, prefix="/v1/watch", tags=["watch"])
app.include_router(hospitals.router, prefix="/v1/hospitals", tags=["hospitals"])
app.include_router(ws.router, tags=["ws"])
app.include_router(alarms.router, prefix="/v1/alarms", tags=["alarms"])

@app.get("/healthz")
async def healthz() -> dict:
	return {"status": "ok"}

@app.on_event("startup")
async def on_startup() -> None:
	from .db import init_engine, run_migrations
	await init_engine()
	await run_migrations()
	from .realtime import init_redis
	await init_redis()

@app.on_event("shutdown")
async def on_shutdown() -> None:
	from .realtime import close_redis
	await close_redis()