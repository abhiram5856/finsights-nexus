from datetime import datetime, timedelta
import pytz

EXCHANGE_CONFIG = {
    "NSE": {
        "timezone": "Asia/Kolkata",
        "sessions": [
            {"name": "PRE_MARKET", "start": "09:00", "end": "09:15"},
            {"name": "OPEN", "start": "09:15", "end": "15:30"},
            {"name": "POST_MARKET", "start": "15:40", "end": "16:00"},
        ]
    },
    "BSE": {
        "timezone": "Asia/Kolkata",
        "sessions": [
            {"name": "PRE_MARKET", "start": "09:00", "end": "09:15"},
            {"name": "OPEN", "start": "09:15", "end": "15:30"},
            {"name": "POST_MARKET", "start": "15:40", "end": "16:00"},
        ]
    },
    "NYSE": {
        "timezone": "America/New_York",
        "sessions": [
            {"name": "PRE_MARKET", "start": "04:00", "end": "09:30"},
            {"name": "OPEN", "start": "09:30", "end": "16:00"},
            {"name": "AFTER_HOURS", "start": "16:00", "end": "20:00"},
        ]
    },
    "NASDAQ": {
        "timezone": "America/New_York",
        "sessions": [
            {"name": "PRE_MARKET", "start": "04:00", "end": "09:30"},
            {"name": "OPEN", "start": "09:30", "end": "16:00"},
            {"name": "AFTER_HOURS", "start": "16:00", "end": "20:00"},
        ]
    },
    "LSE": {
        "timezone": "Europe/London",
        "sessions": [
            {"name": "OPEN", "start": "08:00", "end": "16:30"},
        ]
    },
    "TSE": {
        "timezone": "Asia/Tokyo",
        "sessions": [
            {"name": "OPEN", "start": "09:00", "end": "15:00"},
        ]
    }
}

def get_market_status(exchange_code: str):
    exchange_code = exchange_code.upper()
    if exchange_code not in EXCHANGE_CONFIG:
        return {"error": f"Unsupported exchange: {exchange_code}"}

    cfg = EXCHANGE_CONFIG[exchange_code]
    tz = pytz.timezone(cfg["timezone"])
    now = datetime.now(tz)
    
    # Check for weekends
    if now.weekday() >= 5:  # Saturday=5, Sunday=6
        status = "CLOSED"
        # Find next Monday 00:00:00
        days_until_monday = (7 - now.weekday()) % 7
        if days_until_monday == 0: days_until_monday = 7 # It's Sunday, next is tomorrow
        next_monday = (now + timedelta(days=days_until_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        
        # More accurately: next_open is the first session of the first workday
        # Simple for now: just next monday first session
        first_session_start = cfg["sessions"][0]["start"]
        h, m = map(int, first_session_start.split(":"))
        next_open = next_monday.replace(hour=h, minute=m)
        
        return {
            "exchange": exchange_code,
            "status": status,
            "next_open_time": next_open.strftime("%Y-%m-%d %H:%M:%S %Z"),
            "next_close_time": "",
            "countdown_seconds": int((next_open - now).total_seconds())
        }

    # Weekday logic
    current_time_str = now.strftime("%H:%M")
    status = "CLOSED"
    next_open_time = ""
    next_close_time = ""
    countdown_seconds = 0
    
    # Check if we are in any session
    for session in cfg["sessions"]:
        if session["start"] <= current_time_str < session["end"]:
            status = session["name"]
            # Current session ends at...
            h, m = map(int, session["end"].split(":"))
            session_end_dt = now.replace(hour=h, minute=m, second=0, microsecond=0)
            next_close_time = session_end_dt.strftime("%Y-%m-%d %H:%M:%S %Z")
            countdown_seconds = int((session_end_dt - now).total_seconds())
            return {
                "exchange": exchange_code,
                "status": status,
                "next_open_time": "",
                "next_close_time": next_close_time,
                "countdown_seconds": countdown_seconds
            }

    # If not in any session, find what's next
    # Case 1: Early morning (before first session)
    first_session = cfg["sessions"][0]
    if current_time_str < first_session["start"]:
        h, m = map(int, first_session["start"].split(":"))
        next_open_dt = now.replace(hour=h, minute=m, second=0, microsecond=0)
        return {
            "exchange": exchange_code,
            "status": "CLOSED",
            "next_open_time": next_open_dt.strftime("%Y-%m-%d %H:%M:%S %Z"),
            "next_close_time": "",
            "countdown_seconds": int((next_open_dt - now).total_seconds())
        }

    # Case 2: Between sessions (gap)
    for i in range(len(cfg["sessions"]) - 1):
        curr_session = cfg["sessions"][i]
        next_session = cfg["sessions"][i+1]
        if curr_session["end"] <= current_time_str < next_session["start"]:
            h, m = map(int, next_session["start"].split(":"))
            next_open_dt = now.replace(hour=h, minute=m, second=0, microsecond=0)
            return {
                "exchange": exchange_code,
                "status": "CLOSED",
                "next_open_time": next_open_dt.strftime("%Y-%m-%d %H:%M:%S %Z"),
                "next_close_time": "",
                "countdown_seconds": int((next_open_dt - now).total_seconds())
            }

    # Case 3: After last session (close for the day)
    last_session = cfg["sessions"][-1]
    if current_time_str >= last_session["end"]:
        # Find next open day (could be tomorrow or Monday)
        next_day = now + timedelta(days=1)
        while next_day.weekday() >= 5:
            next_day += timedelta(days=1)
            
        h, m = map(int, first_session["start"].split(":"))
        next_open_dt = next_day.replace(hour=h, minute=m, second=0, microsecond=0)
        return {
            "exchange": exchange_code,
            "status": "CLOSED",
            "next_open_time": next_open_dt.strftime("%Y-%m-%d %H:%M:%S %Z"),
            "next_close_time": "",
            "countdown_seconds": int((next_open_dt - now).total_seconds())
        }

    return {
        "exchange": exchange_code,
        "status": "CLOSED",
        "next_open_time": "",
        "next_close_time": "",
        "countdown_seconds": 0
    }
