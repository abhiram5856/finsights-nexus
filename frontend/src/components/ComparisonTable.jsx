import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/formatCurrency';

export default function ComparisonTable({ stocks }) {
    const { selectedCurrency, getRate } = useCurrency();
    if (!stocks || stocks.length === 0) return null;

    const metrics = [
        { label: 'Reporting Currency', key: 'currency' },
        { label: 'Market Capitalization', key: 'marketCap', isCurrency: true, isCompact: true },
        { label: 'Price-to-Earnings (P/E)', key: 'peRatio' },
        { label: 'Dividend Yield', key: 'dividendYield', suffix: '%' },
        { label: '6M Performance', key: 'sixMonthPerformance', suffix: '%' },
        { label: '52-Week Range High', key: 'high52', isCurrency: true },
        { label: '52-Week Range Low', key: 'low52', isCurrency: true },
    ];

    return (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden transition-all duration-300">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
                            <th className="px-8 py-5 font-bold text-[var(--text-muted)] uppercase tracking-wider text-[11px]">Key Metric</th>
                            {stocks.map((stock) => (
                                <th key={stock.symbol} className="px-8 py-5 font-bold text-[var(--text-main)] text-base">
                                    {stock.symbol}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {metrics.map((metric) => (
                            <tr key={metric.label} className="hover:bg-[var(--bg-primary)]/50 transition-colors group">
                                <td className="px-8 py-5 text-[var(--text-muted)] font-medium group-hover:text-[var(--text-main)] transition-colors">{metric.label}</td>
                                {stocks.map((stock) => {
                                    const val = stock[metric.key];
                                    if (val === null || val === undefined || (typeof val === 'number' && Number.isNaN(val))) {
                                        return (
                                            <td key={stock.symbol} className="px-8 py-5 font-bold text-[var(--text-main)] tabular-nums">—</td>
                                        );
                                    }

                                    // Special case for reporting currency
                                    if (metric.key === 'currency') {
                                        return (
                                            <td key={stock.symbol} className="px-8 py-5 font-bold text-[var(--accent-primary)] tabular-nums uppercase">
                                                {val}
                                            </td>
                                        );
                                    }

                                    let displayVal;
                                    const stockToUSDRate = getRate(stock.currency);
                                    const targetToUSDRate = getRate(selectedCurrency);
                                    const conversionFactor = targetToUSDRate / stockToUSDRate;

                                    if (metric.isCompact && metric.isCurrency) {
                                        const adjustedVal = val * conversionFactor;

                                        const formatter = new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: selectedCurrency,
                                            notation: 'compact',
                                            maximumFractionDigits: 2
                                        });
                                        displayVal = formatter.format(adjustedVal);

                                    } else if (metric.isCurrency) {
                                        // Manual calculation since formatCurrency doesn't take conversionFactor easily
                                        const adjustedVal = val * conversionFactor;
                                        const locale = selectedCurrency === 'INR' ? 'en-IN' : 'en-US';
                                        displayVal = new Intl.NumberFormat(locale, {
                                            style: 'currency',
                                            currency: selectedCurrency,
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }).format(adjustedVal);
                                    } else {
                                        displayVal = typeof val === 'number' ? Number(val.toFixed(2)).toLocaleString() : val;
                                        if (metric.suffix) displayVal = `${displayVal}${metric.suffix}`;
                                    }

                                    // Color coding for performance
                                    let colorClass = 'text-[var(--text-main)]';
                                    if (metric.key === 'sixMonthPerformance') {
                                        colorClass = val >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]';
                                    }

                                    return (
                                        <td key={stock.symbol} className={`px-8 py-5 font-bold tabular-nums ${colorClass}`}>
                                            {metric.key === 'sixMonthPerformance' && val > 0 ? '+' : ''}{displayVal}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
