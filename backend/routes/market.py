from fastapi import APIRouter, HTTPException
from services.market_status import get_market_status

router = APIRouter()

@router.get("/status/{exchange_code}")
def get_status(exchange_code: str):
    """
    Returns real-time market status for a given exchange.
    Example: /api/market/status/NSE
    """
    result = get_market_status(exchange_code)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
