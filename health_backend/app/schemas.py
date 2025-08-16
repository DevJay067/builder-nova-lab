from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class Token(BaseModel):
	access_token: str
	token_type: str = "bearer"

class UserCreate(BaseModel):
	email: EmailStr
	password: str = Field(min_length=8)

class UserOut(BaseModel):
	id: int
	email: EmailStr
	class Config:
		from_attributes = True

class WatchSampleIn(BaseModel):
	timestamp: datetime
	heart_rate_bpm: float | None = None
	spo2_percent: float | None = None
	steps: int | None = None
	calories: float | None = None
	raw: dict | None = None

class WatchSampleOut(WatchSampleIn):
	id: int
	class Config:
		from_attributes = True

class SleepStage(BaseModel):
	start: datetime
	end: datetime
	stage: str  # awake, light, deep, rem

class SleepSessionIn(BaseModel):
	start_time: datetime
	end_time: datetime | None = None
	stages: list[SleepStage] | None = None

class SleepSessionOut(SleepSessionIn):
	id: int
	class Config:
		from_attributes = True

class AlarmIn(BaseModel):
	label: str = "Alarm"
	window_start: datetime
	window_end: datetime
	is_enabled: bool = True

class AlarmOut(AlarmIn):
	id: int
	triggered_at: datetime | None = None
	class Config:
		from_attributes = True