from pydantic import BaseModel
from typing import Optional, List, Any


class AnalysisRequest(BaseModel):
    ticker: str


class MarketDataOut(BaseModel):
    ticker: str
    name: str
    price: Optional[float]
    market_cap: Optional[float]
    week_52_high: Optional[float]
    week_52_low: Optional[float]
    pe_ratio: Optional[float]
    price_change_pct: Optional[float]
    historical: List[dict] = []


# ── Fundamental ──────────────────────────────────────────────────────────────

class FundamentalItem(BaseModel):
    name: str
    score: float
    max_score: float
    rating: str
    explanation: str
    evidence: str


class FundamentalCategory(BaseModel):
    name: str
    items: List[FundamentalItem]
    category_score: float
    category_max: float


class GauntletItem(BaseModel):
    name: str
    deduction: float
    min_deduction: float
    explanation: str


class FundamentalDetail(BaseModel):
    categories: List[FundamentalCategory]
    pre_gauntlet_score: float
    gauntlet_items: List[GauntletItem]
    gauntlet_total: float
    final_score: float
    rating: str
    summary: str


# ── Antifragile ───────────────────────────────────────────────────────────────

class AntifragileItem(BaseModel):
    name: str
    score: float
    min_score: float
    max_score: float
    explanation: str


class AntifragilePillar(BaseModel):
    name: str
    items: List[AntifragileItem]
    pillar_score: float


class AntifragileDetail(BaseModel):
    pillars: List[AntifragilePillar]
    total_score: float
    rating: str
    summary: str


# ── Sentiment ─────────────────────────────────────────────────────────────────

class Theme(BaseModel):
    theme: str
    sentiment: float
    importance: float
    novelty: float
    theme_score: float
    quote: Optional[str] = None


class SentimentDetail(BaseModel):
    score: float
    rating: str
    news_sentiment: float
    transcript_sentiment: float
    narrative_change_score: float
    current_themes: List[Theme]
    previous_themes: List[Theme]
    new_themes: List[str]
    removed_themes: List[str]
    positive_themes: List[str]
    negative_themes: List[str]
    key_headlines: List[str]
    summary: str


# ── Top-level response ────────────────────────────────────────────────────────

class AnalysisResponse(BaseModel):
    ticker: str
    market_data: MarketDataOut
    fundamental: FundamentalDetail
    antifragile: AntifragileDetail
    sentiment: SentimentDetail
    analysis_id: int
    cached: bool = False


class ErrorResponse(BaseModel):
    detail: str
    ticker: str


class HistoricalPrice(BaseModel):
    date: str
    close: float
    volume: Optional[float] = None
