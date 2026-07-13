import React, { useState } from "react";
import {
    fmt, PALETTE, MODULE_COLORS,
    Card, Input, Badge, StatRow, SectionHeader, Btn
} from "./shared";

// ═══════════════════════════════════════════════════════════════
// INSURANCE PLANNING MODULE
// ═══════════════════════════════════════════════════════════════
export default function InsurancePlanning({ onBack }) {
    const [age, setAge] = useState(32);
    const [annualIncome, setAnnualIncome] = useState(1200000);
    const [dependents, setDependents] = useState(2);
    const [loans, setLoans] = useState(5000000);
    const [existingTerm, setExistingTerm] = useState(5000000);
    const [existingHealth, setExistingHealth] = useState(300000);
    const [members, setMembers] = useState(4);
    const [parentAge, setParentAge] = useState(62);

    // Term insurance: recommended = 15× income + loans (industry standard upper band)
    // Display range 10–15× for context
    const termLow = (annualIncome * 10) + loans;
    const termHigh = (annualIncome * 15) + loans;
    const recommendedTerm = termHigh; // Use 15× as the recommendation
    const termGap = Math.max(0, recommendedTerm - existingTerm);

    // Health insurance: ₹8–10L per adult (non-metro baseline ₹8L, metro ₹10L)
    // Using ₹800,000 per adult as the base recommendation
    const healthPerAdult = 800000;
    const recommendedHealth = Math.max(healthPerAdult, members * healthPerAdult);
    const healthGap = Math.max(0, recommendedHealth - existingHealth);

    // Senior health: trigger if parent ≥ 60
    const needSeniorHealth = parentAge >= 60;
    const seniorHealthRecommended = needSeniorHealth ? 500000 : 0; // dedicated senior floater

    // Child protection: dependent minors (assume dependents under age of policyholder means minors)
    // If user has dependents and is < 55 (working age), child protection is relevant
    const childRisk = dependents > 0 && age < 55;

    // Scoring: start at 100, deduct for each gap
    const overallScore = Math.max(0,
        100
        - (termGap > 0 ? 25 : 0)                                    // missing term cover
        - (healthGap > 0 ? 20 : 0)                                   // missing health cover
        - (needSeniorHealth ? 15 : 0)                                 // senior always needs separate cover
        - (childRisk && existingTerm < termLow ? 10 : 0)             // child not protected adequately
    );
    const scoreType = overallScore >= 80 ? "good" : overallScore >= 55 ? "warn" : "bad";

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 pb-10 flex flex-col items-stretch transition-colors duration-300 w-full fadeIn animate-in slide-in-from-bottom-2 ease-out">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {onBack && <Btn label="← Back" onClick={onBack} variant="ghost" color={PALETTE.muted} small />}
                <SectionHeader title="Insurance Planning" subtitle="Gap analysis & optimal coverage recommendation" color={MODULE_COLORS.insurance} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl mx-auto">
                {/* Top Row */}
                <Card title="Personal Details">
                    <div className="flex flex-col gap-4 py-2">
                        <Input label="Age" value={age} onChange={setAge} min={18} max={70} step={1} prefix="" suffix="Years" />
                        <Input label="Annual Income" value={annualIncome} onChange={setAnnualIncome} step={100000} />
                        <Input label="Dependents" value={dependents} onChange={setDependents} min={0} max={10} step={1} prefix="" suffix="Members" />
                        <Input label="Outstanding Loans" value={loans} onChange={setLoans} step={100000} />
                    </div>
                </Card>

                <Card title="Existing Coverage">
                    <div className="flex flex-col gap-4 py-2">
                        <Input label="Existing Term Coverage" value={existingTerm} onChange={setExistingTerm} step={500000} />
                        <Input label="Existing Health Coverage" value={existingHealth} onChange={setExistingHealth} step={100000} />
                        <Input label="Family Members to Cover" value={members} onChange={setMembers} min={1} max={10} step={1} prefix="" suffix="People" />
                        <Input label="Elder Parent Age" value={parentAge} onChange={setParentAge} min={50} max={90} step={1} prefix="" suffix="Years" />
                    </div>
                </Card>

                {/* Bottom Row */}
                <Card title="⭐ Risk Assessment">
                    <div className="flex flex-col gap-5 py-2 mt-2">
                        <div className="flex justify-between items-center pb-5 border-b border-gray-100/10">
                            <span className="text-sm text-gray-400 font-medium">Term Insurance Gap</span>
                            <Badge label={termGap > 0 ? `Undercovered by ${fmt(termGap)}` : "Adequate cover"} type={termGap > 0 ? "bad" : "good"} />
                        </div>
                        <div className="flex justify-between items-center pb-5 border-b border-gray-100/10">
                            <span className="text-sm text-gray-400 font-medium">Health Insurance Gap</span>
                            <Badge label={healthGap > 0 ? `Need ${fmt(healthGap)} more` : "Adequate cover"} type={healthGap > 0 ? "bad" : "good"} />
                        </div>
                        <div className="flex justify-between items-center pb-5 border-b border-gray-100/10">
                            <span className="text-sm text-gray-400 font-medium">Senior Parent Health</span>
                            <Badge label={needSeniorHealth ? `Dedicated senior plan needed (${parentAge}+)` : "N/A"} type={needSeniorHealth ? "warn" : "neutral"} />
                        </div>
                        <div className="flex justify-between items-center pb-5 border-b border-gray-100/10">
                            <span className="text-sm text-gray-400 font-medium">Child Protection Risk</span>
                            <Badge label={childRisk ? "Minor dependents require adequate term cover" : "N/A"} type={childRisk && termGap > 0 ? "warn" : "neutral"} />
                        </div>

                        <div className="flex justify-between items-end mt-4 mb-2">
                            <span className="text-sm text-gray-400 font-medium">Overall Protection Score</span>
                            <span className={`text-3xl font-bold tracking-tight ${scoreType === 'good' ? 'text-emerald-500' : scoreType === 'warn' ? 'text-amber-500' : 'text-rose-500'}`}>{overallScore}/100</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5 mb-2 overflow-hidden">
                            <div className={`h-1.5 rounded-full ${scoreType === 'good' ? 'bg-emerald-500' : scoreType === 'warn' ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${overallScore}%` }}></div>
                        </div>

                        <div className={`mt-2 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold
                            ${scoreType === 'good' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                scoreType === 'warn' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                    'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                            {scoreType === "good" ? "✓ Well Protected" : scoreType === "warn" ? "⚠ Partial Coverage" : "🚨 Significant Gaps"}
                        </div>
                    </div>
                </Card>

                <Card title="⭐ Recommended Coverage">
                    <div className="flex flex-col gap-3 mt-4">
                        <div className="bbg-white dark:bg-gray-800/30 border border-gray-700/50 rounded-xl py-4 px-5 flex flex-col gap-1 transition-all">
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Term Insurance — 10-15× Income + Loans</div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400 font-medium">Range: {fmt(termLow)} - {fmt(termHigh)}</span>
                                <span className="text-emerald-400 font-bold text-sm tracking-wide">Rec: {fmt(recommendedTerm)}</span>
                            </div>
                        </div>

                        <StatRow label="Your Current Term Cover" value={fmt(existingTerm)} />
                        {termGap > 0 && <StatRow label="Term Gap" value={fmt(termGap)} color={PALETTE.red} border={false} />}

                        <div className="bg-white dark:bg-gray-800/30 border border-gray-700/50 rounded-xl py-4 px-5 flex flex-col gap-1 transition-all">
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Health Insurance — ₹8L-₹10L per adult</div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400 font-medium">{members} members × ₹8L base</span>
                                <span className="text-emerald-400 font-bold text-sm tracking-wide">Rec: {fmt(recommendedHealth)}</span>
                            </div>
                        </div>

                        <StatRow label="Your Current Health Cover" value={fmt(existingHealth)} />
                        {healthGap > 0 && <StatRow label="Health Gap" value={fmt(healthGap)} color={PALETTE.red} border={false} className="mb-4" />}

                        {needSeniorHealth && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 mt-4">
                                <div className="text-amber-500 font-bold text-sm mb-2 flex items-center gap-2">⚠ Senior Parent Cover Required</div>
                                <div className="text-[13px] text-amber-500/80 leading-relaxed font-medium">
                                    Parent aged {parentAge} (≥60). A dedicated senior citizen health plan of {fmt(seniorHealthRecommended)}+ is strongly recommended — separate from family floater.
                                </div>
                            </div>
                        )}

                        {childRisk && (
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5 mt-4">
                                <div className="text-purple-400 font-bold text-sm mb-2 flex items-center gap-2">Child Protection — Term Cover Adequacy</div>
                                <div className="text-[13px] text-purple-400/80 leading-relaxed font-medium">
                                    You have {dependents} minor dependent(s). Ensure your term cover of at minimum {fmt(termLow)} is in place to protect them if the primary earner is absent.
                                </div>
                            </div>
                        )}

                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 mt-6">
                            <div className="text-[10px] text-emerald-600/60 font-medium leading-relaxed grid grid-cols-[16px_1fr] gap-2">
                                <span>📐</span>
                                <div><span className="text-emerald-600/80 font-semibold">Formula:</span> Term = max(10×, 15×) × Annual Income + All Outstanding Loans</div>
                                <span>🏥</span>
                                <div><span className="text-emerald-600/80 font-semibold">Health:</span> ₹8L per adult (non-metro) | ₹10-15L (metro recommended)</div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
