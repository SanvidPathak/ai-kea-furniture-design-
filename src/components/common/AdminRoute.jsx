import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { LoadingSpinner } from './LoadingSpinner.jsx';

export function AdminRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Security Check: Must be logged in AND have role 'admin'
    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
}
