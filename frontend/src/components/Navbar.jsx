import { Bell, Sun, Moon, Globe, LogOut, Menu } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ theme, toggleTheme, toggleSidebar, onStockSelect }) {
    const { selectedCurrency, setSelectedCurrency, supportedCurrencies } = useCurrency();
    const { user, signOut } = useAuth();

    // Get initials from user name or email
    const getInitials = () => {
        if (!user) return '??';
        const name = user.user_metadata?.full_name || user.email;
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const getUserName = () => {
        if (!user) return 'Guest';
        return user.user_metadata?.full_name || user.email.split('@')[0];
    };

    return (
        <nav className="h-16 bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 md:px-8 flex items-center justify-between transition-colors duration-300 sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="md:hidden p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)]"
                    aria-label="Toggle menu"
                >
                    <Menu size={20} />
                </button>
                <div className="hidden md:flex flex-1 max-w-xl">
                </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
                <div className="relative group/currency">
                    <button
                        className="px-2 md:px-3 py-1.5 rounded-lg text-[var(--text-main)] hover:bg-[var(--bg-primary)] transition-all duration-200 font-semibold border border-[var(--border-color)] flex items-center gap-1.5 md:gap-2"
                        aria-label="Select currency"
                    >
                        <Globe size={14} className="text-[var(--text-muted)]" />
                        <span className="text-[11px] md:text-[13px] uppercase tracking-wide">{selectedCurrency}</span>
                    </button>
                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl opacity-0 invisible group-hover/currency:opacity-100 group-hover/currency:visible transition-all duration-200 z-50 overflow-hidden">
                        <div className="py-1 max-h-64 overflow-y-auto no-scrollbar">
                            {supportedCurrencies.map((currency) => (
                                <button
                                    key={currency.code}
                                    onClick={() => setSelectedCurrency(currency.code)}
                                    className={`w-full px-4 py-2.5 text-left text-[13px] hover:bg-[var(--bg-primary)] transition-colors flex items-center justify-between ${selectedCurrency === currency.code ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/5 font-bold' : 'text-[var(--text-main)] font-medium'}`}
                                >
                                    <span>{currency.name}</span>
                                    <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold">{currency.code}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="hidden sm:block h-4 w-px bg-[var(--border-color)] mx-1 opacity-50"></div>

                <div className="relative group/profile">
                    <div className="flex items-center gap-2 md:gap-3 px-1.5 md:pl-2 cursor-pointer group">
                        <div className="text-right hidden lg:block">
                            <p className="text-[13px] font-bold text-[var(--text-main)] truncate max-w-[150px] tracking-tight">
                                {getUserName()}
                            </p>
                        </div>
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] font-bold text-[10px] md:text-[11px] border border-[var(--accent-primary)]/20 shadow-lg shadow-[var(--accent-primary)]/5 transition-transform group-hover:scale-105">
                            {getInitials()}
                        </div>
                    </div>

                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 z-50 overflow-hidden">
                        <div className="py-1">
                            <button
                                onClick={signOut}
                                className="w-full px-4 py-2.5 text-left text-[13px] hover:bg-rose-500/5 hover:text-rose-500 text-[var(--text-main)] font-semibold transition-colors flex items-center gap-3 group/btn"
                            >
                                <LogOut size={14} className="text-[var(--text-muted)] group-hover/btn:text-rose-500" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
