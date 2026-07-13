import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { useCurrency } from '../context/CurrencyContext';
import { useState, useMemo } from 'react';
import { BarChart3, Coins, Info, Loader2 } from 'lucide-react';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const getSafeKey = (symbol) => symbol.replace(/\./g, '_');

export default function ComparisonChart({ stocks, theme }) {
    const { selectedCurrency, getRate, isLoading: ratesLoading } = useCurrency();
    const [chartMode, setChartMode] = useState('normalized'); // 'normalized' or 'actual'

    if (!stocks || stocks.length === 0) return null;

    const isDark = theme === 'dark';

    const chartColors = {
        grid: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
        text: isDark ? '#94A3B8' : '#64748B',
        tooltipBg: isDark ? '#1E293B' : '#FFFFFF',
        tooltipBorder: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
    };

    // Calculate conversion factor to selected currency
    const getConversionFactor = (stockCurrency) => {
        const stockToUSDRate = getRate(stockCurrency);
        const targetToUSDRate = getRate(selectedCurrency);
        return targetToUSDRate / stockToUSDRate;
    };

    // Memoized data transformation to avoid recalculation on every render
    const { chartData } = useMemo(() => {
        const dateMap = {};
        const initials = {};

        stocks.forEach((stock) => {
            const history = stock.price_history_6m || [];
            if (history.length > 0) {
                initials[stock.symbol] = history[0].price;
            }
        });

        stocks.forEach((stock) => {
            const history = stock.price_history_6m || [];
            const conversionFactor = getConversionFactor(stock.currency);
            const safeSymbol = getSafeKey(stock.symbol);

            history.forEach((p) => {
                if (!dateMap[p.date]) {
                    dateMap[p.date] = { date: p.date };
                }

                const base = initials[stock.symbol];
                const normalizedVal = base ? ((p.price / base) * 100) : 100;
                const convertedPrice = p.price * conversionFactor;

                dateMap[p.date][`${safeSymbol}_norm`] = normalizedVal;
                dateMap[p.date][`${safeSymbol}_actual`] = convertedPrice;

                // Active plotting key depends on mode
                dateMap[p.date][safeSymbol] = chartMode === 'normalized' ? normalizedVal : convertedPrice;
            });
        });

        return {
            chartData: Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date))
        };
    }, [stocks, chartMode, selectedCurrency, getRate]);

    return (
        <div className="w-full h-auto min-h-[550px] bg-[var(--bg-card)] p-4 md:p-8 rounded-2xl border border-[var(--border-color)] shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)]">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[var(--text-main)]">Performance Correlation</h3>
                        <p className="text-sm text-[var(--text-muted)] mt-1 flex items-center gap-2">
                            {chartMode === 'normalized'
                                ? 'Growth indexed to 100 (Relative Efficiency)'
                                : `Values converted to ${selectedCurrency} (Market Value Comparison)`}
                            {ratesLoading && <Loader2 size={12} className="animate-spin" />}
                        </p>
                    </div>
                </div>

                <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-color)] self-stretch md:self-auto shadow-inner">
                    <button
                        onClick={() => setChartMode('normalized')}
                        className={`flex-1 md:flex-none flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${chartMode === 'normalized'
                                ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] shadow-md'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                            }`}
                    >
                        Index 100
                    </button>
                    <button
                        onClick={() => setChartMode('actual')}
                        className={`flex-1 md:flex-none flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${chartMode === 'actual'
                                ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] shadow-md'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                            }`}
                    >
                        Price ({selectedCurrency})
                    </button>
                </div>
            </div>

            <div className="h-96 w-full -ml-4 md:ml-0 overflow-visible relative">
                {ratesLoading && chartMode === 'actual' && (
                    <div className="absolute inset-0 z-10 bg-[var(--bg-card)]/40 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                        <div className="flex items-center gap-3 px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl">
                            <Loader2 className="animate-spin text-[var(--accent-primary)]" size={20} />
                            <span className="text-sm font-bold text-[var(--text-main)]">Syncing Global Rates...</span>
                        </div>
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ left: 20, right: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: chartColors.text, fontSize: 10, fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={40}
                            dy={10}
                        />
                        <YAxis
                            tick={{ fill: chartColors.text, fontSize: 10, fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                            domain={['auto', 'auto']}
                            tickFormatter={(val) => {
                                if (chartMode === 'normalized') return `${val.toFixed(0)}`;
                                return val > 1000 ? (val / 1000).toFixed(1) + 'k' : val.toFixed(0);
                            }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: chartColors.tooltipBg,
                                borderColor: chartColors.tooltipBorder,
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                padding: '12px'
                            }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-color)] shadow-2xl min-w-[200px]">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">{label}</p>
                                            <div className="space-y-3">
                                                {payload.map((entry, index) => {
                                                    const dataPoint = entry.payload;
                                                    const safeName = getSafeKey(entry.name);
                                                    const norm = dataPoint[`${safeName}_norm`];
                                                    const actual = dataPoint[`${safeName}_actual`];
                                                    const change = norm - 100;
 
                                                    return (
                                                        <div key={index} className="flex flex-col gap-0.5">
                                                            <div className="flex items-center justify-between gap-4">
                                                                 <div className="flex items-center gap-2">
                                                                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                                     <span className="text-xs font-black text-[var(--text-main)]">{entry.name}</span>
                                                                 </div>
                                                                 <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${change >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                                     {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                                                 </span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)] ml-4">
                                                                <span>Price:</span>
                                                                <span>{selectedCurrency} {actual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            </div>
                                                        </div>
                                                     );
                                                })}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            content={({ payload }) => (
                                <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 justify-end">
                                    {payload.map((entry, index) => (
                                        <div key={`item-${index}`} className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-primary)] rounded-full border border-[var(--border-color)]">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                            <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">{entry.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        />
                        {stocks.map((stock, index) => {
                            const safeSymbol = getSafeKey(stock.symbol);
                            return (
                                <Line
                                    key={stock.symbol}
                                    type="monotone"
                                    dataKey={safeSymbol}
                                    name={stock.symbol}
                                    stroke={COLORS[index % COLORS.length]}
                                    strokeWidth={4}
                                    dot={false}
                                    connectNulls={true}
                                    activeDot={{
                                        r: 8,
                                        strokeWidth: 4,
                                        stroke: isDark ? '#020617' : '#ffffff',
                                        fill: COLORS[index % COLORS.length],
                                        style: { filter: `drop-shadow(0 0 12px ${COLORS[index % COLORS.length]})` }
                                    }}
                                    animationDuration={1000}
                                    animationEasing="ease-in-out"
                                />
                            );
                        })}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-8 p-5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl flex items-start gap-4 shadow-inner">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                    <Info size={18} />
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-main)] mb-1">Statistical Methodology</h4>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed">
                        {chartMode === 'normalized'
                            ? "Current View: Relative Indexing. Every stock starts at a base of 100. This eliminates unit-price bias, allowing you to compare returns directly. A stock at 110 has outperformed a stock at 105, regardless of their native currency."
                            : `Current View: Monetary Parity. All historical prices have been real-time converted to ${selectedCurrency}. This provides a consolidated view of asset values and demonstrates the total capital required to hold these positions.`}
                    </p>
                </div>
            </div>
        </div>
    );
}
