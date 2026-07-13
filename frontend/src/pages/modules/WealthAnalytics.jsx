import React, { useState } from "react";
import {
    fmt, pct, PALETTE, MODULE_COLORS,
    Card, Input, Badge, StatRow, SectionHeader, Btn, PieChart, GaugeBar
} from "./shared";

// ═══════════════════════════════════════════════════════════════
// WEALTH TRACKING MODULE
// ═══════════════════════════════════════════════════════════════
export default function WealthAnalytics({ onBack }) {
    const [savings, setSavings] = useState(300000);
    const [fd, setFd] = useState(500000);
    const [mutualFunds, setMutualFunds] = useState(800000);
    const [stocks, setStocks] = useState(400000);
    const [property, setProperty] = useState(5000000);
    const [gold, setGold] = useState(300000);
    const [homeLoan, setHomeLoan] = useState(3000000);
    const [personalLoan, setPersonalLoan] = useState(200000);
    const [vehicleLoan, setVehicleLoan] = useState(300000);
    const [creditDues, setCreditDues] = useState(50000);

    const totalAssets = savings + fd + mutualFunds + stocks + property + gold;
    const totalLiabilities = homeLoan + personalLoan + vehicleLoan + creditDues;
    const netWorth = totalAssets - totalLiabilities;
    const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
    const stability = debtRatio < 20 ? "Excellent" : debtRatio < 40 ? "Good" : debtRatio < 60 ? "Fair" : "At Risk";
    const stabilityType = debtRatio < 20 ? "good" : debtRatio < 40 ? "info" : debtRatio < 60 ? "warn" : "bad";

    const allocData = {
        "Savings": savings, "FDs": fd, "Mutual Funds": mutualFunds,
        "Stocks": stocks, "Property": property, "Gold": gold
    };
    const filteredAlloc = Object.fromEntries(Object.entries(allocData).filter(([, v]) => v > 0).map(([k, v]) => [k, Math.round((v / totalAssets) * 100)]));

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 pb-10 flex flex-col items-stretch transition-colors duration-300 w-full fadeIn animate-in slide-in-from-bottom-2 ease-out">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {onBack && <Btn label="← Back" onClick={onBack} variant="ghost" color={PALETTE.muted} small />}
                <SectionHeader title="Wealth Analytics" subtitle="Net worth, asset allocation & financial stability" color={MODULE_COLORS.wealth} />
            </div>
            <div className="flex flex-col gap-6 w-full mt-4">
                {/* Top Row: 3 Columns map to Assets, Liabilities, Net Worth */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Assets */}
                    <Card title="Assets">
                        <Input label="Cash & Savings" value={savings} onChange={setSavings} step={50000} />
                        <Input label="Fixed Deposits" value={fd} onChange={setFd} step={50000} />
                        <Input label="Mutual Funds" value={mutualFunds} onChange={setMutualFunds} step={50000} />
                        <Input label="Stocks & Equity" value={stocks} onChange={setStocks} step={50000} />
                        <Input label="Property Value" value={property} onChange={setProperty} step={100000} />
                        <Input label="Gold & Jewelry" value={gold} onChange={setGold} step={10000} />
                    </Card>

                    {/* Column 2: Liabilities */}
                    <Card title="Liabilities">
                        <Input label="Home Loan Outstanding" value={homeLoan} onChange={setHomeLoan} step={100000} />
                        <Input label="Personal Loan" value={personalLoan} onChange={setPersonalLoan} step={50000} />
                        <Input label="Vehicle Loan" value={vehicleLoan} onChange={setVehicleLoan} step={25000} />
                        <Input label="Credit Card Dues" value={creditDues} onChange={setCreditDues} step={10000} />
                    </Card>

                    {/* Column 3: Net Worth Dashboard */}
                    <Card title="Net Worth Dashboard">
                        <div className="flex flex-col items-center mb-6 mt-2">
                            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Net Worth</span>
                            <span className={`text-5xl font-semibold tracking-tight mb-2 ${netWorth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(netWorth)}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-t border-gray-100 pt-4">
                            <StatRow label="Total Assets" value={fmt(totalAssets)} color={PALETTE.green} />
                            <StatRow label="Total Liabilities" value={fmt(totalLiabilities)} color={PALETTE.red} />
                            <StatRow label="Debt Ratio (Liab ÷ Assets)" value={pct(debtRatio)} color={debtRatio > 40 ? PALETTE.amber : PALETTE.amber} border={false} />
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full mt-4 overflow-hidden mb-6">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, debtRatio)}%`, backgroundColor: PALETTE.amber }} />
                        </div>

                        <div className="flex gap-2 justify-center mt-auto">
                            <Badge label={`★ Stability: ${stability}`} type={stabilityType === 'info' ? 'info' : stabilityType === 'bad' ? 'warn' : 'dark'} size="lg" />
                        </div>
                    </Card>
                </div>

                {/* Bottom Row: Full Width Asset Allocation */}
                <Card title="Asset Allocation Breakdown">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mt-2">
                        {totalAssets > 0 && (
                            <div className="flex justify-center items-center h-full min-h-[250px]">
                                <PieChart data={filteredAlloc} size={280} />
                            </div>
                        )}
                        <div className="flex flex-col gap-5 justify-center h-full">
                            {Object.entries(allocData).filter(([, v]) => v > 0).map(([name, val]) => (
                                <GaugeBar key={name} label={name} value={val} max={totalAssets}
                                    color={name === "Property" ? PALETTE.red : name === "Stocks" ? PALETTE.accent : PALETTE.green} fmtFn={fmt} />
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
