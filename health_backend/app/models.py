from __future__ import annotations
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey, DateTime, Float, JSON, UniqueConstraint, Index
from .db import Base

class User(Base):
	__tablename__ = "users"
	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
	password_hash: Mapped[str] = mapped_column(String(255))
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

	samples: Mapped[list[WatchSample]] = relationship(back_populates="user")
	sleeps: Mapped[list[SleepSession]] = relationship(back_populates="user")
	alarms: Mapped[list[Alarm]] = relationship(back_populates="user")

class WatchSample(Base):
	__tablename__ = "watch_samples"
	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
	timestamp: Mapped[datetime] = mapped_column(DateTime, index=True)
	heart_rate_bpm: Mapped[float | None] = mapped_column(Float, nullable=True)
	spo2_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
	steps: Mapped[int | None] = mapped_column(Integer, nullable=True)
	calories: Mapped[float | None] = mapped_column(Float, nullable=True)
	raw: Mapped[dict | None] = mapped_column(JSON, nullable=True)

	user: Mapped[User] = relationship(back_populates="samples")

	__table_args__ = (
		Index("ix_watch_samples_user_ts", "user_id", "timestamp"),
	)

class SleepSession(Base):
	__tablename__ = "sleep_sessions"
	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
	start_time: Mapped[datetime] = mapped_column(DateTime, index=True)
	end_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
	stages: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # e.g., [{start, end, stage}]

	user: Mapped[User] = relationship(back_populates="sleeps")

class Alarm(Base):
	__tablename__ = "alarms"
	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
	label: Mapped[str] = mapped_column(String(255), default="Alarm")
	window_start: Mapped[datetime] = mapped_column(DateTime)
	window_end: Mapped[datetime] = mapped_column(DateTime)
	is_enabled: Mapped[bool] = mapped_column(Integer, default=1)
	triggered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

	user: Mapped[User] = relationship(back_populates="alarms")