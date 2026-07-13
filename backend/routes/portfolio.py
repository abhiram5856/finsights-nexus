from fastapi import APIRouter, HTTPException, Depends, Request
from db import get_supabase, create_client, SUPABASE_URL, SUPABASE_KEY
from services.auth import get_user_id, get_current_user
import yfinance as yf
import pandas as pd
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class StockAdd(BaseModel):
    symbol: str
    company_name: str
    quantity: float
    buy_price: float

@router.get("/")
def get_portfolio(request: Request):
    try:
        user_id = get_current_user(request)
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1] if auth_header else None
        
        # Create a fresh client for this request to respect RLS (auth.uid())
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        if token:
            supabase.postgrest.auth(token)
            
        result = supabase.table("portfolio").select("*").eq("user_id", user_id).execute()
        port_data = result.data
    except Exception as e:
        print(f"Error fetching portfolio data: {e}")
        # Only return empty list if it's a regular error, not an auth error which is handled by get_current_user
        return {
            "assets": [],
            "totalValue": 0,
            "totalPnL": 0,
            "totalPnLPercent": 0
        }
    
    if not port_data:
        return {
            "assets": [],
            "totalValue": 0,
            "totalPnL": 0,
            "totalPnLPercent": 0
        }

    # Batch fetch prices using yfinance
    symbols = [stock["stock_symbol"] for stock in port_data]
    try:
        # Fetching only the last closing price for all symbols in one go
        market_data_raw = yf.download(symbols, period="1d", progress=False)
        
        # Robust column extraction
        if market_data_raw.empty:
             market_data = pd.DataFrame()
        elif isinstance(market_data_raw.columns, pd.MultiIndex):
             market_data = market_data_raw.xs('Close', axis=1, level=0)
        else:
             # Simple Index
             if 'Close' in market_data_raw.columns:
                 market_data = market_data_raw[['Close']]
                 if len(symbols) == 1:
                     market_data.columns = [symbols[0]]
             else:
                 market_data = pd.DataFrame()
    except Exception as e:
        print(f"Batch fetch error: {e}")
        market_data = pd.DataFrame()

    total_invested = 0
    current_total_value = 0
    assets = []

    for stock in port_data:
        symbol = stock["stock_symbol"]
        qty = float(stock["quantity"])
        buy_p = float(stock["buy_price"])
        
        # Extract current price from batch data
        current_p = buy_p # Default fallback
        if not market_data.empty and symbol in market_data:
            val = market_data[symbol].iloc[-1]
            if not pd.isna(val):
                current_p = float(val)

        invested = qty * buy_p
        current_val = qty * current_p
        pnl = current_val - invested
        pnl_percent = (pnl / invested * 100) if invested > 0 else 0
        
        total_invested += invested
        current_total_value += current_val
        
        assets.append({
            "id": stock["id"],
            "symbol": symbol,
            "quantity": qty,
            "buyPrice": buy_p,
            "currentPrice": round(current_p, 2),
            "pnl": round(pnl, 2),
            "pnlPercent": round(pnl_percent, 2),
            "value": round(current_val, 2)
        })

    total_pnl = current_total_value - total_invested
    total_pnl_percent = (total_pnl / total_invested * 100) if total_invested > 0 else 0

    # Calculate allocations
    for asset in assets:
        asset["allocation"] = round(float(asset["value"] / current_total_value * 100), 1) if current_total_value > 0 else 0

    return {
        "assets": sorted(assets, key=lambda x: x["value"], reverse=True),
        "totalValue": round(float(current_total_value), 2),
        "totalPnL": round(float(total_pnl), 2),
        "totalPnLPercent": round(float(total_pnl_percent), 2)
    }

