import React, { useState, useEffect } from "react";
import {
    A, FUND_LIST, PALETTE, MODULE_COLORS,
    fv, inflAdj, blended, fmt, pct, RISK_ALLOC,
    Card, Input, Select, Slider, Badge, StatRow, SectionHeader, Btn, PieChart, BarChart, GaugeBar, EmergencyAlert, EmergencyFundInterface
} from "./shared";

// ═══════════════════════════════════════════════════════════════
// LOCAL COMPONENTS FOR PREMIUM UI
// ═══════════════════════════════════════════════════════════════
const CurrencyInput = ({ label, value, onChange, prefix = "₹", feedback }) => {
    const displayValue = value ? value.toLocaleString('en-IN') : '';
    const handleInput = (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        onChange(raw ? parseInt(raw, 10) : 0);
    };
    return (
        <div className="flex flex-col gap-1.5 transition-all w-full">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                {prefix && <span className="absolute left-4 text-gray-500 font-medium text-[15px] select-none">{prefix}</span>}
                <input
                    type="text"
                    value={displayValue}
                    onChange={handleInput}
                    className={`w-full bg-transparent border-none outline-none text-gray-900 py-3 font-semibold text-[15px] ${prefix ? 'pl-9 pr-4' : 'px-4'}`}
                />
            </div>
            {feedback && (
                <div className="mt-1 animate-in fade-in slide-in-from-top-1 duration-300">
                    <span className={`text-xs ${feedback.type === 'warn' ? 'text-amber-600' : 'text-gray-500'}`}>{feedback.text}</span>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// LONG-TERM INVESTMENT MODULE
// ═══════════════════════════════════════════════════════════════
export default function LongTermModule({ onBack }) {
    const [step, setStep] = useState(0);
    const [income, setIncome] = useState(100000);
    const [expenses, setExpenses] = useState(50000);
    const [savings, setSavings] = useState(150000);
    const [showEmergency, setShowEmergency] = useState(false);
    const [monthly, setMonthly] = useState(20000);
    const [years, setYears] = useState(10);
    const [target, setTarget] = useState(0);
    const [risk, setRisk] = useState("Moderate");
    const [alloc, setAlloc] = useState({ ...RISK_ALLOC["Moderate"] });
    const [customMode, setCustomMode] = useState(false);

    const required = expenses * A.emergencyMonths;
    const emergencyOk = savings >= required;
    const emergencyMonths = expenses > 0 ? (savings / expenses).toFixed(1) : 0;

    useEffect(() => { setAlloc({ ...RISK_ALLOC[risk] }); }, [risk]);

    const totalAlloc = Object.values(alloc).reduce((a, b) => a + b, 0);
    const rate = blended(alloc);
    const corpus = fv(monthly, rate, years);
    const adjCorpus = inflAdj(corpus, years);
    const gap = target > 0 ? target - corpus : 0;

    const statusType = gap > corpus * 0.3 ? "bad" : gap > 0 ? "warn" : "good";
    const statusLabel = gap > corpus * 0.3 ? "High Risk" : gap > 0 ? "Improvement Recommended" : "Good to Proceed";
    const planLabel = risk === "Low" ? "Safe Plan" : risk === "High" ? "Aggressive Plan" : "Optimized Plan";
    const planType = risk === "Low" ? "good" : risk === "High" ? "bad" : "gold";

    const steps = ["Financial Profile", "Investment Setup", "Results"];

    if (showEmergency) return (
        <EmergencyFundInterface income={income} expenses={expenses} savings={savings}
            onReturn={() => setShowEmergency(false)} onAdjust={() => { setShowEmergency(false); setStep(1); }} />
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 pb-10 flex flex-col items-stretch transition-colors duration-300 w-full fadeIn animate-in slide-in-from-bottom-2 ease-out">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {onBack && <Btn label="← Back" onClick={onBack} variant="ghost" color={PALETTE.muted} small />}
                <SectionHeader title="Long-Term Investing" subtitle="Build your corpus with intelligent allocation" color={MODULE_COLORS.invest} />
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-center w-full max-w-5xl mx-auto py-8 overflow-x-auto no-scrollbar">
                {steps.map((s, i) => (
                    <div key={i} className={`flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}>
                        <div onClick={() => i <= step && setStep(i)} className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm cursor-pointer shrink-0 transition-all ${i < step ? 'bg-indigo-600 text-white shadow-sm' : i === step ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-200' : 'bg-white border-2 border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                            {i < step ? "✓" : i + 1}
                        </div>
                        <span className={`text-sm font-medium ml-3 whitespace-nowrap ${i === step ? 'text-indigo-700' : i < step ? 'text-gray-900' : 'text-gray-500'}`}>{s}</span>
                        {i < steps.length - 1 && <div className={`flex-1 min-w-[30px] h-0.5 mx-4 ${i < step ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
                    </div>
                ))}
            </div>

            {step === 0 && (
                <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: Financial Profile Inputs */}
                        <Card title="Financial Profile">
                            <div className="flex flex-col gap-5 py-2">
                                <CurrencyInput
                                    label="MONTHLY INCOME"
                                    value={income}
                                    onChange={setIncome}
                                />
                                <CurrencyInput
                                    label="MONTHLY ESSENTIAL EXPENSES"
                                    value={expenses}
                                    onChange={setExpenses}
                                    feedback={expenses > income ? { text: "Expenses exceed income. Please review.", type: "warn" } : null}
                                />
                                <CurrencyInput
                                    label="CURRENT LIQUID SAVINGS"
                                    value={savings}
                                    onChange={setSavings}
                                />
                            </div>
                        </Card>

                        {/* Right Column: Emergency Fund Check Insight */}
                        <Card title="Emergency Fund Check">
                            <div className="flex flex-col gap-4 py-2 mt-2">
                                <GaugeBar label="Coverage" value={savings} max={required} color={emergencyOk ? PALETTE.green : PALETTE.red} />
                                <StatRow label="Required (6 months)" value={fmt(required)} className="border-t border-gray-100 pt-3" />
                                <StatRow label="Current Savings" value={fmt(savings)} className="border-t border-gray-100 pt-3" />
                                <StatRow label="Coverage Period" value={`${emergencyMonths} months`} color={emergencyOk ? PALETTE.green : PALETTE.red} className="border-t border-b border-gray-100 py-3" border={false} />

                                {!emergencyOk ? (
                                    <div className="mt-2 text-sm text-red-500 bg-red-50 border border-red-500/20 px-4 py-2 rounded-xl flex items-center justify-center gap-2">
                                        ⚠ Insufficient Emergency Fund
                                    </div>
                                ) : (
                                    <div className="mt-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center justify-center gap-2">
                                        ✓ Emergency Fund Adequate
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {!emergencyOk && (
                        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="text-rose-600 dark:text-rose-400 mt-0.5">⚠</div>
                                <div>
                                    <h4 className="font-bold text-rose-800 dark:text-rose-400 text-[15px] m-0 leading-tight">Emergency Fund Inadequate</h4>
                                    <p className="text-sm text-rose-600 dark:text-rose-500 font-medium m-0 mt-1">
                                        Emergency fund covers only {emergencyMonths} months (need 6). Required: {fmt(required)}
                                    </p>
                                </div>
                            </div>
                            <Btn label="View Details" onClick={() => setShowEmergency(true)} variant="outline" color={PALETTE.red} small />
                        </div>
                    )}

                    <div className="flex justify-center mt-2 w-full">
                        <Btn label={emergencyOk ? "Continue to Investment Setup →" : "Continue Anyway →"}
                            onClick={() => setStep(1)} full={true} color={emergencyOk ? 'var(--accent-primary)' : PALETTE.amber} />
                    </div>
                </div>
            )}

            {step === 1 && (
                <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card title="Investment Inputs">
                            <div className="flex flex-col gap-2 py-2">
                                <Input label="Monthly SIP Amount" value={monthly} onChange={setMonthly} step={1000} hint={`Max: ${fmt(income - expenses)}`} />
                                <Input label="Investment Duration" value={years} onChange={setYears} min={1} max={40} step={1} prefix="" suffix="Years" />
                                <Input label="Target Corpus (Optional)" value={target} onChange={setTarget} step={100000} />
                            </div>
                        </Card>
                        <Card title="Risk Profile">
                            <div className="flex flex-col gap-3">
                                {["Low", "Moderate", "High"].map(r => (
                                    <button key={r} onClick={() => setRisk(r)}
                                        className={`p-4 rounded-xl cursor-pointer text-left transition-all duration-200 border-2 w-full ${risk === r ? (r === 'Low' ? 'bg-emerald-500/10 border-emerald-500/30' : r === 'High' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30') : 'bg-[var(--bg-primary)] border-transparent hover:border-[var(--border-color)]'}`}>
                                        <div className="font-semibold text-sm text-[var(--text-main)] mb-1">
                                            {r === "Low" ? "🛡 Conservative" : r === "High" ? "🚀 Aggressive" : "⚖ Balanced"}
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)] font-medium">
                                            {r === "Low" ? `Expected ~${A.indexFund - 1}% • Capital preservation priority` : r === "High" ? `Expected ~${A.smallCap - 2}%+ • Maximum growth` : `Expected ~${A.multiCap}% • Risk-return balance`}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <Card title="System Assumptions">
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                            {[...FUND_LIST.map(f => [f.label, f.return]), ["Inflation", A.inflation]].map(([name, val]) => (
                                <div key={name} className="bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all hover:border-gray-200 dark:hover:border-slate-600">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold text-center">{name}</div>
                                    <div className="text-gray-900 font-semibold text-lg">{val}%</div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="flex gap-4 justify-between w-full mt-2">
                        <Btn label="← Back" onClick={() => setStep(0)} variant="ghost" />
                        <Btn label="Generate Recommendation →" onClick={() => setStep(2)} />
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl mx-auto">
                    <Card>
                        <div className="flex flex-col items-center mb-8 mt-2">
                            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Projected Corpus</span>
                            <span className="text-5xl font-semibold tracking-tight text-gray-900 mb-2">{fmt(corpus)}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-t border-gray-100 pt-4">
                            <StatRow label="Expected Return (Blended)" value={pct(rate)} />
                            <StatRow label="Inflation-Adjusted Value" value={fmt(adjCorpus)} />
                            {target > 0 && <StatRow label="Your Target" value={fmt(target)} />}
                            {target > 0 && <StatRow label={gap > 0 ? "Shortfall" : "Surplus"} value={fmt(Math.abs(gap))} color={gap > 0 ? PALETTE.amber : PALETTE.green} />}
                            <StatRow label="Sustainability Score" value={monthly <= (income - expenses) * 0.8 ? "High Capacity" : "Moderate Capacity"} border={false} />
                        </div>
                        <div className="flex gap-2 justify-center mt-2 border-t border-gray-100 pt-5">
                            <Badge label={statusLabel} type={statusType === 'bad' ? 'warn' : 'dark'} />
                            <Badge label={planLabel} type="dark" />
                        </div>
                    </Card>

                    <Card title="Allocation Details">
                        <PieChart data={{ "Index": alloc.index, "Large Cap": alloc.large, "Multi Cap": alloc.multi, "Mid Cap": alloc.mid, "Small Cap": alloc.small, "Balanced": alloc.balanced }} />
                        <div className="flex justify-between items-center mt-4 border-t border-gray-100 pt-5">
                            <Badge label={`${risk} Risk`} type="dark" />
                            {totalAlloc !== 100 && <Badge label={`⚠ Total: ${totalAlloc}%`} type="bad" />}
                        </div>
                    </Card>

                    <Card title="Corpus Growth Projection">
                        <BarChart monthly={monthly} rate={rate} years={years} color={PALETTE.indigo} />
                        <p className="text-xs text-gray-500 font-medium mt-6 text-center">Monthly SIP of {fmt(monthly)} at {pct(rate)} blended return</p>
                    </Card>

                    <Card title={customMode ? "Customize Allocation" : "Manual Override"}>
                        {!customMode ? (
                            <div className="flex flex-col gap-4 items-start">
                                <p className="text-sm text-[var(--text-muted)] font-medium">Override the system recommendation and adjust fund percentages manually.</p>
                                <Btn label="Customize My Allocation" onClick={() => setCustomMode(true)} variant="ghost" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {FUND_LIST.map(f => (
                                        <Slider key={f.key} label={f.label} value={alloc[f.key]}
                                            onChange={v => setAlloc(prev => ({ ...prev, [f.key]: v }))} />
                                    ))}
                                </div>
                                <div className={`font-semibold text-sm ${totalAlloc === 100 ? 'text-gray-900' : 'text-amber-600'}`}>
                                    Total: {totalAlloc}% {totalAlloc !== 100 ? "(adjust to 100%)" : ""}
                                </div>
                                <div className="flex gap-3">
                                    <Btn label="Reset to Recommended" onClick={() => { setAlloc({ ...RISK_ALLOC[risk] }); setCustomMode(false); }} variant="ghost" small />
                                    <Btn label="Apply Rules" onClick={() => setCustomMode(false)} small disabled={totalAlloc !== 100} />
                                </div>
                            </div>
                        )}
                    </Card>

                    <div className="col-span-1 lg:col-span-2 flex justify-between gap-4 mt-6 border-t border-[var(--border-color)] pt-8">
                        <Btn label="← Back to Inputs" onClick={() => setStep(1)} variant="ghost" />
                        <Btn label="Start Over" onClick={() => setStep(0)} variant="ghost" />
                    </div>
                </div>
            )}
        </div>
    );
}
