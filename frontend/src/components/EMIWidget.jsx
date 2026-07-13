import React, { useState, useEffect, useRef } from 'react';
import { Calculator, X, IndianRupee, PieChart, AlertCircle } from 'lucide-react';
import { Input } from '../pages/modules/shared';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/formatCurrency';

export default function EMIWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [income, setIncome] = useState(150000);
    const [existingEmi, setExistingEmi] = useState(15000);
    const [proposedEmi, setProposedEmi] = useState(25000);
    const modalRef = useRef(null);
    const { selectedCurrency, getRate } = useCurrency();
    const currentRate = getRate(selectedCurrency);

    // Live Ratio Calculation
    const totalEmi = Number(existingEmi) + Number(proposedEmi);
    const emiRatio = income > 0 ? (totalEmi / Number(income)) * 100 : 0;

    // Affordability Logic
    let statusColor = "text-emerald-500";
    let statusBg = "bg-emerald-500/10";
    let statusBorder = "border-emerald-500/20";
    let statusText = "Affordable (Optimal)";
    let progressColor = "bg-emerald-500";

    if (emiRatio > 50) {
        statusColor = "text-rose-500";
        statusBg = "bg-rose-500/10";
        statusBorder = "border-rose-500/20";
        statusText = "Risky (Over-Leveraged)";
        progressColor = "bg-rose-500";
    } else if (emiRatio > 35) {
        statusColor = "text-amber-500";
        statusBg = "bg-amber-500/10";
        statusBorder = "border-amber-500/20";
        statusText = "Moderate (Watch Caution)";
        progressColor = "bg-amber-500";
    }

    // Keyboard & Click Outside Listeners
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) setIsOpen(false);
        };
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Prevent scrolling behind the modal
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);


    return (
        <>
            {/* Floating Action Button (FAB) */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-8 right-8 z-[90] p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center ${isOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100'} bg-gradient-to-r from-indigo-600 to-purple-600 text-white border border-white/10 shadow-indigo-500/30 group`}
                aria-label="EMI Quick Check"
            >
                <Calculator size={24} className="group-hover:rotate-12 transition-transform duration-300" />

                {/* Ping Animation Backend */}
                <div className="absolute inset-0 rounded-full bg-indigo-500 opacity-20 animate-ping" />
            </button>

            {/* Modal Backdrop & Container */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
                    <div
                        ref={modalRef}
                        className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                                    <PieChart className="text-indigo-500" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-[var(--text-main)] tracking-tight">EMI Quick Check</h3>
                                    <p className="text-xs text-[var(--text-muted)] font-medium">Live Affordability Testing</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-[var(--border-color)] rounded-full transition-colors opacity-70 hover:opacity-100"
                            >
                                <X size={20} className="text-[var(--text-main)]" />
                            </button>
                        </div>

                        {/* Middle Content - Inputs */}
                        <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-5">
                                <Input
                                    label="Monthly Take-Home Income"
                                    type="number"
                                    step={1000}
                                    min={0}
                                    value={income}
                                    onChange={setIncome}
                                    autoFocus
                                    prefix={<IndianRupee size={16} className="text-slate-400" />}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Existing EMIs"
                                        type="number"
                                        min={0}
                                        value={existingEmi}
                                        onChange={setExistingEmi}
                                        prefix={<IndianRupee size={16} className="text-slate-400" />}
                                    />
                                    <Input
                                        label="Proposed EMI"
                                        type="number"
                                        min={0}
                                        value={proposedEmi}
                                        onChange={setProposedEmi}
                                        prefix={<IndianRupee size={16} className="text-slate-400" />}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Sticky Result Section */}
                        <div className="p-6 pt-5 bg-[var(--bg-primary)] border-t border-[var(--border-color)] mt-auto">
                            <div className="flex justify-between items-end mb-4">
                                <div className="space-y-1">
                                    <span className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold">Total Debt Burden</span>
                                    <h4 className="text-2xl font-black text-[var(--text-main)] transition-all">
                                        {formatCurrency(totalEmi, selectedCurrency, currentRate)}
                                        <span className="text-sm font-medium text-[var(--text-muted)] ml-1">/mo</span>
                                    </h4>
                                </div>
                                <div className="text-right">
                                    <h4 className={`text-3xl font-black ${statusColor} transition-colors tracking-tighter`}>
                                        {emiRatio.toFixed(1)}%
                                    </h4>
                                </div>
                            </div>

                            {/* Progress Bar Visualizer */}
                            <div className="h-2.5 w-full bg-[var(--border-color)] rounded-full overflow-hidden mb-4 relative">
                                <div
                                    className={`h-full ${progressColor} transition-all duration-500 ease-out`}
                                    style={{ width: `${Math.min(emiRatio, 100)}%` }}
                                />
                                {/* Danger Threshold Markers */}
                                <div className="absolute top-0 bottom-0 w-px bg-white/50 left-[35%] z-10" />
                                <div className="absolute top-0 bottom-0 w-px bg-white/50 left-[50%] z-10" />
                            </div>

                            {/* Status Badge */}
                            <div className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${statusBg} ${statusBorder}`}>
                                <AlertCircle size={18} className={statusColor} />
                                <span className={`text-sm font-bold ${statusColor}`}>{statusText}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
