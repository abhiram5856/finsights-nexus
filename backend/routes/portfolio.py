from fastapi import APIRouter, HTTPException, Depends, Request
from db import get_supabase, create_client, SUPABASE_URL, SUPABASE_KEY
from services.auth import get_user_id, get_current_user
from services.cache import cache_get, cache_set
import yfinance as yf
import pandas as pd
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

CURRENCY_CACHE_TTL = 3600      # 1 hour — currency rarely changes
PORTFOLIO_PRICE_TTL = 180      # 3 minutes — prices are semi-live

class StockAdd(BaseModel):
    symbol: str
    company_name: str
    quantity: float
    buy_price: float
    buy_currency: Optional[str] = None   # native currency of buy price (e.g. "USD", "INR")


def _get_ticker_currency(symbol: str) -> str:
    """
    Return the native trading currency for a stock symbol.
    Results are cached for 1 hour (via Redis or in-memory fallback).
    """
    cache_key = f"currency_{symbol.upper()}"
    cached = cache_get(cache_key)
    if cached:
        return cached
    try:
        fast = yf.Ticker(symbol).fast_info
        currency = getattr(fast, "currency", None) or "USD"
    except Exception:
        currency = "USD"
    cache_set(cache_key, currency, ttl=CURRENCY_CACHE_TTL)
    return currency


def _get_current_price(symbol: str) -> Optional[float]:
    """
    Fetch the latest closing price for a symbol.
    Cached for 3 minutes so repeated portfolio loads don't hammer Yahoo.
    """
    cache_key = f"price_{symbol.upper()}"
    cached = cache_get(cache_key)
    if cached is not None:
        return float(cached)
    try:
        hist = yf.Ticker(symbol).history(period="2d")
        if hist.empty:
            return None
        price = float(hist["Close"].iloc[-1])
        cache_set(cache_key, price, ttl=PORTFOLIO_PRICE_TTL)
        return price
    except Exception:
        return None


