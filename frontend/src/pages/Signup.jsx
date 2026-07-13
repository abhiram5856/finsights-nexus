import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Loader2, CheckCircle2, Eye, EyeOff, TrendingUp, Chrome } from 'lucide-react';
import { Input } from './modules/shared';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const { signUp, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError(null);

        if (!agreeTerms) {
            setError("You must agree to the Terms of Service");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error: signUpError } = await signUp({
                email,
                password,
                options: {
                    data: { full_name: name }
                }
            });

            if (signUpError) throw signUpError;

            setIsSuccess(true);
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

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
                <div className="absolute inset-0 matrix-bg matrix-fade opacity-30 pointer-events-none"></div>
                <div className="w-full max-w-md bg-[#18181b]/80 backdrop-blur-2xl border border-zinc-800 rounded-3xl md:rounded-[32px] p-8 md:p-10 text-center space-y-6 shadow-2xl relative z-10">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/10 rounded-2xl md:rounded-3xl flex items-center justify-center">
                            <CheckCircle2 size={32} md:size={40} className="text-emerald-500" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl md:text-3xl font-black text-white">Check your email</h2>
                        <p className="text-sm md:text-base text-zinc-400 font-medium">
                            We've sent a verification link to <span className="text-white font-bold">{email}</span>.
                            Please verify your account to continue.
                        </p>
                    </div>
                    <Link
                        to="/login"
                        className="block w-full bg-zinc-900 border border-zinc-800 text-white py-4 rounded-xl md:rounded-2xl font-black hover:bg-zinc-800 transition-all touch-target"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 matrix-bg matrix-fade opacity-30 pointer-events-none"></div>

            <div className="w-full max-w-md space-y-6 md:space-y-8 relative z-10 my-8">
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
                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Create Account</h2>
                        <p className="text-sm md:text-base text-zinc-400 font-medium">Get started with NEXUS</p>
                    </div>
                </div>

                <div className="bg-[#18181b]/80 backdrop-blur-2xl border border-zinc-800 rounded-3xl md:rounded-[40px] p-6 md:p-8 shadow-2xl space-y-6 md:space-y-8">
                    <form onSubmit={handleSignup} className="space-y-5 md:space-y-6">
                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-[11px] md:text-xs font-bold animate-in shake duration-300">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4 md:space-y-5">
                            <Input
                                label="Full Name"
                                type="text"
                                value={name}
                                onChange={setName}
                                required
                                placeholder="John Doe"
                                prefix={<User size={18} className="text-zinc-500" />}
                            />

                            <Input
                                label="Email"
                                type="email"
                                value={email}
                                onChange={setEmail}
                                required
                                placeholder="you@example.com"
                                prefix={<Mail size={18} className="text-zinc-500" />}
                            />

                            <Input
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={setPassword}
                                required
                                placeholder="Create strong password"
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

                            <Input
                                label="Confirm Password"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                required
                                placeholder="Confirm password"
                                prefix={<Lock size={18} className="text-zinc-500" />}
                                suffix={
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="text-zinc-500 hover:text-white transition-colors focus:outline-none p-2"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                            />

                            <div className="px-1">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-zinc-100 focus:ring-zinc-500/30 focus:ring-offset-0 transition-all"
                                    />
                                    <span className="text-xs md:text-sm font-semibold text-zinc-400 group-hover:text-zinc-300 transition-colors leading-tight">
                                        I agree to the <Link to="/terms" className="text-emerald-500 hover:underline">Terms</Link> and <Link to="/privacy" className="text-emerald-500 hover:underline">Privacy</Link>
                                    </span>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-zinc-100 hover:bg-white text-zinc-900 py-4 md:py-5 rounded-xl md:rounded-[20px] font-black text-base md:text-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 touch-target"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : null}
                            {isSubmitting ? 'Creating...' : 'Create Account'}
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
                            Already have an account? {' '}
                            <Link to="/login" className="text-emerald-500 hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
