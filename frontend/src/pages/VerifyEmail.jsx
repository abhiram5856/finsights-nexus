import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, RefreshCcw, LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';

const VerifyEmail = () => {
    const { user, signOut } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const navigate = useNavigate();

    const handleRefresh = () => {
        setIsRefreshing(true);
        window.location.reload();
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[40px] p-10 text-center space-y-8 shadow-2xl">
                <div className="flex justify-center">
                    <div className="w-24 h-24 bg-indigo-500/10 rounded-[32px] flex items-center justify-center animate-pulse">
                        <Mail size={48} className="text-[var(--accent-primary)]" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl font-black text-[var(--text-main)]">Verify your email</h2>
                    <p className="text-[var(--text-muted)] font-medium text-lg leading-relaxed">
                        We've sent a verification link to <br />
                        <span className="text-[var(--text-main)] font-black break-all">{user?.email}</span>
                    </p>
                    <p className="text-sm text-[var(--text-muted)]/60 font-bold bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)]/50">
                        Check your inbox (and spam folder) and click the link to activate your account.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-4">
                    <button
                        onClick={handleRefresh}
                        className="w-full bg-[var(--accent-primary)] text-white py-4 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[var(--accent-primary)]/30 flex items-center justify-center gap-2"
                    >
                        {isRefreshing ? <Loader2 className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
                        I've Verified
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-main)] py-4 rounded-2xl font-black hover:bg-[var(--border-color)] transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
