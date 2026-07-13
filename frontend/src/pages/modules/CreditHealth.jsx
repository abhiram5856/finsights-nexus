import React, { useState } from "react";
import {
    fmt, pct, PALETTE, MODULE_COLORS,
    Card, Input, Badge, StatRow, SectionHeader, Btn, GaugeBar
} from "./shared";

// ═══════════════════════════════════════════════════════════════
// CREDIT CARD MODULE
// ═══════════════════════════════════════════════════════════════
export default function CreditHealth({ onBack }) {
    const [monthlyIncome, setMonthlyIncome] = useState(150000);
    const [totalLimit, setTotalLimit] = useState(500000);
    const [outstanding, setOutstanding] = useState(80000);
    const [minDue, setMinDue] = useState(4000);
    const [totalEMI, setTotalEMI] = useState(20000);
    const [simMode, setSimMode] = useState(false);
    const [simPaydown, setSimPaydown] = useState(10000);

    const utilization = totalLimit > 0 ? (outstanding / totalLimit) * 100 : 0;
    const dti = monthlyIncome > 0 ? ((totalEMI + minDue) / monthlyIncome) * 100 : 0;
    const targetUtil = 30;
    const paydownTarget = Math.max(0, outstanding - totalLimit * (targetUtil / 100));

    const utilizType = utilization > 60 ? "bad" : utilization > 30 ? "warn" : "good";
    const dtiType = dti > 50 ? "bad" : dti > 35 ? "warn" : "good";
    const healthLabel = utilization > 60 ? "Critical" : utilization > 30 ? "Fair" : "Healthy";
    const healthType = utilization > 60 ? "bad" : utilization > 30 ? "warn" : "good";

    const simOutstanding = Math.max(0, outstanding - simPaydown);
    const simUtil = totalLimit > 0 ? (simOutstanding / totalLimit) * 100 : 0;

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 pb-10 flex flex-col items-stretch transition-colors duration-300 w-full fadeIn animate-in slide-in-from-bottom-2 ease-out">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {onBack && <Btn label="← Back" onClick={onBack} variant="ghost" color={PALETTE.muted} small />}
                <SectionHeader title="Credit Health" subtitle="Utilization tracking, debt analysis & health scoring" color={MODULE_COLORS.credit} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
                <div className="flex flex-col gap-6">
                    <Card title="Credit Profile">
                        <Input label="Monthly Income" value={monthlyIncome} onChange={setMonthlyIncome} step={5000} />
                        <Input label="Total Credit Limit" value={totalLimit} onChange={setTotalLimit} step={50000} />
                        <Input label="Current Outstanding" value={outstanding} onChange={setOutstanding} step={5000} />
                        <Input label="Minimum Due" value={minDue} onChange={setMinDue} step={500} />
                        <Input label="Total Monthly EMIs" value={totalEMI} onChange={setTotalEMI} step={1000} />
                    </Card>
                    <Card title={simMode ? "Paydown Simulator" : "Manual Simulation"}>
                        {!simMode ? (
                            <div className="flex flex-col gap-4 items-start">
                                <p className="text-sm text-[var(--text-muted)] font-medium">Simulate the impact of paying down your outstanding balance.</p>
                                <Btn label="Run Simulation" onClick={() => setSimMode(true)} variant="ghost" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5">
                                <Input label="Extra Payment This Month" value={simPaydown} onChange={setSimPaydown} step={5000} />
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-4">
                                    <StatRow label="New Outstanding" value={fmt(simOutstanding)} color={PALETTE.green} />
                                    <StatRow label="New Utilization" value={pct(simUtil)} color={simUtil > 30 ? PALETTE.amber : PALETTE.green} border={false} />
                                    <div className="h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, simUtil)}%`, backgroundColor: simUtil > 30 ? PALETTE.amber : PALETTE.green }} />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Badge label={simUtil <= 30 ? "Target Achieved" : `${(simUtil - 30).toFixed(1)}% above target`} type={simUtil <= 30 ? "good" : "warn"} />
                                    <Btn label="Close" onClick={() => setSimMode(false)} variant="ghost" small />
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="flex flex-col gap-6">
                    <Card>
                        <div className="flex flex-col items-center mb-6 mt-2">
                            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Credit Health</span>
                            <span className={`text-5xl font-semibold tracking-tight mb-5 ${healthType === 'good' ? 'text-emerald-600' : healthType === 'warn' ? 'text-amber-600' : 'text-rose-600'}`}>{healthLabel}</span>
                            <Badge label={utilizType === "bad" ? "High Utilization" : utilizType === "warn" ? "Needs Attention" : "Optimal"} type={utilizType} />
                        </div>
                        <div className="flex flex-col gap-4 border-t border-gray-100 pt-4">
                            <GaugeBar label={`Utilization (Target: <30%)`} value={utilization} max={100} color={utilization > 60 ? PALETTE.rose : utilization > 30 ? PALETTE.amber : PALETTE.green} fmtFn={v => pct(v)} />
                            <GaugeBar label={`Debt-to-Income (Safe: <35%)`} value={dti} max={100} color={dti > 50 ? PALETTE.rose : dti > 35 ? PALETTE.amber : PALETTE.green} fmtFn={v => pct(v)} />
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-4 transition-all hover:border-gray-300">
                                <StatRow label="Current Utilization" value={pct(utilization)} color={utilizType === "bad" ? PALETTE.rose : utilizType === "warn" ? PALETTE.amber : PALETTE.green} />
                                <StatRow label="Debt-to-Income Ratio" value={pct(dti)} color={dtiType === "bad" ? PALETTE.rose : dtiType === "warn" ? PALETTE.amber : PALETTE.green} />
                                <StatRow label="Recommended Paydown" value={fmt(paydownTarget)} color={PALETTE.green} border={false} />
                            </div>
                        </div>
                    </Card>
                    <Card title="Tips & Recommendations">
                        <div className="flex flex-col">
                            {[
                                { icon: "🎯", tip: `Keep utilization below 30% to maintain a healthy credit score` },
                                { icon: "💰", tip: utilization > 30 ? `Pay ${fmt(paydownTarget)} to reach 30% utilization` : "You're within the safe utilization zone" },
                                { icon: "📅", tip: "Pay full balance monthly to avoid 40%+ annualized interest on cards" },
                                { icon: "⚠", tip: "Never pay only the minimum due — it leads to debt spiral" },
                            ].map((t, i) => (
                                <div key={i} className="flex gap-4 p-4 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-primary)] transition-colors rounded-lg">
                                    <span className="text-xl flex-shrink-0">{t.icon}</span>
                                    <span className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">{t.tip}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
