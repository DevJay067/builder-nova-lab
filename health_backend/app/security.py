from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from .settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")

ALGORITHM = "HS256"


def verify_password(plain_password: str, hashed_password: str) -> bool:
	return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
	return pwd_context.hash(password)


def _build_token_payload(subject: str, minutes: int, extra: dict | None = None) -> dict:
	expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
	payload: dict = {"sub": subject, "exp": expire}
	if extra:
		payload.update(extra)
	return payload


def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
	payload = _build_token_payload(subject, expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES)
	return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_scoped_token(subject: str, scope: str, expires_minutes: int = 60) -> str:
	payload = _build_token_payload(subject, expires_minutes, {"scope": scope})
	return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> str:
	try:
		payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
		return str(payload.get("sub"))
	except JWTError:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def decode_scoped_token(token: str, expected_scope: str | None = None) -> tuple[str, Optional[str]]:
	try:
		payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
		sub = str(payload.get("sub"))
		scope = payload.get("scope")
		if expected_scope and scope != expected_scope:
			raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token scope")
		return sub, scope
	except JWTError:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")