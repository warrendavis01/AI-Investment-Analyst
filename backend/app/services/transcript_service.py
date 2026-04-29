"""
Fetch earnings data from SEC EDGAR 8-K filings.

Most companies file earnings press releases (EX-99.1) and CFO commentary
(EX-99.2) as exhibits to Form 8-K (Item 2.02 — Results of Operations).
These contain CEO/CFO quotes, segment breakdowns, and guidance — sufficient
for narrative change analysis even without a verbatim call transcript.
"""
import re
import httpx
from typing import List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

SEC_BASE = "https://www.sec.gov"
EDGAR_BASE = "https://data.sec.gov"
HEADERS = {"User-Agent": "AIEquityAnalyst research@example.com"}

# Item 2.02 = Results of Operations (earnings release — most reliable)
# Item 7.01 = Regulation FD (sometimes contains actual transcript)
TRANSCRIPT_ITEMS = {"2.02", "7.01"}


async def fetch_transcripts(ticker: str, limit: int = 2) -> List[dict]:
    """
    Fetch the last N earnings releases from SEC EDGAR 8-K filings.
    Returns list of dicts with keys: ticker, date, quarter, year, content,
    source_url, source.
    """
    from app.services.filings_service import _resolve_cik

    cik = await _resolve_cik(ticker)
    if not cik:
        logger.warning(f"Could not resolve EDGAR CIK for {ticker} — skipping transcripts")
        return []

    eight_k_filings = await _get_earnings_8ks(cik, max_candidates=25)
    if not eight_k_filings:
        logger.warning(f"No qualifying 8-K filings found for {ticker}")
        return []

    transcripts = []
    for filing in eight_k_filings:
        if len(transcripts) >= limit:
            break
        result = await _extract_content_from_8k(cik, filing)
        if result:
            result["ticker"] = ticker.upper()
            transcripts.append(result)

    logger.info(f"Fetched {len(transcripts)} earnings release(s) for {ticker} via EDGAR")
    return transcripts


async def _get_earnings_8ks(cik: str, max_candidates: int = 25) -> List[dict]:
    """Fetch submissions JSON and return 8-K filings with earnings content."""
    try:
        async with httpx.AsyncClient(timeout=30, headers=HEADERS) as client:
            resp = await client.get(f"{EDGAR_BASE}/submissions/CIK{cik.zfill(10)}.json")
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch EDGAR submissions for CIK {cik}: {e}")
        return []

    recent = data.get("filings", {}).get("recent", {})
    forms = recent.get("form", [])
    dates = recent.get("filingDate", [])
    accessions = recent.get("accessionNumber", [])
    items_all = recent.get("items", [])

    earnings_filings = []
    for form, date, acc, items in zip(forms, dates, accessions, items_all):
        if form != "8-K":
            continue
        items_str = str(items)
        # Prioritize 2.02 (earnings release), also accept 7.01 (Reg FD transcript)
        has_earnings = any(item in items_str for item in TRANSCRIPT_ITEMS)
        # Exclude pure governance 8-Ks (5.02 director changes, 8.01 other events)
        if has_earnings and len(earnings_filings) < max_candidates:
            priority = "2.02" in items_str  # True → sort first
            earnings_filings.append({
                "date": date,
                "accession": acc,
                "items": items_str,
                "priority": priority,
            })

    # Sort: highest-date first, 2.02 filings before 7.01 at same date
    earnings_filings.sort(key=lambda x: (x["date"], x["priority"]), reverse=True)
    return earnings_filings


async def _extract_content_from_8k(cik: str, filing: dict) -> Optional[dict]:
    """Download 8-K filing index, find exhibit files, and combine their text."""
    acc = filing["accession"]
    acc_no_dashes = acc.replace("-", "")
    date = filing["date"]

    index_url = f"{SEC_BASE}/Archives/edgar/data/{cik}/{acc_no_dashes}/{acc}-index.htm"
    exhibits = await _parse_filing_index(index_url)
    if not exhibits:
        return None

    # Download EX-99.1 and optionally EX-99.2 (CFO commentary, if present)
    combined_text = ""
    best_url = None

    for ex_type in ("EX-99.1", "EX-99.2", "EX-99"):
        ex_url = exhibits.get(ex_type)
        if ex_url:
            text = await _fetch_exhibit_text(ex_url)
            if text and len(text) > 300:
                if not best_url:
                    best_url = ex_url
                combined_text += f"\n\n--- {ex_type} ---\n\n" + text

    if not combined_text:
        return None

    quarter, year = _parse_quarter_year(combined_text, date)

    return {
        "date": date,
        "quarter": quarter,
        "year": year,
        "content": combined_text.strip(),
        "source_url": best_url or index_url,
        "source": "SEC EDGAR 8-K",
    }


