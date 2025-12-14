import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { SignupForm } from '../components/auth/SignupForm.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';

export function SignupPage() {
  const { isAuthenticated, loading } = useAuth();

  // Redirect to home if already authenticated
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Create Account</h2>
          <p className="text-neutral-600 dark:text-neutral-300 mt-2">Join us to start designing</p>
        </div>

        {/* Signup Card */}
        <div className="card">
          <SignupForm />

          {/* Divider */}
          <div className="mt-6 mb-6 flex items-center">
            <div className="flex-1 border-t border-neutral-300 dark:border-neutral-700"></div>
            <span className="px-4 text-sm text-neutral-500">or</span>
            <div className="flex-1 border-t border-neutral-300 dark:border-neutral-700"></div>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-ikea-blue hover:text-primary-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
