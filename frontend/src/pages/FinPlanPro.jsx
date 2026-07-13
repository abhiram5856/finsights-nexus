import React, { useState } from 'react';
import {
    TrendingUp, Home, ShieldCheck, CreditCard,
    Wallet, Settings, Landmark, Calculator
} from 'lucide-react';

import LongTermInvest from './modules/LongTermInvest';
import AssetBuying from './modules/AssetBuying';
import InsurancePlanning from './modules/InsurancePlanning';
import CreditCardManager from './modules/CreditCardManager';
import WealthTracking from './modules/WealthTracking';
import AdvancedPlanning from './modules/AdvancedPlanning';
import GovernmentSchemes from './modules/GovernmentSchemes';

const FinPlanPro = () => {
    const [activeModule, setActiveModule] = useState('invest');

    const menuItems = [
        { id: 'invest', label: 'Long-Term Investing', icon: <TrendingUp size={20} />, color: 'border-emerald-500' },
        { id: 'asset', label: 'Liability Structuring', icon: <Home size={20} />, color: 'border-cyan-500' },
        { id: 'insurance', label: 'Insurance Planning', icon: <ShieldCheck size={20} />, color: 'border-indigo-500' },
        { id: 'credit', label: 'Credit Health', icon: <CreditCard size={20} />, color: 'border-orange-500' },
        { id: 'wealth', label: 'Wealth Analytics', icon: <Wallet size={20} />, color: 'border-rose-500' },
        { id: 'advanced', label: 'Advanced Planning', icon: <Settings size={20} />, color: 'border-blue-500' },
        { id: 'gov', label: 'Government Schemes', icon: <Landmark size={20} />, color: 'border-orange-600' },
    ];

    return (
        <div className="flex h-[calc(100vh-120px)] bg-slate-950 text-slate-200 rounded-2xl overflow-hidden border border-slate-800">
            {/* SIDEBAR */}
            <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <div className="bg-cyan-500 p-1.5 rounded-lg text-slate-900 font-black">₹</div>
                    <span className="font-bold text-white text-xl tracking-tight">FinPlan <span className="text-cyan-400 text-xs">PRO</span></span>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveModule(item.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all ${activeModule === item.id
                                ? 'bg-slate-800 text-cyan-400 border-l-4 ' + item.color
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800 m-4 bg-slate-800/50 rounded-2xl shrink-0">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">System Status</p>
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Real-time Logic Active
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 p-8 overflow-y-auto bg-[#070B14]">
                {activeModule === 'invest' && <LongTermInvest />}
                {activeModule === 'asset' && <AssetBuying />}
                {activeModule === 'insurance' && <InsurancePlanning />}
                {activeModule === 'credit' && <CreditCardManager />}
                {activeModule === 'wealth' && <WealthTracking />}
                {activeModule === 'advanced' && <AdvancedPlanning />}
                {activeModule === 'gov' && <GovernmentSchemes />}
            </main>
        </div>
    );
};

export default FinPlanPro;
