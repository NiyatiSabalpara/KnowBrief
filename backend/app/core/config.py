import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "KnowBrief"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    EXPORTS_DIR: Path = BASE_DIR / "exports"
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'knowledge_base.db'}"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]
    
    # Request limits and timeouts
    REQUEST_TIMEOUT_SECONDS: int = 12
    MAX_ARTICLE_CHARS: int = 150000
    USER_AGENT: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (KnowBrief/1.0)"
    
    # Optional Keys
    NEWSAPI_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    HUGGINGFACE_API_KEY: str | None = None
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure required runtime directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
