/* eslint-disable react-refresh/only-export-components */

// ═══════════════════════════════════════════════════════════════
// CONSTANTS & ASSUMPTIONS
// ═══════════════════════════════════════════════════════════════
export const A = {
    indexFund: 12, largeCap: 11, multiCap: 13, midCap: 15, smallCap: 18,
    balanced: 9, debt: 7, inflation: 6,
    loanRate: { House: 8.5, Land: 9.5, Vehicle: 10.5, "Business Asset": 11.5 },
    maxEmiRatio: 0.35, emergencyMonths: 6,
};

export const FUND_LIST = [
    { key: "index", label: "Index Funds", return: A.indexFund },
    { key: "large", label: "Large Cap", return: A.largeCap },
    { key: "multi", label: "Multi Cap", return: A.multiCap },
    { key: "mid", label: "Mid Cap", return: A.midCap },
    { key: "small", label: "Small Cap", return: A.smallCap },
    { key: "balanced", label: "Balanced", return: A.balanced },
];

export const PALETTE = {
    bg: "var(--bg-primary)", surface: "var(--bg-card)", card: "var(--bg-card)",
    border: "var(--border-color)", accent: "#4F46E5", gold: "#F5C518",
    green: "var(--success)", red: "var(--danger)", amber: "#F59E0B",
    text: "var(--text-main)", muted: "var(--text-muted)", dim: "var(--text-muted)",
};

export const MODULE_COLORS = {
    invest: "#4F46E5", asset: "#4F46E5", insurance: "#4F46E5",
    credit: "#4F46E5", wealth: "#4F46E5", advanced: "#4F46E5",
    govschemes: "#4F46E5", emergency: "var(--warning)",
};

// ═══════════════════════════════════════════════════════════════
// MATH UTILITIES
// ═══════════════════════════════════════════════════════════════
export const fv = (monthly, rateAnnual, years) => {
    const r = rateAnnual / 100 / 12, n = years * 12;
    if (r === 0) return monthly * n;
    return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
};
export const calcEMI = (P, rAnnual, years) => {
    const r = rAnnual / 100 / 12, n = years * 12;
    if (r === 0) return P / n;
    return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
};
export const inflAdj = (v, y) => v / Math.pow(1 + A.inflation / 100, y);
export const blended = (alloc) => FUND_LIST.reduce((s, f) => s + (alloc[f.key] || 0) * f.return, 0) / 100;
export const fmt = (n) => {
    if (!isFinite(n) || isNaN(n)) return "₹0";
    const abs = Math.abs(n);
    const sign = n < 0 ? "-" : "";
    if (abs >= 1e7) return sign + "₹" + (abs / 1e7).toFixed(2) + " Cr";
    if (abs >= 1e5) return sign + "₹" + (abs / 1e5).toFixed(2) + " L";
    return sign + "₹" + Math.round(abs).toLocaleString("en-IN");
};
export const pct = (n) => (isFinite(n) ? n.toFixed(1) : "0.0") + "%";

export const RISK_ALLOC = {
    Low: { index: 35, large: 30, multi: 15, mid: 5, small: 0, balanced: 15 },
    Moderate: { index: 25, large: 20, multi: 20, mid: 20, small: 5, balanced: 10 },
    High: { index: 15, large: 10, multi: 20, mid: 25, small: 25, balanced: 5 },
};
export const SURPLUS_ALLOC = {
    Low: { index: 20, large: 20, multi: 10, mid: 5, small: 0, balanced: 45 },
    Moderate: { index: 35, large: 25, multi: 15, mid: 15, small: 5, balanced: 5 },
    High: { index: 30, large: 15, multi: 20, mid: 20, small: 15, balanced: 0 },
};

// ═══════════════════════════════════════════════════════════════
// SHARED UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════
export function Card({ children, title, accent, style = {} }) {
    return (
        <div
            className="bg-[var(--bg-card)] p-6 lg:p-8 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col gap-5 relative overflow-hidden"
            style={style}
        >
            {title && <h3 className="text-lg font-medium text-[var(--text-main)] tracking-tight relative z-10">{title}</h3>}
            <div className="relative z-10 flex flex-col gap-4">
                {children}
            </div>
        </div>
    );
}

