import React, { useState } from "react";
import {
    fmt, PALETTE, MODULE_COLORS,
    Card, Input, Badge, StatRow, SectionHeader, Btn, Select
} from "./shared";

// ═══════════════════════════════════════════════════════════════
// LOCAL COMPONENTS
// ═══════════════════════════════════════════════════════════════
const SchemeCard = ({ icon, title, tags, specs, accordions, disabled, disabledMsg }) => {
    const [expandedAll, setExpandedAll] = useState(false);
    const [openSections, setOpenSections] = useState({});

    const toggleSection = (idx) => {
        setOpenSections(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const toggleAll = () => {
        const nextState = !expandedAll;
        setExpandedAll(nextState);
        const newOpen = {};
        if (accordions) {
            accordions.forEach((_, i) => newOpen[i] = nextState);
        }
        setOpenSections(newOpen);
    };

    return (
        <Card className={`!p-5 ${disabled ? 'opacity-80' : ''}`}>
            {/* Top Section */}
            <div className="flex items-center gap-3.5 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl border border-gray-100 shrink-0">
                    {icon}
                </div>
                <div>
                    <h3 className="text-[17px] font-bold text-gray-900 tracking-tight leading-none mb-1.5">{title}</h3>
                    <div className="flex flex-wrap gap-1.5">
                        {tags.map((t, i) => <Badge key={i} label={t.label} type={t.type} />)}
                    </div>
                </div>
            </div>

            {disabled ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium px-4 py-4 rounded-xl flex items-center gap-2 mt-4">
                    ⚠ {disabledMsg}
                </div>
            ) : (
                <>
                    {/* Core Specs */}
                    <div className="grid grid-cols-2 gap-4 pb-4">
                        {specs.slice(0, 2).map((s, i) => (
                            <div key={i}>
                                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">{s.label}</div>
                                <div className="font-semibold text-gray-900 text-[15px] leading-tight">{s.value}</div>
                            </div>
                        ))}
                    </div>
                    {specs[2] && (
                        <div className="pt-3 border-t border-gray-100 mb-1">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">{specs[2].label}</div>
                            <div className="font-medium text-gray-700 text-[13px]">{specs[2].value}</div>
                        </div>
                    )}

                    {/* Accordions */}
                    {accordions && accordions.length > 0 && (
                        <div className="mt-5 flex flex-col gap-2">
                            {accordions.map((acc, i) => (
                                <div key={i} className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden transition-all duration-300">
                                    <button
                                        onClick={() => toggleSection(i)}
                                        className="w-full text-left px-4 py-3 flex justify-between items-center outline-none hover:bg-gray-100 transition-colors"
                                    >
                                        <h4 className="text-[13px] font-semibold text-gray-800 flex items-center gap-2">
                                            <span className="text-gray-400 text-[10px] text-center w-2">{openSections[i] || expandedAll ? '▼' : '▶'}</span> {acc.title}
                                        </h4>
                                    </button>
                                    <div className={`grid transition-all duration-300 ease-in-out ${openSections[i] || expandedAll ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <div className="px-4 pb-4 pt-1">
                                                {acc.content}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* View Full Details Toggle */}
                    {accordions && accordions.length > 0 && (
                        <button
                            onClick={toggleAll}
                            className="w-full text-center text-[13px] font-bold text-indigo-600 hover:text-indigo-700 mt-4 py-2 hover:bg-indigo-50/50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                        >
                            {expandedAll ? "Collapse Details" : "View Full Details"}
                        </button>
                    )}
                </>
            )}
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════
// GOVERNMENT SCHEMES MODULE
// ═══════════════════════════════════════════════════════════════
export default function GovernmentSchemes({ onBack }) {
    const [ppfMonthly, setPpfMonthly] = useState(12500); // Max 1.5L/yr
    const [npsMonthly, setNpsMonthly] = useState(50000);
    const [ssyMonthly, setSsyMonthly] = useState(12500); // For girl child
    const [age, setAge] = useState(30);
    const [empType, setEmpType] = useState("Salaried");
    const [income, setIncome] = useState(800000);
    const [retAge, setRetAge] = useState(60);

    const [taxRegime, setTaxRegime] = useState("Old");
    const [used80c, setUsed80c] = useState(0);
    const [riskPref, setRiskPref] = useState("Moderate");

    const [hasChild, setHasChild] = useState("Yes");
    const [childGender, setChildGender] = useState("Girl");
    const [childAge, setChildAge] = useState(5);

    const headroom80c = Math.max(0, 150000 - used80c);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10 flex flex-col items-stretch transition-colors duration-300 w-full fadeIn animate-in slide-in-from-bottom-2 ease-out">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {onBack && <Btn label="← Back" onClick={onBack} variant="ghost" color={PALETTE.muted} small />}
                <SectionHeader title="Government Schemes" subtitle="Eligibility, caps & tax benefit analysis for government-backed instruments" color={MODULE_COLORS.govschemes} />
            </div>

            {/* TOP GRID: Profiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Personal Profile">
                    <Input label="Your Age" value={age} onChange={setAge} min={18} max={80} suffix="Years" prefix="" />
                    <Select
                        label="Employment Type"
                        value={empType}
                        onChange={setEmpType}
                        options={["Salaried", "Self-Employed", "Business"]}
                    />
                    <Input label="Annual Income" value={income} onChange={setIncome} step={100000} />
                    <Input label="Expected Retirement Age" value={retAge} onChange={setRetAge} min={40} max={70} suffix="Years" prefix="" />
                </Card>

                <Card title="Tax & Investment Profile">
                    <Select
                        label="Tax Regime"
                        value={taxRegime}
                        onChange={setTaxRegime}
                        options={["Old", "New"]}
                    />
                    <Input label="80C Already Used (EPF / LIC etc.)" value={used80c} onChange={setUsed80c} step={10000} hint="Enter existing 80C investments" />
                    <Select
                        label="Risk Preference"
                        value={riskPref}
                        onChange={setRiskPref}
                        options={["Low", "Moderate", "High"]}
                    />
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">80C Utilisation</span>
                            <span className="text-sm font-semibold text-emerald-600">{fmt(used80c)} / ₹1.50 L</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
                            <div className="h-full rounded-full transition-all duration-500 ease-out bg-emerald-500" style={{ width: `${Math.min(100, (used80c / 150000) * 100)}%` }} />
                        </div>
                        <div className="text-xs text-emerald-600 font-medium mt-2">{fmt(headroom80c)} available headroom</div>
                    </div>
                </Card>

                <Card title="Child Details (SSY)">
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-xs uppercase tracking-wide text-gray-500 font-medium">Do you have a child?</label>
                        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-full">
                            {["Yes", "No"].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setHasChild(opt)}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center ${hasChild === opt ? 'bg-white dark:bg-slate-700 shadow-sm text-[var(--text-main)]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                    {hasChild === "Yes" && (
                        <>
                            <Select
                                label="Child Gender"
                                value={childGender}
                                onChange={setChildGender}
                                options={["Girl", "Boy"]}
                            />
                            <Input label="Child Age" value={childAge} onChange={setChildAge} min={0} max={25} suffix="Years" prefix="" />
                            {childGender === "Girl" && childAge < 10 ? (
                                <div className="mt-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2">
                                    ✓ Eligible for Sukanya Samriddhi Yojana
                                </div>
                            ) : (
                                <div className="mt-2 bg-gray-50 border border-gray-200 text-gray-600 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2">
                                    Not eligible for SSY (Requires Girl Child &lt; 10 years)
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </div>

            <div className="text-xs tracking-widest text-gray-400 uppercase font-semibold pl-2">
                SCHEME ANALYSIS — {taxRegime.toUpperCase()} REGIME · {empType.toUpperCase()} · AGE {age}
            </div>

            {/* SCHEME CARDS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                <SchemeCard
                    icon="🏛"
                    title="PPF - Public Provident Fund"
                    tags={[
                        { label: "✓ Eligible", type: "good" },
                        { label: "Low Risk", type: "neutral" },
                        { label: "80C Eligible", type: "info" }
                    ]}
                    specs={[
                        { label: "Max Contribution", value: "₹1.50 L / year" },
                        { label: "Lock-in", value: "15 years" },
                        { label: "Maturity", value: "Matures after 15 years" }
                    ]}
                    accordions={[
                        {
                            title: "Key Features",
                            content: (
                                <ul className="text-[13px] text-gray-600 font-medium space-y-2 m-0 pl-1 list-none relative">
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> Government-backed • Sovereign guarantee</li>
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> Interest compounded annually</li>
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> Minimum ₹500 / year to keep account active</li>
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> Partial withdrawal from Year 7</li>
                                </ul>
                            )
                        },
                        {
                            title: "Tax Details",
                            content: (
                                <div className="text-[13px] font-medium text-gray-700">
                                    {taxRegime === 'Old' ? `Qualifies under 80C — up to ${fmt(Math.min(150000, headroom80c))} additional deduction available in your headroom.` : 'No deduction available under New Regime, but interest and maturity remain tax-free.'}
                                </div>
                            )
                        }
                    ]}
                />

                <SchemeCard
                    icon="🏢"
                    title="EPF - Employees' Provident Fund"
                    tags={[
                        { label: empType === 'Salaried' ? "✓ Eligible" : "✗ Ineligible", type: empType === 'Salaried' ? "good" : "neutral" },
                        { label: "Retirement", type: "neutral" },
                        { label: "80C Eligible", type: "info" }
                    ]}
                    specs={[
                        { label: "Max Contribution", value: "12% of Basic Salary" },
                        { label: "Lock-in", value: "Till age 58" },
                        { label: "Maturity", value: `Continues till retirement • ${Math.max(0, 58 - age)} years remaining` }
                    ]}
                    accordions={[
                        {
                            title: "Contribution Structure",
                            content: (
                                <ul className="text-[13px] text-gray-600 font-medium space-y-2 m-0 pl-1 list-none relative">
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> Employee: 12% of Basic Salary → EPF</li>
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> Employer: 3.67% → EPF • 8.33% → EPS</li>
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> Mandatory deduction — not an optional investment</li>
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> UAN (Universal Account Number) is portable</li>
                                </ul>
                            )
                        },
                        {
                            title: "Tax Details",
                            content: (
                                <div className="text-[13px] font-medium text-gray-700">
                                    {taxRegime === 'Old' ? 'Employee contribution (up to ₹1.5L) qualifies under 80C.' : 'No deduction available under New Regime.'}
                                </div>
                            )
                        }
                    ]}
                />

                <SchemeCard
                    icon="🎯"
                    title="NPS - National Pension System"
                    tags={[
                        { label: "✓ Eligible", type: "good" },
                        { label: "Moderate Risk", type: "warn" },
                        { label: "80CCD(1B) Eligible", type: "info" }
                    ]}
                    specs={[
                        { label: "Max Contribution", value: "No upper cap" },
                        { label: "Lock-in", value: "Till age 60" },
                        { label: "Maturity", value: "60% lump sum (tax-free) + 40% annuity" }
                    ]}
                    accordions={[
                        {
                            title: "Deduction Structure",
                            content: (
                                <ul className="text-[13px] text-gray-600 font-medium space-y-2 m-0 pl-1 list-none relative">
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> 80C (₹1.5L cap): Tier 1 contribution counts</li>
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> 80CCD(1B) (₹50K): SEPARATE additional deduction</li>
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> Equity allocation: 0-75% (auto-reducing with age)</li>
                                </ul>
                            )
                        },
                        {
                            title: "Tax Details",
                            content: (
                                <div className="text-[13px] font-medium text-gray-700">
                                    {taxRegime === 'Old' ? '₹50,000 deduction under 80CCD(1B) — SEPARATE from 80C limit.' : 'Corporate NPS employer contribution is deductible.'}
                                </div>
                            )
                        }
                    ]}
                />

                <SchemeCard
                    icon="🥇"
                    title="SGB - Sovereign Gold Bonds"
                    tags={[
                        { label: "✓ Eligible", type: "good" },
                        { label: "Market Risk", type: "warn" },
                        { label: "Tax-Free Maturity", type: "info" }
                    ]}
                    specs={[
                        { label: "Max Contribution", value: "4 kg / year" },
                        { label: "Lock-in", value: "8 years total" },
                        { label: "Maturity", value: "Redemption at prevailing gold price" }
                    ]}
                    accordions={[
                        {
                            title: "Key Features",
                            content: (
                                <ul className="text-[13px] text-gray-600 font-medium space-y-2 m-0 pl-1 list-none relative">
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> 2.5% p.a. fixed interest — paid semi-annually</li>
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> Returns linked to gold market price</li>
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> No making charges or storage risk</li>
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> Premature redemption allowed after 5th year</li>
                                </ul>
                            )
                        },
                        {
                            title: "Tax Details",
                            content: (
                                <div className="text-[13px] font-medium text-gray-700">
                                    Capital gains are tax-free if held to 8-year maturity. No 80C deduction applies. The 2.5% semi-annual interest is taxable as income.
                                </div>
                            )
                        }
                    ]}
                />

                <SchemeCard
                    icon="👧"
                    title="Sukanya Samriddhi Yojana"
                    disabled={!(hasChild === 'Yes' && childGender === 'Girl' && childAge < 10)}
                    disabledMsg={hasChild === "No" ? "No child details provided" : "Requires a girl child under the age of 10"}
                    tags={[
                        { label: (hasChild === 'Yes' && childGender === 'Girl' && childAge < 10) ? "✓ Eligible" : "✗ Not Eligible", type: (hasChild === 'Yes' && childGender === 'Girl' && childAge < 10) ? "good" : "bad" },
                        { label: "Low Risk", type: "neutral" },
                        { label: "80C Eligible", type: "info" }
                    ]}
                    specs={[
                        { label: "Max Contribution", value: "₹1.50 L / year" },
                        { label: "Lock-in", value: "15 years of contributions" },
                        { label: "Maturity", value: `Matures when girl turns 21 (at age ${Number(childAge) + 21})` }
                    ]}
                    accordions={[
                        {
                            title: "Key Features",
                            content: (
                                <ul className="text-[13px] text-gray-600 font-medium space-y-2 m-0 pl-1 list-none relative">
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> Minimum ₹250 / year • Maximum ₹1,50,000 / year</li>
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> Account matures 21 years from opening date (not at age 21)</li>
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> Partial withdrawal: 50% after girl turns 18 for education</li>
                                    <li className="flex gap-2 items-start"><span className="text-gray-400">›</span> Maximum 2 accounts per family</li>
                                </ul>
                            )
                        },
                        {
                            title: "Tax Details",
                            content: (
                                <div className="text-[13px] font-medium text-gray-700">
                                    {taxRegime === 'Old' ? 'Qualifies under 80C — maturity amount is completely tax-free.' : 'No deduction available under New Regime, but maturity is tax-free.'}
                                </div>
                            )
                        }
                    ]}
                />

            </div>

            {/* 80C Deduction Rule Footer */}
            <div className="bg-[var(--bg-primary)] border border-gray-200 rounded-2xl shadow-sm p-8 mt-4">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                    <span className="text-gray-900 text-xl font-bold">⚠ 80C Deduction Safety Rule</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-2">80C Total Cap</div>
                        <div className="font-semibold text-gray-900 text-2xl mb-1 text-emerald-600">₹1.50 L</div>
                        <div className="text-xs text-gray-500 font-medium tracking-wide">Shared across PPF + EPF + SSY + ELSS etc.</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-2">80CCD(1B) Cap</div>
                        <div className="font-semibold text-gray-900 text-2xl mb-1 text-purple-600">₹50,000</div>
                        <div className="text-xs text-gray-500 font-medium tracking-wide">NPS only • SEPARATE from 80C • not shared</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-2">Combined Max Deduction</div>
                        <div className="font-semibold text-gray-900 text-2xl mb-1 text-emerald-600">₹2.00 L</div>
                        <div className="text-xs text-gray-500 font-medium tracking-wide">80C (₹1.5L) + 80CCD(1B) (₹50K)</div>
                    </div>
                </div>
                <div className="mt-6 pt-5 border-t border-gray-100">
                    <p className="text-[13px] text-gray-600 font-medium leading-relaxed m-0">
                        PPF, EPF, SSY, and ELSS all share the same ₹1,50,000 Section 80C ceiling. NPS under 80CCD(1B) is a completely separate deduction — it does not count toward or reduce your 80C limit.
                    </p>
                </div>
            </div>

        </div>
    );
}
