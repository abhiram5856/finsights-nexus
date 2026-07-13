import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, ArrowLeft, Loader2, CheckCircle2, TrendingUp } from 'lucide-react';
import { Input } from './modules/shared';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleResetRequest = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setIsSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 matrix-bg matrix-fade opacity-30 pointer-events-none"></div>
                <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-[32px] p-10 text-center space-y-6 shadow-2xl relative z-10">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center">
                            <CheckCircle2 size={40} className="text-emerald-500" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-white">Link Sent!</h2>
                        <p className="text-slate-400 font-medium">
                            If an account exists for <span className="text-white font-bold">{email}</span>,
                            you'll receive a password reset link shortly.
                        </p>
                    </div>
                    <Link
                        to="/login"
                        className="block w-full bg-slate-900 border border-slate-700 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all touch-target"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 matrix-bg matrix-fade opacity-30 pointer-events-none"></div>

            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="text-center space-y-6">
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center shadow-lg">
                            <TrendingUp size={22} className="text-slate-100" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tighter text-white uppercase mt-1">
                            NEXUS
                        </h1>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-white tracking-tight">Forgot Password?</h2>
                        <p className="text-slate-400 font-medium">Enter your email to receive a reset link</p>
                    </div>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-[40px] p-8 shadow-2xl space-y-8">
                    <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl">
                        <p className="text-sm font-medium text-slate-300 leading-relaxed text-center">
                            Enter the email address associated with your account and we'll send you a link to reset your password.
                        </p>
                    </div>

                    <form onSubmit={handleResetRequest} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs font-bold">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <Input
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={setEmail}
                                required
                                placeholder="you@example.com"
                                prefix={<Mail size={18} className="text-slate-500" />}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-slate-100 hover:bg-white text-slate-900 py-5 rounded-[20px] font-black text-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 touch-target"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : null}
                            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 text-emerald-500 font-bold hover:text-emerald-400 transition-colors"
                        >
                            <ArrowLeft size={18} />
                            Back to Login
                        </Link>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
