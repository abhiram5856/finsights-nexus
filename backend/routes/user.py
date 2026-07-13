from fastapi import APIRouter, HTTPException, Request
from db import create_client, SUPABASE_URL, SUPABASE_KEY
from services.auth import get_current_user
from services.stocks_service import get_multi_stock_comparison
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class WatchlistAdd(BaseModel):
    symbol: str
    company_name: Optional[str] = None

class PriceAlert(BaseModel):
    symbol: str
    target_price: float
    condition: str   # "above" or "below"
    note: Optional[str] = None

# ── Watchlist ──────────────────────────────────────────────────────────────────

@router.get("/watchlist")
def get_watchlist(request: Request):
    try:
        user_id = get_current_user(request)
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1] if auth_header else None
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        if token:
            supabase.postgrest.auth(token)
        result = supabase.table("watchlist").select("*").eq("user_id", user_id).execute()
        items = result.data or []
        
        # Enrich with live price data
        if items:
            symbols = [i["symbol"] for i in items]
            try:
                live = get_multi_stock_comparison(symbols)
                live_map = {s["symbol"]: s for s in live}
                for item in items:
                    live_data = live_map.get(item["symbol"], {})
                    item["current_price"] = live_data.get("current_price")
                    item["change_percent"] = live_data.get("change_percent")
                    item["currency"] = live_data.get("currency", "USD")
            except Exception:
                pass  # Return items without live data on error
        
        return {"items": items}
    except Exception as e:
        print(f"Watchlist fetch error: {e}")
        return {"items": []}

@router.post("/watchlist")
def add_to_watchlist(item: WatchlistAdd, request: Request):
    try:
        user_id = get_current_user(request)
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1] if auth_header else None
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        if token:
            supabase.postgrest.auth(token)
        
        # Check if already exists
        existing = supabase.table("watchlist").select("id").eq("user_id", user_id).eq("symbol", item.symbol.upper()).execute()
        if existing.data:
            raise HTTPException(status_code=409, detail=f"{item.symbol} is already in your watchlist")
        
        result = supabase.table("watchlist").insert({
            "user_id": user_id,
            "symbol": item.symbol.upper(),
            "company_name": item.company_name or item.symbol.upper()
        }).execute()
        return result.data[0] if result.data else {"message": "Added to watchlist"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/watchlist/{item_id}")
def remove_from_watchlist(item_id: str, request: Request):
    try:
        user_id = get_current_user(request)
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1] if auth_header else None
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        if token:
            supabase.postgrest.auth(token)
        supabase.table("watchlist").delete().eq("id", item_id).eq("user_id", user_id).execute()
        return {"message": "Removed from watchlist"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ── Price Alerts ───────────────────────────────────────────────────────────────

@router.get("/alerts")
def get_alerts(request: Request):
    try:
        user_id = get_current_user(request)
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1] if auth_header else None
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        if token:
            supabase.postgrest.auth(token)
        result = supabase.table("price_alerts").select("*").eq("user_id", user_id).execute()
        return {"alerts": result.data or []}
    except Exception as e:
        print(f"Alerts fetch error: {e}")
        return {"alerts": []}

@router.post("/alerts")
def create_alert(alert: PriceAlert, request: Request):
    try:
        user_id = get_current_user(request)
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1] if auth_header else None
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        if token:
            supabase.postgrest.auth(token)
        result = supabase.table("price_alerts").insert({
            "user_id": user_id,
            "symbol": alert.symbol.upper(),
            "target_price": alert.target_price,
            "condition": alert.condition,
            "note": alert.note or "",
            "triggered": False
        }).execute()
        return result.data[0] if result.data else {"message": "Alert created"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/alerts/{alert_id}")
def delete_alert(alert_id: str, request: Request):
    try:
        user_id = get_current_user(request)
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1] if auth_header else None
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        if token:
            supabase.postgrest.auth(token)
        supabase.table("price_alerts").delete().eq("id", alert_id).eq("user_id", user_id).execute()
        return {"message": "Alert deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ── Market Status ──────────────────────────────────────────────────────────────

@router.get("/market-status")
def get_market_status():
    """
    Returns real-time open/closed status for NSE and NYSE based on local trading hours.
    NSE:  Mon-Fri 09:15 - 15:30 IST (UTC+5:30)
    NYSE: Mon-Fri 09:30 - 16:00 EST (UTC-5 / UTC-4 in DST)
    """
    from datetime import datetime, timezone, timedelta
    import pytz

    now_utc = datetime.now(timezone.utc)
    
    # NSE — Indian Standard Time
    ist = pytz.timezone("Asia/Kolkata")
    now_ist = now_utc.astimezone(ist)
    nse_open = (
        now_ist.weekday() < 5 and
        now_ist.replace(hour=9, minute=15, second=0, microsecond=0) <= now_ist <=
        now_ist.replace(hour=15, minute=30, second=0, microsecond=0)
    )
    
    # NYSE — Eastern Time (handles DST automatically)
    et = pytz.timezone("America/New_York")
    now_et = now_utc.astimezone(et)
    nyse_open = (
        now_et.weekday() < 5 and
        now_et.replace(hour=9, minute=30, second=0, microsecond=0) <= now_et <=
        now_et.replace(hour=16, minute=0, second=0, microsecond=0)
    )

    return {
        "NSE": {
            "open": nse_open,
            "label": "NSE India",
            "local_time": now_ist.strftime("%H:%M IST"),
            "hours": "09:15 – 15:30 IST"
        },
        "NYSE": {
            "open": nyse_open,
            "label": "NYSE / NASDAQ",
            "local_time": now_et.strftime("%H:%M ET"),
            "hours": "09:30 – 16:00 ET"
        }
    }
