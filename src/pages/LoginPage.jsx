import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LoginForm } from '../components/auth/LoginForm.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';

export function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Redirect to home (or previous page) if already authenticated
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to the page they tried to visit, or home
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] px-4">
      <div className="max-w-md w-full">
        {/* Header Text */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Welcome Back</h2>
          <p className="text-neutral-600 dark:text-neutral-300 mt-2">Sign in to continue designing</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <LoginForm />

          {/* Divider */}
          <div className="mt-6 mb-6 flex items-center">
            <div className="flex-1 border-t border-neutral-300 dark:border-neutral-700"></div>
            <span className="px-4 text-sm text-neutral-500">or</span>
            <div className="flex-1 border-t border-neutral-300 dark:border-neutral-700"></div>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-ikea-blue hover:text-primary-700 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
