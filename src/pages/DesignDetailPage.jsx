import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { getDesign, deleteDesign } from '../services/designService.js';
import { signOut } from '../services/authService.js';
import { DesignPartsTable } from '../components/design/DesignPartsTable.jsx';
import { Button } from '../components/common/Button.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';

export function DesignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDesign();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [id, isAuthenticated, user, authLoading]);

  const loadDesign = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const designData = await getDesign(id);

      // Verify ownership
      if (designData.userId !== user.uid) {
        setErrorMessage('You do not have permission to view this design.');
        return;
      }

      setDesign(designData);
    } catch (error) {
      console.error('Load design error:', error);
      setErrorMessage('Failed to load design. It may have been deleted.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this ${design.furnitureType}? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setErrorMessage('');

    try {
      await deleteDesign(id, user.uid);
      showToast('Design deleted successfully!', 'success');
      navigate('/designs', { replace: true });
    } catch (error) {
      console.error('Delete design error:', error);
      showToast('Failed to delete design. Please try again.', 'error');
      setDeleting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-earth-beige">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="section-container py-4 flex items-center justify-between">
          <Link to="/">
            <h1 className="text-3xl font-bold text-ikea-blue">AI-KEA</h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/designs">
              <Button variant="secondary">My Designs</Button>
            </Link>
            {user && (
              <>
                <span className="text-sm text-neutral-600">
                  {user.displayName}
                </span>
                <Button variant="secondary" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="section-container py-8">
        <ErrorMessage message={errorMessage} onClose={() => setErrorMessage('')} />

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="xl" />
          </div>
        ) : !design ? (
          /* Error State */
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-2xl font-semibold text-neutral-900 mb-2">
              Design Not Found
            </h3>
            <p className="text-neutral-600 mb-6">
              This design may have been deleted or you don't have permission to view it.
            </p>
            <Link to="/designs">
              <Button>Back to My Designs</Button>
            </Link>
          </div>
        ) : (
          /* Design Content */
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="text-sm text-neutral-600">
              <Link to="/" className="hover:text-neutral-900">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/designs" className="hover:text-neutral-900">My Designs</Link>
              <span className="mx-2">/</span>
              <span className="text-neutral-900 capitalize">{design.furnitureType}</span>
            </div>

            {/* Design Header */}
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-4xl font-bold text-neutral-900 capitalize mb-2">
                    {design.furnitureType}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-neutral-600">
                    <span className="flex items-center gap-1 capitalize">
                      <span className="font-medium">Material:</span> {design.material}
                    </span>
                    <span className="flex items-center gap-1">
                      <div
                        className="w-4 h-4 rounded border border-neutral-300"
                        style={{ backgroundColor: design.materialColor }}
                      />
                      <span className="font-medium">Color:</span> {design.materialColor}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Created {formatDate(design.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-ikea-blue">
                    ${design.totalCost.toFixed(2)}
                  </div>
                  <div className="text-xs text-neutral-500">Total Cost</div>
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-earth-beige rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-900">
                    {design.dimensions.length} cm
                  </div>
                  <div className="text-xs text-neutral-600">Length</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-900">
                    {design.dimensions.width} cm
                  </div>
                  <div className="text-xs text-neutral-600">Width</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-900">
                    {design.dimensions.height} cm
                  </div>
                  <div className="text-xs text-neutral-600">Height</div>
                </div>
              </div>

              {/* Assembly Info */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-neutral-600">
                  <span className="font-medium">Parts:</span> {design.parts.length} types
                </span>
                <span className="text-neutral-600">
                  <span className="font-medium">Assembly time:</span> ~{design.assemblyTime} min
                </span>
              </div>
            </div>

            {/* Parts List */}
            <div className="card">
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Parts List</h3>
              <DesignPartsTable parts={design.parts} />
            </div>

            {/* Assembly Instructions */}
            <div className="card">
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                Assembly Instructions
              </h3>
              <ol className="space-y-2">
                {(design.instructions || design.assemblyInstructions || []).map((instruction, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ikea-blue text-white text-sm font-semibold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-neutral-700 pt-0.5">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* AI Badge if applicable */}
            {design.aiEnhanced && (
              <div className="card bg-gradient-to-r from-ikea-blue to-ikea-electric text-white">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🤖</div>
                  <div>
                    <h4 className="font-semibold mb-1">AI-Enhanced Design</h4>
                    <p className="text-sm opacity-90">
                      Generated from: "{design.userQuery}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Link to="/designs" className="flex-1">
                <Button variant="secondary" className="w-full">
                  ← Back to My Designs
                </Button>
              </Link>
              <Button
                onClick={handleDelete}
                loading={deleting}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Delete Design
              </Button>
              <Button className="px-6 py-3">
                Create Order
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-16">
        <div className="section-container py-6 text-center text-sm text-neutral-600">
          <p>AI-KEA © 2025 - Design Details</p>
        </div>
      </footer>
    </div>
  );
}
