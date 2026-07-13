import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, Chrome, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { Input } from './modules/shared';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { signIn, signInWithGoogle, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate("/dashboard", { replace: true });
        }
    }, [user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const { data, error: signInError } = await signIn({ email, password });
            if (signInError) throw signInError;

            // Check if email is confirmed
            if (!data.user?.email_confirmed_at) {
                navigate('/verify-email');
                return;
            }

            navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await signInWithGoogle();
            if (error) throw error;
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 matrix-bg matrix-fade opacity-30 pointer-events-none"></div>

            <div className="w-full max-w-md space-y-6 md:space-y-8 relative z-10">
                <div className="text-center space-y-4 md:space-y-6">
                    <div className="flex items-center justify-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-[#18181b] border border-zinc-800 rounded-xl flex items-center justify-center shadow-lg">
                            <TrendingUp size={20} md:size={22} className="text-zinc-100" />
                        </div>
                        <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase mt-1">
                            NEXUS
                        </h1>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Welcome Back</h2>
                        <p className="text-sm md:text-base text-zinc-400 font-medium">Sign in to your account to continue</p>
                    </div>
                </div>

                <div className="bg-[#18181b]/80 backdrop-blur-2xl border border-zinc-800 rounded-3xl md:rounded-[40px] p-6 md:p-8 shadow-2xl space-y-6 md:space-y-8">
                    <form onSubmit={handleLogin} className="space-y-5 md:space-y-6">
                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-[11px] md:text-xs font-bold animate-in shake duration-300">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4 md:space-y-5">
                            <Input
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={setEmail}
                                required
                                placeholder="you@example.com"
                                prefix={<Mail size={18} className="text-zinc-500" />}
                            />

                            <div className="relative">
                                <Input
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={setPassword}
                                    required
                                    placeholder="Enter password"
                                    prefix={<Lock size={18} className="text-zinc-500" />}
                                    suffix={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-zinc-500 hover:text-white transition-colors focus:outline-none p-2"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-zinc-100 focus:ring-zinc-500/30 focus:ring-offset-0 transition-all"
                                    />
                                    <span className="text-xs md:text-sm font-semibold text-zinc-400 group-hover:text-zinc-300 transition-colors">Remember me</span>
                                </label>
                                <Link to="/forgot-password" size="sm" className="text-xs md:text-sm font-bold text-emerald-500 hover:text-emerald-400 hover:underline tracking-tight">
                                    Forgot?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-zinc-100 hover:bg-white text-zinc-900 py-4 md:py-5 rounded-xl md:rounded-[20px] font-black text-base md:text-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 touch-target"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : null}
                            {isSubmitting ? 'Verifying...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-800" />
                        </div>
                        <div className="relative flex justify-center text-[10px] md:text-xs uppercase">
                            <span className="bg-[#18181b] px-4 text-zinc-500 font-black tracking-widest">Or</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 group touch-target"
                    >
                        <Chrome size={20} className="text-white group-hover:scale-110 transition-transform" />
                        <span className="text-sm md:text-base">Continue with Google</span>
                    </button>

                    <div className="text-center pt-2 md:pt-4">
                        <p className="text-xs md:text-sm text-zinc-400 font-bold">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-emerald-500 hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
