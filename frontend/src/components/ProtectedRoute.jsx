import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requireVerification = true }) => {
    const { user, loading, isVerified } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[var(--bg-primary)]">
                <Loader2 className="animate-spin text-[var(--accent-primary)]" size={48} />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireVerification && !isVerified) {
        return <Navigate to="/verify-email" replace />;
    }

    return children;
};

export default ProtectedRoute;
