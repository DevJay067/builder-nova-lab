from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
	model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore")

	ENVIRONMENT: str = "development"
	SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-change")
	ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30

	DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./health.db")
	REDIS_URL: str = os.getenv("REDIS_URL", "memory://local")
	RATE_LIMIT_REDIS_URL: str | None = None

	GOOGLE_MAPS_API_KEY: str | None = None

settings = Settings()  # type: ignore