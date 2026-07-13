import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Plus, Trash2, X, Bell, TrendingUp, TrendingDown, Loader2, Globe, RefreshCw, CheckCircle2 } from 'lucide-react';
import StockAutocomplete from '../components/StockAutocomplete';
import api from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { convertAndFormat } from '../utils/formatCurrency';

export default function Watchlist({ theme }) {
    const { selectedCurrency, getRate } = useCurrency();

    // ── State ────────────────────────────────────────────────────────────────
    const [watchlist, setWatchlist] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [marketStatus, setMarketStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Add watchlist modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSymbol, setNewSymbol] = useState('');
    const [newSymbolName, setNewSymbolName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Add alert modal
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertForm, setAlertForm] = useState({ symbol: '', target_price: '', condition: 'above', note: '' });
    const [isCreatingAlert, setIsCreatingAlert] = useState(false);

    // ── Formatting ───────────────────────────────────────────────────────────
    const formatPrice = (amount, currency) => {
        if (!amount) return '—';
        return convertAndFormat(amount, currency || 'USD', selectedCurrency, getRate);
    };

    // ── Data Fetching ────────────────────────────────────────────────────────
    const fetchAll = useCallback(async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true);
        try {
            const [wRes, aRes, mRes] = await Promise.all([
                api.get('/user/watchlist'),
                api.get('/user/alerts'),
                api.get('/user/market-status'),
            ]);
            setWatchlist(wRes.data.items || []);
            setAlerts(aRes.data.alerts || []);
            setMarketStatus(mRes.data);
        } catch (err) {
            console.error('Watchlist fetch error:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Watchlist Actions ────────────────────────────────────────────────────
    const handleAddToWatchlist = async (e) => {
        e.preventDefault();
        if (!newSymbol) return;
        setIsAdding(true);
        try {
            await api.post('/user/watchlist', { symbol: newSymbol.toUpperCase(), company_name: newSymbolName });
            setShowAddModal(false);
            setNewSymbol('');
            setNewSymbolName('');
            fetchAll();
        } catch (err) {
            console.error(err);
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveFromWatchlist = async (id) => {
        try {
            await api.delete(`/user/watchlist/${id}`);
            setWatchlist(prev => prev.filter(w => w.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    // ── Alert Actions ────────────────────────────────────────────────────────
    const handleCreateAlert = async (e) => {
        e.preventDefault();
        if (!alertForm.symbol || !alertForm.target_price) return;
        setIsCreatingAlert(true);
        try {
            await api.post('/user/alerts', {
                symbol: alertForm.symbol.toUpperCase(),
                target_price: Number(alertForm.target_price),
                condition: alertForm.condition,
                note: alertForm.note,
            });
            setShowAlertModal(false);
            setAlertForm({ symbol: '', target_price: '', condition: 'above', note: '' });
            fetchAll();
        } catch (err) {
            console.error(err);
        } finally {
            setIsCreatingAlert(false);
        }
    };

    const handleDeleteAlert = async (id) => {
        try {
            await api.delete(`/user/alerts/${id}`);
            setAlerts(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
                <Loader2 className="w-12 h-12 text-[var(--accent-primary)] animate-spin" />
                <p className="text-[var(--text-muted)] font-medium">Loading market data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-8 pb-10 animate-in fade-in duration-700 px-0 md:px-2">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-4 md:px-0">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-black text-[var(--text-main)] tracking-tight">Watchlist</h1>
                    <p className="text-[11px] md:text-[13px] text-[var(--text-muted)] font-medium flex items-center gap-2">
                        <Eye size={16} className="text-[var(--accent-primary)]" />
                        Track stocks & set price alerts without buying
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => fetchAll(true)}
                        disabled={isRefreshing}
                        className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-all"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setShowAlertModal(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] font-bold hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all"
                    >
                        <Bell size={18} />
                        Set Alert
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[var(--accent-primary)] text-white px-5 py-3 rounded-xl font-black hover:scale-[1.02] transition-all shadow-lg shadow-[var(--accent-primary)]/25"
                    >
                        <Plus size={18} />
                        Add Stock
                    </button>
                </div>
            </div>

            {/* Market Status */}
            {marketStatus && (
                <div className="grid grid-cols-2 gap-4 px-4 md:px-0">
                    {Object.entries(marketStatus).map(([key, market]) => (
                        <div key={key} className="bg-[var(--bg-card)] p-4 md:p-6 rounded-2xl border border-[var(--border-color)] shadow-md flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${market.open ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-rose-500 opacity-60'}`} />
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-sm md:text-base text-[var(--text-main)]">
                                    {market.label}
                                    <span className={`ml-2 text-[10px] font-black px-2 py-0.5 rounded-full ${market.open ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                        {market.open ? 'OPEN' : 'CLOSED'}
                                    </span>
                                </p>
                                <p className="text-[10px] md:text-xs text-[var(--text-muted)] font-medium mt-0.5">{market.local_time} · {market.hours}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">

                {/* Watchlist Table */}
                <div className="xl:col-span-2 bg-[var(--bg-card)] rounded-2xl md:rounded-3xl border border-[var(--border-color)] shadow-xl overflow-hidden">
                    <div className="p-5 md:p-8 border-b border-[var(--border-color)]">
                        <h3 className="font-black text-lg text-[var(--text-main)] flex items-center gap-3">
                            <Eye className="text-[var(--accent-primary)]" size={20} />
                            Watching ({watchlist.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[500px]">
                            <thead>
                                <tr className="text-[var(--text-muted)] text-[9px] font-black uppercase tracking-[0.2em] border-b border-[var(--border-color)]">
                                    <th className="py-4 px-6">Symbol</th>
                                    <th className="py-4 px-4 text-right">Price</th>
                                    <th className="py-4 px-4 text-right">Change</th>
                                    <th className="py-4 px-6 text-center">Remove</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {watchlist.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-16 text-center text-[var(--text-muted)] text-sm italic">
                                            No stocks in watchlist yet.
                                        </td>
                                    </tr>
                                ) : watchlist.map(item => (
                                    <tr key={item.id} className="hover:bg-[var(--bg-primary)]/40 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-[var(--bg-primary)] rounded-xl flex items-center justify-center font-black text-[var(--accent-primary)] border border-[var(--border-color)] text-xs">
                                                    {item.symbol[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm text-[var(--text-main)]">{item.symbol}</p>
                                                    <p className="text-[10px] text-[var(--text-muted)] font-medium truncate max-w-[120px]">{item.company_name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-right font-black text-sm text-[var(--text-main)]">
                                            {formatPrice(item.current_price, item.currency)}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            {item.change_percent != null ? (
                                                <span className={`flex items-center justify-end gap-1 font-black text-xs ${item.change_percent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {item.change_percent >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                                                    {Math.abs(item.change_percent).toFixed(2)}%
                                                </span>
                                            ) : <span className="text-[var(--text-muted)] text-xs">—</span>}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => handleRemoveFromWatchlist(item.id)}
                                                className="p-1.5 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Price Alerts Sidebar */}
                <div className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl border border-[var(--border-color)] shadow-xl overflow-hidden">
                    <div className="p-5 md:p-6 border-b border-[var(--border-color)]">
                        <h3 className="font-black text-lg text-[var(--text-main)] flex items-center gap-3">
                            <Bell className="text-amber-500" size={20} />
                            Price Alerts ({alerts.length})
                        </h3>
                    </div>
                    <div className="p-4 space-y-3">
                        {alerts.length === 0 ? (
                            <div className="py-12 text-center text-[var(--text-muted)] text-xs font-medium italic">
                                No alerts set yet.<br />Click "Set Alert" to create one.
                            </div>
                        ) : alerts.map(alert => (
                            <div key={alert.id} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all hover:scale-[1.01] ${alert.triggered ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-[var(--bg-primary)] border-[var(--border-color)]'}`}>
                                <div className={`p-1.5 rounded-lg flex-shrink-0 ${alert.condition === 'above' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                    {alert.condition === 'above'
                                        ? <TrendingUp size={14} className="text-emerald-500" />
                                        : <TrendingDown size={14} className="text-rose-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-xs text-[var(--text-main)]">{alert.symbol}</p>
                                    <p className="text-[10px] text-[var(--text-muted)] font-medium">
                                        {alert.condition === 'above' ? 'Above' : 'Below'} {alert.target_price}
                                    </p>
                                    {alert.note && <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{alert.note}</p>}
                                </div>
                                {alert.triggered && <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />}
                                <button
                                    onClick={() => handleDeleteAlert(alert.id)}
                                    className="p-1 text-rose-500/30 hover:text-rose-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add to Watchlist Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[var(--bg-card)] w-full max-w-md rounded-2xl border border-[var(--border-color)] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black text-[var(--text-main)]">Add to Watchlist</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-all">
                                <X size={20} className="text-[var(--text-muted)]" />
                            </button>
                        </div>
                        <form onSubmit={handleAddToWatchlist} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Stock Ticker</label>
                                <StockAutocomplete
                                    placeholder="Search stock (e.g. RELIANCE, TSLA)..."
                                    onSelect={(symbol, stock) => { setNewSymbol(symbol); setNewSymbolName(stock?.description || symbol); }}
                                    onChange={(val) => setNewSymbol(val)}
                                    variant="white"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!newSymbol || isAdding}
                                className="w-full bg-[var(--accent-primary)] text-white py-3.5 rounded-xl font-black hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {isAdding ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                {isAdding ? 'Adding...' : 'Add to Watchlist'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Set Price Alert Modal */}
            {showAlertModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[var(--bg-card)] w-full max-w-md rounded-2xl border border-[var(--border-color)] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black text-[var(--text-main)]">Set Price Alert</h2>
                            <button onClick={() => setShowAlertModal(false)} className="p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-all">
                                <X size={20} className="text-[var(--text-muted)]" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAlert} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Stock Ticker</label>
                                <StockAutocomplete
                                    placeholder="Search stock..."
                                    onSelect={(symbol) => setAlertForm(prev => ({ ...prev, symbol }))}
                                    onChange={(val) => setAlertForm(prev => ({ ...prev, symbol: val }))}
                                    variant="white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Condition</label>
                                    <select
                                        value={alertForm.condition}
                                        onChange={e => setAlertForm(prev => ({ ...prev, condition: e.target.value }))}
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                                    >
                                        <option value="above">Price Above</option>
                                        <option value="below">Price Below</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Target Price</label>
                                    <input
                                        type="number"
                                        value={alertForm.target_price}
                                        onChange={e => setAlertForm(prev => ({ ...prev, target_price: e.target.value }))}
                                        placeholder="e.g. 1500"
                                        step="any"
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Note (optional)</label>
                                <input
                                    type="text"
                                    value={alertForm.note}
                                    onChange={e => setAlertForm(prev => ({ ...prev, note: e.target.value }))}
                                    placeholder="e.g. Support level break..."
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!alertForm.symbol || !alertForm.target_price || isCreatingAlert}
                                className="w-full bg-amber-500 text-white py-3.5 rounded-xl font-black hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {isCreatingAlert ? <Loader2 className="animate-spin" size={20} /> : <Bell size={20} />}
                                {isCreatingAlert ? 'Creating...' : 'Create Alert'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
