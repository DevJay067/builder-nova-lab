from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..db import get_session
from ..models import User
from ..schemas import UserCreate, UserOut, Token
from ..security import get_password_hash, verify_password, create_access_token

router = APIRouter()

@router.post("/register", response_model=UserOut)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_session)):
	res = await db.execute(select(User).where(User.email == payload.email))
	existing = res.scalar_one_or_none()
	if existing:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
	user = User(email=payload.email, password_hash=get_password_hash(payload.password))
	db.add(user)
	await db.commit()
	await db.refresh(user)
	return user

@router.post("/login", response_model=Token)
async def login(payload: UserCreate, db: AsyncSession = Depends(get_session)):
	res = await db.execute(select(User).where(User.email == payload.email))
	user = res.scalar_one_or_none()
	if not user or not verify_password(payload.password, user.password_hash):
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
	token = create_access_token(subject=user.email)
	return Token(access_token=token)