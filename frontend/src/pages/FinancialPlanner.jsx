import React, { useState, useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/formatCurrency';
import {
    Wallet,
    ShieldCheck,
    TrendingUp,
    IndianRupee,
    Info,
    ArrowRight
} from 'lucide-react';
import { Input } from './modules/shared';

const ASSET_METRICS = {
    "Rent": { return: 0 },
    "Bills": { return: 0 },
    "EMI": { return: 0 },
    "Food": { return: 0 },
    "Shopping": { return: 0 },
    "Fun": { return: 0 },
    "SIPs": { return: 10 },
    "Stocks": { return: 12 },
    "Savings": { return: 3 },
    "Health": { return: 0 },
    "Term": { return: 0 }
};

const RISK_PROFILES = {
    Conservative: {
        description: "Focuses on stability and maximum safety for essential expenses.",
        categories: [
            {
                name: "Monthly Expenses",
                percentage: 50,
                breakdown: [
                    { name: "Rent", percentage: 25 },
                    { name: "Bills", percentage: 15 },
                    { name: "EMI", percentage: 10 }
                ]
            },
            {
                name: "Personal Expenses",
                percentage: 15,
                breakdown: [
                    { name: "Food", percentage: 7 },
                    { name: "Shopping", percentage: 4 },
                    { name: "Fun", percentage: 4 }
                ]
            },
            {
                name: "Investments(SIPs,Stocks)",
                percentage: 10,
                breakdown: [
                    { name: "SIPs", percentage: 7 },
                    { name: "Stocks", percentage: 3 }
                ]
            },
            {
                name: "Emergency Fund",
                percentage: 20,
                breakdown: [
                    { name: "Savings", percentage: 20 }
                ]
            },
            {
                name: "Insurance(Health,Term)",
                percentage: 5,
                breakdown: [
                    { name: "Health", percentage: 3 },
                    { name: "Term", percentage: 2 }
                ]
            }
        ]
    },
    Moderate: {
        description: "Balanced allocation between lifestyle, safety, and long-term wealth.",
        categories: [
            {
                name: "Monthly Expenses",
                percentage: 45,
                breakdown: [
                    { name: "Rent", percentage: 20 },
                    { name: "Bills", percentage: 15 },
                    { name: "EMI", percentage: 10 }
                ]
            },
            {
                name: "Personal Expenses",
                percentage: 20,
                breakdown: [
                    { name: "Food", percentage: 8 },
                    { name: "Shopping", percentage: 6 },
                    { name: "Fun", percentage: 6 }
                ]
            },
            {
                name: "Investments(SIPs,Stocks)",
                percentage: 20,
                breakdown: [
                    { name: "SIPs", percentage: 12 },
                    { name: "Stocks", percentage: 8 }
                ]
            },
            {
                name: "Emergency Fund",
                percentage: 10,
                breakdown: [
                    { name: "Savings", percentage: 10 }
                ]
            },
            {
                name: "Insurance(Health,Term)",
                percentage: 5,
                breakdown: [
                    { name: "Health", percentage: 3 },
                    { name: "Term", percentage: 2 }
                ]
            }
        ]
    },
    Aggressive: {
        description: "Directs maximum surplus towards high-growth investments while minimizing idle cash.",
        categories: [
            {
                name: "Monthly Expenses",
                percentage: 35,
                breakdown: [
                    { name: "Rent", percentage: 15 },
                    { name: "Bills", percentage: 10 },
                    { name: "EMI", percentage: 10 }
                ]
            },
            {
                name: "Personal Expenses",
                percentage: 15,
                breakdown: [
                    { name: "Food", percentage: 6 },
                    { name: "Shopping", percentage: 5 },
                    { name: "Fun", percentage: 4 }
                ]
            },
            {
                name: "Investments",
                percentage: 40,
                breakdown: [
                    { name: "SIPs", percentage: 20 },
                    { name: "Stocks", percentage: 20 }
                ]
            },
            {
                name: "Emergency Fund",
                percentage: 5,
                breakdown: [
                    { name: "Savings", percentage: 5 }
                ]
            },
            {
                name: "Insurance(Health,Term)",
                percentage: 5,
                breakdown: [
                    { name: "Health", percentage: 3 },
                    { name: "Term", percentage: 2 }
                ]
            }
        ]
    }
};

const CATEGORY_COLORS = {
    "Monthly Expenses": '#6366f1', // indigo
    "Personal Expenses": '#f43f5e',  // rose
    "Investments(SIPs,Stocks)": '#06b6d4', // cyan
    "Emergency Fund": '#10b981', // emerald
    "Insurance(Health,Term)": '#f59e0b' // amber
};

export default function FinancialPlanner({ theme }) {
    const { selectedCurrency, getRate, supportedCurrencies } = useCurrency();
    const currentRate = getRate(selectedCurrency);
    const currentSymbol = supportedCurrencies.find(c => c.code === selectedCurrency)?.symbol || '$';

    const [monthlyIncome, setMonthlyIncome] = useState(50000);
    const [riskLevel, setRiskLevel] = useState('Moderate');

    const { allocationData, expectedReturn } = useMemo(() => {
        const profile = RISK_PROFILES[riskLevel];
        const baseIncome = monthlyIncome / currentRate;
        const currentData = profile.categories.map(cat => ({
            name: cat.name,
            value: (baseIncome * cat.percentage) / 100,
            percentage: cat.percentage,
            color: CATEGORY_COLORS[cat.name],
            breakdown: cat.breakdown.map(b => ({
                name: b.name,
                percentage: b.percentage,
                amount: (baseIncome * b.percentage) / 100,
                return: ASSET_METRICS[b.name].return
            }))
        }));

        let weightedSum = 0;
        profile.categories.forEach(cat => {
            cat.breakdown.forEach(asset => {
                weightedSum += (asset.percentage * ASSET_METRICS[asset.name].return);
            });
        });

        return {
            allocationData: currentData,
            expectedReturn: (weightedSum / 100).toFixed(1)
        };
    }, [monthlyIncome, riskLevel, currentRate]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                        <p className="text-sm font-bold text-[var(--text-main)]">{data.name}</p>
                    </div>
                    <p className="text-[var(--accent-primary)] font-black text-xl mb-3">
                        {formatCurrency(data.value, selectedCurrency, currentRate)}
                    </p>
                    <div className="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
                        {data.breakdown.map(b => (
                            <div key={b.name} className="flex justify-between items-center text-[10px]">
                                <span className="text-[var(--text-muted)] font-medium">{b.name}</span>
                                <span className="text-[var(--text-main)] font-black">{b.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-10 animate-in fade-in duration-700 px-0 md:px-2">
            <div className="flex flex-col gap-1 md:gap-2 px-4 md:px-0">
                <h1 className="text-3xl md:text-4xl font-black text-[var(--text-main)] tracking-tight">Financial Planner</h1>
                <p className="text-[11px] md:text-[13px] text-[var(--text-muted)] font-medium flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[var(--accent-primary)]" />
                    Smart allocation based on your risk profile
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* Left Section: Inputs & Allocation */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-2xl md:rounded-3xl border border-[var(--border-color)] shadow-xl space-y-6 md:space-y-8">
                        {/* Income Input */}
                        <div className="space-y-3 md:space-y-4">
                            <Input
                                label={`Monthly Income (${currentSymbol})`}
                                type="number"
                                value={monthlyIncome}
                                onChange={(val) => setMonthlyIncome(Number(val))}
                                prefix={<span className="text-xl font-bold text-[var(--text-muted)]">{currentSymbol}</span>}
                            />
                        </div>

                        {/* Risk Tolerance */}
                        <div className="space-y-3 md:space-y-4">
                            <label className="text-[10px] md:text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                                <TrendingUp size={14} />
                                Risk Tolerance
                            </label>
                            <div className="grid grid-cols-3 gap-1.5 md:gap-2 p-1 md:p-1.5 bg-[var(--bg-primary)] rounded-xl md:rounded-2xl border border-[var(--border-color)]">
                                {Object.keys(RISK_PROFILES).map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setRiskLevel(level)}
                                        className={`py-2.5 md:py-3 px-1 md:px-2 rounded-lg md:rounded-xl text-[11px] md:text-sm font-bold transition-all duration-300 touch-target ${riskLevel === level
                                            ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/30 scale-[1.02]'
                                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] md:text-xs text-[var(--text-muted)] leading-relaxed italic px-1">
                                {RISK_PROFILES[riskLevel].description}
                            </p>
                        </div>
                    </div>

                    {/* Recommended Allocation List */}
                    <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-2xl md:rounded-3xl border border-[var(--border-color)] shadow-xl space-y-5 md:space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base md:text-lg font-black text-[var(--text-main)] flex items-center gap-2 md:gap-3">
                                <IndianRupee className="text-[var(--accent-primary)]" size={20} />
                                Portfolio Structure
                            </h2>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] md:text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-widest">Est. Return</span>
                                <span className="text-base md:text-xl font-black text-[var(--text-main)]">{expectedReturn}%</span>
                            </div>
                        </div>
                        <div className="space-y-4 md:space-y-5">
                            {allocationData.map((item) => (
                                <div key={item.name} className="group">
                                    <div className="flex items-center justify-between mb-1.5 md:mb-2 gap-2">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                            <span className="text-[11px] md:text-[13px] font-black md:font-bold text-[var(--text-main)] truncate max-w-[120px] md:max-w-none">{item.name}</span>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className="text-[11px] md:text-[13px] font-black text-[var(--text-main)] transition-all group-hover:text-[var(--accent-primary)]">
                                                {formatCurrency(item.value, selectedCurrency, currentRate)}
                                            </span>
                                            <span className="text-[9px] md:text-[10px] ml-1 font-bold text-[var(--text-muted)] uppercase">
                                                ({item.percentage}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1 md:h-1.5 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden">
                                        <div
                                            className="h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                                            style={{
                                                width: `${item.percentage}%`,
                                                backgroundColor: item.color,
                                                boxShadow: `0 0 12px ${item.color}33`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 mt-4 md:mt-6 border-t border-[var(--border-color)] flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                <Info size={14} />
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Adjusted Total</span>
                            </div>
                            <span className="text-lg md:text-xl font-black text-[var(--accent-primary)]">{formatCurrency(monthlyIncome / currentRate, selectedCurrency, currentRate)}</span>
                        </div>
                    </div>
                </div>

                {/* Right Section: Chart */}
                <div className="lg:col-span-12 xl:col-span-7 bg-[var(--bg-card)] rounded-2xl md:rounded-3xl border border-[var(--border-color)] shadow-xl relative overflow-hidden flex flex-col items-center justify-center p-6 md:p-8 min-h-[400px] md:min-h-[500px]">
                    {/* Chart Header Background Effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-50" />

                    <div className="text-center mb-0 md:mb-4 z-10">
                        <h3 className="text-2xl md:text-3xl font-black text-[var(--text-main)] mb-1.5 md:mb-2 tracking-tight">
                            {riskLevel} Profile
                        </h3>
                        <div className="h-1 w-10 md:w-12 bg-[var(--accent-primary)] mx-auto rounded-full mb-6 md:mb-8 shadow-[0_0_10px_var(--accent-primary)]" />
                    </div>

                    <div className="w-full h-[300px] md:h-[400px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={allocationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={window.innerWidth < 768 ? 70 : 110}
                                    outerRadius={window.innerWidth < 768 ? 100 : 160}
                                    paddingAngle={window.innerWidth < 768 ? 4 : 8}
                                    dataKey="value"
                                    animationBegin={0}
                                    animationDuration={1500}
                                >
                                    {allocationData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            stroke="none"
                                            className="hover:opacity-80 transition-opacity cursor-pointer"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Label */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <p className="text-[8px] md:text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] md:tracking-[0.3em] mb-0.5 md:mb-1">Monthly</p>
                            <p className="text-2xl md:text-4xl font-black text-[var(--text-main)] leading-none">{formatCurrency(monthlyIncome / currentRate, selectedCurrency, currentRate).split('.')[0]}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-6 mt-4 md:mt-8 w-full max-w-2xl px-2">
                        {allocationData.map(item => (
                            <div key={item.name} className="flex flex-col items-center gap-1">
                                <div className="w-6 md:w-8 h-0.5 md:h-1 rounded-full mb-0.5 md:mb-1" style={{ backgroundColor: item.color }} />
                                <span className="text-[8px] md:text-[10px] font-black text-[var(--text-muted)] uppercase tracking-tight text-center truncate w-full">{item.name}</span>
                                <span className="text-[11px] md:text-sm font-black md:font-bold text-[var(--text-main)]">{item.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
