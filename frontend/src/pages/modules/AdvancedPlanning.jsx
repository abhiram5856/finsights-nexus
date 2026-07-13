import React, { useState } from "react";
import {
    fmt, PALETTE, MODULE_COLORS,
    Card, Input, Badge, StatRow, SectionHeader, Btn, GaugeBar
} from "./shared";

// ═══════════════════════════════════════════════════════════════
// ADVANCED PLANNING MODULE
// ═══════════════════════════════════════════════════════════════
export default function AdvancedPlanning({ onBack }) {
    const [tab, setTab] = useState("fire");
    const [annualExpenses, setAnnualExpenses] = useState(720000);
    const [currentSavings, setCurrentSavings] = useState(2000000);
    const [annualInvestment, setAnnualInvestment] = useState(600000);
    const [expectedReturn, setExpectedReturn] = useState(12);
    const [annualIncome, setAnnualIncome] = useState(1500000);
    const [inv80c, setInv80c] = useState(100000);
    const [insurance, setInsurance] = useState(20000);
    const [hlInterest, setHlInterest] = useState(150000);
    const [nps80ccd, setNps80ccd] = useState(0);

    // FIRE
    const fireCorpus = annualExpenses * 25;
    const gap = Math.max(0, fireCorpus - currentSavings);
    const r = expectedReturn / 100;
    let yearsToFI = 0;
    if (r > 0 && gap > 0) {
        let corpus = currentSavings;
        while (corpus < fireCorpus && yearsToFI < 100) {
            corpus = corpus * (1 + r) + annualInvestment;
            yearsToFI++;
        }
    }
    const fireStatus = yearsToFI <= 15 ? "good" : yearsToFI <= 25 ? "warn" : "bad";

    // ── TAX MODULE — Old Regime Slabs (correct slab-by-slab) ──
    // Slabs: 0–2.5L @0%, 2.5–5L @5%, 5–10L @20%, >10L @30%
    // After slab tax: +4% Health & Education Cess
    const calcTaxOldRegime = (income) => {
        if (income <= 0) return 0;
        let tax = 0;
        // Slab 1: 0 – 2,50,000 → 0%
        // Slab 2: 2,50,001 – 5,00,000 → 5%
        if (income > 250000) tax += (Math.min(income, 500000) - 250000) * 0.05;
        // Slab 3: 5,00,001 – 10,00,000 → 20%
        if (income > 500000) tax += (Math.min(income, 1000000) - 500000) * 0.20;
        // Slab 4: Above 10,00,000 → 30%
        if (income > 1000000) tax += (income - 1000000) * 0.30;
        // Add 4% Health & Education Cess on total slab tax
        return Math.round(tax * 1.04);
    };

    // ── Marginal slab rate on a given income level ──────────────────
    // Returns the rate that applies to the TOP rupee of that income.
    const getMarginalRate = (income) => {
        if (income > 1000000) return 0.30;
        if (income > 500000) return 0.20;
        if (income > 250000) return 0.05;
        return 0;
    };

    // ── Precise tax saving from adding 'extraDedn' on top of 'baseIncome' ──
    // Handles slab crossings correctly by computing delta-tax.
    const taxSavingFromDeduction = (baseIncome, extraDedn) => {
        if (extraDedn <= 0 || baseIncome <= 0) return 0;
        const before = calcTaxOldRegime(baseIncome);
        const after = calcTaxOldRegime(Math.max(0, baseIncome - extraDedn));
        return before - after;
    };

    const stdDeduction = 75000;                            // Old Regime standard deduction (updated ₹75,000)
    const dedn80c = Math.min(150000, inv80c);         // 80C: max ₹1.5L
    const dedn80d = Math.min(25000, insurance);      // 80D: max ₹25K
    const dednHL = Math.min(200000, hlInterest);     // 24(b) HL interest: max ₹2L
    const dedn80ccd1b = Math.min(50000, nps80ccd);       // 80CCD(1B) NPS: max ₹50K — SEPARATE from 80C

    // Tax Without Optimization = Gross − Standard Deduction only
    const grossAfterStd = Math.max(0, annualIncome - stdDeduction);
    const baseTax = calcTaxOldRegime(grossAfterStd);

    // Tax After All Deductions (80C + 80CCD(1B) + 80D + HL — all applied to grossAfterStd)
    const totalExtraDeductions = dedn80c + dedn80d + dednHL + dedn80ccd1b;
    const taxableIncome = Math.max(0, grossAfterStd - totalExtraDeductions);
    const optimizedTax = calcTaxOldRegime(taxableIncome);
    const taxSavings = baseTax - optimizedTax;

    // ── Marginal rate displayed = rate that applies to the TOP of current taxableIncome ──
    // This is the rate at which the NEXT rupee of income is taxed (or saved by deduction).
    const marginalRate = getMarginalRate(taxableIncome);

    // ── Gaps & potential savings — computed with slab-crossing delta ──
    const gap80c = Math.max(0, 150000 - inv80c);
    const gap80ccd = Math.max(0, 50000 - nps80ccd);

    // Additional 80C saving: applied on top of current taxableIncome
    const marginalSavings80c = taxSavingFromDeduction(taxableIncome, gap80c);
    // Additional 80CCD(1B) saving: applied after 80C gap is filled
    const incomeAfter80cGap = Math.max(0, taxableIncome - gap80c);
    const marginalSavings80ccd = taxSavingFromDeduction(incomeAfter80cGap, gap80ccd);

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 pb-10 flex flex-col items-stretch transition-colors duration-300 w-full fadeIn animate-in slide-in-from-bottom-2 ease-out">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {onBack && <Btn label="← Back" onClick={onBack} variant="ghost" color={PALETTE.muted} small />}
                <SectionHeader title="Advanced Planning" subtitle="FIRE calculator & tax optimization engine" color={MODULE_COLORS.advanced} />
            </div>
            <div className="flex gap-3 flex-wrap">
                {[{ id: "fire", label: "FIRE Planning" }, { id: "tax", label: "Tax Optimization" }].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${tab === t.id ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "fire" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl mx-auto mt-4">
                    <Card title="FIRE Variables">
                        <Input label="Annual Expenses (today)" value={annualExpenses} onChange={setAnnualExpenses} step={50000} />
                        <Input label="Current Investment Corpus" value={currentSavings} onChange={setCurrentSavings} step={100000} />
                        <Input label="Annual Investment" value={annualInvestment} onChange={setAnnualInvestment} step={50000} />
                        <Input label="Expected Annual Return" value={expectedReturn} onChange={setExpectedReturn} min={4} max={20} step={0.5} prefix="" suffix="%" />
                    </Card>
                    <Card>
                        <div className="flex flex-col items-center mb-6 mt-2">
                            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">FIRE Corpus Target</span>
                            <span className="text-5xl font-semibold tracking-tight text-gray-900 mb-2">{fmt(fireCorpus)}</span>
                            <div className="text-xs text-gray-500 font-medium mb-5">Based on 25× Annual Expenses Rule</div>
                            <Badge label={gap === 0 ? "FIRE Achieved!" : yearsToFI <= 15 ? "On Track" : yearsToFI <= 25 ? "Increase Investments" : "Needs Major Boost"} type={fireStatus === 'bad' ? 'warn' : fireStatus} />
                        </div>
                        <div className="flex flex-col gap-1 border-t border-gray-100 pt-4">
                            <StatRow label="Current Corpus" value={fmt(currentSavings)} />
                            <StatRow label="Gap to Target" value={fmt(gap)} color={gap > 0 ? PALETTE.amber : PALETTE.green} />
                            <StatRow label="Years to Independence" value={gap === 0 ? "Ready now" : `${yearsToFI} years`} color={fireStatus === "good" ? PALETTE.green : PALETTE.amber} border={false} />
                        </div>
                        <div className="mt-4">
                            <GaugeBar label="Progress to FIRE" value={currentSavings} max={fireCorpus} color="var(--accent-primary)" fmtFn={fmt} />
                        </div>
                    </Card>
                </div>
            )}

            {tab === "tax" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl mx-auto mt-4">
                    {/* INPUTS */}
                    <div className="flex flex-col gap-6">
                        <Card title="Income & Deduction Inputs">
                            <Input label="Annual Gross Income" value={annualIncome} onChange={setAnnualIncome} step={50000} />
                            <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl py-4 px-5 flex justify-between items-center mt-2 mb-4 transition-all">
                                <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Standard Deduction</span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">₹75,000 ⬡ Fixed</span>
                            </div>
                            <Input label="80C Investments (ELSS/PPF/EPF etc.)" value={inv80c} onChange={setInv80c} min={0} max={150000} step={5000} hint="Cap ₹1,50,000" />
                            <Input label="80CCD(1B) — NPS Contribution" value={nps80ccd} onChange={setNps80ccd} min={0} max={50000} step={5000} hint="Cap ₹50,000 (separate)" />
                            <Input label="80D — Health Insurance Premium" value={insurance} onChange={setInsurance} min={0} max={25000} step={2500} hint="Cap ₹25,000" />
                            <Input label="24(b) — Home Loan Interest" value={hlInterest} onChange={setHlInterest} min={0} max={200000} step={10000} hint="Cap ₹2,00,000" />
                        </Card>

                        {/* Slab Reference Card */}
                        <Card title="Old Regime Tax Slabs">
                            <div className="flex flex-col gap-3 mt-2">
                                {[
                                    ["₹0 – ₹2.5L", "0%", grossAfterStd > 0, taxableIncome <= 250000 && taxableIncome >= 0],
                                    ["₹2.5L – ₹5L", "5%", grossAfterStd > 250000, taxableIncome > 250000 && taxableIncome <= 500000],
                                    ["₹5L – ₹10L", "20%", grossAfterStd > 500000, taxableIncome > 500000 && taxableIncome <= 1000000],
                                    ["Above ₹10L", "30%", grossAfterStd > 1000000, taxableIncome > 1000000],
                                ].map(([range, rate, baseActive, optimActive]) => (
                                    <div key={range} className={`flex justify-between items-center p-4 rounded-xl border transition-all ${optimActive ? 'bg-indigo-50 border-indigo-200' : baseActive ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
                                        <span className={`text-sm font-semibold ${optimActive ? 'text-indigo-900' : baseActive ? 'text-amber-800' : 'text-gray-500'}`}>{range}</span>
                                        <div className="flex gap-4 items-center">
                                            {baseActive && !optimActive && <span className="text-[10px] text-amber-600 font-bold tracking-widest uppercase">Pre-Opt</span>}
                                            {optimActive && <span className="text-[10px] text-indigo-600 font-bold tracking-widest uppercase">Optimized</span>}
                                            <span className={`font-semibold text-sm ${optimActive ? 'text-indigo-600' : baseActive ? 'text-amber-600' : 'text-gray-400'}`}>{rate}</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="text-[11px] text-gray-500 text-center mt-4">
                                    + 4% Health & Education Cess applied on total slab tax
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* RESULTS */}
                    <div className="flex flex-col gap-6">
                        <Card>
                            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-8 mt-2">
                                <div className="flex flex-col">
                                    <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Total Tax Saved</span>
                                    <span className="text-4xl font-semibold text-emerald-600 tracking-tight">{fmt(taxSavings)}</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Marginal Rate</span>
                                    <span className="text-3xl font-semibold text-indigo-600 tracking-tight">{(marginalRate * 100).toFixed(0)}%</span>
                                    <span className="text-[11px] text-gray-500 font-medium">on ₹{(taxableIncome / 100000).toFixed(2)}L taxable</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6">
                                {/* Without Optimization */}
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                                    <div className="text-amber-800 font-semibold text-sm mb-4">Without Optimization</div>
                                    <StatRow label="Gross Income" value={fmt(annualIncome)} border={false} />
                                    <StatRow label="Less: Standard Deduction" value={`− ${fmt(stdDeduction)}`} color={PALETTE.green} border={false} />
                                    <StatRow label="Taxable Income" value={fmt(grossAfterStd)} color={PALETTE.amber} border={false} />
                                    <div className="border-t border-amber-200 mt-3 pt-3">
                                        <StatRow label="Tax (slab-wise)" value={fmt(baseTax)} border={false} />
                                    </div>
                                </div>

                                {/* With Optimization */}
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                                    <div className="text-emerald-800 font-semibold text-sm mb-4">After All Deductions</div>
                                    <StatRow label="Less: 80C" value={`− ${fmt(dedn80c)}`} color={PALETTE.green} border={false} />
                                    <StatRow label="Less: 80CCD(1B)" value={`− ${fmt(dedn80ccd1b)}`} color={PALETTE.green} border={false} />
                                    <StatRow label="Less: 80D & 24(b)" value={`− ${fmt(dedn80d + dednHL)}`} color={PALETTE.green} border={false} />
                                    <StatRow label="Net Taxable Income" value={fmt(taxableIncome)} color={PALETTE.amber} border={false} />
                                    <div className="border-t border-emerald-200 mt-3 pt-3">
                                        <StatRow label="Optimized Tax" value={fmt(optimizedTax)} color={PALETTE.green} border={false} />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Optimization Hints */}
                        <Card title="Optimization Opportunities">
                            <div className="flex flex-col gap-4">
                                {gap80c > 0 && (
                                    <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl">
                                        <div className="text-amber-800 font-semibold text-sm mb-3">80C Gap: {fmt(gap80c)} unused</div>
                                        <div className="text-sm text-amber-700/90 leading-relaxed">
                                            Invest {fmt(gap80c)} more in ELSS/PPF/EPF to save <strong className="text-emerald-700 font-semibold mx-1">{fmt(marginalSavings80c)}</strong> in tax (slab-accurate, incl. cess)
                                        </div>
                                    </div>
                                )}
                                {gap80ccd > 0 && (
                                    <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-xl">
                                        <div className="text-indigo-800 font-semibold text-sm mb-3">80CCD(1B) Gap: {fmt(gap80ccd)} unused</div>
                                        <div className="text-sm text-indigo-700/90 leading-relaxed">
                                            Contribute {fmt(gap80ccd)} to NPS to save <strong className="text-emerald-700 font-semibold mx-1">{fmt(marginalSavings80ccd)}</strong> in additional tax — separate from 80C
                                        </div>
                                    </div>
                                )}
                                {gap80c === 0 && gap80ccd === 0 && (
                                    <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl">
                                        <div className="text-emerald-800 font-semibold text-sm">✓ All major deductions fully utilized</div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
