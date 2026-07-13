from fastapi import APIRouter, HTTPException, Query, Request
from services.cache import cache_get, cache_set
from typing import Optional
import yfinance as yf
import pandas as pd

router = APIRouter()

# ── Curated Stock Universe ─────────────────────────────────────────────────────
SCREENER_UNIVERSE = [
    # Large-cap Indian
    {"symbol": "RELIANCE.NS",  "name": "Reliance Industries",     "sector": "Energy"},
    {"symbol": "TCS.NS",       "name": "Tata Consultancy Services","sector": "Technology"},
    {"symbol": "HDFCBANK.NS",  "name": "HDFC Bank",               "sector": "Financial Services"},
    {"symbol": "INFY.NS",      "name": "Infosys",                  "sector": "Technology"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank",               "sector": "Financial Services"},
    {"symbol": "HINDUNILVR.NS","name": "Hindustan Unilever",        "sector": "Consumer Defensive"},
    {"symbol": "ITC.NS",       "name": "ITC Limited",              "sector": "Consumer Defensive"},
    {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank",      "sector": "Financial Services"},
    {"symbol": "LT.NS",        "name": "Larsen & Toubro",          "sector": "Industrials"},
    {"symbol": "AXISBANK.NS",  "name": "Axis Bank",                "sector": "Financial Services"},
    {"symbol": "BAJFINANCE.NS","name": "Bajaj Finance",             "sector": "Financial Services"},
    {"symbol": "WIPRO.NS",     "name": "Wipro",                    "sector": "Technology"},
    {"symbol": "HCLTECH.NS",   "name": "HCL Technologies",         "sector": "Technology"},
    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharmaceutical",       "sector": "Healthcare"},
    {"symbol": "TATAMOTORS.NS","name": "Tata Motors",               "sector": "Consumer Cyclical"},
    {"symbol": "MARUTI.NS",    "name": "Maruti Suzuki",            "sector": "Consumer Cyclical"},
    {"symbol": "SBIN.NS",      "name": "State Bank of India",      "sector": "Financial Services"},
    {"symbol": "ONGC.NS",      "name": "ONGC",                     "sector": "Energy"},
    {"symbol": "ADANIENT.NS",  "name": "Adani Enterprises",        "sector": "Industrials"},
    {"symbol": "M&M.NS",       "name": "Mahindra & Mahindra",      "sector": "Consumer Cyclical"},
    # Large-cap US
    {"symbol": "AAPL",  "name": "Apple Inc.",         "sector": "Technology"},
    {"symbol": "MSFT",  "name": "Microsoft Corp.",    "sector": "Technology"},
    {"symbol": "GOOGL", "name": "Alphabet Inc.",      "sector": "Technology"},
    {"symbol": "AMZN",  "name": "Amazon.com Inc.",    "sector": "Consumer Cyclical"},
    {"symbol": "NVDA",  "name": "NVIDIA Corp.",       "sector": "Technology"},
    {"symbol": "META",  "name": "Meta Platforms",     "sector": "Technology"},
    {"symbol": "TSLA",  "name": "Tesla Inc.",         "sector": "Consumer Cyclical"},
    {"symbol": "JPM",   "name": "JPMorgan Chase",     "sector": "Financial Services"},
    {"symbol": "JNJ",   "name": "Johnson & Johnson",  "sector": "Healthcare"},
    {"symbol": "V",     "name": "Visa Inc.",          "sector": "Financial Services"},
    {"symbol": "XOM",   "name": "Exxon Mobil",        "sector": "Energy"},
    {"symbol": "WMT",   "name": "Walmart Inc.",       "sector": "Consumer Defensive"},
    {"symbol": "MA",    "name": "Mastercard Inc.",    "sector": "Financial Services"},
    {"symbol": "KO",    "name": "Coca-Cola Co.",      "sector": "Consumer Defensive"},
    {"symbol": "PFE",   "name": "Pfizer Inc.",        "sector": "Healthcare"},
]

SECTORS = sorted(set(s["sector"] for s in SCREENER_UNIVERSE))


@router.get("/screener")
def screen_stocks(
    sector: Optional[str] = Query(None),
    market: Optional[str] = Query(None, description="'IN' for Indian, 'US' for US stocks"),
    min_pe: Optional[float] = Query(None),
    max_pe: Optional[float] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    sort_by: str = Query("marketCap", description="marketCap | peRatio | price | changePercent"),
    sort_dir: str = Query("desc"),
):
    """Screen stocks from the curated universe with live data."""

    cache_key = f"screener_{sector}_{market}_{min_pe}_{max_pe}_{min_price}_{max_price}_{sort_by}_{sort_dir}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    # Filter universe first
    universe = SCREENER_UNIVERSE.copy()
    if sector:
        universe = [s for s in universe if s["sector"].lower() == sector.lower()]
    if market == "IN":
        universe = [s for s in universe if s["symbol"].endswith(".NS")]
    elif market == "US":
        universe = [s for s in universe if not s["symbol"].endswith(".NS")]

    if not universe:
        return {"results": [], "sectors": SECTORS}

    symbols = [s["symbol"] for s in universe]
    meta_map = {s["symbol"]: s for s in universe}

    # Batch download closing prices for change %
    try:
        hist = yf.download(symbols, period="2d", progress=False, auto_adjust=True)
        if isinstance(hist.columns, pd.MultiIndex):
            closes = hist.xs("Close", axis=1, level=0)
        elif "Close" in hist.columns:
            closes = hist[["Close"]]
            if len(symbols) == 1:
                closes.columns = symbols
        else:
            closes = pd.DataFrame()
    except Exception:
        closes = pd.DataFrame()

    results = []
    for sym in symbols:
        try:
            ticker = yf.Ticker(sym)
            info = ticker.info
            if not info or not info.get("regularMarketPrice") and not info.get("currentPrice"):
                continue

            price = info.get("regularMarketPrice") or info.get("currentPrice") or 0
            market_cap = info.get("marketCap")
            pe_ratio = info.get("trailingPE")
            div_yield = info.get("dividendYield")
            week52_high = info.get("fiftyTwoWeekHigh")
            week52_low = info.get("fiftyTwoWeekLow")
            currency = info.get("currency", "USD")
            volume = info.get("regularMarketVolume")

            # Calculate % change
            change_pct = None
            if not closes.empty and sym in closes.columns:
                vals = closes[sym].dropna()
                if len(vals) >= 2:
                    prev, curr = float(vals.iloc[-2]), float(vals.iloc[-1])
                    if prev > 0:
                        change_pct = round((curr - prev) / prev * 100, 2)

            # Apply numeric filters
            if pe_ratio and min_pe and pe_ratio < min_pe:
                continue
            if pe_ratio and max_pe and pe_ratio > max_pe:
                continue
            if min_price and price < min_price:
                continue
            if max_price and price > max_price:
                continue

            results.append({
                "symbol": sym,
                "name": meta_map[sym]["name"],
                "sector": meta_map[sym]["sector"],
                "currency": currency,
                "price": round(price, 2),
                "changePercent": change_pct,
                "marketCap": market_cap,
                "peRatio": round(pe_ratio, 2) if pe_ratio else None,
                "dividendYield": round(div_yield * 100, 2) if div_yield else None,
                "week52High": week52_high,
                "week52Low": week52_low,
                "volume": volume,
            })
        except Exception:
            continue

    # Sort
    reverse = sort_dir.lower() != "asc"
    sort_key_map = {
        "marketCap": "marketCap",
        "peRatio": "peRatio",
        "price": "price",
        "changePercent": "changePercent",
    }
    skey = sort_key_map.get(sort_by, "marketCap")
    results.sort(key=lambda x: (x.get(skey) is None, -(x.get(skey) or 0) if reverse else (x.get(skey) or 0)), reverse=False)

    payload = {"results": results, "sectors": SECTORS}
    cache_set(cache_key, payload, ttl=300)  # 5 min cache
    return payload


@router.get("/news")
def get_news_feed(
    query: Optional[str] = Query("Indian stock market"),
    limit: int = Query(30)
):
    """Fetch financial news from multiple RSS feeds."""
    import feedparser
    from datetime import datetime

    FEEDS = [
        ("Economic Times Markets", "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"),
        ("Moneycontrol", "https://www.moneycontrol.com/rss/latestnews.xml"),
        ("LiveMint Markets", "https://www.livemint.com/rss/markets"),
        ("Yahoo Finance", "https://finance.yahoo.com/news/rssindex"),
        ("Seeking Alpha", "https://seekingalpha.com/market_currents.xml"),
    ]

    cache_key = f"news_feed_{query}_{limit}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    all_articles = []

    for source_name, url in FEEDS:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:8]:
                title = entry.get("title", "")
                link = entry.get("link", "")
                summary = entry.get("summary", entry.get("description", ""))[:300]
                published_raw = entry.get("published", "")

                # Normalise date
                try:
                    from email.utils import parsedate_to_datetime
                    pub_dt = parsedate_to_datetime(published_raw)
                    published = pub_dt.strftime("%b %d, %Y · %H:%M")
                    sort_ts = pub_dt.timestamp()
                except Exception:
                    published = published_raw[:16] if published_raw else "Recent"
                    sort_ts = 0

                if title and link:
                    all_articles.append({
                        "title": title,
                        "link": link,
                        "summary": summary,
                        "source": source_name,
                        "published": published,
                        "sort_ts": sort_ts,
                    })
        except Exception:
            continue

    # Sort newest first
    all_articles.sort(key=lambda x: x["sort_ts"], reverse=True)
    for a in all_articles:
        del a["sort_ts"]

    result = {"articles": all_articles[:limit]}
    cache_set(cache_key, result, ttl=600)  # 10 min cache
    return result
