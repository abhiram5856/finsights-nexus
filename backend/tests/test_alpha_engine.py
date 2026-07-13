import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add backend dir to pythonpath for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from services.alpha_engine import AlphaEngine

@pytest.fixture
def mock_stock_data():
    """Generates synthetic stock data for testing."""
    dates = pd.date_range(start="2024-01-01", periods=100, freq='B')
    # Generate a simple trending time series with some noise
    close_prices = np.linspace(100, 150, 100) + np.random.normal(0, 2, 100)
    df = pd.DataFrame({'Date': dates, 'Close': close_prices})
    df.set_index('Date', inplace=True)
    return df

def test_alpha_engine_initialization():
    """Tests if the model initializes correctly."""
    engine = AlphaEngine(rf_estimators=100)
    assert engine.prophet_model is None
    assert engine.xgb_model is None

def test_alpha_engine_feature_engineering(mock_stock_data):
    """Tests if technical indicators are created correctly."""
    engine = AlphaEngine()
    df_feat = engine._create_features(mock_stock_data)
    
    # Check if features exist
    expected_cols = ['sma_5', 'sma_20', 'rsi', 'macd', 'macd_signal', 'close_lag_1', 'close_lag_2']
    for col in expected_cols:
        assert col in df_feat.columns
        
    # Check if shifting worked correctly (first row should be NaN for lags)
    assert pd.isna(df_feat['close_lag_1'].iloc[0])

def test_alpha_engine_fit_and_predict(mock_stock_data):
    """Tests if the model can fit and predict without throwing errors."""
    engine = AlphaEngine()
    engine.fit(mock_stock_data)
    
    assert engine.prophet_model is not None
    assert engine.xgb_model is not None
    
    # Predict next 7 days
    forecast = engine.predict(days=7)
    
    # Check output shape
    assert len(forecast) == 7
    assert isinstance(forecast, np.ndarray)
    
    # Check that predictions are relatively sane (not infinite/nan)
    assert not np.isnan(forecast).any()
    assert not np.isinf(forecast).any()
    
def test_alpha_engine_missing_close_column():
    """Tests exception handling when data is malformed."""
    engine = AlphaEngine()
    bad_df = pd.DataFrame({'Open': [100, 101, 102]})
    with pytest.raises(ValueError, match="Dataframe must contain 'Close' column"):
        engine.fit(bad_df)