@router.get("/")
def get_portfolio(request: Request):
    try:
        user_id = get_current_user(request)
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1] if auth_header else None
        
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        if token:
            supabase.postgrest.auth(token)
            
        result = supabase.table("portfolio").select("*").eq("user_id", user_id).execute()
        port_data = result.data
    except Exception as e:
        print(f"Error fetching portfolio data: {e}")
        return {"assets": [], "totalValueUSD": 0, "totalPnLUSD": 0, "totalPnLPercent": 0}
    
    if not port_data:
        return {"assets": [], "totalValueUSD": 0, "totalPnLUSD": 0, "totalPnLPercent": 0}

    # ── Fetch exchange rates for USD normalisation ─────────────────────────────
    # We need to convert native prices → USD to produce consistent totals.
    # The frontend will then convert USD totals → selected display currency.
    fx_cache_key = "exchange_rates_usd"
    exchange_rates = cache_get(fx_cache_key)
    if not exchange_rates:
        try:
            import requests as _req
            r = _req.get("https://api.exchangerate-api.com/v4/latest/USD", timeout=5)
            if r.ok:
                exchange_rates = r.json().get("rates", {})
                cache_set(fx_cache_key, exchange_rates, ttl=3600)
        except Exception:
            exchange_rates = {}
    if not exchange_rates:
        exchange_rates = {"INR": 83.5, "USD": 1.0, "EUR": 0.92, "GBP": 0.79}

    def to_usd(amount: float, currency: str) -> float:
        """Convert an amount in native currency to USD."""
        rate = exchange_rates.get(currency, 1.0)
        if rate == 0:
            return amount
        return amount / rate

    total_invested_usd = 0.0
    current_total_usd = 0.0
    assets = []

    for stock in port_data:
        symbol = stock["stock_symbol"]
        qty = float(stock["quantity"])
        buy_price_native = float(stock["buy_price"])

        # Determine native currency for this stock
        stock_currency = stock.get("buy_currency") or _get_ticker_currency(symbol)

        # Fetch current price in native currency
        current_price_native = _get_current_price(symbol)
        if current_price_native is None:
            current_price_native = buy_price_native  # fallback: no gain/loss

        # Convert to USD for portfolio-level totals
        buy_price_usd = to_usd(buy_price_native, stock_currency)
        current_price_usd = to_usd(current_price_native, stock_currency)

        invested_usd = qty * buy_price_usd
        current_val_usd = qty * current_price_usd
        pnl_usd = current_val_usd - invested_usd
        pnl_percent = (pnl_usd / invested_usd * 100) if invested_usd > 0 else 0

        total_invested_usd += invested_usd
        current_total_usd += current_val_usd

        assets.append({
            "id": stock["id"],
            "symbol": symbol,
            "stockCurrency": stock_currency,
            "quantity": qty,
            # Native prices (for per-asset display with correct currency badge)
            "buyPrice": round(buy_price_native, 4),
            "currentPrice": round(current_price_native, 4),
            # USD-normalised values for consistent portfolio-level math
            "buyPriceUSD": round(buy_price_usd, 4),
            "currentPriceUSD": round(current_price_usd, 4),
            "pnlUSD": round(pnl_usd, 2),
            "pnlPercent": round(pnl_percent, 2),
            "valueUSD": round(current_val_usd, 2),
        })

    total_pnl_usd = current_total_usd - total_invested_usd
    total_pnl_percent = (total_pnl_usd / total_invested_usd * 100) if total_invested_usd > 0 else 0

    # Calculate allocations (% of total USD value)
    for asset in assets:
        asset["allocation"] = round(float(asset["valueUSD"] / current_total_usd * 100), 1) if current_total_usd > 0 else 0

    return {
        "assets": sorted(assets, key=lambda x: x["valueUSD"], reverse=True),
        # Totals in USD — frontend multiplies by getRate(selectedCurrency) to display
        "totalValueUSD": round(float(current_total_usd), 2),
        "totalPnLUSD": round(float(total_pnl_usd), 2),
        "totalPnLPercent": round(float(total_pnl_percent), 2),
    }


@router.post("/")
def add_to_portfolio(stock: StockAdd, request: Request):
    try:
        user_id = get_current_user(request)
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1] if auth_header else None
        
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        if token:
            supabase.postgrest.auth(token)

        # Detect native currency of the stock if not provided
        stock_currency = stock.buy_currency or _get_ticker_currency(stock.symbol.upper())
        
        data = {
            "user_id": user_id,
            "stock_symbol": stock.symbol.upper(),
            "company_name": stock.company_name,
            "quantity": stock.quantity,
            "buy_price": stock.buy_price,  # stored in native currency
            "buy_currency": stock_currency,
        }
        
        result = supabase.table("portfolio").insert(data).execute()
        return result.data[0] if result.data else {"message": "Success"}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error adding to portfolio: {e}")
        error_msg = str(e)
        if "row-level security" in error_msg.lower():
            error_msg = "Database RLS policy violation. Please ensure you have configured the 'portfolio' table correctly in Supabase."
        raise HTTPException(status_code=400, detail=error_msg)


@router.delete("/{item_id}")
def delete_from_portfolio(item_id: str, request: Request):
    try:
        user_id = get_current_user(request)
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1] if auth_header else None
        
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        if token:
            supabase.postgrest.auth(token)
            
        supabase.table("portfolio").delete().eq("id", item_id).eq("user_id", user_id).execute()
        return {"message": "Deleted successfully"}
    except Exception as e:
        print(f"Error deleting from portfolio: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/history")
