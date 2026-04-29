import httpx
from typing import List
from app.config import settings
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


async def fetch_news(ticker: str, company_name: str = "", days: int = 30) -> List[dict]:
    """Fetch recent news via NewsAPI, with FMP as fallback."""
    articles = []

    if settings.news_api_key:
        articles = await _fetch_newsapi(ticker, company_name, days)

    if not articles and settings.fmp_api_key:
        articles = await _fetch_fmp_news(ticker)

    return articles[:20]


async def _fetch_newsapi(ticker: str, company_name: str, days: int) -> List[dict]:
    query = company_name or ticker
    from_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(
                "https://newsapi.org/v2/everything",
                params={
                    "q": f'"{query}" OR "{ticker}"',
                    "from": from_date,
                    "sortBy": "relevancy",
                    "language": "en",
                    "pageSize": 20,
                    "apiKey": settings.news_api_key,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        return [
            {
                "title": a.get("title", ""),
                "description": a.get("description", ""),
                "source": a.get("source", {}).get("name", ""),
                "published_at": a.get("publishedAt", ""),
                "url": a.get("url", ""),
            }
            for a in data.get("articles", [])
            if a.get("title") and "[Removed]" not in a.get("title", "")
        ]
    except Exception as e:
        logger.error(f"newsapi error for {ticker}: {e}")
        return []


async def _fetch_fmp_news(ticker: str) -> List[dict]:
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(
                f"https://financialmodelingprep.com/api/v3/stock_news",
                params={"tickers": ticker, "limit": 20, "apikey": settings.fmp_api_key},
            )
            resp.raise_for_status()
            data = resp.json()

        return [
            {
                "title": a.get("title", ""),
                "description": a.get("text", ""),
                "source": a.get("site", ""),
                "published_at": a.get("publishedDate", ""),
                "url": a.get("url", ""),
            }
            for a in (data if isinstance(data, list) else [])
        ]
    except Exception as e:
        logger.error(f"fmp_news error for {ticker}: {e}")
        return []


def format_news_for_ai(articles: List[dict]) -> str:
    """Condense news articles into a prompt-ready string, including index for URL reference."""
    if not articles:
        return "No recent news available."
    lines = []
    for i, a in enumerate(articles[:15], 1):
        desc = (a.get("description") or "")[:150]
        lines.append(f"{i}. [{a.get('source','')}] {a['title']} — {desc}")
    return "\n".join(lines)


def build_url_index(articles: List[dict]) -> dict:
    """Return a mapping of article title → url for matching AI output back to URLs."""
    return {
        a["title"]: a.get("url", "")
        for a in articles
        if a.get("title") and a.get("url")
    }
