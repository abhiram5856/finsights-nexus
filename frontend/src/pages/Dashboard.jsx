import {
    LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
    AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, ArrowUpRight, ArrowDownRight, MoreHorizontal, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/formatCurrency';

export default function Dashboard() {
    const { selectedCurrency, getRate } = useCurrency();
    const [portfolioData, setPortfolioData] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [signupDate, setSignupDate] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [pRes, hRes] = await Promise.all([
                    api.get("/portfolio/"),
                    api.get("/portfolio/history")
                ]);

                const data = pRes.data;
                const assets = data.assets || [];

                // Process for table
                const holdings = assets.map(asset => ({
                    symbol: asset.symbol.split('.')[0],
                    allocation: asset.allocation,
                    value: asset.value,
                    pl: asset.pnl || 0,
                    plPercent: asset.pnlPercentage || 0
                })).sort((a, b) => b.allocation - a.allocation);

                setPortfolioData({
                    totalValue: data.totalValue,
                    totalPL: data.totalPnL,
                    plPercent: data.totalPnLPercentage || 0,
                    holdings: holdings,
                    riskScore: holdings.length > 0 ? 65 : 0, 
                    topAllocation: holdings[0]?.allocation || 0
                });
                setHistoryData(hRes.data.history || []);
                setSignupDate(hRes.data.signupDate);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Growth calculation logic
    const calculateGrowth = () => {
        if (!historyData || historyData.length < 2) return 0;
        const first = historyData[0].value;
        const last = historyData[historyData.length - 1].value;
        if (first === 0) return 0;
        return ((last - first) / first) * 100;
    };

    const growthPercent = calculateGrowth();
    const formattedSignupDate = signupDate ? new Date(signupDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const StatCard = ({ label, value, subtext, trend, trendValue }) => (
        <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-color)] transition-all duration-200 hover:border-[var(--accent-primary)]/30 group">
            <p className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">{label}</p>
            <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">{value}</h2>
                {trend && (
                    <span className={`text-[13px] font-bold flex items-center ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {trendValue}%
                    </span>
                )}
            </div>
            {subtext && <p className="text-[11px] text-[var(--text-muted)] mt-4 font-medium opacity-80">{subtext}</p>}
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto space-y-4 md:space-y-6 pb-10 px-0 md:px-2">

            {/* Top Section: Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <StatCard
                    label="Total Portfolio Value"
                    value={formatCurrency(portfolioData?.totalValue, selectedCurrency, getRate(selectedCurrency))}
                    subtext="Last updated 2 mins ago"
                />
                <StatCard
                    label="Total Gain/Loss"
                    value={formatCurrency(Math.abs(portfolioData?.totalPL), selectedCurrency, getRate(selectedCurrency))}
                    trend={portfolioData?.totalPL >= 0 ? 'up' : 'down'}
                    trendValue={portfolioData?.plPercent}
                />
                <StatCard
                    label="Risk Score"
                    value={`${portfolioData?.riskScore}/100`}
                    subtext={portfolioData?.riskScore > 70 ? "High Risk" : portfolioData?.riskScore > 40 ? "Moderate" : "Low Risk"}
                />
                <StatCard
                    label="Main Allocation"
                    value={`${portfolioData?.topAllocation}%`}
                    subtext={portfolioData?.holdings?.[0]?.symbol || "N/A"}
                />
            </div>

            {/* Middle Section: Chart and Portfolio Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

                {/* Chart Section */}
                <div className="lg:col-span-2 bg-[var(--bg-card)] p-5 md:p-8 rounded-xl border border-[var(--border-color)] relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6 md:mb-10">
                        <div>
                            <h3 className="text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1 md:mb-2">Portfolio Growth</h3>
                            <p className="text-lg md:text-xl font-bold text-[var(--text-main)]">Since {formattedSignupDate}</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-xl md:text-2xl font-bold ${growthPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(2)}%
                            </p>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">Performance</p>
                        </div>
                    </div>

                    <div className="h-[250px] md:h-[300px] w-full">
                        {historyData.length < 2 ? (
                            <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 md:p-10 space-y-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--bg-primary)] flex items-center justify-center border border-[var(--border-color)]">
                                    <TrendingUp size={18} className="text-[var(--text-muted)] opacity-50" />
                                </div>
                                <div>
                                    <p className="text-[var(--text-main)] font-bold text-sm tracking-tight text-muji leading-relaxed">Tracking started today.</p>
                                    <p className="text-[var(--text-muted)] text-[10px] md:text-[11px] mt-1">Growth data will appear soon.</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={historyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.2} />
                                    <XAxis
                                        dataKey="time"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 600 }}
                                        dy={10}
                                        minTickGap={30}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 600 }}
                                        tickFormatter={(val) => {
                                            const currencySymbols = {
                                                USD: '$', EUR: '€', JPY: '¥', GBP: '£', INR: '₹', CNY: '¥', AUD: 'A$', CAD: 'C$', CHF: 'Fr'
                                            };
                                            const curSymbol = currencySymbols[selectedCurrency] || '$';
                                            return `${curSymbol}${((val * getRate(selectedCurrency)) / 1000).toFixed(0)}k`;
                                        }}
                                        width={40}
                                    />
                                    <RechartsTooltip
                                        cursor={{ stroke: 'var(--accent-primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        contentStyle={{
                                            backgroundColor: 'var(--bg-card)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                            padding: '8px 12px'
                                        }}
                                        itemStyle={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: 'bold' }}
                                        labelStyle={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}
                                        formatter={(value) => [formatCurrency(value, selectedCurrency, getRate(selectedCurrency), 0), 'Value']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="var(--accent-primary)"
                                        strokeWidth={1.5}
                                        dot={false}
                                        activeDot={{ r: 4, fill: 'var(--accent-primary)', stroke: 'var(--bg-card)', strokeWidth: 2 }}
                                        animationDuration={1500}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Portfolio Summary / Alerts */}
                <div className="space-y-3 md:space-y-4">
                    <h3 className="text-[12px] md:text-[13px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-2">Portfolio Summary</h3>

                    {portfolioData?.holdings?.length > 0 ? (
                        <>
                            <div className="bg-[var(--bg-card)] border-l-2 border-orange-500/50 p-4 md:p-5 rounded-r-xl border-y border-r border-[var(--border-color)] flex gap-3 md:gap-4 transition-all hover:bg-[var(--bg-primary)]/40">
                                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle size={16} className="text-orange-500/80" />
                                </div>
                                <div>
                                    <p className="text-[12px] md:text-[13px] font-bold text-orange-900 dark:text-orange-100">Portfolio is active</p>
                                    <p className="text-[11px] md:text-xs text-orange-700 dark:text-orange-300 mt-1">Make sure to diversify your assets to minimize risk.</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-xl">
                            <p className="text-sm text-[var(--text-muted)] text-center">Add stocks to your portfolio to see insights.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Section: Holdings Table */}
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                <div className="px-5 md:px-8 py-4 md:py-6 border-b border-[var(--border-color)] flex justify-between items-center">
                    <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-widest">Asset Allocation</h3>
                    <button className="p-2 hover:bg-[var(--bg-primary)] rounded-lg text-[var(--text-muted)] transition-colors">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[var(--bg-primary)]/50 text-left">
                                <th className="px-5 md:px-8 py-3 md:py-4 text-[9px] md:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em]">Asset</th>
                                <th className="px-5 md:px-8 py-3 md:py-4 text-[9px] md:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] text-right">Allocation</th>
                                <th className="hidden sm:table-cell px-5 md:px-8 py-3 md:py-4 text-[9px] md:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] text-right">Value</th>
                                <th className="px-5 md:px-8 py-3 md:py-4 text-[9px] md:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] text-right">Perform.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {portfolioData?.holdings?.map((h) => (
                                <tr key={h.symbol} className="hover:bg-[var(--bg-primary)]/30 transition-all cursor-pointer group">
                                    <td className="px-5 md:px-8 py-4 md:py-5">
                                        <p className="text-[13px] md:text-[14px] font-bold text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition-colors">{h.symbol}</p>
                                    </td>
                                    <td className="px-5 md:px-8 py-4 md:py-5 text-right">
                                        <p className="text-[13px] md:text-[14px] font-medium text-[var(--text-main)]">{h.allocation}%</p>
                                    </td>
                                    <td className="hidden sm:table-cell px-5 md:px-8 py-4 md:py-5 text-right">
                                        <p className="text-[13px] md:text-[14px] font-medium text-[var(--text-main)]">
                                            {formatCurrency(h.value, selectedCurrency, getRate(selectedCurrency), 0)}
                                        </p>
                                    </td>
                                    <td className="px-5 md:px-8 py-4 md:py-5 text-right">
                                        <span className={`text-[12px] md:text-[13px] font-bold ${h.pl >= 0 ? 'text-emerald-500/90' : 'text-rose-500/90'}`}>
                                            {h.pl >= 0 ? '+' : ''}{h.plPercent}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
