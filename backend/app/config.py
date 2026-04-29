import os
import json
from pathlib import Path
from dotenv import load_dotenv

# Load .env only when running locally
_env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)


class Settings:
    def __init__(self):
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.fmp_api_key = os.getenv("FMP_API_KEY", "")
        self.news_api_key = os.getenv("NEWS_API_KEY", "")
        self.database_url = os.getenv(
            "DATABASE_URL", "sqlite+aiosqlite:///./equity_analyst.db"
        )

        cors_raw = os.getenv("CORS_ORIGINS", "")
        if cors_raw.startswith("["):
            try:
                self.cors_origins = json.loads(cors_raw)
            except json.JSONDecodeError:
                self.cors_origins = self._default_cors()
        elif cors_raw:
            self.cors_origins = [v.strip() for v in cors_raw.split(",")]
        else:
            self.cors_origins = self._default_cors()

    @staticmethod
    def _default_cors():
        return [
            "http://localhost:3000",
            "https://ai-investment-analyst-rho.vercel.app",
            "https://ai-investment-analyst-nv8dvw3cy-warren-davis-projects.vercel.app",
        ]


settings = Settings()