async def _parse_filing_index(index_url: str) -> dict:
    """
    Fetch the 8-K filing index HTML and return a mapping of
    exhibit type → full URL (e.g., {"EX-99.1": "https://..."}).
    """
    try:
        async with httpx.AsyncClient(
            timeout=20, headers=HEADERS, follow_redirects=True
        ) as client:
            resp = await client.get(index_url)
            if resp.status_code != 200:
                return {}
            html = resp.text
    except Exception as e:
        logger.debug(f"Could not fetch filing index {index_url}: {e}")
        return {}

    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "lxml")

    # Extract base path from URL for constructing exhibit URLs
    # index_url: .../edgar/data/{cik}/{acc_clean}/{acc}-index.htm
    base_path = index_url.rsplit("/", 1)[0]

    exhibits = {}
    table = soup.find("table", {"class": "tableFile"})
    if not table:
        return {}

    for row in table.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 4:
            continue

        # Columns: Seq | Description | Document | Type | Size
        doc_type = cells[3].get_text(strip=True) if len(cells) > 3 else ""
        link_tag = cells[2].find("a") if len(cells) > 2 else None

        if not link_tag or not doc_type:
            continue

        # Only collect exhibit types we care about
        if doc_type not in ("EX-99.1", "EX-99.2", "EX-99"):
            continue

        href = link_tag.get("href", "")
        if href.startswith("/"):
            full_url = f"{SEC_BASE}{href}"
        elif href.startswith("http"):
            full_url = href
        else:
            full_url = f"{base_path}/{href}"

        if doc_type not in exhibits:
            exhibits[doc_type] = full_url

    return exhibits


async def _fetch_exhibit_text(url: str, max_chars: int = 10000) -> str:
    """Download an exhibit HTML file and return plain text."""
    try:
        async with httpx.AsyncClient(
            timeout=30, headers=HEADERS, follow_redirects=True
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            raw = resp.text

        from bs4 import BeautifulSoup
        soup = BeautifulSoup(raw, "lxml")
        text = soup.get_text(separator=" ", strip=True)
        text = re.sub(r"\s{3,}", "\n\n", text)
        return text[:max_chars]
    except Exception as e:
        logger.error(f"Failed to fetch exhibit {url}: {e}")
        return ""


def _parse_quarter_year(text: str, date: str) -> Tuple[Optional[int], Optional[int]]:
    """Extract fiscal quarter and year from exhibit text or filing date."""
    snippet = text[:3000]
    m = re.search(
        r"\b(Q[1-4]|first|second|third|fourth)\s+(?:quarter\s+)?(?:fiscal\s+)?(\d{4})\b",
        snippet,
        re.IGNORECASE,
    )
    if m:
        q_str = m.group(1).upper()
        year = int(m.group(2))
        q_map = {"FIRST": 1, "SECOND": 2, "THIRD": 3, "FOURTH": 4}
        if q_str.startswith("Q"):
            quarter = int(q_str[1])
        else:
            quarter = q_map.get(q_str)
        return quarter, year

    # Fall back to deriving quarter from filing date (YYYY-MM-DD)
    try:
        parts = date.split("-")
        year = int(parts[0])
        month = int(parts[1])
        quarter = (month - 1) // 3 + 1
        return quarter, year
    except Exception:
        return None, None


def truncate_transcript(content: str, max_chars: int = 8000) -> str:
    """Keep the first max_chars characters, cutting at a sentence boundary."""
    if len(content) <= max_chars:
        return content
    cut = content[:max_chars]
    last_period = cut.rfind(".")
    return cut[: last_period + 1] if last_period > max_chars * 0.8 else cut
