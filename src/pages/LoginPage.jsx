import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LoginForm } from '../components/auth/LoginForm.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { Logo } from '../components/common/Logo.jsx';

export function LoginPage() {
  const { isAuthenticated, loading } = useAuth();

  // Redirect to home if already authenticated
  if (loading) {
    return (
      <div className="min-h-screen bg-earth-beige flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-earth-beige flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="flex justify-center mb-4">
            <Logo size="lg" />
          </Link>
          <p className="text-neutral-600">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <LoginForm />

          {/* Divider */}
          <div className="mt-6 mb-6 flex items-center">
            <div className="flex-1 border-t border-neutral-300"></div>
            <span className="px-4 text-sm text-neutral-500">or</span>
            <div className="flex-1 border-t border-neutral-300"></div>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-neutral-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-ikea-blue hover:text-primary-700 transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
