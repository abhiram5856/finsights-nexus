import { useState, useEffect, useMemo } from 'react';
import StockAutocomplete from '../components/StockAutocomplete';
import { supabase } from '../lib/supabase';
import { PieChart as PieChartIcon, Search, Plus, List, ArrowUpRight, TrendingUp, TrendingDown, RefreshCw, Briefcase, IndianRupee, Trash2, X, AlertTriangle, Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import api from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/formatCurrency';
import { Input } from './modules/shared';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6'];
const EMPTY_COLOR = '#E2E8F0'; // light gray state

export default function Portfolio({ theme }) {
    const { selectedCurrency, getRate } = useCurrency();
    const currentRate = getRate(selectedCurrency);

    const [portfolio, setPortfolio] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [aiInsights, setAiInsights] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Modal Form State
    const [newStock, setNewStock] = useState({ symbol: '', quantity: '', buyPrice: '' });

    const fetchPortfolio = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/portfolio/');
            setPortfolio(res.data);
        } catch (err) {
            console.error("Fetch portfolio error:", err);
            // Fallback to empty state so the user isn't stuck loading
            setPortfolio({ assets: [], totalValue: 0, totalPnL: 0, totalPnLPercent: 0 });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolio();
    }, []);

    const [error, setError] = useState(null);

    const handleAddStock = async (e) => {
        e.preventDefault();
        setError(null);
        if (!newStock.symbol || !newStock.quantity || !newStock.buyPrice) {
            setError("Please fill in all fields");
            return;
        }

        setIsAdding(true);
        try {
            // 1. Fetch the logged-in user
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error("You must be logged in to add stocks.");
            }

            // 2. Log UID for debugging (per user request)
            console.log("Supabase Auth UID:", user.id);

            // 3. Backend API call (centralized validation and logging)
            await api.post('/portfolio/', {
                symbol: newStock.symbol.toUpperCase(),
                company_name: newStock.name,
                quantity: Number(newStock.quantity),
                buy_price: Number(newStock.buyPrice) / currentRate
            });

            setIsModalOpen(false);
            setNewStock({ symbol: '', quantity: '', buyPrice: '' });
            fetchPortfolio();
        } catch (err) {
            console.error("Add stock error:", err);
            // Better error reporting: show API detail if available
            const errorMsg = err.response?.data?.detail || err.message || "Failed to add stock. Check database RLS policies.";
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

    const chartData = useMemo(() => {
        if (!portfolio?.assets || portfolio.assets.length === 0) {
            // Return a default empty-state ring so the chart doesn't disappear
            return [{ name: "No Assets", value: 1 }];
        }
        return portfolio.assets.map(asset => ({
            name: asset.symbol,
            value: (asset.currentPrice || 0) * (asset.quantity || 0)
        }));
    }, [portfolio]);

    // Dynamic AI Insight Engine
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
                    buy_price: a.buyPrice,
                    current_price: a.currentPrice
                })),
                total_value: currentPortfolio.totalValue || 0
            };
            const response = await api.post('/ai/analyze_portfolio', payload);
            
            // Map the icons and bg classes dynamically based on type
            const enhancedInsights = response.data.insights.map(insight => {
                let icon, bg, border;
                if (insight.type === 'warning') {
                    icon = <AlertTriangle size={18} className="text-amber-500" />;
                    bg = "bg-amber-500/10";
                    border = "border-amber-500/20";
                } else if (insight.type === 'success') {
                    icon = <CheckCircle2 size={18} className="text-emerald-500" />;
                    bg = "bg-emerald-500/10";
                    border = "border-emerald-500/20";
                } else {
                    icon = <Zap size={18} className="text-indigo-500" />;
                    bg = "bg-indigo-500/10";
                    border = "border-indigo-500/20";
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

    useEffect(() => {
        if (portfolio) {
            fetchAiInsights(portfolio);
        }
    }, [portfolio]);

    if (isLoading && !portfolio) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
                <Loader2 className="w-12 h-12 text-[var(--accent-primary)] animate-spin" />
                <p className="text-[var(--text-muted)] font-medium">Crunching market numbers...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8 pb-10 animate-in fade-in duration-700 px-0 md:px-2">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-4 md:px-0">
                <div className="space-y-1 md:space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black text-[var(--text-main)] tracking-tight">Portfolio</h1>
                    <p className="text-[11px] md:text-[13px] text-[var(--text-muted)] font-medium flex items-center gap-2">
                        <Briefcase size={16} className="text-[var(--accent-primary)]" />
                        Track and optimize your investment distribution
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto bg-[var(--accent-primary)] text-white px-6 py-3.5 md:py-3 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-[1.05] active:scale-[0.95] transition-all shadow-lg shadow-[var(--accent-primary)]/25 touch-target"
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
                        {formatCurrency(portfolio?.totalValue || 0, selectedCurrency, currentRate)}
                    </h2>
                </div>

                <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-2xl md:rounded-3xl border border-[var(--border-color)] shadow-xl overflow-hidden relative group">
                    <p className="text-[var(--text-muted)] text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-2">Total Net P/L</p>
                    <div className="flex items-baseline gap-2 md:gap-3">
                        <h2 className={`text-2xl md:text-4xl font-black ${portfolio?.totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {portfolio?.totalPnL >= 0 ? '+' : ''}{formatCurrency(portfolio?.totalPnL || 0, selectedCurrency, currentRate)}
                        </h2>
                        <span className={`text-[11px] md:text-sm font-black px-2 py-0.5 md:py-1 rounded-lg ${portfolio?.totalPnL >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {portfolio?.totalPnLPercent}%
                        </span>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-2xl md:rounded-3xl border border-[var(--border-color)] shadow-xl overflow-hidden relative group sm:col-span-2 lg:col-span-1">
                    <p className="text-[var(--text-muted)] text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-2">Market Status</p>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
                        <h2 className="text-xl md:text-2xl font-black text-[var(--text-main)] uppercase tracking-tight">Open</h2>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* Main Table (8 cols) */}
                <div className="lg:col-span-12 xl:col-span-8 bg-[var(--bg-card)] rounded-2xl md:rounded-3xl border border-[var(--border-color)] shadow-xl overflow-hidden">
                    <div className="p-5 md:p-8 border-b border-[var(--border-color)] flex justify-between items-center">
                        <h3 className="font-black text-lg md:text-xl text-[var(--text-main)] flex items-center gap-3">
                            <List className="text-[var(--accent-primary)]" size={20} md:size={24} />
                            My Holdings
                        </h3>
                    </div>
                    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                        <table className="w-full text-left min-w-[650px]">
                            <thead>
                                <tr className="text-[var(--text-muted)] text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] border-b border-[var(--border-color)]">
                                    <th className="py-4 md:py-6 px-4 md:px-8">Symbol</th>
                                    <th className="py-4 md:py-6 px-2 md:px-4 text-center">Qty</th>
                                    <th className="py-4 md:py-6 px-2 md:px-4 text-right">Avg Price</th>
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
                                                <span className="font-black text-[13px] md:text-base text-[var(--text-main)] tracking-tight">{asset.symbol}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 md:py-6 px-2 md:px-4 text-center font-bold text-[13px] md:text-base text-[var(--text-main)]">
                                            {asset.quantity}
                                        </td>
                                        <td className="py-4 md:py-6 px-2 md:px-4 text-right font-bold text-[12px] md:text-sm text-[var(--text-muted)]">
                                            {formatCurrency(asset.buyPrice, selectedCurrency, currentRate)}
                                        </td>
                                        <td className="py-4 md:py-6 px-2 md:px-4 text-right font-black text-[13px] md:text-base text-[var(--text-main)]">
                                            {formatCurrency(asset.currentPrice, selectedCurrency, currentRate)}
                                        </td>
                                        <td className="py-4 md:py-6 px-2 md:px-4 text-right font-black">
                                            <div className={`flex flex-col items-end ${asset.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                <span className="text-[13px] md:text-base">{asset.pnl >= 0 ? '+' : ''}{formatCurrency(asset.pnl, selectedCurrency, currentRate)}</span>
                                                <span className="text-[9px] md:text-[10px] opacity-80">{asset.pnlPercent}%</span>
                                            </div>
                                        </td>
                                        <td className="py-4 md:py-6 px-4 md:px-8 text-center">
                                            <button
                                                onClick={() => handleDelete(asset.id)}
                                                className="p-2 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                            >
                                                <Trash2 size={16} md:size={18} />
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

                {/* Sidebar Analytics (4 cols) */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-6 md:space-y-8">
                    {/* Allocation Donut */}
                    <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-2xl md:rounded-3xl border border-[var(--border-color)] shadow-xl flex flex-col items-center">
                        <h3 className="font-black text-lg md:text-xl text-[var(--text-main)] flex items-center gap-3 self-start mb-6 md:mb-8">
                            <PieChartIcon className="text-[var(--accent-primary)]" size={20} md:size={24} />
                            Allocation
                        </h3>
                        <div className="w-full h-[250px] md:h-[300px] min-w-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
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

                    {/* AI Dynamic Actionable Alerts */}
                    <div className="space-y-4 px-1 md:px-0">
                        {aiInsights.length > 0 && (
                            <h3 className="font-black text-lg md:text-xl text-[var(--text-main)] flex items-center gap-3 mb-2">
                                <Zap className="text-indigo-500" size={18} md:size={20} fill="currentColor" />
                                Smart Co-Pilot
                            </h3>
                        )}

                        <div className="flex flex-col gap-4">
                            {isAiLoading ? (
                                <div className="flex flex-col items-center justify-center py-8 space-y-4 bg-[var(--bg-primary)]/50 rounded-2xl border border-[var(--border-color)]">
                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                    <p className="text-[var(--text-muted)] text-sm font-medium">Nexus AI is analyzing your portfolio...</p>
                                </div>
                            ) : (
                                aiInsights.map((insight) => (
                                    <div key={insight.id} className={`${insight.bg} ${insight.border} p-4 md:p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] shadow-xl backdrop-blur-sm relative group overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-right-4`}>

                                    {/* Header Row */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-[var(--bg-primary)] shadow-sm border border-[var(--border-color)]">
                                                {insight.icon}
                                            </div>
                                            <h4 className="font-black text-[13px] md:text-sm text-[var(--text-main)] tracking-tight">
                                                {insight.title}
                                            </h4>
                                        </div>

                                        {/* Confidence Badge */}
                                        <div className="bg-[var(--bg-primary)] px-2 py-0.5 rounded-md border border-[var(--border-color)] flex-shrink-0">
                                            <span className="text-[9px] md:text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{insight.confidence}%</span>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-[11px] md:text-xs text-[var(--text-muted)] leading-relaxed font-medium pl-1">
                                        {insight.message}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex justify-end mt-1">
                                        <button className="text-[10px] md:text-xs font-black text-[var(--text-main)] bg-[var(--bg-primary)] px-4 py-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--text-main)] hover:text-[var(--bg-primary)] transition-all">
                                            {insight.action}
                                        </button>
                                    </div>
                                </div>
                            )))}
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
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-all">
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
                                <div className="relative">
                                    <StockAutocomplete
                                        placeholder="e.g. RELIANCE, TCS"
                                        variant="white"
                                        initialValue={newStock.symbol}
                                        onSelect={(symbol, stock) => setNewStock({ ...newStock, symbol, name: stock?.description || symbol })}
                                        onChange={(val) => setNewStock({ ...newStock, symbol: val, name: '' })}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 mt-4">
                                <Input
                                    label="Quantity"
                                    type="number"
                                    value={newStock.quantity}
                                    onChange={(val) => setNewStock({ ...newStock, quantity: val })}
                                    placeholder="0.00"
                                    step="any"
                                    required
                                />

                                <Input
                                    label="Purchase Price"
                                    type="number"
                                    value={newStock.buyPrice}
                                    onChange={(val) => setNewStock({ ...newStock, buyPrice: val })}
                                    placeholder="0.00"
                                    step="any"
                                    required
                                    prefix={<IndianRupee size={16} className="text-slate-400" />}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isAdding}
                                className="w-full bg-[var(--accent-primary)] text-white py-4 md:py-5 rounded-xl md:rounded-[20px] font-black text-base md:text-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-[var(--accent-primary)]/30 flex items-center justify-center gap-2 disabled:opacity-50 touch-target"
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
