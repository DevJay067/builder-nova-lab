from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..deps import get_current_user
from ..db import get_session
from ..models import WatchSample, User
from ..schemas import WatchSampleIn, WatchSampleOut
from ..realtime import publish_user_event
from ..utils import channel_id_from_email

router = APIRouter()

@router.post("/samples", response_model=WatchSampleOut)
async def ingest_sample(payload: WatchSampleIn, db: AsyncSession = Depends(get_session), user: User = Depends(get_current_user)):
	sample = WatchSample(
		user_id=user.id,
		timestamp=payload.timestamp,
		heart_rate_bpm=payload.heart_rate_bpm,
		spo2_percent=payload.spo2_percent,
		steps=payload.steps,
		calories=payload.calories,
		raw=payload.raw,
	)
	db.add(sample)
	await db.commit()
	await db.refresh(sample)
	channel_id = channel_id_from_email(user.email)
	await publish_user_event(channel_id, "watch.sample", {
		"id": sample.id,
		"timestamp": sample.timestamp.isoformat(),
		"heart_rate_bpm": sample.heart_rate_bpm,
		"spo2_percent": sample.spo2_percent,
		"steps": sample.steps,
		"calories": sample.calories,
	})
	return sample

@router.get("/samples", response_model=list[WatchSampleOut])
async def list_samples(limit: int = 100, db: AsyncSession = Depends(get_session), user: User = Depends(get_current_user)):
	q = select(WatchSample).where(WatchSample.user_id == user.id).order_by(WatchSample.timestamp.desc()).limit(limit)
	res = await db.execute(q)
	return list(res.scalars().all())