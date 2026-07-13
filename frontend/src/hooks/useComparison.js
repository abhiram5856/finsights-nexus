import { useState } from 'react';
import api from '../services/api';

export function useComparison() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const safeNumber = (value) => {
        if (value === null || value === undefined || isNaN(Number(value))) return null;
        return Number(value);
    };

    const safePercent = (value, isDecimal = false) => {
        const num = safeNumber(value);
        if (num === null) return null;
        return isDecimal ? num * 100 : num;
    };

    const compareStocks = async (tickers) => {
        if (!tickers || tickers.length < 2) {
            setError('Please provide at least 2 tickers to compare');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/stocks/compare', { tickers });

            // Sanitization Layer
            const sanitizedStocks = res.data.stocks.map((raw) => ({
                symbol: raw.symbol,
                currency: raw.currency || 'USD',
                marketCap: safeNumber(raw.marketCap),
                peRatio: safeNumber(raw.trailingPE),
                dividendYield: safePercent(raw.dividendYield, true),
                high52: safeNumber(raw.fiftyTwoWeekHigh),
                low52: safeNumber(raw.fiftyTwoWeekLow),
                sixMonthPerformance: safePercent(raw.six_month_performance, false),
                price_history_6m: Array.isArray(raw.price_history_6m) ? raw.price_history_6m : []
            }));

            setData(sanitizedStocks);
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to compare stocks');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, compareStocks };
}
