from datetime import datetime, timedelta, timezone
import yfinance as yf
from typing import Dict

# supported currencies relative to USD
SUPPORTED_CURRENCIES = ["USD", "EUR", "JPY", "GBP", "INR", "CNY", "AUD", "CAD", "CHF"]

_rate_cache = {
    "rates": {},
    "expiry": datetime.min.replace(tzinfo=timezone.utc)
}
CACHE_TTL = timedelta(hours=1)

def get_exchange_rates() -> Dict[str, float]:
    """
    Fetch exchange rates for supported currencies relative to USD using yfinance.
    """
    now = datetime.now(timezone.utc)
    
    if _rate_cache["expiry"] > now: # type: ignore
        return _rate_cache["rates"] # type: ignore

    rates = {"USD": 1.0}
    
    for currency in SUPPORTED_CURRENCIES:
        if currency == "USD":
            continue
            
        try:
            # yfinance uses symbols like 'USDEUR=X' for USD to EUR
            symbol = f"USD{currency}=X"
            ticker = yf.Ticker(symbol)
            # Get the most recent close price
            data = ticker.history(period="1d")
            if not data.empty:
                rate = float(data["Close"].iloc[-1])
                rates[currency] = rate
            else:
                # Fallback or log if no data
                print(f"No data found for {symbol}")
                rates[currency] = 1.0 # default to 1 if failed
        except Exception as e:
            print(f"Error fetching rate for {currency}: {e}")
            rates[currency] = 1.0

    _rate_cache["rates"] = rates
    _rate_cache["expiry"] = now + CACHE_TTL
    return rates
