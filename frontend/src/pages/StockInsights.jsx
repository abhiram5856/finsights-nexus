import { useState, useEffect, useRef } from 'react';
import { useStockInsights } from '../hooks/useStockInsights';
import StockAutocomplete from '../components/StockAutocomplete';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/formatCurrency';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Bot, Search, TrendingUp, TrendingDown, Activity, Loader2 } from 'lucide-react';

const POPULAR_TICKERS = [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'NVDA', name: 'Nvidia' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'RELIANCE.NS', name: 'Reliance' },
    { symbol: 'TCS.NS', name: 'TCS' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC' },
    { symbol: 'INFY.NS', name: 'Infosys' },
    { symbol: 'BTC-USD', name: 'Bitcoin' },
];

export default function StockInsights({ theme, selectedTicker }) {
  const { selectedCurrency, getRate } = useCurrency();
  const [ticker, setTicker] = useState('');
  const { data, loading, error, fetchStock } = useStockInsights();
  const autocompleteRef = useRef(null);

  const formatStockPrice = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    if (!data) return 'N/A';
    const stockCurrency = data.currency || 'USD';
    
    // 1. Convert native amount to USD (divide by native rate to USD)
    const nativeRateToUSD = getRate(stockCurrency);
    const amountInUSD = amount / (nativeRateToUSD || 1);
    
    // 2. Convert from USD to selectedCurrency (multiply by selected rate)
    const selectedRateToUSD = getRate(selectedCurrency);
    const finalAmount = amountInUSD * (selectedRateToUSD || 1);
    
    // 3. Format as currency
    const locale = selectedCurrency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(finalAmount);
  };

  useEffect(() => {
    if (selectedTicker) {
      setTicker(selectedTicker);
      fetchStock(selectedTicker);
    }
  }, [selectedTicker]);

  const isDark = theme === 'dark';

  const chartColors = {
    grid: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
    text: isDark ? '#94A3B8' : '#64748B',
    tooltipBg: isDark ? '#1E293B' : '#FFFFFF',
    tooltipBorder: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
  };

  const fetchData = () => {
    if (!ticker) return;
    if (autocompleteRef.current) {
      autocompleteRef.current.close();
    }
    fetchStock(ticker);
  };

  const handleSelectStock = (symbol) => {
    if (!symbol) return;
    setTicker(symbol);
    fetchStock(symbol);
  };

  const renderCards = () => {
    if (!data) return null;
    const isPositive = data.change_percent >= 0;
    const changeClass = isPositive ? 'text-[#10B981]' : 'text-[#EF4444]';

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="glass-panel p-7 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[var(--text-muted)] text-sm font-medium">Latest Price</p>
            <Activity size={18} className="text-[var(--accent-primary)]/50" />
          </div>
          <h2 className="text-3xl font-bold text-[var(--text-main)] mb-1">{formatStockPrice(data.current_price)}</h2>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${isPositive ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {data.change_percent.toFixed(2)}%
          </div>
        </div>

        <div className="glass-panel p-7 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <p className="text-[var(--text-muted)] text-sm font-medium mb-4">52‑Week High</p>
          <h2 className="text-2xl font-bold text-[var(--text-main)]">{formatStockPrice(data['52_week_high'])}</h2>
          <div className="mt-3 w-full bg-[var(--bg-primary)] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[var(--accent-primary)] h-full rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>

        <div className="glass-panel p-7 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <p className="text-[var(--text-muted)] text-sm font-medium mb-4">52‑Week Low</p>
          <h2 className="text-2xl font-bold text-[var(--text-main)]">{formatStockPrice(data['52_week_low'])}</h2>
          <div className="mt-3 w-full bg-[var(--bg-primary)] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[var(--text-muted)]/30 h-full rounded-full" style={{ width: '15%' }}></div>
          </div>
        </div>
      </div>
    );
  };

  const renderCharts = () => {
    if (!data) return null;
    const priceData = data.price_history_6m.map((p) => ({ date: p.date, price: p.price }));
    const predData = data.ml_prediction_30d.map((p) => ({ date: p.date, predicted: p.predicted_price }));
    const chartData = [...priceData, ...predData];
    const volumeData = data.volume_history.map((v) => ({ date: v.date, volume: v.volume }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="lg:col-span-2 glass-panel p-8 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
              Market Performance & Trend Projection
              <span className="text-[10px] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-0.5 rounded uppercase font-bold tracking-widest">Forecast</span>
            </h3>
          </div>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartColors.text, fontSize: 10, fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartColors.text, fontSize: 10, fontWeight: 500 }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    borderColor: chartColors.tooltipBorder,
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="var(--accent-primary)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--accent-primary)' }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="6 6"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-8">Trading Volume</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartColors.text, fontSize: 10, fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartColors.text, fontSize: 10, fontWeight: 500 }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    borderColor: chartColors.tooltipBorder,
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="volume" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderTrendBadge = () => {
    if (!data) return null;
    const bullish = data.trend_signal === 'Bullish';
    return (
      <div className="flex flex-col items-end gap-2">
        <div
          className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-xl border animate-in zoom-in duration-300 ${bullish
            ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20 shadow-sm shadow-[#10B981]/5'
            : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20 shadow-sm shadow-[#EF4444]/5'
            }`}
        >
          <Bot className="mr-2" size={16} /> Sentiment: {data.trend_signal}
        </div>
      </div>
    );
  };

  const renderSentimentSummary = () => {
    if (!data || !data.sentiment_summary) return null;
    return (
      <div className="glass-panel p-6 md:p-8 rounded-2xl shadow-sm mt-6 mb-6">
         <h3 className="text-lg font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
            <Bot size={20} className="text-[var(--accent-primary)]" /> <span className="gradient-text">Market Deep-Dive</span>
         </h3>
         <p className="text-[var(--text-muted)] text-sm leading-relaxed font-medium">
            {data.sentiment_summary}
         </p>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-10 px-0 md:px-2">
      {/* search bar */}
      <div className="glass-panel p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-xl flex flex-col items-stretch gap-5 md:gap-6 transition-all duration-300">
        
        {/* Search controls */}
        <div className="flex flex-col md:flex-row gap-4 items-end w-full">
          <div className="flex-1 w-full">
            <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Search Indian Stocks (A-Z):</label>
            <StockAutocomplete 
                onSelect={(symbol) => handleSelectStock(symbol)}
                clearOnSelect={false}
                placeholder="Search stock to analyze (e.g. RELIANCE, TCS)..."
            />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} className="flex gap-2 w-full md:w-auto items-end">
            <div className="flex-1 md:flex-initial">
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Or Type Ticker (US/Crypto):</label>
              <input 
                  type="text" 
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  placeholder="e.g. AAPL, BTC-USD"
                  className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] transition-all placeholder:text-[var(--text-muted)] text-[var(--text-main)] font-medium w-full md:w-44"
              />
            </div>
            <button 
                type="submit"
                className="bg-[var(--accent-primary)] hover:brightness-110 text-white px-5 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-[var(--accent-primary)]/20 w-full md:w-auto touch-target"
            >
                <Search size={18} />
                Analyze
            </button>
          </form>
        </div>

        {/* Quick Select Buttons */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Quick Select:</span>
          <div className="flex flex-wrap gap-2 w-full">
            {POPULAR_TICKERS.map(pt => (
                <button
                    key={pt.symbol}
                    onClick={() => {
                        setTicker(pt.symbol);
                        fetchStock(pt.symbol);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold border rounded-xl transition-all shadow-sm ${ticker === pt.symbol ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-md shadow-[var(--accent-primary)]/20' : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10'}`}
                >
                    {pt.symbol}
                </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-[var(--border-color)] pt-5 md:pt-6 gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] flex-shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Global Insights</p>
              <p className="text-[13px] md:text-sm font-semibold text-[var(--text-main)]">Real-time Market Analysis</p>
            </div>
          </div>
          <div className="w-full sm:w-auto flex justify-end">
            {renderTrendBadge()}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 md:p-20 space-y-4">
          <div className="w-10 h-10 border-4 border-[var(--accent-primary)]/20 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
          <p className="text-[var(--text-muted)] text-sm font-medium text-center">Processing market data & training model...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-medium flex items-center gap-2 text-sm">
          <Bot size={20} />
          {error}
        </div>
      )}

      {renderCards()}
      {renderSentimentSummary()}
      {renderCharts()}
    </div>
  );
}
