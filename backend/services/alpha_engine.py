import pandas as pd
import numpy as np
import warnings
from prophet import Prophet
import xgboost as xgb
from ta.trend import SMAIndicator, MACD
from ta.momentum import RSIIndicator
import optuna
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split

# Silence Optuna logs so it doesn't spam the server console
optuna.logging.set_verbosity(optuna.logging.WARNING)

warnings.filterwarnings("ignore")

class AlphaEngine:
    def __init__(self, rf_estimators=100):
        self.prophet_model = None
        self.xgb_model = None
        self.history = None
        
    def _create_features(self, df):
        """Creates technical indicators as features."""
        data = df.copy()
        
        # SMA 5 and 20
        data['sma_5'] = SMAIndicator(close=data['Close'], window=5).sma_indicator()
        data['sma_20'] = SMAIndicator(close=data['Close'], window=20).sma_indicator()
        
        # RSI
        data['rsi'] = RSIIndicator(close=data['Close'], window=14).rsi()
        
        # MACD
        macd = MACD(close=data['Close'])
        data['macd'] = macd.macd()
        data['macd_signal'] = macd.macd_signal()
        
        # Lagged Close
        data['close_lag_1'] = data['Close'].shift(1)
        data['close_lag_2'] = data['Close'].shift(2)
        
        return data

    def fit(self, df):
        """
        Fits the Prophet model on the Close price, computes residuals,
        and fits XGBoost on features to predict residuals.
        """
        df = df.copy()
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
            
        if 'Close' not in df.columns:
            raise ValueError("Dataframe must contain 'Close' column.")
            
        df.reset_index(inplace=True)
        # Ensure we have a Date column
        date_col = df.columns[0]
        
        # 1. Fit Prophet
        prophet_df = pd.DataFrame({'ds': df[date_col], 'y': df['Close']})
        # Removing tz timezone if exists to avoid Prophet warnings
        if prophet_df['ds'].dt.tz is not None:
            prophet_df['ds'] = prophet_df['ds'].dt.tz_localize(None)
            
        self.prophet_model = Prophet(daily_seasonality=True, yearly_seasonality=True)
        self.prophet_model.fit(prophet_df)
        
        # Get Prophet predictions for the training period
        forecast = self.prophet_model.predict(prophet_df[['ds']])
        df['prophet_pred'] = forecast['yhat'].values
        
        # 2. Compute residuals
        df['residual'] = df['Close'] - df['prophet_pred']
        
        # 3. Create features for XGBoost
        df_feat = self._create_features(df)
        df_feat.dropna(inplace=True)
        
        if df_feat.empty:
            self.xgb_model = None
            return
            
        # 4. Dynamic Hyperparameter Tuning with Optuna
        self.features = ['sma_5', 'sma_20', 'rsi', 'macd', 'macd_signal', 'close_lag_1', 'close_lag_2']
        X = df_feat[self.features]
        y = df_feat['residual']
        
        # Split data for Optuna evaluation (time-series split without shuffling)
        X_train, X_valid, y_train, y_valid = train_test_split(X, y, test_size=0.2, shuffle=False)
        
        def objective(trial):
            param = {
                'n_estimators': trial.suggest_int('n_estimators', 50, 150),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.2),
                'max_depth': trial.suggest_int('max_depth', 3, 7),
                'random_state': 42
            }
            model = xgb.XGBRegressor(**param)
            model.fit(X_train, y_train)
            preds = model.predict(X_valid)
            return mean_squared_error(y_valid, preds)
            
        study = optuna.create_study(direction='minimize')
        # Run 10 micro-experiments on the fly to find the perfect ML parameters
        study.optimize(objective, n_trials=10)
        
        best_params = study.best_params
        best_params['random_state'] = 42
        
        # Train final XGBoost model on all available data using the optimized parameters
        self.xgb_model = xgb.XGBRegressor(**best_params)
        self.xgb_model.fit(X, y)
        
        self.history = df[['Close']].copy()
        self.last_date = df[date_col].iloc[-1]

    def predict(self, days=7):
        """
        Predicts future prices for `days`.
        """
        if self.prophet_model is None:
            raise ValueError("Model is not fitted yet.")
            
        # Generate future dates for Prophet
        future_dates = pd.date_range(start=self.last_date, periods=days+1, freq='B')[1:]
        future_df = pd.DataFrame({'ds': future_dates})
        if future_df['ds'].dt.tz is not None:
            future_df['ds'] = future_df['ds'].dt.tz_localize(None)
            
        # Get Prophet forecast
        prophet_forecast = self.prophet_model.predict(future_df)
        arima_forecast = prophet_forecast['yhat'].values
        
        final_predictions = []
        current_history = self.history.copy()
        
        for i in range(days):
            current_arima_pred = arima_forecast[i]
            
            if self.xgb_model is not None:
                temp_df = current_history.copy()
                temp_df.loc[len(temp_df)] = {'Close': current_arima_pred}
                
                feat_df = self._create_features(temp_df)
                last_row = feat_df.iloc[[-1]]
                
                if not last_row[self.features].isnull().values.any():
                    xgb_pred = self.xgb_model.predict(last_row[self.features])[0]
                else:
                    xgb_pred = 0
            else:
                xgb_pred = 0
                
            final_pred = current_arima_pred + xgb_pred
            final_predictions.append(final_pred)
            current_history.loc[len(current_history)] = {'Close': final_pred}
            
        return np.array(final_predictions)
