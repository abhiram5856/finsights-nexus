from datetime import datetime, timedelta, timezone
from typing import List, Optional
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from services.cache import cache_get, cache_set

import math

CACHE_TTL_SECONDS = 300  # 5 minutes

def safe_float(val):
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (ValueError, TypeError):
        return None


def _slice_last_six_months(df: pd.DataFrame) -> pd.DataFrame:
    cutoff = datetime.now(timezone.utc) - timedelta(days=182)  # approx 6 months
    # Ensure index is timezone-aware if cutoff is
    if df.index.tz is None:
        df.index = df.index.tz_localize('UTC')
    return df[df.index >= cutoff]


def _resolve_symbol(symbol: str):
    """
    Check if symbol returns data. If not and it doesn't contain a dot,
    try appending '.NS' to automatically support Indian tickers.
    Returns (ticker_object, period_1y_history, resolved_symbol_str).
    """
    symbol = symbol.upper().strip()
    ticker = yf.Ticker(symbol)
    try:
        hist = ticker.history(period="1y")
    except Exception:
        hist = pd.DataFrame()
        
    if hist.empty and "." not in symbol:
        try:
            try_ticker = yf.Ticker(f"{symbol}.NS")
            try_hist = try_ticker.history(period="1y")
            if not try_hist.empty:
                return try_ticker, try_hist, f"{symbol}.NS"
        except Exception:
            pass
            
    return ticker, hist, symbol


def get_stock_currency(symbol: str) -> str:
    """
    Fetch and cache the native currency of a stock symbol.
    Cached for 1 hour since currency doesn't change frequently.
    """
    cache_key = f"currency_{symbol.upper()}"
    cached = cache_get(cache_key)
    if cached:
        return cached
    
    try:
        ticker = yf.Ticker(symbol)
        fast = ticker.fast_info
        currency = getattr(fast, "currency", None)
        if not currency:
            try:
                info = ticker.info
                currency = info.get("currency", "USD")
            except Exception:
                currency = "USD"
    except Exception:
        currency = "USD"
    
    cache_set(cache_key, currency, ttl=3600)  # cache for 1 hour
    return currency


def get_multi_stock_comparison(tickers: List[str]) -> List[dict]:
    results = []

    rate_limited = False
    for symbol in tickers:
        symbol = symbol.upper()
        ticker, hist, resolved_symbol = _resolve_symbol(symbol)
        
        if hist.empty:
            # Stock genuinely not found or no data
            continue

        cache_key = f"compare_{resolved_symbol}"
        cached = cache_get(cache_key)
        if cached:
            results.append(cached)
            continue

        try:

            # 2. Fetch metadata (less reliable due to rate limits)
            try:
                info = ticker.info
            except Exception as e:
                if "Too Many Requests" in str(e) or "Rate limited" in str(e):
                    rate_limited = True
                info = {}
            
            fast = ticker.fast_info
            
            # 6-month performance
            last_6m = _slice_last_six_months(hist.copy())
            if len(last_6m) >= 2:
                start_price = float(last_6m["Close"].iloc[0])
                end_price = float(last_6m["Close"].iloc[-1])
                perf_6m = ((end_price - start_price) / start_price) * 100 if start_price != 0 else None
            else:
                perf_6m = None

            # Historical data
            if last_6m.empty:
                price_history_6m = []
            else:
                price_history_6m = [
                    {"date": idx.strftime("%Y-%m-%d"), "price": safe_float(row["Close"])}
                    for idx, row in last_6m.iterrows()
                ]

            # Safe extraction with fast_info fallbacks
            market_cap = info.get("marketCap") or getattr(fast, "market_cap", None)
            pe_ratio = info.get("trailingPE") or None
            
            # Dividend yield calculation
            dividend_yield = info.get("dividendYield")
            if dividend_yield is None:
                div_rate = info.get("dividendRate")
                current_price_val = info.get("currentPrice") or getattr(fast, "last_price", None)
                if div_rate and current_price_val:
                    dividend_yield = div_rate / current_price_val

            high_52 = info.get("fiftyTwoWeekHigh") or getattr(fast, "year_high", None) or (float(hist["High"].max()) if not hist.empty else None)
            low_52 = info.get("fiftyTwoWeekLow") or getattr(fast, "year_low", None) or (float(hist["Low"].min()) if not hist.empty else None)

            current_price = getattr(fast, "last_price", None) or (float(hist["Close"].iloc[-1]) if not hist.empty else None)
            prev_price = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else current_price
            change_percent = ((current_price - prev_price) / prev_price) * 100 if prev_price and current_price else 0

            data = {
                "symbol": resolved_symbol,
                "currency": (info.get("currency") or getattr(fast, "currency", "USD")).upper(),
                "marketCap": safe_float(market_cap),
                "trailingPE": safe_float(pe_ratio),
                "dividendYield": safe_float(dividend_yield),
                "six_month_performance": safe_float(perf_6m),
                "fiftyTwoWeekHigh": safe_float(high_52),
                "fiftyTwoWeekLow": safe_float(low_52),
                "price_history_6m": price_history_6m,
                "current_price": safe_float(current_price),
                "change_percent": safe_float(change_percent)
            }
            
            cache_set(cache_key, data, ttl=CACHE_TTL_SECONDS)
            results.append(data)

        except Exception as e:
            if "Too Many Requests" in str(e) or "Rate limited" in str(e):
                rate_limited = True
            print(f"Error comparing {symbol}: {e}")
            continue

    if not results and rate_limited:
        raise ValueError("Yahoo Finance is currently rate limiting requests. Please try again in a few minutes.")

    return results


