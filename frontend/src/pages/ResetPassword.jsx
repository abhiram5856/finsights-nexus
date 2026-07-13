import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Input } from './modules/shared';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleReset = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[32px] p-10 text-center space-y-6 shadow-2xl">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center">
                            <CheckCircle2 size={40} className="text-emerald-500" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-[var(--text-main)]">Password Updated!</h2>
                        <p className="text-[var(--text-muted)] font-medium text-lg">
                            Your password has been changed successfully. Redirecting to login...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight">Set New Password</h1>
                    <p className="text-[var(--text-muted)] font-medium text-lg">Choose a strong password for your account</p>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[40px] p-8 shadow-2xl shadow-indigo-500/5">
                    <form onSubmit={handleReset} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs font-bold">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <Input
                                label="New Password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={setPassword}
                                required
                                placeholder="••••••••"
                                prefix={<Lock size={18} className="text-[var(--text-muted)]" />}
                                suffix={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors focus:outline-none"
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
                                placeholder="••••••••"
                                prefix={<Lock size={18} className="text-[var(--text-muted)]" />}
                                suffix={
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors focus:outline-none"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[var(--accent-primary)] text-white py-5 rounded-[20px] font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[var(--accent-primary)]/30 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <ArrowRight size={24} />}
                            Reset Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
