from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from fastapi import status
from ..realtime import subscribe_user_events
from ..security import decode_token

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = Query(...)):
	# Token contains user email; map to user id is client-provided in app logic or derived elsewhere.
	try:
		email = decode_token(token)
	except Exception:
		await ws.close(code=status.WS_1008_POLICY_VIOLATION)
		return
	await ws.accept()
	# In production, map email to user_id; here assume the client subscribes using user_id after auth
	# For demo, require client to pass user_id header if needed; we will not add extra mapping here
	# Subscribe based on email-derived identifier by hashing for a stable channel
	import hashlib
	user_channel_id = int(hashlib.sha256(email.encode()).hexdigest(), 16) % (10**8)
	try:
		async for message in subscribe_user_events(user_channel_id):
			await ws.send_text(message)
	except WebSocketDisconnect:
		return
	except Exception:
		await ws.close()