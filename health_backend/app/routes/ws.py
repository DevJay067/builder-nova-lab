from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from fastapi import status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..realtime import subscribe_user_events
from ..security import decode_token
from ..db import get_session
from ..models import User

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str | None = Query(default=None), user_id: int | None = Query(default=None), db: AsyncSession = Depends(get_session)):
	resolved_user_id: int | None = user_id
	if resolved_user_id is None and token:
		try:
			email = decode_token(token)
			res = await db.execute(select(User.id).where(User.email == email))
			resolved_user_id = res.scalar_one_or_none()
		except Exception:
			await ws.close(code=status.WS_1008_POLICY_VIOLATION)
			return
	if resolved_user_id is None:
		await ws.close(code=status.WS_1008_POLICY_VIOLATION)
		return
	await ws.accept()
	try:
		async for message in subscribe_user_events(resolved_user_id):
			await ws.send_text(message)
	except WebSocketDisconnect:
		return
	except Exception:
		await ws.close()