export function Input({
    label, value, onChange, min, max, step,
    prefix, suffix,
    locked, hint, type = "text",
    placeholder, required, name
}) {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {(label || hint) && (
                <div className="flex justify-between items-center px-1">
                    {label && (
                        <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                            {label} {locked && <span className="text-amber-500 ml-1 tracking-normal lowercase font-semibold">⬡ fixed</span>}
                        </label>
                    )}
                    {hint && <span className="text-[11px] text-[var(--text-muted)] font-medium">{hint}</span>}
                </div>
            )}
            <div className={`
                flex items-center rounded-xl overflow-hidden border transition-all duration-200
                ${locked
                    ? 'bg-gray-50/80 dark:bg-slate-800/50 border-gray-200 dark:border-slate-800 opacity-70 cursor-not-allowed'
                    : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 focus-within:border-indigo-500 dark:focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:focus-within:ring-indigo-500/40 dark:shadow-inner'
                }
            `}>
                {prefix && (
                    <span className="pl-4 pr-3 text-gray-400 dark:text-slate-500 font-medium text-[15px] flex items-center justify-center">
                        {prefix}
                    </span>
                )}
                <input
                    type={type}
                    value={value}
                    name={name}
                    disabled={locked}
                    required={required}
                    placeholder={placeholder}
                    onChange={e => {
                        if (!onChange) return;
                        if (type === "number") {
                            // Only pass number if it's not empty string to allow clearing the input
                            onChange(e.target.value === '' ? '' : Number(e.target.value));
                        } else {
                            onChange(e.target.value);
                        }
                    }}
                    min={min} max={max} step={step}
                    className={`
                        flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-slate-200 
                        py-3 font-medium text-[15px] w-full
                        placeholder:text-gray-400 dark:placeholder:text-slate-500
                        ${!prefix ? 'pl-4' : ''} 
                        ${!suffix ? 'pr-4' : ''}
                    `}
                />
                {suffix && (
                    <span className="pr-4 pl-3 text-gray-400 dark:text-slate-500 font-medium text-[15px] flex items-center justify-center">
                        {suffix}
                    </span>
                )}
            </div>
        </div>
    );
}

export function Select({ label, value, onChange, options }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wide text-[var(--text-muted)] font-medium">{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)}
                className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] px-4 py-3 text-sm outline-none cursor-pointer focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all font-bold w-full"
            >
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

