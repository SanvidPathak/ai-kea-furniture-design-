import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { getUserDesigns, deleteDesign } from '../services/designService.js';
import { signOut } from '../services/authService.js';
import { calculateTotalCost } from '../services/designGenerator.js';
import { DesignCard } from '../components/design/DesignCard.jsx';
import { Button } from '../components/common/Button.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';
import { Logo } from '../components/common/Logo.jsx';

export function MyDesignsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDesigns();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading]);

  const loadDesigns = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const userDesigns = await getUserDesigns(user.uid);

      // Recalculate prices for all designs with current rates
      const designsWithUpdatedPrices = userDesigns.map(design => {
        if (design.parts && design.material) {
          const recalculatedCost = calculateTotalCost(design.parts, design.material);
          return {
            ...design,
            totalCost: recalculatedCost
          };
        }
        return design;
      });

      setDesigns(designsWithUpdatedPrices);
    } catch (error) {
      console.error('Load designs error:', error);
      setErrorMessage('Failed to load designs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (designId) => {
    try {
      await deleteDesign(designId, user.uid);
      // Remove from local state
      setDesigns(designs.filter(d => d.id !== designId));
      showToast('Design deleted successfully!', 'success');
    } catch (error) {
      console.error('Delete design error:', error);
      showToast('Failed to delete design. Please try again.', 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-earth-beige">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="section-container py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/create">
              <Button>Create Design</Button>
            </Link>
            {user && (
              <>
                <Link to="/account" className="hidden sm:flex items-center gap-2 text-sm text-neutral-600 hover:text-ikea-blue transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{user.displayName}</span>
                </Link>
                <Button variant="secondary" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="section-container py-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
              My Designs
            </h1>
            <p className="text-neutral-600">
              View and manage your saved furniture designs
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4 mb-6 border-b border-neutral-200">
            <div className="pb-3 px-1 text-ikea-blue border-b-2 border-ikea-blue font-semibold">
              My Designs
            </div>
            <Link
              to="/orders"
              className="pb-3 px-1 text-neutral-600 hover:text-ikea-blue transition-colors"
            >
              My Orders
            </Link>
          </div>

          <ErrorMessage message={errorMessage} onClose={() => setErrorMessage('')} />

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="xl" />
            </div>
          ) : designs.length === 0 ? (
            /* Empty State */
            <div className="card text-center py-16">
              <div className="text-6xl mb-4">📐</div>
              <h3 className="text-2xl font-semibold text-neutral-900 mb-2">
                No Designs Yet
              </h3>
              <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                You haven't created any furniture designs yet. Start designing to see them here!
              </p>
              <Link to="/create">
                <Button className="text-lg px-8 py-4">
                  Create Your First Design
                </Button>
              </Link>
            </div>
          ) : (
            /* Designs Grid */
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-neutral-600">
                  Showing {designs.length} design{designs.length !== 1 ? 's' : ''}
                </p>
                <Link to="/create">
                  <Button variant="secondary">+ New Design</Button>
                </Link>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {designs.map((design) => (
                  <DesignCard
                    key={design.id}
                    design={design}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link to="/" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-16">
        <div className="section-container py-6 text-center text-sm text-neutral-600">
          <p>AI-KEA © 2025 - My Designs</p>
        </div>
      </footer>
    </div>
  );
}
