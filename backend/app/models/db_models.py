from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.database import Base


class Stock(Base):
    __tablename__ = "stocks"
    ticker = Column(String, primary_key=True, index=True)
    name = Column(String)
    sector = Column(String)
    country = Column(String)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class MarketData(Base):
    __tablename__ = "market_data"
    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String, index=True)
    price = Column(Float)
    market_cap = Column(Float)
    week_52_high = Column(Float)
    week_52_low = Column(Float)
    pe_ratio = Column(Float)
    raw_data = Column(JSON)
    fetched_at = Column(DateTime, server_default=func.now())


class Transcript(Base):
    __tablename__ = "transcripts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String, index=True)
    quarter = Column(String)
    year = Column(Integer)
    content = Column(Text)
    fetched_at = Column(DateTime, server_default=func.now())


class Filing(Base):
    __tablename__ = "filings"
    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String, index=True)
    filing_type = Column(String)
    filed_at = Column(String)
    content_summary = Column(Text)
    url = Column(String)
    fetched_at = Column(DateTime, server_default=func.now())


class NewsItem(Base):
    __tablename__ = "news"
    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String, index=True)
    title = Column(String)
    description = Column(Text)
    source = Column(String)
    published_at = Column(String)
    url = Column(String)
    fetched_at = Column(DateTime, server_default=func.now())


class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String, index=True)
    fundamental_score = Column(Float)
    antifragile_score = Column(Float)
    sentiment_score = Column(Float)
    fundamental_detail = Column(JSON)
    antifragile_detail = Column(JSON)
    sentiment_detail = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
