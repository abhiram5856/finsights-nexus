import { useState } from 'react';
import {
    LayoutDashboard,
    LineChart,
    Briefcase,
    PieChart,
    Calendar,
    Settings,
    TrendingUp,
    MessageCircle,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Home,
    ShieldCheck,
    Wallet,
    Landmark,
    ChevronDown,
    Eye,
    SlidersHorizontal,
    Newspaper
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar({ isOpen, setIsOpen, theme }) {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [openDropdown, setOpenDropdown] = useState('');

    const toggleDropdown = (name) => {
        if (!isOpen) setIsOpen(true);
        setOpenDropdown(prev => prev === name ? '' : name);
    };

    const menuItems = [
        { name: "Dashboard",    icon: <LayoutDashboard size={20} />, path: "/dashboard" },
        { name: "Stock Insights",icon: <LineChart size={20} />,       path: "/stockinsights" },
        { name: "Compare",       icon: <TrendingUp size={20} />,       path: "/compare" },
        { name: "Screener",      icon: <SlidersHorizontal size={20} />,path: "/screener" },
        { name: "Portfolio",     icon: <Briefcase size={20} />,        path: "/portfolio" },
        { name: "Watchlist",     icon: <Eye size={20} />,              path: "/watchlist" },
        { name: "News Feed",     icon: <Newspaper size={20} />,        path: "/news" },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={`fixed left-0 top-0 h-screen bg-[var(--sidebar-bg,var(--bg-card))] border-r border-[var(--border-color)] transition-all duration-300 z-50 flex flex-col 
                    ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 w-20'}
                    md:w-${isOpen ? '60' : '20'}
                `}
            >
                <div className={`h-16 flex items-center px-6 transition-all duration-300 ${isOpen ? 'justify-between' : 'justify-center'}`}>
                    <div className={`flex items-center gap-3 transition-opacity duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
                        <div className="w-8 h-8 bg-[var(--accent-primary)] rounded-lg flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/10">
                            <span className="text-white font-black text-xs">F</span>
                        </div>
                        <h1 className="text-[11px] font-bold tracking-[0.2em] text-[var(--text-main)] uppercase">
                            Nexus
                        </h1>
                    </div>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-1.5 rounded-md hover:bg-[var(--bg-primary)] text-[var(--text-muted)] transition-all duration-300 border border-[var(--border-color)] group"
                    >
                        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                    </button>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto no-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        const isDropdownOpen = openDropdown === item.name;

                        return (
                            <div key={item.name} className="relative">

                                <button
                                    onClick={() => {
                                        if (item.subItems) {
                                            toggleDropdown(item.name);
                                        } else {
                                            navigate(item.path);
                                            // Auto-close on mobile after navigation
                                            if (window.innerWidth < 768) setIsOpen(false);
                                        }
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                                        ${isActive && !item.subItems
                                            ? 'bg-[var(--accent-primary)]/5 text-[var(--text-main)]'
                                            : 'text-[var(--text-muted)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-main)]'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`${isActive ? 'text-[var(--accent-primary)]' : 'opacity-60 group-hover:opacity-100'} transition-all duration-200 flex-shrink-0`}>
                                            {item.icon}
                                        </span>
                                        <span className={`text-[13px] font-medium transition-all duration-300 whitespace-nowrap ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 overflow-hidden text-[0px]'}`}>
                                            {item.name}
                                        </span>
                                    </div>
                                    {isActive && !item.subItems && (
                                        <div className="absolute left-0 w-1 h-4 bg-[var(--accent-primary)] rounded-full -ml-1 shadow-[0_0_10px_var(--accent-primary)] opacity-40" />
                                    )}
                                    {item.subItems && isOpen && (
                                        <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    )}
                                </button>

                                {/* Dropdown Menu */}
                                {item.subItems && isDropdownOpen && isOpen && (
                                    <div className="mt-1 ml-4 pl-4 border-l border-[var(--border-color)] space-y-1">
                                        {item.subItems.map((subItem) => {
                                            const isSubActive = location.pathname === subItem.path;
                                            return (
                                                <button
                                                    key={subItem.name}
                                                    onClick={() => {
                                                        navigate(subItem.path);
                                                        if (window.innerWidth < 768) setIsOpen(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-[13px]
                                                        ${isSubActive
                                                            ? 'text-[var(--accent-primary)] font-semibold bg-[var(--accent-primary)]/5'
                                                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                                        }
                                                    `}
                                                >
                                                    <span className="whitespace-nowrap">{subItem.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[var(--border-color)]">
                    <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-primary)] transition-all duration-200 cursor-pointer group ${!isOpen && 'justify-center'}`}>
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/10 flex-shrink-0 flex items-center justify-center text-[var(--accent-primary)] font-bold text-xs border border-[var(--accent-primary)]/20">
                            {user?.user_metadata?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || user?.email?.[0].toUpperCase() || '??'}
                        </div>
                        {isOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-[var(--text-main)] truncate">
                                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest'}
                                </p>
                                <p className="text-[10px] text-[var(--text-muted)] font-medium">Pro Status</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
