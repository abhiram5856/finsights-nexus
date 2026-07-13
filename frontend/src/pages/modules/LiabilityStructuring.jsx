import React, { useState } from "react";
import {
    A, FUND_LIST, PALETTE, MODULE_COLORS, SURPLUS_ALLOC,
    fv, calcEMI, fmt, pct,
    Card, Input, Select, Slider, Badge, StatRow, SectionHeader, Btn, GaugeBar, EmergencyAlert, EmergencyFundInterface
} from "./shared";

// ═══════════════════════════════════════════════════════════════
// ASSET BUYING MODULE
// ═══════════════════════════════════════════════════════════════
export default function LiabilityStructuring({ onBack }) {
    const [step, setStep] = useState(0);
    const [income, setIncome] = useState(150000);
    const [expenses, setExpenses] = useState(60000);
    const [existingEMI, setExistingEMI] = useState(10000);
    const [savings, setSavings] = useState(500000);
    const [showEmergency, setShowEmergency] = useState(false);
    const [assetType, setAssetType] = useState("House");
    const [assetCost, setAssetCost] = useState(7500000);
    const [downPayment, setDownPayment] = useState(1500000);
    const [tenure, setTenure] = useState(20);
    const [surplusAlloc, setSurplusAlloc] = useState({ ...SURPLUS_ALLOC["Moderate"] });
    const [surplusDuration, setSurplusDuration] = useState(5);
    const [customMode, setCustomMode] = useState(false);
    const [customTenure, setCustomTenure] = useState(20);
    const [customDown, setCustomDown] = useState(1500000);
    const [takeLoan, setTakeLoan] = useState(true);

    const required = expenses * A.emergencyMonths;
    const emergencyOk = savings >= required;
    const emergencyMonths = expenses > 0 ? (savings / expenses).toFixed(1) : 0;

    const loanRate = A.loanRate[assetType] || 9;
    const activeTenure = customMode ? customTenure : tenure;
    const activeDown = customMode ? customDown : downPayment;
    const loanAmount = Math.max(0, assetCost - activeDown);
    const emi = calcEMI(loanAmount, loanRate, activeTenure);
    const totalPay = emi * activeTenure * 12;
    const totalInterest = totalPay - loanAmount;
    const totalDebt = emi + existingEMI;
    const dtiRatio = income > 0 ? (totalDebt / income) * 100 : 0;
    const surplus = Math.max(0, income - expenses - totalDebt);

    const riskLevel = dtiRatio > 50 ? "High" : dtiRatio > 40 ? "Moderate" : "Low";
    const strategy = dtiRatio > 50 ? "High Risk" : dtiRatio > 40 ? "Increase Down Payment" : dtiRatio > 35 ? "Reduce Loan Size" : "Safe to Proceed";
    const strategyType = dtiRatio > 50 ? "bad" : dtiRatio > 35 ? "warn" : "good";

    // Surplus investment calculation
    const totalSurplusAlloc = Object.values(surplusAlloc).reduce((a, b) => a + b, 0);
    const surplusGain = FUND_LIST.reduce((sum, f) => {
        const monthlyInFund = surplus * (surplusAlloc[f.key] || 0) / 100;
        return sum + fv(monthlyInFund, f.return, surplusDuration);
    }, 0);
    const surplusInvested = surplus * 12 * surplusDuration;
    const investmentGain = surplusGain - surplusInvested;               // pure growth on invested capital
    const netProfitAfterLoanCost = surplusGain - totalInterest;         // spec: Gain − Total Loan Interest
    const prepayBenefit = totalInterest;                                  // Guaranteed interest saved if prepaying

    if (showEmergency) return (
        <EmergencyFundInterface income={income} expenses={expenses} savings={savings}
            onReturn={() => setShowEmergency(false)} onAdjust={() => { setShowEmergency(false); setStep(1); }} />
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 pb-10 flex flex-col items-stretch transition-colors duration-300 w-full fadeIn animate-in slide-in-from-bottom-2 ease-out">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {onBack && <Btn label="← Back" onClick={onBack} variant="ghost" color={PALETTE.muted} small />}
                <SectionHeader title="Liability Structuring" subtitle="EMI affordability, risk analysis & investment optimizer" color={MODULE_COLORS.asset} />
            </div>

            {step === 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
                    <Card title="Financial Profile">
                        <Input label="Monthly Income" value={income} onChange={setIncome} step={5000} />
                        <Input label="Monthly Expenses" value={expenses} onChange={setExpenses} step={5000} />
                        <Input label="Existing Monthly EMIs" value={existingEMI} onChange={setExistingEMI} step={1000} />
                        <Input label="Current Liquid Savings" value={savings} onChange={setSavings} step={10000} />
                    </Card>
                    <Card title="Emergency Fund Insight">
                        <div className="flex flex-col items-center text-center mb-2">
                            <span className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold mb-1">Current Buffer</span>
                            <span className={`text-5xl font-black tracking-tight mb-3 ${emergencyOk ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {emergencyMonths} <span className="text-lg font-medium opacity-70">mo</span>
                            </span>
                            <Badge label={emergencyOk ? "Coverage Adequate" : "Requires Attention"} type={emergencyOk ? "good" : "bad"} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <GaugeBar label="Progress to 6 Months" value={savings} max={required} color={emergencyOk ? PALETTE.green : PALETTE.red} fmtFn={v => fmt(v)} />
                            <StatRow label="Required Target" value={fmt(required)} />
                            <StatRow label="Current Savings" value={fmt(savings)} color={emergencyOk ? PALETTE.green : PALETTE.red} border={false} />
                        </div>
                    </Card>
                    {!emergencyOk && <div className="col-span-1 lg:col-span-2">
                        <EmergencyAlert months={emergencyMonths} required={required} onView={() => setShowEmergency(true)} />
                    </div>}
                    <div className="col-span-1 lg:col-span-2 flex justify-end">
                        <Btn label="Continue to Asset Details →" onClick={() => setStep(1)} full={false} />
                    </div>
                </div>
            )}

            {step >= 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                    {!emergencyOk && <div className="col-span-1 lg:col-span-2">
                        <EmergencyAlert months={emergencyMonths} required={required} onView={() => setShowEmergency(true)} />
                    </div>}

                    <div className="flex flex-col gap-6">
                        <Card title="Asset Details">
                            <Select label="Asset Type" value={assetType} onChange={setAssetType} options={["House", "Land", "Vehicle", "Business Asset"]} />
                            <Input label="Total Asset Cost" value={assetCost} onChange={setAssetCost} step={100000} />
                            <Input label="Down Payment" value={customMode ? customDown : downPayment} onChange={customMode ? setCustomDown : setDownPayment} step={100000} />
                            <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl py-4 px-5 flex justify-between items-center mt-2 transition-all hover:border-gray-300 dark:hover:border-slate-600">
                                <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">Take a Loan?</span>
                                <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                                    <button onClick={() => setTakeLoan(true)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${takeLoan ? 'bg-white dark:bg-slate-700 shadow-sm text-[var(--text-main)]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Yes</button>
                                    <button onClick={() => setTakeLoan(false)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${!takeLoan ? 'bg-white dark:bg-slate-700 shadow-sm text-[var(--text-main)]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>No</button>
                                </div>
                            </div>
                            {takeLoan && (
                                <>
                                    <Input label="Loan Tenure" value={customMode ? customTenure : tenure} onChange={customMode ? setCustomTenure : setTenure} min={1} max={30} step={1} prefix="" suffix="Years" />
                                    <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl py-4 px-5 flex justify-between items-center mt-2 transition-all hover:border-gray-300 dark:hover:border-slate-600">
                                        <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Interest Rate ({assetType})</span>
                                        <span className="text-indigo-600 font-semibold text-sm">{loanRate}%</span>
                                    </div>
                                </>
                            )}
                        </Card>

                        {takeLoan && (
                            <Card title="Manual Loan Customizer">
                                {!customMode ? (
                                    <div className="flex flex-col gap-4 items-start">
                                        <p className="text-sm text-[var(--text-muted)] font-medium">Adjust tenure and down payment to optimize your loan affordability.</p>
                                        <Btn label="Customize Loan & Plan" onClick={() => { setCustomTenure(tenure); setCustomDown(downPayment); setCustomMode(true); }} variant="ghost" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-5">
                                        <Input label="Adjusted Tenure" value={customTenure} onChange={setCustomTenure} min={1} max={30} step={1} prefix="" suffix="Years" />
                                        <Input label="Adjusted Down Payment" value={customDown} onChange={setCustomDown} step={100000} />
                                        <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4">
                                            <StatRow label="Adjusted EMI" value={fmt(emi)} color={PALETTE.accent} />
                                            <StatRow label="Adjusted DTI" value={pct(dtiRatio)} color={dtiRatio > 35 ? PALETTE.red : PALETTE.green} />
                                            <StatRow label="Adjusted Surplus" value={fmt(surplus)} color={surplus > 0 ? PALETTE.green : PALETTE.red} border={false} />
                                        </div>
                                        <Btn label="Confirm" onClick={() => setCustomMode(false)} small />
                                    </div>
                                )}
                            </Card>
                        )}
                    </div>

                    <div className="flex flex-col gap-6">
                        <Card>
                            <div className="flex flex-col items-center mb-6 mt-2">
                                <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Monthly EMI</span>
                                <span className={`text-5xl font-semibold tracking-tight mb-5 ${strategyType === 'good' ? 'text-emerald-600' : strategyType === 'warn' ? 'text-amber-600' : 'text-rose-600'}`}>{fmt(emi)}</span>
                                <Badge label={strategy} type={strategyType} />
                            </div>
                            <div className="flex flex-col gap-1 border-t border-gray-100 pt-4">
                                <StatRow label="Loan Amount" value={fmt(loanAmount)} />
                                <StatRow label="Total Interest" value={fmt(totalInterest)} />
                                <StatRow label="Total Payment" value={fmt(totalPay)} />
                                <StatRow label="EMI + Existing Debt" value={fmt(totalDebt)} />
                                <StatRow label="Debt-to-Income Ratio" value={pct(dtiRatio)} color={dtiRatio > 35 ? PALETTE.amber : PALETTE.green} />
                                <StatRow label="Risk Level" value={riskLevel} color={riskLevel === "High" ? PALETTE.amber : riskLevel === "Moderate" ? PALETTE.amber : PALETTE.green} border={false} />
                            </div>
                        </Card>

                        <Card title="Payment Breakdown">
                            <div className="flex flex-col gap-4">
                                <div className="h-4 rounded-lg overflow-hidden flex w-full">
                                    <div style={{ width: `${(loanAmount / totalPay) * 100}%`, background: PALETTE.green }} title="Principal" />
                                    <div style={{ width: `${(totalInterest / totalPay) * 100}%`, background: PALETTE.red }} title="Interest" />
                                </div>
                                <div className="flex gap-6 justify-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                                        <span className="text-xs text-gray-500 font-medium">Principal: {fmt(loanAmount)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                                        <span className="text-xs text-gray-500 font-medium">Interest: {fmt(totalInterest)}</span>
                                    </div>
                                </div>
                            </div>
                            {emi === 0 && assetCost > activeDown ? (
                                <div className="mt-4 text-center text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl p-4">
                                    Cannot afford this asset with current timelines.
                                </div>
                            ) : (
                                <div className="mt-4 text-center text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl p-4">
                                    Monthly Surplus (after all costs) <span className={surplus > 0 ? 'text-emerald-600 ml-1' : 'text-amber-600 ml-1'}>{fmt(surplus)}</span>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Surplus Investment Strategy */}
                    {surplus > 0 && (
                        <div className="col-span-1 lg:col-span-2">
                            <Card title="Surplus Investment Strategy">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                                    <div className="flex flex-col gap-5">
                                        <h4 className="text-lg font-semibold text-[var(--text-main)]">Allocation Setup</h4>
                                        <Input label="Surplus to Invest" value={surplus} onChange={() => { }} locked prefix="₹" hint="Auto-calculated" />
                                        <Input label="Investment Duration" value={surplusDuration} onChange={setSurplusDuration} min={1} max={20} step={1} prefix="" suffix="Years" />
                                        <div className="flex flex-col gap-4">
                                            {FUND_LIST.map(f => (
                                                <Slider key={f.key} label={f.label} value={surplusAlloc[f.key] || 0}
                                                    onChange={v => setSurplusAlloc(p => ({ ...p, [f.key]: v }))} />
                                            ))}
                                        </div>
                                        {totalSurplusAlloc !== 100 && <Badge label={`Total: ${totalSurplusAlloc}% (must = 100%)`} type="bad" />}
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <h4 className="text-lg font-semibold text-[var(--text-main)] mb-2">Investment Results</h4>
                                        {FUND_LIST.filter(f => (surplusAlloc[f.key] || 0) > 0).map(f => {
                                            const monthly = surplus * (surplusAlloc[f.key] || 0) / 100;
                                            const fvVal = fv(monthly, f.return, surplusDuration);
                                            return <StatRow key={f.key} label={f.label} value={fmt(fvVal)} color={PALETTE.green} />;
                                        })}
                                        <div className="border-t border-[var(--border-color)] pt-3 mt-2">
                                            <StatRow label="Total Corpus" value={fmt(surplusGain)} color={PALETTE.green} border={false} />
                                            <StatRow label="Amount Invested" value={fmt(surplusInvested)} border={false} />
                                            <StatRow label="Total Gain" value={fmt(surplusGain - surplusInvested)} color={PALETTE.green} border={false} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <h4 className="text-[14px] font-semibold text-gray-900">Strategy Comparison</h4>
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                                            <div className="font-semibold text-emerald-800 text-sm mb-3">Option B — Invest Surplus</div>
                                            <StatRow label="Total Investment Corpus" value={fmt(surplusGain)} color={PALETTE.green} border={false} />
                                            <StatRow label="Investment Gain" value={fmt(investmentGain)} color={PALETTE.green} border={false} />
                                            <StatRow label="Net Profit (After EMI)" value={fmt(netProfitAfterLoanCost)} color={netProfitAfterLoanCost > 0 ? PALETTE.green : PALETTE.amber} border={false} />
                                        </div>
                                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                                            <div className="font-semibold text-indigo-800 text-sm mb-3">Option A — Prepay Loan</div>
                                            <StatRow label="Guaranteed Interest Saved" value={fmt(prepayBenefit)} color={PALETTE.indigo} border={false} />
                                        </div>
                                        <div className={`mt-2 flex flex-col items-center p-5 rounded-xl border-2 ${netProfitAfterLoanCost > prepayBenefit ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200'}`}>
                                            <div className="text-[11px] text-gray-500 tracking-wider font-semibold mb-2 uppercase">Recommendation</div>
                                            <div className={`text-xl font-semibold mb-2 ${netProfitAfterLoanCost > prepayBenefit ? 'text-emerald-700' : 'text-indigo-700'}`}>
                                                {netProfitAfterLoanCost > prepayBenefit ? "Invest the Surplus" : "Prepay the Loan"}
                                            </div>
                                            <div className="text-xs text-gray-600 font-medium text-center leading-relaxed">
                                                {netProfitAfterLoanCost > prepayBenefit
                                                    ? `Net profit ${fmt(netProfitAfterLoanCost)} vs guaranteed savings ${fmt(prepayBenefit)}`
                                                    : `Guaranteed savings ${fmt(prepayBenefit)} vs net profit ${fmt(netProfitAfterLoanCost)}`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    <div className="col-span-1 lg:col-span-2 flex gap-4 mt-6">
                        <Btn label="← Edit Financial Profile" onClick={() => setStep(0)} variant="ghost" />
                    </div>
                </div>
            )}
        </div>
    );
}
