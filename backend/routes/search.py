from fastapi import APIRouter, Query
from services.finnhub_service import search_stocks
from typing import List, Dict

router = APIRouter()

@router.get("/")
def search(q: str = Query("", description="Search query for stocks")):
    """
    Real-time stock search endpoint.
    """
    if not q or len(q) < 1:
        return []
        
    return search_stocks(q)
