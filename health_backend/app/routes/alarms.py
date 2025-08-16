from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..db import get_session
from ..deps import get_current_user
from ..models import Alarm, SleepSession, User, WatchSample
from ..schemas import AlarmIn, AlarmOut
from ..realtime import publish_user_event
from ..utils import channel_id_from_email

router = APIRouter()

@router.post("/", response_model=AlarmOut)
async def create_alarm(payload: AlarmIn, db: AsyncSession = Depends(get_session), user: User = Depends(get_current_user)):
	alarm = Alarm(
		user_id=user.id,
		label=payload.label,
		window_start=payload.window_start,
		window_end=payload.window_end,
		is_enabled=1 if payload.is_enabled else 0,
	)
	db.add(alarm)
	await db.commit()
	await db.refresh(alarm)
	return alarm

@router.get("/", response_model=list[AlarmOut])
async def list_alarms(db: AsyncSession = Depends(get_session), user: User = Depends(get_current_user)):
	res = await db.execute(select(Alarm).where(Alarm.user_id == user.id).order_by(Alarm.window_start.desc()))
	return list(res.scalars().all())

@router.post("/simulate-trigger")
async def simulate_trigger(now: datetime, db: AsyncSession = Depends(get_session), user: User = Depends(get_current_user)):
	# Find active alarms
	res = await db.execute(select(Alarm).where(Alarm.user_id == user.id, Alarm.is_enabled == 1, Alarm.window_start <= now, Alarm.window_end >= now))
	alarm = res.scalar_one_or_none()
	if not alarm:
		return {"trigger": False}
	# Heuristic: find low-motion/light sleep window close to now using recent heart rate/steps
	recent = await db.execute(
		select(WatchSample).where(WatchSample.user_id == user.id).order_by(WatchSample.timestamp.desc()).limit(30)
	)
	samples = list(recent.scalars().all())
	if not samples:
		return {"trigger": True, "reason": "no-data"}
	avg_hr = sum(s.heart_rate_bpm or 0 for s in samples) / max(1, len(samples))
	avg_steps = sum(s.steps or 0 for s in samples) / max(1, len(samples))
	is_light_sleep_window = avg_hr > 45 and avg_hr < 70 and avg_steps < 5
	if is_light_sleep_window or (alarm.window_end - now) <= timedelta(minutes=5):
		alarm.triggered_at = now
		await db.commit()
		await db.refresh(alarm)
		channel_id = channel_id_from_email(user.email)
		await publish_user_event(channel_id, "alarm.trigger", {"alarm_id": alarm.id, "label": alarm.label, "triggered_at": now.isoformat()})
		return {"trigger": True}
	return {"trigger": False}