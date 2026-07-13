import { useState } from 'react';
import api from '../services/api';

export function useStockInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStock = async (ticker) => {
    setLoading(true);
    setError(null);
    try {
      // Fire requests in parallel
      const [stockRes, predictRes, sentimentRes] = await Promise.all([
        api.get(`/stocks/${ticker}`),
        api.post(`/ai/predict/${ticker}?days=30`),
        api.get(`/ai/sentiment/${ticker}`)
      ]);

      const baseData = stockRes.data;
      const forecastData = predictRes.data.forecast;
      const sentimentScore = sentimentRes.data.score;

      // Transform forecast data into the format expected by the chart
      const lastDate = new Date(baseData.price_history_6m[baseData.price_history_6m.length - 1].date);
      const newPredData = forecastData.map((price, i) => {
        const d = new Date(lastDate);
        d.setDate(d.getDate() + i + 1);
        return {
          date: d.toISOString().split('T')[0],
          predicted_price: price
        };
      });

      // Override the basic linear regression with our new AlphaEngine predictions
      baseData.ml_prediction_30d = newPredData;
      
      // Override the basic trend signal with our LLM sentiment score
      baseData.trend_signal = sentimentScore > 50 ? 'Bullish' : 'Bearish';
      baseData.sentiment_score = sentimentScore;
      baseData.sentiment_summary = sentimentRes.data.summary;

      setData(baseData);
    } catch (e) {
      setError(e.response?.data?.detail || 'Unable to fetch AI insights. Make sure the backend is running.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchStock };
}
