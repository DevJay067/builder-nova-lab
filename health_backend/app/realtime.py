import asyncio
import json
from typing import Any
import redis.asyncio as aioredis
from .settings import settings

_redis: aioredis.Redis | None = None
_local_channels: dict[int, asyncio.Queue[str]] = {}

async def init_redis() -> None:
	global _redis
	if settings.REDIS_URL.startswith("memory://"):
		_redis = None
		return
	try:
		_redis = aioredis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
		await _redis.ping()
	except Exception:
		_redis = None

async def close_redis() -> None:
	global _redis
	if _redis is not None:
		await _redis.close()
		_redis = None

async def publish_user_event(user_id: int, event: str, data: dict[str, Any]) -> None:
	global _redis
	message = json.dumps({"event": event, "data": data}, separators=(",", ":"))
	if _redis is None:
		queue = _local_channels.setdefault(user_id, asyncio.Queue())
		await queue.put(message)
		return
	channel = f"user:{user_id}:events"
	await _redis.publish(channel, message)

async def subscribe_user_events(user_id: int):
	global _redis
	if _redis is None:
		queue = _local_channels.setdefault(user_id, asyncio.Queue())
		while True:
			message = await queue.get()
			yield message
	else:
		pubsub = _redis.pubsub()
		channel = f"user:{user_id}:events"
		await pubsub.subscribe(channel)
		try:
			async for msg in pubsub.listen():
				if msg is None or msg.get("type") != "message":
					continue
				yield msg["data"]
		finally:
			await pubsub.unsubscribe(channel)
			await pubsub.close()