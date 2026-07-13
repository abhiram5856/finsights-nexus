from pydantic import BaseModel
from typing import List, Optional


class ComparisonRequest(BaseModel):
    tickers: List[str]


class ComparisonPricePoint(BaseModel):
    date: str
    price: Optional[float] = None


class StockComparisonData(BaseModel):
    symbol: str
    marketCap: Optional[float] = None
    trailingPE: Optional[float] = None
    dividendYield: Optional[float] = None
    six_month_performance: Optional[float] = None
    fiftyTwoWeekHigh: Optional[float] = None
    fiftyTwoWeekLow: Optional[float] = None
    price_history_6m: List[ComparisonPricePoint]


class ComparisonResponse(BaseModel):
    stocks: List[StockComparisonData]
