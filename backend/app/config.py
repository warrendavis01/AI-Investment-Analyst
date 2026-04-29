from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path
from dotenv import load_dotenv

# Explicitly load .env before pydantic-settings reads env vars
_env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    fmp_api_key: str = ""
    news_api_key: str = ""
    database_url: str = "sqlite+aiosqlite:///./equity_analyst.db"
    cors_origins: List[str] = [
        "http://localhost:3000",
        "https://ai-investment-analyst-rho.vercel.app",
        "https://ai-investment-analyst-nv8dvw3cy-warren-davis-projects.vercel.app",
    ]


settings = Settings()
