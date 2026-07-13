import { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, TrendingUp, TrendingDown, Search, RefreshCw, Filter, Globe2, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { convertAndFormat } from '../utils/formatCurrency';

const SECTORS = [
    "All", "Technology", "Financial Services", "Consumer Cyclical",
    "Consumer Defensive", "Healthcare", "Energy", "Industrials"
];

const MARKETS = [{ value: "", label: "All Markets" }, { value: "IN", label: "🇮🇳 India (NSE)" }, { value: "US", label: "🇺🇸 United States" }];

const SORT_OPTIONS = [
    { value: "marketCap", label: "Market Cap" },
    { value: "changePercent", label: "% Change" },
    { value: "price", label: "Price" },
    { value: "peRatio", label: "P/E Ratio" },
];

function formatMarketCap(val, currency) {
    if (!val) return "—";
    const sym = currency === "INR" ? "₹" : "$";
    if (val >= 1e12) return `${sym}${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9)  return `${sym}${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6)  return `${sym}${(val / 1e6).toFixed(2)}M`;
    return `${sym}${val.toLocaleString()}`;
}

export default function Screener({ theme }) {
    const { selectedCurrency, getRate } = useCurrency();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filters
    const [sector, setSector] = useState("All");
    const [market, setMarket] = useState("");
    const [sortBy, setSortBy] = useState("marketCap");
    const [sortDir, setSortDir] = useState("desc");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchScreener = useCallback(async (refresh = false) => {
        if (refresh) setIsRefreshing(true);
        else setLoading(true);
        try {
            const params = new URLSearchParams();
            if (sector !== "All") params.set("sector", sector);
            if (market) params.set("market", market);
            params.set("sort_by", sortBy);
            params.set("sort_dir", sortDir);

            const res = await api.get(`/screener/screener?${params.toString()}`);
            setResults(res.data.results || []);
        } catch (err) {
            console.error("Screener error:", err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [sector, market, sortBy, sortDir]);

    useEffect(() => { fetchScreener(); }, [fetchScreener]);

    const toggleSort = (col) => {
        if (sortBy === col) setSortDir(d => d === "desc" ? "asc" : "desc");
        else { setSortBy(col); setSortDir("desc"); }
    };

    const SortIcon = ({ col }) => {
        if (sortBy !== col) return null;
        return sortDir === "desc" ? <ChevronDown size={12} className="inline" /> : <ChevronUp size={12} className="inline" />;
    };

    const filtered = results.filter(r =>
        !searchQuery || r.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatPrice = (price, currency) => {
        if (!price) return "—";
        return convertAndFormat(price, currency || "USD", selectedCurrency, getRate);
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-8 pb-10 px-0 md:px-2 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-4 md:px-0">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-black text-[var(--text-main)] tracking-tight">Market Screener</h1>
                    <p className="text-[11px] md:text-[13px] text-[var(--text-muted)] font-medium flex items-center gap-2">
                        <Globe2 size={16} className="text-[var(--accent-primary)]" />
                        Filter and discover stocks across global markets
                    </p>
                </div>
                <button
                    onClick={() => fetchScreener(true)}
                    disabled={isRefreshing}
                    className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-all"
                >
                    <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-4 md:p-6 shadow-sm">
                <div className="flex flex-wrap gap-3 md:gap-4 items-end">

                    {/* Search */}
                    <div className="flex-1 min-w-[180px] space-y-1.5">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Search</label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="AAPL, Infosys..."
                                className="w-full pl-8 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40 transition-all"
                            />
                        </div>
                    </div>

                    {/* Sector */}
                    <div className="space-y-1.5 min-w-[140px]">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Sector</label>
                        <select
                            value={sector}
                            onChange={e => setSector(e.target.value)}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40"
                        >
                            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Market */}
                    <div className="space-y-1.5 min-w-[150px]">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Market</label>
                        <select
                            value={market}
                            onChange={e => setMarket(e.target.value)}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40"
                        >
                            {MARKETS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>

                    {/* Sort */}
                    <div className="space-y-1.5 min-w-[130px]">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40"
                        >
                            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Dir</label>
                        <button
                            onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
                            className="flex items-center gap-1.5 px-3 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] hover:border-[var(--accent-primary)] transition-all font-bold"
                        >
                            {sortDir === "desc" ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            {sortDir === "desc" ? "Desc" : "Asc"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-xl overflow-hidden">
                <div className="px-5 md:px-8 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                    <h3 className="font-black text-sm text-[var(--text-main)] flex items-center gap-2">
                        <Filter size={16} className="text-[var(--accent-primary)]" />
                        {loading ? "Loading..." : `${filtered.length} stocks`}
                    </h3>
                    <span className="text-[10px] text-[var(--text-muted)] font-medium">Data refreshes every 5 min</span>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-10 h-10 text-[var(--accent-primary)] animate-spin" />
                        <p className="text-sm text-[var(--text-muted)] font-medium">Fetching live market data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[750px]">
                            <thead>
                                <tr className="bg-[var(--bg-primary)]/60 text-[9px] md:text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.15em] border-b border-[var(--border-color)]">
                                    <th className="py-4 px-5 md:px-8">Company</th>
                                    <th className="py-4 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors select-none" onClick={() => toggleSort("price")}>
                                        Price <SortIcon col="price" />
                                    </th>
                                    <th className="py-4 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors select-none" onClick={() => toggleSort("changePercent")}>
                                        Change <SortIcon col="changePercent" />
                                    </th>
                                    <th className="hidden md:table-cell py-4 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors select-none" onClick={() => toggleSort("marketCap")}>
                                        Mkt Cap <SortIcon col="marketCap" />
                                    </th>
                                    <th className="hidden lg:table-cell py-4 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors select-none" onClick={() => toggleSort("peRatio")}>
                                        P/E <SortIcon col="peRatio" />
                                    </th>
                                    <th className="hidden lg:table-cell py-4 px-4 text-right">Div Yield</th>
                                    <th className="hidden md:table-cell py-4 px-5 md:px-8 text-center">Sector</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-20 text-center text-[var(--text-muted)] text-sm italic">
                                            No stocks match the current filters.
                                        </td>
                                    </tr>
                                ) : filtered.map(stock => (
                                    <tr key={stock.symbol} className="hover:bg-[var(--bg-primary)]/30 transition-all group cursor-pointer">
                                        <td className="py-4 px-5 md:px-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center font-black text-[var(--accent-primary)] text-xs flex-shrink-0">
                                                    {stock.symbol.replace(".NS", "")[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition-colors">
                                                        {stock.symbol.replace(".NS", "")}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[130px] font-medium">{stock.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <p className="font-black text-sm text-[var(--text-main)]">{formatPrice(stock.price, stock.currency)}</p>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            {stock.changePercent != null ? (
                                                <span className={`flex items-center justify-end gap-1 font-black text-xs ${stock.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {stock.changePercent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                    {Math.abs(stock.changePercent).toFixed(2)}%
                                                </span>
                                            ) : <span className="text-[var(--text-muted)] text-xs">—</span>}
                                        </td>
                                        <td className="hidden md:table-cell py-4 px-4 text-right">
                                            <p className="text-sm text-[var(--text-muted)] font-medium">{formatMarketCap(stock.marketCap, stock.currency)}</p>
                                        </td>
                                        <td className="hidden lg:table-cell py-4 px-4 text-right">
                                            <p className="text-sm text-[var(--text-muted)] font-medium">{stock.peRatio ? stock.peRatio.toFixed(1) : "—"}</p>
                                        </td>
                                        <td className="hidden lg:table-cell py-4 px-4 text-right">
                                            <p className="text-sm text-[var(--text-muted)] font-medium">{stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : "—"}</p>
                                        </td>
                                        <td className="hidden md:table-cell py-4 px-5 md:px-8 text-center">
                                            <span className="px-2.5 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full text-[10px] font-black text-[var(--text-muted)] whitespace-nowrap">
                                                {stock.sector}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