export function Slider({ label, value, onChange, min = 0, max = 100, color = PALETTE.accent }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label style={{ fontSize: 11, color: PALETTE.muted, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label>
                <span style={{ color, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>{value}%</span>
            </div>
            <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
                style={{ accentColor: color, width: "100%" }} />
        </div>
    );
}

export function Badge({ label, type = "neutral", size = "md" }) {
    const map = {
        good: { bg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/20" },
        warn: { bg: "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400", border: "border-amber-200 dark:border-amber-500/20" },
        bad: { bg: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-500/20" },
        info: { bg: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-500/20" },
        gold: { bg: "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400", border: "border-amber-200 dark:border-amber-500/20" },
        purple: { bg: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-500/20" },
        neutral: { bg: "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300", border: "border-gray-200 dark:border-slate-700" },
        dark: { bg: "bg-gray-900 dark:bg-slate-700 text-white", border: "border-gray-800 dark:border-slate-600" },
    };
    const s = map[type] || map.neutral;
    const sz = size === "lg" ? "px-4 py-1.5 text-sm" : "px-2.5 py-0.5 text-[11px]";
    return (
        <span className={`${s.bg} ${s.border} border rounded-full font-medium tracking-wide ${sz} inline-flex items-center justify-center whitespace-nowrap`}>
            {label}
        </span>
    );
}

export function StatRow({ label, value, color, border = true }) {
    return (
        <div className={`flex justify-between items-center py-2.5 ${border ? 'border-b border-[var(--border-color)]' : ''} w-full`}>
            <span className="text-sm text-[var(--text-muted)]">{label}</span>
            <span className="text-sm font-semibold tracking-tight" style={{ color: color || 'var(--text-main)' }}>{value}</span>
        </div>
    );
}

export function SectionHeader({ title, subtitle, icon }) {
    return (
        <div className="mb-6 w-full">
            <div className="flex items-center gap-3 mb-2">
                {icon && <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-sm">{icon}</div>}
                <div>
                    <h2 className="text-2xl font-semibold text-[var(--text-main)] tracking-tight m-0">{title}</h2>
                    {subtitle && <p className="text-sm text-[var(--text-muted)] mt-1 m-0">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
}

export function Btn({ label, onClick, variant = "primary", color, full, small, disabled }) {
    const baseClass = `font-medium rounded-xl transition-all inline-flex items-center justify-center text-center ${small ? 'px-4 py-2 text-sm' : 'px-6 py-3 text-[15px]'} ${full ? 'w-full' : 'w-auto'}`;

    let styleObj = {};
    if (variant === "primary") {
        styleObj = { background: PALETTE.accent, color: "#ffffff", border: "1px solid transparent" };
        if (disabled) styleObj.opacity = 0.5;
    } else if (variant === "ghost") {
        styleObj = { background: "#ffffff", color: "#374151", border: "1px solid #D1D5DB" };
    } else if (variant === "danger") {
        styleObj = { background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" };
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClass} ${disabled ? 'cursor-not-allowed hidden-hover' : 'hover:opacity-90 shadow-sm cursor-pointer'}`}
            style={styleObj}
        >
            {label}
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════
// CHART COMPONENTS
// ═══════════════════════════════════════════════════════════════
export function PieChart({ data, size = 160 }) {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) return <div style={{ width: size, height: size, borderRadius: "50%", background: PALETTE.surface }} />;
    const COLORS = ["#00E5A0", "#00D4FF", "#A78BFA", "#F59E0B", "#FB7185", "#60A5FA", "#34D399", "#F472B6"];
    let cum = 0;
    const slices = Object.entries(data).filter(([, v]) => v > 0).map(([label, value], i) => {
        const p = value / total, start = cum; cum += p;
        return { label, value, p, start, color: COLORS[i % COLORS.length] };
    });
    const r = size / 2 - 4, cx = size / 2, cy = size / 2;
    const arc = (start, end) => {
        const a1 = start * 2 * Math.PI - Math.PI / 2;
        const a2 = end * 2 * Math.PI - Math.PI / 2;
        return `M${cx},${cy} L${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} A${r},${r},0,${end - start > 0.5 ? 1 : 0},1,${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)} Z`;
    };
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", width: "100%" }}>
            <svg width={size} height={size}>
                {slices.map((s, i) => <path key={i} d={arc(s.start, s.start + s.p)} fill={s.color} stroke={PALETTE.card} strokeWidth={2} />)}
                <circle cx={cx} cy={cy} r={size * 0.22} fill={PALETTE.card} />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 120 }}>
                {slices.map((s, i) => {
                    const isIndex = s.label === 'Index' || s.label === 'Index Funds';
                    return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                            <span style={{ color: isIndex ? PALETTE.text : PALETTE.muted, fontSize: isIndex ? 14 : 12, fontWeight: isIndex ? 600 : 400, fontFamily: "'Outfit', sans-serif", flex: 1 }}>{s.label}</span>
                            <span style={{ color: PALETTE.text, fontSize: isIndex ? 14 : 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{s.value}%</span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

export function BarChart({ monthly, rate, years, color = PALETTE.green }) {
    const pts = [];
    const steps = Math.min(8, years);
    for (let i = 0; i <= steps; i++) {
        const y = Math.round((i / steps) * years);
        pts.push({ y, v: fv(monthly, rate, y) });
    }
    const max = pts[pts.length - 1].v || 1;
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 100, width: "100%" }}>
            {pts.map((p, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
                    <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "flex-end" }}>
                        <div style={{ width: "100%", background: color, height: `${Math.max(4, (p.v / max) * 100)}%`, borderRadius: "3px 3px 0 0" }} />
                    </div>
                    <span style={{ fontSize: 9, color: PALETTE.dim, fontFamily: "'JetBrains Mono', monospace" }}>{p.y}y</span>
                </div>
            ))}
        </div>
    );
}

export function GaugeBar({ label, value, max, color, fmt: fmtFn }) {
    const pctVal = Math.min(100, (value / max) * 100);
    return (
        <div className="flex flex-col gap-2 w-full mt-2 mb-2">
            <div className="flex justify-between items-end">
                <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">{label}</span>
                <span className="text-sm font-semibold text-[var(--text-main)]">{fmtFn ? fmtFn(value) : value}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-full">
                <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${pctVal}%`, background: color || PALETTE.accent }} />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// EMERGENCY FUND INTERFACE
// ═══════════════════════════════════════════════════════════════
export function EmergencyFundInterface({ expenses, savings, onReturn, onAdjust }) {
    const required = expenses * A.emergencyMonths;
    const gap = Math.max(0, required - savings);
    const months = expenses > 0 ? (savings / expenses).toFixed(1) : 0;
    const coverageOk = savings >= required;
    const monthlySave = gap > 0 ? Math.ceil(gap / 12) : 0;

    return (
        <div className="fadeIn flex flex-col gap-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex gap-4 items-start shadow-sm">
                <span className="text-2xl text-amber-600 mt-0.5">⚠</span>
                <div>
                    <div className="text-amber-800 font-medium text-sm mb-1">Emergency Fund Insufficient</div>
                    <div className="text-amber-700/90 text-sm leading-relaxed max-w-2xl">
                        You need {A.emergencyMonths} months of expenses as an emergency buffer before investing. Your current savings cover only <strong>{months} months</strong>.
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Card title="Emergency Fund Status" accent={PALETTE.red}>
                    <StatRow label="Monthly Expenses" value={fmt(expenses)} />
                    <StatRow label="Required (6 months)" value={fmt(required)} color={PALETTE.amber} />
                    <StatRow label="Current Savings" value={fmt(savings)} color={coverageOk ? PALETTE.green : PALETTE.red} />
                    <StatRow label="Coverage" value={`${months} months`} color={coverageOk ? PALETTE.green : PALETTE.red} />
                    <StatRow label="Gap" value={fmt(gap)} color={PALETTE.red} border={false} />
                </Card>
                <Card title="Recovery Plan" accent={PALETTE.amber}>
                    <div className="flex flex-col items-center justify-center py-5">
                        <div className="text-4xl font-semibold tracking-tight text-amber-600">₹{monthlySave.toLocaleString('en-IN')}</div>
                        <div className="text-gray-500 text-sm mt-2 font-medium">Save monthly for 12 months</div>
                    </div>
                    <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4">
                        <div className="text-amber-700 text-xs font-medium leading-relaxed">
                            💡 Park savings in a <strong>Liquid Fund or High-Interest Savings Account</strong> to earn ~6–7% while staying accessible.
                        </div>
                    </div>
                    <StatRow label="Risk Without Buffer" value="Very High" color={PALETTE.red} border={false} />
                </Card>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
                <Btn label="← Return to Module" onClick={onReturn} variant="ghost" color={PALETTE.accent} />
                <Btn label="I understand, continue anyway" onClick={onAdjust} variant="ghost" color={PALETTE.muted} />
            </div>
        </div>
    );
}

export function EmergencyAlert({ months, required, onView }) {
    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="text-xl mt-0.5 text-amber-600">⚠</div>
                <div>
                    <div className="text-amber-800 font-medium text-sm mb-1">Coverage gap detected</div>
                    <div className="text-sm text-amber-700/90 leading-relaxed max-w-xl">
                        You currently have {months} months of expenses saved. Building a 6-month buffer ({fmt(required)}) is recommended.
                    </div>
                </div>
            </div>
            <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                <button onClick={onView} className="bg-transparent border border-amber-300 text-amber-800 px-4 py-2 rounded-lg cursor-pointer text-sm font-medium whitespace-nowrap hover:bg-amber-100 transition-colors">
                    Review Details
                </button>
            </div>
        </div>
    );
}

// Global styles for FinPlan components
if (typeof document !== 'undefined') {
    const style = document.createElement("style");
    style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600&display=swap');
    input[type=range] { -webkit-appearance: none; width: 100%; height: 6px; background: var(--bg-primary); border-radius: 3px; outline: none; border: 1px solid var(--border-color); }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent-primary); cursor: pointer; border: 2px solid var(--bg-card); box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.1s; }
    input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.1); }
    select option { background: var(--bg-card); color: var(--text-main); font-weight: medium; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .fadeIn { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `;
    document.head.appendChild(style);
}