def get_stock_insights(ticker_symbol: str) -> dict:
    # Resolve symbol first so we cache under the resolved symbol name
    ticker, hist, resolved_symbol = _resolve_symbol(ticker_symbol)
    
    cache_key = f"insights_{resolved_symbol}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    try:
        # Fetch native currency details
        try:
            info = ticker.info
        except:
            info = {}
        fast = ticker.fast_info
        currency = (info.get("currency") or getattr(fast, "currency", "USD")).upper()
    except Exception as exc:
        if "Too Many Requests" in str(exc) or "Rate limited" in str(exc):
            raise ValueError("Yahoo Finance rate limit hit. Please try again later.")
        raise ValueError(f"Failed to fetch data for {resolved_symbol}: {exc}")

    if hist.empty:
        raise ValueError(f"Ticker symbol {resolved_symbol} not found or no historical data")

    # compute current price information
    try:
        last_close = safe_float(hist["Close"].iloc[-1])
        prev_close = safe_float(hist["Close"].iloc[-2]) if len(hist) >= 2 else last_close
        if last_close is not None and prev_close is not None and prev_close != 0:
            change_percent = ((last_close - prev_close) / prev_close) * 100
        else:
            change_percent = 0
    except:
        last_close = None
        change_percent = 0

    # 52-week extremes
    high_52 = safe_float(hist["High"].max())
    low_52 = safe_float(hist["Low"].min())

    # 6-month slice
    last_6m = _slice_last_six_months(hist.copy())

    price_history_6m = [
        {"date": idx.strftime("%Y-%m-%d"), "price": safe_float(row["Close"])}
        for idx, row in last_6m.iterrows()
    ]
    volume_history = [
        {"date": idx.strftime("%Y-%m-%d"), "volume": int(row["Volume"]) if not pd.isna(row["Volume"]) else None}
        for idx, row in last_6m.iterrows()
    ]

    # linear regression prediction over last 6 months closes
    closes = last_6m["Close"].reset_index()
    closes = closes.dropna()
    if closes.empty:
        preds_list = []
        avg_pred = None
    else:
        closes["day"] = np.arange(len(closes))
        X = closes[["day"]].values
        y = closes["Close"].values
        model = LinearRegression()
        model.fit(X, y)

        future_days = np.arange(len(closes), len(closes) + 30).reshape(-1, 1)
        preds = model.predict(future_days)

        last_date = closes["Date"].iloc[-1]
        future_dates = [last_date + timedelta(days=i + 1) for i in range(30)]
        preds_list = [
            {"date": d.strftime("%Y-%m-%d"), "predicted_price": safe_float(p)}
            for d, p in zip(future_dates, preds)
        ]
        avg_pred = float(np.mean(preds)) if len(preds) > 0 else None

    if avg_pred is not None and last_close is not None:
        trend_signal = "Bullish" if avg_pred > last_close else "Bearish"
    else:
        trend_signal = "Neutral"

    response = {
        "current_price": last_close,
        "change_percent": change_percent,
        "52_week_high": high_52,
        "52_week_low": low_52,
        "price_history_6m": price_history_6m,
        "volume_history": volume_history,
        "ml_prediction_30d": preds_list,
        "trend_signal": trend_signal,
        "currency": currency,
    }

    cache_set(cache_key, response, ttl=CACHE_TTL_SECONDS)
    return response
