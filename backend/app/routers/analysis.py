import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models.db_models import AnalysisResult
from app.models.schemas import AnalysisRequest
from app.ai.pipeline import run_full_analysis

router = APIRouter(prefix="/api", tags=["analysis"])
logger = logging.getLogger(__name__)


def _safe_json(obj) -> str:
    """Serialize to JSON, converting any non-serializable types to strings."""
    def default(o):
        try:
            # numpy scalar types
            return o.item()
        except AttributeError:
            return str(o)
    return json.dumps(obj, default=default)


@router.post("/analyze")
async def analyze_ticker(
    request: AnalysisRequest,
    db: AsyncSession = Depends(get_db),
):
    ticker = request.ticker.upper().strip()

    if not ticker or len(ticker) > 10:
        raise HTTPException(status_code=400, detail="Invalid ticker symbol")

    try:
        result = await run_full_analysis(ticker)
    except Exception as e:
        logger.error(f"Pipeline failed for {ticker}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    # Persist to DB
    try:
        db_result = AnalysisResult(
            ticker=ticker,
            fundamental_score=float(result["fundamental"].get("final_score", 0) or 0),
            antifragile_score=float(result["antifragile"].get("total_score", 0) or 0),
            sentiment_score=float(result["sentiment"].get("score", 0) or 0),
            fundamental_detail=result["fundamental"],
            antifragile_detail=result["antifragile"],
            sentiment_detail=result["sentiment"],
        )
        db.add(db_result)
        await db.commit()
        await db.refresh(db_result)
        result["analysis_id"] = db_result.id
    except Exception as e:
        logger.error(f"DB persist error: {e}")
        result["analysis_id"] = -1

    result["cached"] = False

    # Use explicit safe serialization to avoid numpy/pandas type errors
    try:
        return JSONResponse(content=json.loads(_safe_json(result)))
    except Exception as e:
        logger.error(f"Serialization error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Response serialization failed: {str(e)}")


@router.get("/analysis/{ticker}/latest")
async def get_latest_analysis(ticker: str, db: AsyncSession = Depends(get_db)):
    ticker = ticker.upper()
    stmt = (
        select(AnalysisResult)
        .where(AnalysisResult.ticker == ticker)
        .order_by(desc(AnalysisResult.created_at))
        .limit(1)
    )
    result = await db.execute(stmt)
    row = result.scalar_one_or_none()

    if not row:
        raise HTTPException(status_code=404, detail=f"No cached analysis for {ticker}")

    return JSONResponse(content={
        "ticker": ticker,
        "fundamental": row.fundamental_detail,
        "antifragile": row.antifragile_detail,
        "sentiment": row.sentiment_detail,
        "analysis_id": row.id,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "cached": True,
    })


@router.get("/history")
async def get_all_history(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Return the most recent analysis per ticker across all tickers."""
    stmt = (
        select(AnalysisResult)
        .order_by(desc(AnalysisResult.created_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    # Deduplicate — keep only the latest per ticker
    seen = set()
    unique = []
    for r in rows:
        if r.ticker not in seen:
            seen.add(r.ticker)
            unique.append(r)

    return JSONResponse(content=[
        {
            "id": r.id,
            "ticker": r.ticker,
            "fundamental_score": r.fundamental_score,
            "antifragile_score": r.antifragile_score,
            "sentiment_score": r.sentiment_score,
            "fundamental_rating": (r.fundamental_detail or {}).get("rating", ""),
            "antifragile_rating": (r.antifragile_detail or {}).get("rating", ""),
            "sentiment_rating": (r.sentiment_detail or {}).get("rating", ""),
            "company_name": r.ticker,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in unique
    ])


@router.get("/history/{analysis_id}")
async def get_analysis_by_id(analysis_id: int, db: AsyncSession = Depends(get_db)):
    """Fetch a specific saved analysis by its DB id."""
    stmt = select(AnalysisResult).where(AnalysisResult.id == analysis_id)
    result = await db.execute(stmt)
    row = result.scalar_one_or_none()

    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return JSONResponse(content={
        "ticker": row.ticker,
        "market_data": {"ticker": row.ticker, "name": row.ticker, "price": None,
                        "market_cap": None, "week_52_high": None, "week_52_low": None,
                        "pe_ratio": None, "price_change_pct": None, "historical": []},
        "fundamental": row.fundamental_detail,
        "antifragile": row.antifragile_detail,
        "sentiment": row.sentiment_detail,
        "analysis_id": row.id,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "cached": True,
    })


@router.get("/analysis/{ticker}/history")
async def get_analysis_history(ticker: str, db: AsyncSession = Depends(get_db)):
    ticker = ticker.upper()
    stmt = (
        select(AnalysisResult)
        .where(AnalysisResult.ticker == ticker)
        .order_by(desc(AnalysisResult.created_at))
        .limit(10)
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    return JSONResponse(content=[
        {
            "id": r.id,
            "ticker": ticker,
            "fundamental_score": r.fundamental_score,
            "antifragile_score": r.antifragile_score,
            "sentiment_score": r.sentiment_score,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ])
