from fastapi import APIRouter, HTTPException
from services.stocks_service import get_stock_insights, get_multi_stock_comparison
from services.exchange_service import get_exchange_rates
from models.stock import StockInsights
from models.comparison import ComparisonRequest, ComparisonResponse

router = APIRouter()

@router.get("/exchange-rates")
def fetch_exchange_rates():
    """Fetch latest exchange rates for supported currencies."""
    try:
        return get_exchange_rates()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{ticker_symbol}", response_model=StockInsights)
def fetch_stock(ticker_symbol: str):
    """Fetch full stock insights for a given ticker."""
    try:
        data = get_stock_insights(ticker_symbol.upper())
        return data
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/compare", response_model=ComparisonResponse)
def compare_stocks(request: ComparisonRequest):
    """Compare multiple stock tickers."""
    if not request.tickers:
        raise HTTPException(status_code=400, detail="No tickers provided")
    
    if len(request.tickers) < 2 or len(request.tickers) > 10:
        raise HTTPException(status_code=400, detail="Please provide 2 to 10 tickers for comparison")

    try:
        results = get_multi_stock_comparison(request.tickers)
        if not results:
            raise HTTPException(status_code=404, detail="No valid data found for provided tickers")
        return {"stocks": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
