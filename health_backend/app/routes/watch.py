from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..deps import get_current_user
from ..db import get_session
from ..models import WatchSample, User
from ..schemas import WatchSampleIn, WatchSampleOut
from ..realtime import publish_user_event

router = APIRouter()

@router.post("/samples", response_model=WatchSampleOut)
async def ingest_sample(payload: WatchSampleIn, db: AsyncSession = Depends(get_session), user: User = Depends(get_current_user)):
	from datetime import datetime
	sample = WatchSample(
		user_id=user.id,
		timestamp=payload.timestamp,
		heart_rate_bpm=payload.heart_rate_bpm,
		spo2_percent=payload.spo2_percent,
		steps=payload.steps,
		calories=payload.calories,
		rssi_dbm=payload.rssi_dbm,
		connection_quality=payload.connection_quality,
		raw=payload.raw,
	)
	db.add(sample)
	await db.commit()
	await db.refresh(sample)
	await publish_user_event(user.id, "watch.sample", {
		"id": sample.id,
		"timestamp": sample.timestamp.isoformat(),
		"heart_rate_bpm": sample.heart_rate_bpm,
		"spo2_percent": sample.spo2_percent,
		"steps": sample.steps,
		"calories": sample.calories,
		"rssi_dbm": sample.rssi_dbm,
		"connection_quality": sample.connection_quality,
	})
	return sample

@router.get("/samples", response_model=list[WatchSampleOut])
async def list_samples(limit: int = 100, db: AsyncSession = Depends(get_session), user: User = Depends(get_current_user)):
	q = select(WatchSample).where(WatchSample.user_id == user.id).order_by(WatchSample.timestamp.desc()).limit(limit)
	res = await db.execute(q)
	return list(res.scalars().all())

@router.websocket("/stream")
async def watch_stream(ws: WebSocket, token: str):
	# Accept stream from phone/watch; token must be ingest-scoped
	await ws.accept()
	from ..security import decode_scoped_token
	from ..db import get_session as _get_session
	from ..models import User as _User
	from sqlalchemy import select as _select
	from datetime import datetime
	user_email, scope = decode_scoped_token(token, expected_scope="ingest")
	try:
		async for message in ws.iter_text():
			import json
			payload = json.loads(message)
			async for db in _get_session():
				res = await db.execute(_select(_User).where(_User.email == user_email))
				user = res.scalar_one_or_none()
				if user is None:
					await ws.close()
					return
				sample = WatchSample(
					user_id=user.id,
					timestamp=datetime.fromisoformat(payload.get("timestamp")),
					heart_rate_bpm=payload.get("heart_rate_bpm"),
					spo2_percent=payload.get("spo2_percent"),
					steps=payload.get("steps"),
					calories=payload.get("calories"),
					rssi_dbm=payload.get("rssi_dbm"),
					connection_quality=payload.get("connection_quality"),
					raw=payload.get("raw"),
				)
				db.add(sample)
				await db.commit()
				await db.refresh(sample)
				await publish_user_event(user.id, "watch.sample", {
					"id": sample.id,
					"timestamp": sample.timestamp.isoformat(),
					"heart_rate_bpm": sample.heart_rate_bpm,
					"spo2_percent": sample.spo2_percent,
					"steps": sample.steps,
					"calories": sample.calories,
					"rssi_dbm": sample.rssi_dbm,
					"connection_quality": sample.connection_quality,
				})
		# Also support binary frames for compact streaming (CBOR or custom); just drop for now
	except WebSocketDisconnect:
		return
	except Exception:
		await ws.close()