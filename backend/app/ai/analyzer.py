import json
import logging
from typing import Optional
import anthropic
from app.config import settings
from app.ai.prompts import FUNDAMENTAL_ANALYSIS_PROMPT, ANTIFRAGILE_PROMPT, SENTIMENT_PROMPT

logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-6"


def _get_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


def _call_claude(system: str, user: str, max_tokens: int = 4096) -> dict:
    client = _get_client()
    message = client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    raw = message.content[0].text.strip()
    logger.info(f"Claude raw response (first 300): {raw[:300]}")

    # Extract JSON — handle markdown code blocks
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()

    return json.loads(raw)


def run_fundamental_analysis(company_data: dict) -> dict:
    system = "You are a precise financial analyst. Always return valid JSON only, no commentary. Keep explanation and evidence fields concise — max 1 sentence each."
    user = FUNDAMENTAL_ANALYSIS_PROMPT.format(
        company_data=json.dumps(company_data, indent=2, default=str)
    )
    try:
        result = _call_claude(system, user, max_tokens=8000)
        return result
    except Exception as e:
        logger.error(f"fundamental analysis error: {e}")
        raise


def run_antifragile_analysis(company_data: dict) -> dict:
    system = "You are a precise financial analyst. Always return valid JSON only, no commentary. Keep explanation fields concise — max 1 sentence each."
    user = ANTIFRAGILE_PROMPT.format(
        company_data=json.dumps(company_data, indent=2, default=str)
    )
    try:
        result = _call_claude(system, user, max_tokens=4000)
        return result
    except Exception as e:
        logger.error(f"antifragile analysis error: {e}")
        raise


def run_sentiment_analysis(
    ticker: str,
    company_name: str,
    news_text: str,
    current_transcript: str,
    previous_transcript: str,
    url_index: Optional[dict] = None,
) -> dict:
    system = "You are a precise financial analyst. Always return valid JSON only, no commentary. Keep all string fields concise — max 1-2 sentences."

    # Format url_index as numbered list matching the news_text numbering
    url_index_str = ""
    if url_index:
        lines = []
        for i, (title, url) in enumerate(list(url_index.items())[:15], 1):
            lines.append(f"{i}. {title[:80]} → {url}")
        url_index_str = "\n".join(lines)

    user = SENTIMENT_PROMPT.format(
        ticker=ticker,
        company_name=company_name,
        news_text=news_text or "No recent news available.",
        current_transcript=current_transcript or "No transcript available.",
        previous_transcript=previous_transcript or "No previous transcript available.",
        url_index=url_index_str or "No URLs available.",
    )
    try:
        result = _call_claude(system, user, max_tokens=6000)
        return result
    except Exception as e:
        logger.error(f"sentiment analysis error: {e}")
        raise
