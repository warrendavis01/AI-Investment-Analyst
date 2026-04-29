import httpx
from typing import List
import logging

logger = logging.getLogger(__name__)

EDGAR_BASE = "https://data.sec.gov"
HEADERS = {"User-Agent": "AIEquityAnalyst research@example.com"}


async def fetch_filings(ticker: str, filing_types: List[str] = None) -> List[dict]:
    """Fetch recent SEC filings metadata from EDGAR for the given ticker."""
    if filing_types is None:
        filing_types = ["10-K", "10-Q", "8-K"]

    cik = await _resolve_cik(ticker)
    if not cik:
        return []

    url = f"{EDGAR_BASE}/cgi-bin/browse-edgar?action=getcompany&CIK={cik}&type=&dateb=&owner=include&count=20&search_text=&output=atom"

    try:
        async with httpx.AsyncClient(timeout=30, headers=HEADERS) as client:
            submissions_url = f"{EDGAR_BASE}/submissions/CIK{cik.zfill(10)}.json"
            resp = await client.get(submissions_url)
            resp.raise_for_status()
            data = resp.json()

        filings_data = data.get("filings", {}).get("recent", {})
        forms = filings_data.get("form", [])
        dates = filings_data.get("filingDate", [])
        accessions = filings_data.get("accessionNumber", [])
        descriptions = filings_data.get("primaryDocument", [])

        results = []
        for form, date, acc, doc in zip(forms, dates, accessions, descriptions):
            if form in filing_types and len(results) < 5:
                acc_clean = acc.replace("-", "")
                filing_url = f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc_clean}/{doc}"
                results.append({
                    "ticker": ticker.upper(),
                    "filing_type": form,
                    "filed_at": date,
                    "url": filing_url,
                    "accession": acc,
                })

        return results
    except Exception as e:
        logger.error(f"filings_service error for {ticker}: {e}")
        return []


async def _resolve_cik(ticker: str) -> str:
    """Look up EDGAR CIK for a ticker symbol."""
    try:
        async with httpx.AsyncClient(timeout=15, headers=HEADERS) as client:
            resp = await client.get(
                f"{EDGAR_BASE}/cgi-bin/browse-edgar?company=&CIK={ticker}&type=10-K&dateb=&owner=include&count=5&search_text=&action=getcompany&output=atom"
            )
            # Use the company tickers JSON — faster
            tickers_resp = await client.get(
                "https://www.sec.gov/files/company_tickers.json"
            )
            tickers_resp.raise_for_status()
            tickers_map = tickers_resp.json()

        for _, v in tickers_map.items():
            if v.get("ticker", "").upper() == ticker.upper():
                return str(v["cik_str"])
        return ""
    except Exception as e:
        logger.error(f"_resolve_cik error for {ticker}: {e}")
        return ""


async def fetch_filing_text(url: str, max_chars: int = 6000) -> str:
    """Download and truncate a filing document for AI processing."""
    try:
        async with httpx.AsyncClient(timeout=30, headers=HEADERS, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            text = resp.text
        # Strip HTML tags crudely for plain text
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(text, "lxml")
        plain = soup.get_text(separator=" ", strip=True)
        return plain[:max_chars]
    except Exception as e:
        logger.error(f"fetch_filing_text error: {e}")
        return ""
