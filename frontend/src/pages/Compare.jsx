import { useState } from 'react';
import { useComparison } from '../hooks/useComparison';
import ComparisonChart from '../components/ComparisonChart';
import ComparisonTable from '../components/ComparisonTable';
import { Plus, X, Search, TrendingUp, Info } from 'lucide-react';

const POPULAR_TICKERS = [
    { symbol: '', name: 'Select a stock to compare...' },
    { symbol: 'AAPL', name: 'Apple Inc. (AAPL)' },
    { symbol: 'MSFT', name: 'Microsoft Corp. (MSFT)' },
    { symbol: 'NVDA', name: 'NVIDIA Corp. (NVDA)' },
    { symbol: 'TSLA', name: 'Tesla Inc. (TSLA)' },
    { symbol: 'AMZN', name: 'Amazon.com (AMZN)' },
    { symbol: 'GOOGL', name: 'Alphabet Inc. (GOOGL)' },
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries (RELIANCE)' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services (TCS)' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank (HDFCBANK)' },
    { symbol: 'INFY.NS', name: 'Infosys (INFY)' },
    { symbol: 'BTC-USD', name: 'Bitcoin (BTC)' },
];


export default function Compare({ theme }) {
    const [tickers, setTickers] = useState([]);
    const [newTicker, setNewTicker] = useState('');
    const { data, loading, error, compareStocks } = useComparison();

    const handleAddTicker = (e) => {
        e.preventDefault();
        if (!newTicker) return;
        const cleanTicker = newTicker.trim().toUpperCase();
        if (tickers.includes(cleanTicker)) return;
        if (tickers.length >= 6) return;
        setTickers([...tickers, cleanTicker]);
        setNewTicker('');
    };

    const handleRemoveTicker = (ticker) => {
        setTickers(tickers.filter((t) => t !== ticker));
    };

    const handleCompare = () => {
        compareStocks(tickers);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-10 px-0 md:px-2 transition-colors duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6 md:gap-8 bg-[var(--bg-card)] p-5 md:p-8 rounded-2xl border border-[var(--border-color)] shadow-sm">
                <div className="flex-1 space-y-3 md:space-y-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs md:text-sm font-bold text-[var(--text-main)] uppercase tracking-tight">Active Comparison</label>
                        <span className="text-[9px] md:text-[10px] bg-[var(--text-muted)]/10 text-[var(--text-muted)] px-2 py-0.5 rounded font-black">{tickers.length}/6</span>
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-2.5">
                        {tickers.map((t) => (
                            <span
                                key={t}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-primary)] text-[var(--text-main)] rounded-xl border border-[var(--border-color)] group hover:border-[var(--accent-primary)]/50 transition-all shadow-sm"
                            >
                                <span className="font-bold text-xs md:text-sm">{t}</span>
                                <button
                                    onClick={() => handleRemoveTicker(t)}
                                    className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                        {tickers.length < 6 && (
                            <div className="flex flex-wrap gap-2 w-full mt-3 pt-3 border-t border-[var(--border-color)]">
                                <span className="text-[11px] font-bold text-[var(--text-muted)] w-full uppercase tracking-wider mb-1">Quick Select:</span>
                                {POPULAR_TICKERS.filter(pt => pt.symbol).map(pt => (
                                    <button
                                        key={pt.symbol}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (!tickers.includes(pt.symbol)) setTickers([...tickers, pt.symbol]);
                                        }}
                                        disabled={tickers.includes(pt.symbol)}
                                        className="px-3 py-1.5 text-xs font-bold bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        {pt.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleCompare}
                    disabled={tickers.length < 2 || loading}
                    className="w-full lg:w-auto bg-[var(--accent-primary)] hover:brightness-110 disabled:opacity-50 text-white font-black px-8 md:px-10 py-4 md:py-3.5 rounded-xl md:rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent-primary)]/20 touch-target"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <TrendingUp size={20} />
                    )}
                    {loading ? 'Crunching...' : 'Compare Assets'}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-3 font-medium text-sm">
                    <Info size={18} />
                    {error}
                </div>
            )}

            {data && !loading && (
                <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <ComparisonChart stocks={data} theme={theme} />
                    <ComparisonTable stocks={data} />
                </div>
            )}

            {!data && !loading && (
                <div className="py-16 md:py-24 flex flex-col items-center justify-center text-[var(--text-muted)] space-y-5 md:space-y-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] border-dashed mx-2 md:mx-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--bg-primary)] flex items-center justify-center shadow-inner">
                        <Search size={28} md:size={32} className="opacity-40" />
                    </div>
                    <div className="text-center px-6">
                        <p className="text-lg md:text-xl font-bold text-[var(--text-main)]">Ready to compare</p>
                        <p className="text-xs md:text-sm max-w-xs mx-auto mt-2 leading-relaxed">Select 2-6 tickers above and run the comparison to see real-time performance correlations.</p>
                    </div>
                </div>
            )}

            {loading && (
                <div className="space-y-6 md:space-y-8 animate-pulse">
                    <div className="h-80 md:h-96 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]" />
                    <div className="h-48 md:h-64 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]" />
                </div>
            )}
        </div>
    );
}