@router.post("/")
def add_to_portfolio(stock: StockAdd, request: Request):
    # This also validates the user first
    try:
        user_id = get_current_user(request)
        # We need to get the token again from the header to pass it to Supabase client
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1] if auth_header else None
        
        # Create a fresh client for this request to avoid singleton race conditions
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        if token:
            # Set the auth token for the underlying postgrest client to bypass 'anon' role
            # This is important for RLS which checks auth.uid()
            supabase.postgrest.auth(token)
        
        data = {
            "user_id": user_id,
            "stock_symbol": stock.symbol.upper(),
            "company_name": stock.company_name,
            "quantity": stock.quantity,
            "buy_price": stock.buy_price
        }
        
        result = supabase.table("portfolio").insert(data).execute()
        return result.data[0] if result.data else {"message": "Success"}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error adding to portfolio: {e}")
        # Return a proper error detail instead of crashing
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
        
        # Create a fresh client for this request to respect RLS (auth.uid())
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        if token:
            supabase.postgrest.auth(token)
            
        # Simple check to ensure user owns the item (though RLS should handle this too)
        result = supabase.table("portfolio").delete().eq("id", item_id).eq("user_id", user_id).execute()
        return {"message": "Deleted successfully"}
    except Exception as e:
        print(f"Error deleting from portfolio: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/history")
def get_portfolio_history(request: Request):
    """
    Returns aggregated historical time-series data for the user's current portfolio,
    strictly starting from their signup date (user.created_at).
    """
    try:
        user_id = get_current_user(request)
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1] if auth_header else None
        
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        if token:
            supabase.postgrest.auth(token)
            
        # 1. Fetch user signup date from Supabase Auth
        user_response = supabase.auth.get_user(token)
        user_obj = user_response.user
        if not user_obj:
            raise HTTPException(status_code=401, detail="User not found")
        
        signup_dt = pd.to_datetime(user_obj.created_at).tz_localize(None)
        
        # 2. Fetch portfolio assets
        result = supabase.table("portfolio").select("*").eq("user_id", user_id).execute()
        port_data = result.data
    except Exception as e:
        print(f"Auth/DB error in history: {e}")
        return {"history": [], "signupDate": None}
        
    if not port_data:
        return {"history": [], "signupDate": user_obj.created_at if user_obj else None}

    # Use 1y as the maximum historical window to fetch from yfinance
    yf_period = "1y"
    symbols = [stock["stock_symbol"] for stock in port_data]
    
    try:
        hist_data_raw = yf.download(symbols, period=yf_period, progress=False)
        if hist_data_raw.empty:
             return {"history": [], "signupDate": user_obj.created_at}
             
        if isinstance(hist_data_raw.columns, pd.MultiIndex):
             close_prices = hist_data_raw.xs('Close', axis=1, level=0)
        else:
             if 'Close' in hist_data_raw.columns:
                 close_prices = hist_data_raw[['Close']]
                 if len(symbols) == 1:
                     close_prices.columns = [symbols[0]]
             else:
                 return {"history": [], "signupDate": user_obj.created_at}
             
        close_prices = close_prices.dropna(how='all')
    except Exception as e:
        print(f"History fetch error: {e}")
        return {"history": [], "signupDate": user_obj.created_at}

    history_list = []
    
    for date in close_prices.index:
        current_date_naive = pd.to_datetime(date).tz_localize(None)
        # CRITICAL FILTER: Only include dates >= signup date
        if current_date_naive < signup_dt.normalize():
            continue

        daily_total = 0
        for stock in port_data:
            symbol = stock["stock_symbol"]
            qty = float(stock["quantity"])
            buy_price = float(stock.get("buy_price", 0))
            
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
                price = close_prices.loc[date, symbol]
                if not pd.isna(price):
                    if current_date_naive < bought_date:
                        # Value is 0 because they didn't own it yet
                        pass
                    else:
                        daily_total += (price * qty)
                      
        date_str = date.strftime('%b %d, %Y')
        history_list.append({
            "time": date_str,
            "value": round(daily_total, 2),
            "timestamp": date.timestamp()
        })

    history_list = sorted(history_list, key=lambda x: x["timestamp"])
    for item in history_list:
        del item["timestamp"]

    return {
        "history": history_list,
        "signupDate": user_obj.created_at
    }