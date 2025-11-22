import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { LoadingSpinner } from './components/common/LoadingSpinner.jsx';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage.jsx').then(m => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage.jsx').then(m => ({ default: m.SignupPage })));
const CreateDesignPage = lazy(() => import('./pages/CreateDesignPage.jsx').then(m => ({ default: m.CreateDesignPage })));
const MyDesignsPage = lazy(() => import('./pages/MyDesignsPage.jsx').then(m => ({ default: m.MyDesignsPage })));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage.jsx').then(m => ({ default: m.MyOrdersPage })));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage.jsx').then(m => ({ default: m.OrderDetailPage })));
const AccountPage = lazy(() => import('./pages/AccountPage.jsx').then(m => ({ default: m.AccountPage })));
const DesignDetailPage = lazy(() => import('./pages/DesignDetailPage.jsx').then(m => ({ default: m.DesignDetailPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx').then(m => ({ default: m.NotFoundPage })));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen bg-earth-beige flex items-center justify-center">
      <LoadingSpinner size="xl" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/create" element={<CreateDesignPage />} />
                <Route path="/designs" element={<MyDesignsPage />} />
                <Route path="/designs/:id" element={<DesignDetailPage />} />
                <Route path="/orders" element={<MyOrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
