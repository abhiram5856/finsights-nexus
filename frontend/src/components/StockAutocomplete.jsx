import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { INDIAN_STOCKS } from '../data/indianStocks';

const StockAutocomplete = forwardRef(({ onSelect, onChange, placeholder = "Search Indian stocks A-Z...", initialValue = '', className = '', inline = false, variant = 'dark', clearOnSelect = false, excludeSymbols = [] }, ref) => {
    const [query, setQuery] = useState(initialValue);
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const dropdownRef = useRef(null);

    useImperativeHandle(ref, () => ({
        close: () => setIsOpen(false)
    }));

    useEffect(() => {
        setQuery(initialValue);
    }, [initialValue]);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (onChange) onChange(val);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Local search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const timeoutId = setTimeout(() => {
            const q = query.toLowerCase();
            const filtered = INDIAN_STOCKS.filter(stock => 
                stock.name.toLowerCase().includes(q) || stock.symbol.toLowerCase().includes(q)
            ).filter(item => !excludeSymbols.includes(item.symbol)).slice(0, 20); // show top 20 matches
            
            setResults(filtered);
        }, 150);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleKeyDown = (e) => {
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && results.length > 0) {
                handleSelect(results[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const handleSelect = (stock) => {
        if (clearOnSelect) {
            setQuery('');
        } else {
            setQuery(stock.name);
        }
        setResults([]);
        setIsOpen(false);
        if (onSelect) onSelect(stock.symbol, stock);
    };

    const highlightMatch = (text, query) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === query.toLowerCase() ? (
                        <span key={i} className="text-[var(--accent-primary)] font-bold">{part}</span>
                    ) : part
                )}
            </span>
        );
    };

    const isWhite = variant === 'white';

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent-primary)] transition-colors" size={18} />
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    onClick={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] transition-all placeholder:text-[var(--text-muted)] text-[var(--text-main)] font-medium"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {query && (
                        <button type="button" onClick={() => setQuery('')} className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1">
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {isOpen && (
                <div className={`${inline ? 'relative mt-2 mb-2' : 'absolute top-full left-0 mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300'} 
                    ${isWhite ? 'bg-white' : 'bg-[var(--bg-card)]'} 
                    w-full border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden transition-all`}
                >
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-3">
                        {!query ? (
                            <div>
                                <p className={`text-[10px] font-black mb-3 px-1 uppercase tracking-widest ${isWhite ? 'text-slate-400' : 'text-[var(--text-muted)]'}`}>A-Z Indian Stocks Grid</p>
                                <div className="flex flex-wrap gap-2">
                                    {INDIAN_STOCKS.map(stock => (
                                        <button
                                            key={stock.symbol}
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleSelect(stock);
                                            }}
                                            className={`px-2.5 py-1.5 text-xs font-bold border rounded-xl transition-all text-left flex items-center gap-2 shadow-sm ${isWhite ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]' : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'}`}
                                        >
                                            {stock.name} 
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="divide-y divide-[var(--border-color)] -mx-3">
                                {results.map((stock, index) => (
                                    <button
                                        key={stock.symbol}
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleSelect(stock);
                                        }}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        className={`w-full group px-5 py-3.5 text-left flex items-center justify-between transition-all ${index === activeIndex
                                            ? (isWhite ? 'bg-slate-50' : 'bg-[var(--bg-primary)]')
                                            : 'bg-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isWhite
                                                ? (index === activeIndex ? 'bg-white text-[var(--accent-primary)] shadow-sm' : 'bg-slate-100 text-slate-400')
                                                : (index === activeIndex ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'bg-[var(--bg-primary)] text-[var(--text-muted)]')
                                                }`}>
                                                {stock.name[0]}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className={`text-sm font-bold truncate pr-2 ${isWhite ? 'text-slate-900' : 'text-[var(--text-main)]'}`}>
                                                    {highlightMatch(stock.name, query)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded transition-all ${index === activeIndex
                                            ? 'bg-[var(--accent-primary)] text-white'
                                            : (isWhite ? 'bg-slate-100 text-slate-500' : 'bg-[var(--bg-primary)] text-[var(--text-muted)]')
                                            }`}>
                                            {stock.symbol.replace('.NS', '')}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center space-y-2">
                                <Search size={22} className="text-[var(--text-muted)] opacity-20 mx-auto" />
                                <p className={`text-xs font-medium ${isWhite ? 'text-slate-400' : 'text-[var(--text-muted)]'}`}>
                                    No Indian stocks found for "{query}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

export default StockAutocomplete;
