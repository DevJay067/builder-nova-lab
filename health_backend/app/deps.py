from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from .db import get_session
from .models import User
from .security import oauth2_scheme, decode_token

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_session)) -> User:
	email = decode_token(token)
	from sqlalchemy import select
	res = await db.execute(select(User).where(User.email == email))
	user = res.scalar_one_or_none()
	if user is None:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
	return user