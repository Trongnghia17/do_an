from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "OwlEnglish AI Service"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_VERSION: str = "v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # MySQL Database (separate from Laravel)
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3307
    DB_DATABASE: str = "owlenglish_fastapi"
    DB_USERNAME: str = "root"
    DB_PASSWORD: str = ""
    
    @property
    def DATABASE_URL(self) -> str:
        """Build MySQL database URL for SQLAlchemy"""
        return f"mysql+asyncmy://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_DATABASE}?charset=utf8mb4"

    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-3.5-turbo"  # More stable and supports 16k tokens
    OPENAI_MAX_TOKENS: int = 4096  # Safe default for most models
    OPENAI_TEMPERATURE: float = 0.7

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Laravel Integration
    LARAVEL_API_URL: str = "http://localhost:8001/api"
    LARAVEL_API_KEY: str = ""

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
