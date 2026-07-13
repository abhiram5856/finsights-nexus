from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional


class PricePoint(BaseModel):
    date: str
    price: Optional[float] = None


class VolumePoint(BaseModel):
    date: str
    volume: Optional[int] = None


class PredictionPoint(BaseModel):
    date: str
    predicted_price: Optional[float] = None


class StockInsights(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    current_price: Optional[float] = None
    change_percent: Optional[float] = None
    high_52_week: Optional[float] = Field(default=None, alias='52_week_high')
    low_52_week: Optional[float] = Field(default=None, alias='52_week_low')
    price_history_6m: List[PricePoint]
    volume_history: List[VolumePoint]
    ml_prediction_30d: List[PredictionPoint]
    trend_signal: str = "Neutral"