def get_portfolio_history(request: Request):
    """
    Returns aggregated historical time-series data for the user's portfolio.
    All values are returned in USD for consistent cross-currency aggregation.
    The frontend converts to the user's selected display currency.
    """
    try:
        user_id = get_current_user(request)
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1] if auth_header else None
        
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        if token:
            supabase.postgrest.auth(token)
            
        user_response = supabase.auth.get_user(token)
        user_obj = user_response.user
        if not user_obj:
            raise HTTPException(status_code=401, detail="User not found")
        
        signup_dt = pd.to_datetime(user_obj.created_at).tz_localize(None)
        
        result = supabase.table("portfolio").select("*").eq("user_id", user_id).execute()
        port_data = result.data
    except Exception as e:
        print(f"Auth/DB error in history: {e}")
        return {"history": [], "signupDate": None, "currency": "USD"}
        
    if not port_data:
        return {"history": [], "signupDate": user_obj.created_at if user_obj else None, "currency": "USD"}

    # Fetch exchange rates for USD normalisation
    fx_cache_key = "exchange_rates_usd"
    exchange_rates = cache_get(fx_cache_key)
    if not exchange_rates:
        try:
            import requests as _req
            r = _req.get("https://api.exchangerate-api.com/v4/latest/USD", timeout=5)
            if r.ok:
                exchange_rates = r.json().get("rates", {})
                cache_set(fx_cache_key, exchange_rates, ttl=3600)
        except Exception:
            exchange_rates = {}
    if not exchange_rates:
        exchange_rates = {"INR": 83.5, "USD": 1.0, "EUR": 0.92, "GBP": 0.79}

    def to_usd(amount: float, currency: str) -> float:
        rate = exchange_rates.get(currency, 1.0)
        return amount / rate if rate else amount

    # Fetch per-stock currency
    stock_currencies = {}
    for stock in port_data:
        sym = stock["stock_symbol"]
        stock_currencies[sym] = stock.get("buy_currency") or _get_ticker_currency(sym)

    yf_period = "1y"
    symbols = list(stock_currencies.keys())
    
    try:
        hist_data_raw = yf.download(symbols, period=yf_period, progress=False)
        if hist_data_raw.empty:
             return {"history": [], "signupDate": user_obj.created_at, "currency": "USD"}
             
        if isinstance(hist_data_raw.columns, pd.MultiIndex):
             close_prices = hist_data_raw.xs('Close', axis=1, level=0)
        else:
             if 'Close' in hist_data_raw.columns:
                 close_prices = hist_data_raw[['Close']]
                 if len(symbols) == 1:
                     close_prices.columns = [symbols[0]]
             else:
                 return {"history": [], "signupDate": user_obj.created_at, "currency": "USD"}
             
        close_prices = close_prices.dropna(how='all')
    except Exception as e:
        print(f"History fetch error: {e}")
        return {"history": [], "signupDate": user_obj.created_at, "currency": "USD"}

    history_list = []
    
    for date in close_prices.index:
        current_date_naive = pd.to_datetime(date).tz_localize(None)
        if current_date_naive < signup_dt.normalize():
            continue

        daily_total_usd = 0.0
        for stock in port_data:
            symbol = stock["stock_symbol"]
            qty = float(stock["quantity"])
            stock_currency = stock_currencies.get(symbol, "USD")
            
            created_at_str = stock.get("created_at")
            bought_date = None
            if created_at_str:
                try:
                    bought_date = pd.to_datetime(created_at_str).tz_localize(None)
                except Exception:
                    bought_date = signup_dt
            else:
                bought_date = signup_dt

            if symbol in close_prices.columns:
                price_native = close_prices.loc[date, symbol]
                if not pd.isna(price_native) and current_date_naive >= bought_date:
                    price_usd = to_usd(float(price_native), stock_currency)
                    daily_total_usd += price_usd * qty
                      
        date_str = date.strftime('%b %d, %Y')
        history_list.append({
            "time": date_str,
            "value": round(daily_total_usd, 2),
            "timestamp": date.timestamp()
        })

    history_list = sorted(history_list, key=lambda x: x["timestamp"])
    for item in history_list:
        del item["timestamp"]

    return {
        "history": history_list,
        "signupDate": user_obj.created_at,
        "currency": "USD",  # frontend converts to selected currency
    }