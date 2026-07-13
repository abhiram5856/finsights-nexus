import { useState, useEffect, useMemo } from 'react';
import StockAutocomplete from '../components/StockAutocomplete';
import { supabase } from '../lib/supabase';
import { PieChart as PieChartIcon, Search, Plus, List, ArrowUpRight, TrendingUp, TrendingDown, RefreshCw, Briefcase, Trash2, X, AlertTriangle, Zap, CheckCircle2, Loader2, Globe } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import api from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { convertAndFormat, formatFromUSD } from '../utils/formatCurrency';
import { Input } from './modules/shared';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6'];
const EMPTY_COLOR = '#E2E8F0';

// Currency flag/badge colours for visual distinction
const CURRENCY_BADGE_COLORS = {
    USD: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    INR: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    EUR: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    GBP: 'bg-green-500/10 text-green-400 border-green-500/20',
    JPY: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    CNY: 'bg-red-500/10 text-red-400 border-red-500/20',
    default: 'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-color)]',
};

function getCurrencyBadgeClass(currency) {
    return CURRENCY_BADGE_COLORS[currency] || CURRENCY_BADGE_COLORS.default;
}

export default function Portfolio({ theme }) {
    const { selectedCurrency, getRate } = useCurrency();

    const [portfolio, setPortfolio] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [aiInsights, setAiInsights] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [error, setError] = useState(null);

    // Detected native currency for the stock being added
    const [detectedCurrency, setDetectedCurrency] = useState(null);

    // Modal Form State
    const [newStock, setNewStock] = useState({ symbol: '', quantity: '', buyPrice: '', name: '' });

    // ── Helpers ──────────────────────────────────────────────────────────────────

    /**
     * Format a price that is in a stock's native currency into the user's selected display currency.
     * e.g. TSLA price $220 (USD) → ₹18,370 (INR)
     */
    const formatAssetPrice = (amount, stockCurrency) => {
        if (amount === null || amount === undefined) return 'N/A';
        return convertAndFormat(amount, stockCurrency || 'USD', selectedCurrency, getRate);
    };

    /**
     * Format a portfolio-level total that has been pre-normalised to USD by the backend.
     * e.g. totalValueUSD=2000 → ₹1,67,000 (INR)
     */
    const formatTotal = (amountUSD) => {
        if (amountUSD === null || amountUSD === undefined) return 'N/A';
        return formatFromUSD(amountUSD, selectedCurrency, getRate);
    };

    // ── Data fetching ──────────────────────────────────────────────────────────

    const fetchPortfolio = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/portfolio/');
            setPortfolio(res.data);
        } catch (err) {
            console.error("Fetch portfolio error:", err);
            setPortfolio({ assets: [], totalValueUSD: 0, totalPnLUSD: 0, totalPnLPercent: 0 });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchPortfolio(); }, []);

    // Detect native currency when user selects a stock in the Add modal
    const handleStockSelect = async (symbol, stock) => {
        setNewStock(prev => ({ ...prev, symbol, name: stock?.description || symbol }));
        setDetectedCurrency(null);
        if (!symbol) return;
        try {
            // Try to get the currency from the comparison endpoint (which is already cached)
            const res = await api.post('/stocks/compare', { tickers: [symbol.toUpperCase()] });
            const stockData = res.data?.stocks?.[0];
            if (stockData?.currency) {
                setDetectedCurrency(stockData.currency);
            }
        } catch {
            // No detection → user can still enter price, we'll let backend detect on save
        }
    };

    // ── Add Stock ──────────────────────────────────────────────────────────────

    const handleAddStock = async (e) => {
        e.preventDefault();
        setError(null);
        if (!newStock.symbol || !newStock.quantity || !newStock.buyPrice) {
            setError("Please fill in all fields");
            return;
        }

        setIsAdding(true);
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error("You must be logged in to add stocks.");

            await api.post('/portfolio/', {
                symbol: newStock.symbol.toUpperCase(),
                company_name: newStock.name || newStock.symbol.toUpperCase(),
                quantity: Number(newStock.quantity),
                // Store raw price in native currency — NO manual conversion needed
                buy_price: Number(newStock.buyPrice),
                buy_currency: detectedCurrency || null,  // backend will detect if null
            });

            setIsModalOpen(false);
            setNewStock({ symbol: '', quantity: '', buyPrice: '', name: '' });
            setDetectedCurrency(null);
            fetchPortfolio();
        } catch (err) {
            console.error("Add stock error:", err);
            const errorMsg = err.response?.data?.detail || err.message || "Failed to add stock.";
            setError(errorMsg);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this stock from your portfolio?")) return;
        try {
            await api.delete(`/portfolio/${id}`);
            fetchPortfolio();
        } catch (err) {
            console.error("Delete stock error:", err);
        }
    };

    // ── Chart data ─────────────────────────────────────────────────────────────

    const chartData = useMemo(() => {
        if (!portfolio?.assets || portfolio.assets.length === 0) {
            return [{ name: "No Assets", value: 1 }];
        }
        return portfolio.assets.map(asset => ({
            name: asset.symbol,
            value: asset.valueUSD || 0,  // use USD value for consistent pie sizing
        }));
    }, [portfolio]);

    // ── AI Insights ────────────────────────────────────────────────────────────

    const fetchAiInsights = async (currentPortfolio) => {
        if (!currentPortfolio?.assets || currentPortfolio.assets.length === 0) {
            setAiInsights([]);
            return;
        }
        setIsAiLoading(true);
        try {
            const payload = {
                assets: currentPortfolio.assets.map(a => ({
                    symbol: a.symbol,
                    quantity: a.quantity,
                    buy_price: a.buyPriceUSD,      // USD normalised for AI analysis
                    current_price: a.currentPriceUSD,
                })),
                total_value: currentPortfolio.totalValueUSD || 0,
            };
            const response = await api.post('/ai/analyze_portfolio', payload);
            const enhancedInsights = response.data.insights.map(insight => {
                let icon, bg, border;
                if (insight.type === 'warning') {
                    icon = <AlertTriangle size={18} className="text-amber-500" />;
                    bg = "bg-amber-500/10"; border = "border-amber-500/20";
                } else if (insight.type === 'success') {
                    icon = <CheckCircle2 size={18} className="text-emerald-500" />;
                    bg = "bg-emerald-500/10"; border = "border-emerald-500/20";
                } else {
                    icon = <Zap size={18} className="text-indigo-500" />;
                    bg = "bg-indigo-500/10"; border = "border-indigo-500/20";
                }
                return { ...insight, icon, bg, border };
            });
            setAiInsights(enhancedInsights);
        } catch (err) {
            console.error("AI Portfolio Analysis Error:", err);
            setAiInsights([]);
        } finally {
            setIsAiLoading(false);
        }
    };

    useEffect(() => { if (portfolio) fetchAiInsights(portfolio); }, [portfolio]);

    // ── Loading state ──────────────────────────────────────────────────────────

    if (isLoading && !portfolio) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
                <Loader2 className="w-12 h-12 text-[var(--accent-primary)] animate-spin" />
                <p className="text-[var(--text-muted)] font-medium">Crunching market numbers...</p>
            </div>
        );
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    const totalPnLPositive = (portfolio?.totalPnLUSD || 0) >= 0;

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8 pb-10 animate-in fade-in duration-700 px-0 md:px-2">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-4 md:px-0">
                <div className="space-y-1 md:space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black text-[var(--text-main)] tracking-tight">Portfolio</h1>
                    <p className="text-[11px] md:text-[13px] text-[var(--text-muted)] font-medium flex items-center gap-2">
                        <Briefcase size={16} className="text-[var(--accent-primary)]" />
                        Track and optimize your global investment distribution
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto bg-[var(--accent-primary)] text-white px-6 py-3.5 md:py-3 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-[1.05] active:scale-[0.95] transition-all shadow-lg shadow-[var(--accent-primary)]/25"
                >
                    <Plus size={20} />
                    Add Stock
                </button>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-2xl md:rounded-3xl border border-[var(--border-color)] shadow-xl overflow-hidden relative group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:rotate-12 transition-transform duration-500 hidden md:block">
                        <TrendingUp size={120} />
                    </div>
                    <p className="text-[var(--text-muted)] text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-2">Portfolio Value</p>
                    <h2 className="text-2xl md:text-4xl font-black text-[var(--text-main)]">
                        {formatTotal(portfolio?.totalValueUSD || 0)}
                    </h2>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">Converted to {selectedCurrency}</p>
                </div>

                <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-2xl md:rounded-3xl border border-[var(--border-color)] shadow-xl overflow-hidden relative group">
                    <p className="text-[var(--text-muted)] text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-2">Total Net P/L</p>
                    <div className="flex items-baseline gap-2 md:gap-3">
                        <h2 className={`text-2xl md:text-4xl font-black ${totalPnLPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {totalPnLPositive ? '+' : ''}{formatTotal(portfolio?.totalPnLUSD || 0)}
                        </h2>
                        <span className={`text-[11px] md:text-sm font-black px-2 py-0.5 md:py-1 rounded-lg ${totalPnLPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {portfolio?.totalPnLPercent}%
                        </span>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-2xl md:rounded-3xl border border-[var(--border-color)] shadow-xl overflow-hidden relative group sm:col-span-2 lg:col-span-1">
                    <p className="text-[var(--text-muted)] text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-2">Holdings</p>
                    <div className="flex items-center gap-3">
                        <Globe size={24} className="text-[var(--accent-primary)]" />
                        <h2 className="text-xl md:text-2xl font-black text-[var(--text-main)]">
                            {portfolio?.assets?.length || 0} Assets
                        </h2>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-2 font-medium">
                        {[...new Set(portfolio?.assets?.map(a => a.stockCurrency) || [])].join(' · ') || '—'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* Holdings Table */}
                <div className="lg:col-span-12 xl:col-span-8 bg-[var(--bg-card)] rounded-2xl md:rounded-3xl border border-[var(--border-color)] shadow-xl overflow-hidden">
                    <div className="p-5 md:p-8 border-b border-[var(--border-color)] flex justify-between items-center">
                        <h3 className="font-black text-lg md:text-xl text-[var(--text-main)] flex items-center gap-3">
                            <List className="text-[var(--accent-primary)]" size={20} />
                            My Holdings
                        </h3>
                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                            Prices in {selectedCurrency}
                        </span>
                    </div>
                    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="text-[var(--text-muted)] text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] border-b border-[var(--border-color)]">
                                    <th className="py-4 md:py-6 px-4 md:px-8">Symbol</th>
                                    <th className="py-4 md:py-6 px-2 md:px-4 text-center">Qty</th>
                                    <th className="py-4 md:py-6 px-2 md:px-4 text-right">Avg Cost</th>
                                    <th className="py-4 md:py-6 px-2 md:px-4 text-right">Current</th>
                                    <th className="py-4 md:py-6 px-2 md:px-4 text-right">P/L</th>
                                    <th className="py-4 md:py-6 px-4 md:px-8 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {portfolio?.assets.map((asset) => (
                                    <tr key={asset.id} className="group hover:bg-[var(--bg-primary)]/40 transition-colors">
                                        <td className="py-4 md:py-6 px-4 md:px-8">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className="w-8 h-8 md:w-10 md:h-10 bg-[var(--bg-primary)] rounded-lg md:rounded-xl flex items-center justify-center font-black text-[var(--accent-primary)] border border-[var(--border-color)] text-xs md:text-base">
                                                    {asset.symbol[0]}
                                                </div>
                                                <div>
                                                    <span className="font-black text-[13px] md:text-base text-[var(--text-main)] tracking-tight block">{asset.symbol}</span>
                                                    {/* Native currency badge */}
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${getCurrencyBadgeClass(asset.stockCurrency)}`}>
                                                        {asset.stockCurrency}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 md:py-6 px-2 md:px-4 text-center font-bold text-[13px] md:text-base text-[var(--text-main)]">
                                            {asset.quantity}
                                        </td>
                                        <td className="py-4 md:py-6 px-2 md:px-4 text-right font-bold text-[12px] md:text-sm text-[var(--text-muted)]">
                                            {/* buyPrice is in native currency (e.g. USD for TSLA) → convert to selectedCurrency */}
                                            {formatAssetPrice(asset.buyPrice, asset.stockCurrency)}
                                        </td>
                                        <td className="py-4 md:py-6 px-2 md:px-4 text-right font-black text-[13px] md:text-base text-[var(--text-main)]">
                                            {formatAssetPrice(asset.currentPrice, asset.stockCurrency)}
                                        </td>
                                        <td className="py-4 md:py-6 px-2 md:px-4 text-right font-black">
                                            <div className={`flex flex-col items-end ${asset.pnlUSD >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {/* pnlUSD is pre-normalised to USD → convert to selectedCurrency */}
                                                <span className="text-[13px] md:text-base">
                                                    {asset.pnlUSD >= 0 ? '+' : ''}{formatFromUSD(asset.pnlUSD, selectedCurrency, getRate)}
                                                </span>
                                                <span className="text-[9px] md:text-[10px] opacity-80">{asset.pnlPercent}%</span>
                                            </div>
                                        </td>
                                        <td className="py-4 md:py-6 px-4 md:px-8 text-center">
                                            <button
                                                onClick={() => handleDelete(asset.id)}
                                                className="p-2 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!portfolio?.assets || portfolio?.assets.length === 0) && (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center text-[var(--text-muted)] text-sm font-medium italic">
                                            Your portfolio is currently empty.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar Analytics */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-6 md:space-y-8">
                    {/* Allocation Donut */}
                    <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-2xl md:rounded-3xl border border-[var(--border-color)] shadow-xl flex flex-col items-center">
                        <h3 className="font-black text-lg md:text-xl text-[var(--text-main)] flex items-center gap-3 self-start mb-6 md:mb-8">
                            <PieChartIcon className="text-[var(--accent-primary)]" size={20} />
                            Allocation
                        </h3>
                        <div className="w-full h-[250px] md:h-[300px] min-w-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={85}
                                        paddingAngle={5} dataKey="value" stroke="none"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.name === "No Assets" ? EMPTY_COLOR : COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--bg-card)',
                                            borderRadius: '16px',
                                            border: '1px solid var(--border-color)',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Legend */}
                        <div className="w-full mt-4 md:mt-6 grid grid-cols-2 gap-3 md:gap-4">
                            {portfolio?.assets && portfolio.assets.length > 0 ? (
                                portfolio.assets.slice(0, 6).map((asset, idx) => (
                                    <div key={asset.id || idx} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                        <span className="text-[9px] md:text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest truncate">{asset.symbol}</span>
                                        <span className="text-[9px] md:text-[10px] font-black text-[var(--text-main)] ml-auto">{asset.allocation}%</span>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 text-center text-[10px] font-semibold text-[var(--text-muted)] italic">
                                    No allocation data.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Smart Co-Pilot Insights */}
                    <div className="space-y-4 px-1 md:px-0">
                        {aiInsights.length > 0 && (
                            <h3 className="font-black text-lg md:text-xl text-[var(--text-main)] flex items-center gap-3 mb-2">
                                <Zap className="text-indigo-500" size={18} fill="currentColor" />
                                Smart Co-Pilot
                            </h3>
                        )}
                        <div className="flex flex-col gap-4">
                            {isAiLoading ? (
                                <div className="flex flex-col items-center justify-center py-8 space-y-4 bg-[var(--bg-primary)]/50 rounded-2xl border border-[var(--border-color)]">
                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                    <p className="text-[var(--text-muted)] text-sm font-medium">Analysing your portfolio...</p>
                                </div>
                            ) : (
                                aiInsights.map((insight) => (
                                    <div key={insight.id} className={`${insight.bg} ${insight.border} p-4 md:p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] shadow-xl backdrop-blur-sm relative group overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-right-4`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-[var(--bg-primary)] shadow-sm border border-[var(--border-color)]">
                                                    {insight.icon}
                                                </div>
                                                <h4 className="font-black text-[13px] md:text-sm text-[var(--text-main)] tracking-tight">
                                                    {insight.title}
                                                </h4>
                                            </div>
                                            <div className="bg-[var(--bg-primary)] px-2 py-0.5 rounded-md border border-[var(--border-color)] flex-shrink-0">
                                                <span className="text-[9px] md:text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{insight.confidence}%</span>
                                            </div>
                                        </div>
                                        <p className="text-[11px] md:text-xs text-[var(--text-muted)] leading-relaxed font-medium pl-1">
                                            {insight.message}
                                        </p>
                                        <div className="flex justify-end mt-1">
                                            <button className="text-[10px] md:text-xs font-black text-[var(--text-main)] bg-[var(--bg-primary)] px-4 py-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--text-main)] hover:text-[var(--bg-primary)] transition-all">
                                                {insight.action}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Stock Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-[var(--bg-card)] w-full max-w-lg rounded-2xl md:rounded-[32px] border border-[var(--border-color)] shadow-2xl p-6 md:p-8 space-y-6 md:space-y-8 animate-in zoom-in-95 duration-300 my-auto">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl md:text-2xl font-black text-[var(--text-main)]">Add Asset</h2>
                            <button onClick={() => { setIsModalOpen(false); setDetectedCurrency(null); }} className="p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-all">
                                <X size={20} className="text-[var(--text-muted)]" />
                            </button>
                        </div>

                        <form onSubmit={handleAddStock} className="space-y-5 md:space-y-6">
                            {error && (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-[11px] md:text-xs font-bold animate-in shake duration-300">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] md:text-xs font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Stock Ticker</label>
                                <StockAutocomplete
                                    placeholder="e.g. RELIANCE, TSLA, AAPL"
                                    variant="white"
                                    initialValue={newStock.symbol}
                                    onSelect={handleStockSelect}
                                    onChange={(val) => { setNewStock(prev => ({ ...prev, symbol: val, name: '' })); setDetectedCurrency(null); }}
                                    className="w-full"
                                />
                                {detectedCurrency && (
                                    <p className="text-[10px] text-[var(--text-muted)] pl-1 font-medium flex items-center gap-1.5">
                                        <Globe size={11} />
                                        This stock trades in <span className={`font-black px-1.5 py-0.5 rounded border text-[9px] ${getCurrencyBadgeClass(detectedCurrency)}`}>{detectedCurrency}</span>
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 mt-4">
                                <Input
                                    label="Quantity"
                                    type="number"
                                    value={newStock.quantity}
                                    onChange={(val) => setNewStock(prev => ({ ...prev, quantity: val }))}
                                    placeholder="0.00"
                                    step="any"
                                    required
                                />
                                <div className="space-y-1">
                                    <label className="text-[10px] md:text-xs font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">
                                        Purchase Price {detectedCurrency ? `(${detectedCurrency})` : '(native currency)'}
                                    </label>
                                    <Input
                                        type="number"
                                        value={newStock.buyPrice}
                                        onChange={(val) => setNewStock(prev => ({ ...prev, buyPrice: val }))}
                                        placeholder="0.00"
                                        step="any"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isAdding}
                                className="w-full bg-[var(--accent-primary)] text-white py-4 md:py-5 rounded-xl md:rounded-[20px] font-black text-base md:text-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-[var(--accent-primary)]/30 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isAdding ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} />}
                                {isAdding ? 'Adding...' : 'Add to Portfolio'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
