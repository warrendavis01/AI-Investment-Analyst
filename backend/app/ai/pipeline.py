"""
Main orchestration: ticker → data → AI → structured output.
Data fetching is async; AI calls are synchronous (run in thread pool).
"""
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor

from app.services import market_data_service, transcript_service, filings_service, news_service
from app.ai import analyzer
from app.models.schemas import MarketDataOut

logger = logging.getLogger(__name__)
_executor = ThreadPoolExecutor(max_workers=3)


async def run_full_analysis(ticker: str) -> dict:
    ticker = ticker.upper().strip()
    logger.info(f"Starting analysis pipeline for {ticker}")

    # ── 1. Fetch all data concurrently ────────────────────────────────────────
    market_data, transcripts, filings, news = await asyncio.gather(
        asyncio.get_event_loop().run_in_executor(
            _executor, market_data_service.fetch_market_data, ticker
        ),
        transcript_service.fetch_transcripts(ticker, limit=2),
        filings_service.fetch_filings(ticker),
        news_service.fetch_news(ticker, ticker),
    )

    company_name = market_data.get("name", ticker)
    logger.info(f"Data fetched — {len(transcripts)} transcripts, "
                f"{len(filings)} filings, {len(news)} news articles")

    # ── 2. Prepare AI inputs ──────────────────────────────────────────────────
    current_transcript = ""
    previous_transcript = ""
    if transcripts:
        current_transcript = transcript_service.truncate_transcript(
            transcripts[0].get("content", ""), max_chars=6000
        )
    if len(transcripts) > 1:
        previous_transcript = transcript_service.truncate_transcript(
            transcripts[1].get("content", ""), max_chars=4000
        )

    news_text = news_service.format_news_for_ai(news)
    url_index = news_service.build_url_index(news)
    company_data = _build_company_data(market_data, current_transcript, filings)

    # ── 3. Run AI analyses concurrently ───────────────────────────────────────
    loop = asyncio.get_event_loop()
    fundamental_fut = loop.run_in_executor(
        _executor, analyzer.run_fundamental_analysis, company_data
    )
    antifragile_fut = loop.run_in_executor(
        _executor, analyzer.run_antifragile_analysis, company_data
    )
    sentiment_fut = loop.run_in_executor(
        _executor,
        analyzer.run_sentiment_analysis,
        ticker, company_name, news_text, current_transcript, previous_transcript, url_index,
    )

    fundamental_result, antifragile_result, sentiment_result = await asyncio.gather(
        fundamental_fut, antifragile_fut, sentiment_fut
    )

    logger.info(f"AI analyses complete for {ticker}")

    # ── 4. Build sources list ─────────────────────────────────────────────────
    sources = _build_sources(ticker, company_name, news, filings, transcripts)

    # ── 5. Build response ─────────────────────────────────────────────────────
    market_out = MarketDataOut(
        ticker=ticker,
        name=company_name,
        price=market_data.get("price"),
        market_cap=market_data.get("market_cap"),
        week_52_high=market_data.get("week_52_high"),
        week_52_low=market_data.get("week_52_low"),
        pe_ratio=market_data.get("pe_ratio"),
        price_change_pct=market_data.get("price_change_pct"),
        historical=market_data.get("historical", []),
    )

    return {
        "ticker": ticker,
        "market_data": market_out.model_dump(),
        "fundamental": fundamental_result,
        "antifragile": antifragile_result,
        "sentiment": sentiment_result,
        "sources": sources,
    }


def _build_sources(ticker: str, company_name: str, news: list, filings: list, transcripts: list) -> list:
    """Collect all data sources used in this analysis."""
    sources = []

    # Market data
    sources.append({
        "category": "Market Data",
        "label": f"{ticker} Quote & Profile",
        "url": f"https://financialmodelingprep.com/financial-summary/{ticker}",
        "description": "Price, market cap, 52W range via Financial Modeling Prep",
    })

    # SEC Filings
    if filings:
        for f in filings[:3]:
            sources.append({
                "category": "SEC Filing",
                "label": f"{f.get('filing_type')} — {f.get('filed_at', '')[:10]}",
                "url": f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company={ticker}&type={f.get('filing_type')}&dateb=&owner=include&count=10",
                "description": f"SEC EDGAR {f.get('filing_type')} filing",
            })
    else:
        sources.append({
            "category": "SEC Filings",
            "label": f"{ticker} EDGAR Filings",
            "url": f"https://www.sec.gov/cgi-bin/browse-edgar?company={ticker}&CIK=&type=10-K&dateb=&owner=include&count=10&search_text=&action=getcompany",
            "description": "SEC EDGAR filing index",
        })

    # Earnings transcripts
    if transcripts:
        for t in transcripts[:2]:
            q = t.get("quarter")
            yr = t.get("year")
            label = f"Q{q} {yr} Earnings Call" if q and yr else f"Earnings Call {t.get('date', '')[:10]}"
            url = t.get("source_url") or f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={ticker}&type=8-K&dateb=&owner=include&count=10"
            sources.append({
                "category": "Earnings Transcript",
                "label": label,
                "url": url,
                "description": f"Earnings call transcript via {t.get('source', 'SEC EDGAR 8-K')}",
            })
    else:
        sources.append({
            "category": "Earnings Transcript",
            "label": f"{ticker} 8-K Filings (EDGAR)",
            "url": f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={ticker}&type=8-K&dateb=&owner=include&count=10",
            "description": "No transcript found — view 8-K filings on SEC EDGAR",
        })

    # News articles
    for article in news[:8]:
        if article.get("url") and article.get("title"):
            sources.append({
                "category": "News",
                "label": article["title"][:80],
                "url": article["url"],
                "description": f"{article.get('source', '')} — {article.get('published_at', '')[:10]}",
            })

    return sources


def _build_company_data(market_data: dict, transcript: str, filings: list) -> dict:
    filing_summary = [
        {"type": f.get("filing_type"), "date": f.get("filed_at")}
        for f in filings[:3]
    ]
    return {
        "ticker": market_data.get("ticker"),
        "name": market_data.get("name"),
        "sector": market_data.get("sector"),
        "industry": market_data.get("industry"),
        "country": market_data.get("country"),
        "business_summary": (market_data.get("long_business_summary") or "")[:1500],
        "financials": {
            "gross_margin": market_data.get("gross_margin"),
            "operating_margin": market_data.get("operating_margin"),
            "return_on_equity": market_data.get("return_on_equity"),
            "return_on_assets": market_data.get("return_on_assets"),
            "free_cash_flow": market_data.get("free_cash_flow"),
            "total_debt": market_data.get("total_debt"),
            "total_cash": market_data.get("total_cash"),
            "revenue_growth": market_data.get("revenue_growth"),
            "earnings_growth": market_data.get("earnings_growth"),
            "eps_trailing": market_data.get("eps_trailing"),
            "eps_forward": market_data.get("eps_forward"),
        },
        "market": {
            "price": market_data.get("price"),
            "market_cap": market_data.get("market_cap"),
            "pe_ratio": market_data.get("pe_ratio"),
            "beta": market_data.get("beta"),
            "week_52_high": market_data.get("week_52_high"),
            "week_52_low": market_data.get("week_52_low"),
            "relative_5y_perf_vs_spy": market_data.get("relative_5y_perf_vs_spy"),
        },
        "ownership": {
            "held_percent_insiders": market_data.get("held_percent_insiders"),
        },
        "recent_transcript_excerpt": transcript[:3000] if transcript else "",
        "recent_filings": filing_summary,
    }
