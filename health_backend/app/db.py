from __future__ import annotations
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from .settings import settings

Base = declarative_base()
_engine = None
_Session: async_sessionmaker[AsyncSession] | None = None

async def init_engine() -> None:
	global _engine, _Session
	if _engine is None:
		_engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True, pool_pre_ping=True)
		_Session = async_sessionmaker(_engine, expire_on_commit=False, autoflush=False)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
	global _Session
	if _Session is None:
		await init_engine()
	assert _Session is not None
	async with _Session() as session:
		yield session

async def run_migrations() -> None:
	# Auto create tables for local/dev; use Alembic CLI migrations for production
	from . import models  # noqa: F401 ensure models imported
	global _engine
	if _engine is None:
		await init_engine()
	assert _engine is not None
	async with _engine.begin() as conn:
		await conn.run_sync(Base.metadata.create_all)