import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
    Sparkles,
    ArrowRight,
    BarChart3,
    PieChart as PieChartIcon,
    Menu,
    X,
    TrendingUp,
    MessageSquareText,
    Target,
    Check
} from 'lucide-react';

export default function Landing() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    // Mouse Parallax Logic for Interactive Element
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        mouseX.set((clientX - innerWidth / 2) / (innerWidth / 2)); // -1 to 1
        mouseY.set((clientY - innerHeight / 2) / (innerHeight / 2)); // -1 to 1
    };

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // Springs for smooth movement
    const springConfig = { stiffness: 50, damping: 20 };
    const smoothX = useSpring(mouseX, springConfig);
    const smoothY = useSpring(mouseY, springConfig);

    // Layer Parallax Transforms for 3D UI
    const rotateX = useTransform(smoothY, [-1, 1], [15, -15]);
    const rotateY = useTransform(smoothX, [-1, 1], [-15, 15]);
    const translateZ1 = useTransform(smoothX, [-1, 1], [-20, 20]);
    const translateZ2 = useTransform(smoothY, [-1, 1], [-20, 20]);

    const fadeUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    // Ticker Data
    const tickers = [
        { sym: 'NVDA', price: '124.50', change: '+2.4%' },
        { sym: 'RELIANCE', price: '2940.10', change: '+1.2%' },
        { sym: 'AAPL', price: '189.20', change: '-0.5%' },
        { sym: 'TCS', price: '3820.00', change: '+0.8%' },
        { sym: 'MSFT', price: '420.15', change: '+1.1%' },
        { sym: 'HDFCBANK', price: '1640.25', change: '-1.2%' },
        { sym: 'BTC', price: '64,200', change: '+4.5%' },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-slate-800 overflow-x-hidden relative">
            
            {/* Global Glowing Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                        <TrendingUp className="text-emerald-500 w-6 h-6 md:w-8 md:h-8" />
                        <h1 className="text-lg md:text-2xl font-black tracking-tight uppercase mt-0.5 md:mt-1 text-white">
                            NEXUS
                        </h1>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#features" className="hover:text-slate-100 transition-colors">Features</a>
                        <a href="#pricing" className="hover:text-slate-100 transition-colors">Pricing</a>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={() => navigate('/login')} className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors">Log In</button>
                        <button onClick={() => navigate('/signup')} className="bg-slate-100 hover:bg-white text-slate-900 px-6 py-2 rounded-md text-sm font-semibold transition-all hover:scale-105 active:scale-95">
                            Get Started
                        </button>
                    </div>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 text-slate-400 hover:text-slate-100"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Live Ticker Tape */}
            <div className="w-full bg-slate-900 border-b border-slate-800 pt-20 overflow-hidden relative z-40 h-10 flex items-center">
                <motion.div 
                    animate={{ x: [0, -1000] }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="flex whitespace-nowrap gap-12 px-4"
                >
                    {[...tickers, ...tickers, ...tickers].map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-slate-300 font-bold">{t.sym}</span>
                            <span className="text-slate-500">{t.price}</span>
                            <span className={t.change.startsWith('+') ? "text-emerald-500" : "text-rose-500"}>
                                {t.change}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Hero Section */}
            <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden min-h-[85vh] flex items-center justify-center z-10">
                
                {/* Background Glows */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 md:px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                    
                    {/* Left Column: Text */}
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="text-left"
                    >
                        <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 md:mb-8 text-white leading-[1.05]">
                            Smarter Investment <br />
                            <span className="text-slate-500">For Everyone.</span>
                        </motion.h1>

                        <motion.p variants={fadeUp} className="text-base md:text-lg text-slate-400 font-normal mb-10 leading-relaxed max-w-lg">
                            Powerful AI tools and portfolio tracking that make professional-level investing simple and accessible for everyone.
                        </motion.p>

                        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start gap-4">
                            <button onClick={() => navigate('/signup')} className="w-full sm:w-auto bg-slate-100 hover:bg-white text-slate-900 px-8 py-4 rounded-md text-base font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                                Open Dashboard <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    </motion.div>

                    {/* Right Column: 3D Tilting Glassmorphic Dashboard */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative h-[400px] md:h-[500px] flex items-center justify-center hidden md:flex perspective-1000"
                        style={{ perspective: "1000px" }}
                    >
                        {/* Background Glow Core */}
                        <div className="absolute w-72 h-72 bg-emerald-500/10 rounded-full blur-[100px]" />

                        <motion.div 
                            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                            className="relative w-full max-w-2xl aspect-[16/10] rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-3xl shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* App Header (Internal) */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/50">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="h-2 w-12 bg-slate-700 rounded-full"></div>
                                    <div className="h-2 w-12 bg-slate-700 rounded-full"></div>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700"></div>
                            </div>
                            
                            {/* Dashboard Body */}
                            <div className="flex-1 flex p-4 gap-4">
                                {/* Left Sidebar - Asset List */}
                                <div className="w-1/3 flex flex-col gap-3">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Your Assets</div>
                                    {[
                                        { name: 'RELIANCE', chg: '+1.2%', up: true },
                                        { name: 'TCS', chg: '+0.8%', up: true },
                                        { name: 'HDFCBANK', chg: '-0.4%', up: false },
                                        { name: 'INFY', chg: '+2.1%', up: true },
                                    ].map((a, i) => (
                                        <div key={i} className="flex justify-between items-center bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/30">
                                            <div>
                                                <div className="text-[11px] font-bold text-slate-200">{a.name}</div>
                                                <div className="text-[9px] text-slate-500">Equity</div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                {/* Abstract price skeleton */}
                                                <div className="w-12 h-2.5 bg-slate-700/40 rounded-full mb-1"></div>
                                                <div className={`text-[9px] font-bold ${a.up ? 'text-emerald-400' : 'text-rose-400'}`}>{a.chg}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Right Main Content */}
                                <div className="flex-1 flex flex-col gap-4">
                                    {/* Top Stats */}
                                    <div className="flex gap-4">
                                        <div className="flex-1 bg-slate-800/40 p-3 rounded-xl border border-slate-700/30">
                                            <div className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">Total Net Worth</div>
                                            <div className="flex items-end justify-between">
                                                <div className="text-2xl font-black text-white tracking-widest opacity-80">₹•••••••</div>
                                                <div className="text-emerald-500 text-[10px] font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded mb-1">+12.4%</div>
                                            </div>
                                        </div>
                                        <div className="flex-1 bg-slate-800/40 p-3 rounded-xl border border-slate-700/30">
                                            <div className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">Day's Gain</div>
                                            <div className="flex items-end justify-between">
                                                <div className="text-2xl font-black text-emerald-400 tracking-widest opacity-80">+••••••</div>
                                                <div className="text-emerald-500 text-[10px] font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded mb-1">+3.2%</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Main Chart Area */}
                                    <div className="flex-1 bg-slate-950/60 rounded-xl border border-slate-800/80 relative overflow-hidden flex flex-col">
                                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                                        <svg viewBox="0 0 100 50" className="w-full h-full text-emerald-500 absolute bottom-0 left-0" preserveAspectRatio="none">
                                            <motion.path 
                                                d="M 0,50 L 0,35 C 20,30 30,40 50,20 C 70,0 80,15 100,5 L 100,50 Z" 
                                                fill="url(#chart-gradient)" 
                                            />
                                            <motion.path 
                                                d="M 0,35 C 20,30 30,40 50,20 C 70,0 80,15 100,5" 
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 2, ease: "easeOut", delay: 1 }}
                                            />
                                            <defs>
                                                <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-slate-950 border-t border-slate-900 relative z-10">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-slate-800 pb-8"
                    >
                        <div>
                            <span className="text-slate-500 font-mono text-xs uppercase tracking-widest mb-4 block">01 / Features</span>
                            <h2 className="text-3xl md:text-5xl font-black text-white">Everything you need</h2>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 text-left">
                        {[
                            {
                                icon: <BarChart3 className="text-emerald-400" size={24} />,
                                title: "Portfolio Tracker",
                                desc: "Connect your accounts and track your stocks, mutual funds, and crypto in one beautiful dashboard."
                            },
                            {
                                icon: <MessageSquareText className="text-emerald-400" size={24} />,
                                title: "AI Chat Assistant",
                                desc: "Ask our multi-agent AI anything about the markets. It researches real-time data, earnings, and news instantly."
                            },
                            {
                                icon: <Target className="text-emerald-400" size={24} />,
                                title: "Financial Planner",
                                desc: "Set life goals, manage your monthly budget, and get AI-driven advice on how to reach your retirement targets."
                            }
                        ].map((feature, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                whileHover={{ scale: 1.02, borderColor: '#334155' }}
                                className="p-8 bg-slate-900 border border-slate-800 rounded-lg transition-all group cursor-default shadow-lg"
                            >
                                <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-md flex items-center justify-center mb-6">
                                    {feature.icon}
                                </div>
                                <h4 className="text-lg md:text-xl font-bold mb-3 text-slate-100">{feature.title}</h4>
                                <p className="text-sm md:text-base text-slate-400 font-normal leading-relaxed">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-slate-950 border-t border-slate-900 relative z-10">
                 <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <span className="text-slate-500 font-mono text-xs uppercase tracking-widest mb-4 block">02 / Pricing</span>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Simple, transparent pricing</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">Start for free, upgrade when you need more power.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Free Tier */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="p-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col"
                        >
                            <h3 className="text-xl font-bold text-white mb-2">Basic</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-white">₹0</span>
                                <span className="text-slate-500 text-sm">/month</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={18} className="text-emerald-500 shrink-0"/> Track up to 5 assets</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={18} className="text-emerald-500 shrink-0"/> Basic AI Chat (50 msgs/mo)</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={18} className="text-emerald-500 shrink-0"/> End-of-day market data</li>
                            </ul>
                            <button onClick={() => navigate('/signup')} className="w-full py-3 rounded-lg font-bold border border-slate-700 hover:bg-slate-800 text-white transition-colors">Start Free</button>
                        </motion.div>

                        {/* Pro Tier */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="p-8 bg-slate-900 border-2 border-emerald-500/50 rounded-2xl flex flex-col relative shadow-[0_0_30px_rgba(16,185,129,0.1)] scale-105"
                        >
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Most Popular</div>
                            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-white">₹499</span>
                                <span className="text-slate-500 text-sm">/month</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={18} className="text-emerald-500 shrink-0"/> Unlimited asset tracking</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={18} className="text-emerald-500 shrink-0"/> Advanced AI Agent Access</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={18} className="text-emerald-500 shrink-0"/> Real-time market data</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={18} className="text-emerald-500 shrink-0"/> Advanced Financial Planner</li>
                            </ul>
                            <button onClick={() => navigate('/signup')} className="w-full py-3 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">Upgrade to Pro</button>
                        </motion.div>

                        {/* Wealth Tier */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="p-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col"
                        >
                            <h3 className="text-xl font-bold text-white mb-2">Wealth</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-white">₹1499</span>
                                <span className="text-slate-500 text-sm">/month</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={18} className="text-emerald-500 shrink-0"/> Everything in Pro</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={18} className="text-emerald-500 shrink-0"/> Direct Broker Integrations</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={18} className="text-emerald-500 shrink-0"/> API Access for Algos</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={18} className="text-emerald-500 shrink-0"/> 1-on-1 Wealth Advisor calls</li>
                            </ul>
                            <button onClick={() => navigate('/signup')} className="w-full py-3 rounded-lg font-bold border border-slate-700 hover:bg-slate-800 text-white transition-colors">Contact Sales</button>
                        </motion.div>
                    </div>
                 </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 bg-slate-950 border-t border-slate-900 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="max-w-4xl mx-auto px-4 md:px-6 text-center"
                >
                    <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight text-white">
                        Take control of your financial future.
                    </h2>
                    <p className="text-lg text-slate-400 font-normal mb-12">
                        Professional investing tools, designed for everyday investors.
                    </p>
                    <button onClick={() => navigate('/signup')} className="bg-slate-100 hover:bg-white text-slate-900 px-10 py-4 rounded-md text-lg font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto group shadow-xl">
                        Create Free Account <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            </section>

            <footer className="py-8 border-t border-slate-800 bg-slate-950 text-center relative z-10">
                <p className="text-slate-600 font-mono text-xs uppercase tracking-widest">© 2026 NEXUS SYSTEMS. ALL RIGHTS RESERVED.</p>
            </footer>
        </div>
    );
}
