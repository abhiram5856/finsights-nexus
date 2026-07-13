import { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Trash2,
    CreditCard,
    PieChart as PieChartIcon,
    List,
    IndianRupee,
    Loader2,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ChevronDown
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/formatCurrency';
import { Input, Select } from './modules/shared';

const CATEGORIES = [
    "Food", "Travel", "Shopping", "Bills", "Health", "Entertainment", "Transport", "EMI", "Subscriptions", "Other"
];

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6', '#64748B'];

export default function Expenses({ theme }) {
    const { selectedCurrency, getRate } = useCurrency();
    const currentRate = getRate(selectedCurrency);
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);

    // Form state
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [isAdding, setIsAdding] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const { user } = useAuth();

    const fetchExpenses = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/expenses/');
            setExpenses(res.data);
            setError(null);
        } catch (err) {
            console.error("Fetch expenses error:", err);
            setError("Failed to fetch expenses. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchExpenses();
        }
    }, [user]);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!description || !amount || Number(amount) <= 0) return;

        setIsAdding(true);
        try {
            await api.post('/expenses/', {
                description,
                amount: Number(amount) / currentRate,
                category,
                user_id: user.id
            });
            setDescription('');
            setAmount('');
            setCategory(CATEGORIES[0]);
            setSuccessMessage('Expense added successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
            await fetchExpenses();
        } catch (err) {
            console.error("Add expense error:", err);
            alert("Failed to add expense.");
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm("Are you sure you want to delete this expense?")) return;

        setIsDeleting(id);
        try {
            await api.delete(`/expenses/${id}`);
            await fetchExpenses();
        } catch (err) {
            console.error("Delete expense error:", err);
            alert("Failed to delete expense.");
        } finally {
            setIsDeleting(null);
        }
    };

    const totalSpent = useMemo(() => {
        return expenses.reduce((sum, exp) => sum + exp.amount, 0);
    }, [expenses]);

    const chartData = useMemo(() => {
        const distribution = {};
        expenses.forEach(exp => {
            distribution[exp.category] = (distribution[exp.category] || 0) + exp.amount;
        });
        return Object.entries(distribution).map(([name, value]) => ({ name, value }));
    }, [expenses]);

    if (isLoading && expenses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
                <Loader2 className="w-12 h-12 text-[var(--accent-primary)] animate-spin" />
                <p className="text-[var(--text-muted)] font-medium">Loading your expenses...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-10 animate-in fade-in duration-700 px-0 md:px-2">
            <div className="flex flex-col gap-1 md:gap-2 px-4 md:px-0">
                <h1 className="text-3xl md:text-4xl font-black text-[var(--text-main)] tracking-tight">Expenses</h1>
                <p className="text-[11px] md:text-[13px] text-[var(--text-muted)] font-medium flex items-center gap-2">
                    <CreditCard size={16} className="text-[var(--accent-primary)]" />
                    Track and manage your spending
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* Left Column: Form and KPI */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                    {/* Add Expense Card */}
                    <div className="bg-[var(--bg-card)] p-5 md:p-6 rounded-xl border border-[var(--border-color)] space-y-5 md:space-y-6">
                        <h2 className="text-base md:text-lg font-bold text-[var(--text-main)] flex items-center gap-3">
                            <Plus size={18} className="text-[var(--accent-primary)]" />
                            Add Expense
                        </h2>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <Input
                                label="Description"
                                type="text"
                                value={description}
                                onChange={setDescription}
                                placeholder="e.g. Weekly Groceries"
                                required
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label={`Amount (${selectedCurrency})`}
                                    type="number"
                                    value={amount}
                                    onChange={setAmount}
                                    placeholder="0.00"
                                    required
                                />
                                <Select
                                    label="Category"
                                    value={category}
                                    onChange={setCategory}
                                    options={CATEGORIES}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isAdding}
                                className="w-full bg-[var(--accent-primary)] text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 touch-target"
                            >
                                {isAdding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                {isAdding ? 'Adding...' : 'Add Expense'}
                            </button>
                        </form>
                    </div>

                    {/* Total Spent Card */}
                    <div className="bg-[var(--bg-card)] p-5 md:p-8 rounded-xl border border-[var(--border-color)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)]/5 rounded-full -mr-16 -mt-16 blur-2xl" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4 md:mb-6">
                                <div className="p-2.5 bg-[var(--accent-primary)]/10 rounded-xl text-[var(--accent-primary)]">
                                    <CreditCard size={18} />
                                </div>
                                <div className="px-3 py-1 bg-[var(--bg-primary)] text-[var(--text-muted)] rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider border border-[var(--border-color)]">
                                    Target: ₹80k
                                </div>
                            </div>

                            <p className="text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Monthly Spend</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-main)] tracking-tight">
                                {formatCurrency(totalSpent, selectedCurrency, currentRate)}
                            </h2>

                            <div className="flex items-center gap-2 mt-3 md:mt-4">
                                <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">+12.5%</span>
                                <span className="text-[10px] md:text-[11px] text-[var(--text-muted)] font-medium">vs last month</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Analytics and List */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="bg-[var(--bg-card)] p-5 md:p-8 rounded-2xl md:rounded-3xl border border-[var(--border-color)] flex flex-col h-[400px] md:h-[460px] transition-all duration-300 group">
                            <h3 className="text-[12px] md:text-[13px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-3 mb-6 md:mb-8">
                                <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg text-[var(--accent-primary)]">
                                    <PieChartIcon size={18} />
                                </div>
                                <span>Analysis</span>
                            </h3>
                            <div className="flex-1 w-full relative">
                                {chartData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height="80%">
                                            <PieChart>
                                                <Pie
                                                    data={chartData}
                                                    cx="50%"
                                                    cy="40%"
                                                    innerRadius={60}
                                                    outerRadius={85}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    stroke="none"
                                                    animationDuration={1500}
                                                >
                                                    {chartData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={COLORS[index % COLORS.length]}
                                                            className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                                                        />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    contentStyle={{
                                                        backgroundColor: 'var(--bg-card)',
                                                        borderColor: 'var(--border-color)',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                                                        padding: '12px'
                                                    }}
                                                    itemStyle={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: 'bold' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                            <p className="text-[18px] font-bold text-[var(--text-main)] tracking-tight">
                                                {formatCurrency(totalSpent, selectedCurrency, currentRate).split('.')[0]}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-center gap-3 mt-2 px-2">
                                            {chartData.slice(0, 3).map((entry, index) => (
                                                <div key={entry.name} className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{entry.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-[var(--text-muted)] font-medium italic opacity-50">
                                        No spending data yet
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Summary List Card */}
                        <div className="bg-[var(--bg-card)] p-5 md:p-8 rounded-2xl md:rounded-3xl border border-[var(--border-color)] flex flex-col h-[400px] md:h-[460px] transition-all duration-300">
                            <h3 className="text-[12px] md:text-[13px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-3 mb-6 md:mb-8">
                                <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg text-[var(--accent-primary)]">
                                    <List size={18} />
                                </div>
                                <span>Top Categories</span>
                            </h3>
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 md:space-y-6">
                                {([...chartData]).sort((a, b) => b.value - a.value).slice(0, 5).map((cat, idx) => (
                                    <div key={cat.name} className="group/cat flex flex-col gap-2">
                                        <div className="flex justify-between items-center text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                <span className="text-[var(--text-main)] opacity-90">{cat.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[var(--text-muted)] opacity-60 font-bold">{((cat.value / totalSpent) * 100).toFixed(0)}%</span>
                                                <span className="text-[var(--text-main)]">{formatCurrency(cat.value, selectedCurrency, currentRate)}</span>
                                            </div>
                                        </div>
                                        <div className="h-1 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000"
                                                style={{
                                                    width: `${(cat.value / totalSpent) * 100}%`,
                                                    backgroundColor: COLORS[idx % COLORS.length]
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Card */}
                    <div className="bg-[var(--bg-card)] p-4 md:p-8 rounded-2xl md:rounded-3xl border border-[var(--border-color)] space-y-6 md:space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[12px] md:text-[13px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-3">
                                <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg text-[var(--accent-primary)]">
                                    <List size={18} />
                                </div>
                                <span>Transitions</span>
                            </h3>
                            <div className="px-2.5 py-0.5 bg-[var(--bg-primary)] rounded-full border border-[var(--border-color)]">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] opacity-60">
                                    {expenses.length} Records
                                </span>
                            </div>
                        </div>
                        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                            <table className="w-full text-left min-w-[500px]">
                                <thead>
                                    <tr className="text-[var(--text-muted)] text-[9px] md:text-[10px] font-bold uppercase tracking-widest border-b border-[var(--border-color)]">
                                        <th className="pb-4 px-2 md:px-4">Detail</th>
                                        <th className="pb-4 px-2 md:px-4">Category</th>
                                        <th className="pb-4 px-2 md:px-4 text-right">Amount</th>
                                        <th className="pb-4 px-2 md:px-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map((exp) => (
                                        <tr key={exp.id} className="group hover:bg-[var(--bg-primary)]/50 transition-all border-b border-[var(--border-color)]/30 last:border-0 text-[12px] md:text-[13px]">
                                            <td className="py-3 md:py-4 px-2 md:px-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition-colors">{exp.description}</span>
                                                    <span className="text-[9px] md:text-[10px] text-[var(--text-muted)] opacity-50">
                                                        {new Date(exp.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 md:py-4 px-2 md:px-4">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wider border
                                                    ${exp.category === 'Food' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                        exp.category === 'Shopping' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                                                            exp.category === 'Bills' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                                                                'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20'}
                                                `}>
                                                    {exp.category}
                                                </span>
                                            </td>
                                            <td className="py-3 md:py-4 px-2 md:px-4 text-right font-bold text-[var(--text-main)] tabular-nums">
                                                {formatCurrency(exp.amount, selectedCurrency, currentRate)}
                                            </td>
                                            <td className="py-3 md:py-4 px-2 md:px-4 text-center">
                                                <button
                                                    onClick={() => handleDeleteExpense(exp.id)}
                                                    disabled={isDeleting === exp.id}
                                                    className="p-1 px-2 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                                >
                                                    {isDeleting === exp.id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
