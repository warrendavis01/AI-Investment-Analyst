import httpx
import pandas as pd
from typing import Optional
import logging
from app.config import settings

logger = logging.getLogger(__name__)
FMP_STABLE = "https://financialmodelingprep.com/stable"


def fetch_market_data(ticker: str) -> dict:
    try:
        return _fetch_fmp_stable(ticker)
    except Exception as e:
        logger.error(f"market_data error for {ticker}: {e}")
        return {"ticker": ticker.upper(), "name": ticker.upper(), "historical": []}


def _fetch_fmp_stable(ticker: str) -> dict:
    key = settings.fmp_api_key
    with httpx.Client(timeout=20) as client:
        quote_r = client.get(f"{FMP_STABLE}/quote", params={"symbol": ticker, "apikey": key})
        profile_r = client.get(f"{FMP_STABLE}/profile", params={"symbol": ticker, "apikey": key})
        hist_r = client.get(
            f"{FMP_STABLE}/historical-price-eod/light",
            params={"symbol": ticker, "apikey": key, "limit": 260},
        )
        ratios_r = client.get(f"{FMP_STABLE}/ratios-ttm", params={"symbol": ticker, "apikey": key})

    quote = (quote_r.json() or [{}])[0] if quote_r.is_success else {}
    profile = (profile_r.json() or [{}])[0] if profile_r.is_success else {}
    ratios = (ratios_r.json() or [{}])[0] if ratios_r.is_success else {}
    daily = hist_r.json() if hist_r.is_success else []
    if not isinstance(daily, list):
        daily = []

    # Parse 52W range from profile "range" field e.g. "193.25-288.62"
    w52_low, w52_high = None, None
    range_str = profile.get("range", "")
    if range_str and "-" in range_str:
        parts = range_str.split("-")
        try:
            w52_low = float(parts[0])
            w52_high = float(parts[1])
        except (ValueError, IndexError):
            pass

    # Build weekly historical from daily data
    historical = []
    if daily:
        df = pd.DataFrame(daily)
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date").set_index("date")
        weekly = df["price"].resample("W").last().dropna()
        historical = [
            {"date": str(idx.date()), "close": round(float(v), 2)}
            for idx, v in weekly.items()
        ]

    price = _sf(quote.get("price"))
    prev_close = _sf(quote.get("previousClose"))
    price_chg = ((price - prev_close) / prev_close) if price and prev_close else None

    # PE = price / EPS (TTM net income per share)
    eps_ttm = _sf(ratios.get("netIncomePerShareTTM"))
    pe = round(price / eps_ttm, 2) if price and eps_ttm and eps_ttm > 0 else None

    return {
        "ticker": ticker.upper(),
        "name": quote.get("name") or profile.get("companyName") or ticker.upper(),
        "sector": profile.get("sector"),
        "industry": profile.get("industry"),
        "country": profile.get("country"),
        "price": price,
        "market_cap": _sf(profile.get("marketCap") or quote.get("marketCap")),
        "week_52_high": w52_high,
        "week_52_low": w52_low,
        "pe_ratio": pe,
        "price_change_pct": price_chg,
        "beta": _sf(profile.get("beta")),
        "eps_trailing": eps_ttm,
        "eps_forward": None,
        "gross_margin": None,
        "operating_margin": None,
        "return_on_equity": None,
        "return_on_assets": None,
        "free_cash_flow": None,
        "total_debt": None,
        "total_cash": None,
        "revenue_growth": None,
        "earnings_growth": None,
        "held_percent_insiders": None,
        "relative_5y_perf_vs_spy": _get_5y_perf(ticker, key),
        "historical": historical,
        "long_business_summary": (profile.get("description") or "")[:1000],
    }


def _get_5y_perf(ticker: str, key: str) -> Optional[float]:
    try:
        with httpx.Client(timeout=15) as client:
            t_r = client.get(f"{FMP_STABLE}/historical-price-eod/light",
                             params={"symbol": ticker, "apikey": key, "limit": 1260})
            s_r = client.get(f"{FMP_STABLE}/historical-price-eod/light",
                             params={"symbol": "SPY", "apikey": key, "limit": 1260})

        t_data = t_r.json() if t_r.is_success else []
        s_data = s_r.json() if s_r.is_success else []
        if not t_data or not s_data:
            return None

        t_ret = (t_data[0]["price"] - t_data[-1]["price"]) / t_data[-1]["price"] * 100
        s_ret = (s_data[0]["price"] - s_data[-1]["price"]) / s_data[-1]["price"] * 100
        return round(t_ret - s_ret, 1)
    except Exception:
        return None


def _sf(val) -> Optional[float]:
    try:
        f = float(val)
        return None if f != f else f
    except (TypeError, ValueError):
        return None
