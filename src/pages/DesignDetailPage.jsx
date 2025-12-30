import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { getDesign, deleteDesign } from '../services/designService.js';
import { saveOrder, updateOrderStatus } from '../services/orderService.js';
import { initiatePayment } from '../services/paymentService.js';
import { signOut } from '../services/authService.js';
import { calculateTotalCost } from '../services/designGenerator.js';
import { exportDesignAsPDF, exportPartsAsCSV, exportAssemblyInstructionsAsPDF } from '../utils/exportUtils.js';
import { DesignPartsTable } from '../components/design/DesignPartsTable.jsx';
import { CostBreakdown } from '../components/design/CostBreakdown.jsx';
import { OrderForm } from '../components/order/OrderForm.jsx';
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
  const [showOrderForm, setShowOrderForm] = useState(false);

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

      // Recalculate price with current rates or stored snapshot
      if (designData.parts && designData.material) {
        const recalculatedCost = calculateTotalCost(
          designData.parts,
          designData.material,
          designData.pricingSnapshot
        );
        designData.totalCost = recalculatedCost;
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

  const handleCreateOrder = () => {
    setShowOrderForm(true);
  };

  const handleExportPDF = () => {
    try {
      exportDesignAsPDF(design);
      showToast('PDF exported successfully!', 'success');
    } catch (error) {
      console.error('Export PDF error:', error);
      showToast(`Failed to export PDF: ${error.message}`, 'error');
    }
  };

  const handleExportInstructions = () => {
    try {
      exportAssemblyInstructionsAsPDF(design);
      showToast('Assembly instructions exported successfully!', 'success');
    } catch (error) {
      console.error('Export instructions error:', error);
      showToast(`Failed to export instructions: ${error.message}`, 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      exportPartsAsCSV(design);
      showToast('Parts list exported successfully!', 'success');
    } catch (error) {
      console.error('Export CSV error:', error);
      showToast(`Failed to export CSV: ${error.message}`, 'error');
    }
  };

  const handleOrderSubmit = async (customerInfo) => {
    try {
      const orderData = {
        designId: id, // Use the design ID from URL params
        designSnapshot: design,
        customerInfo,
      };

      // 1. Create the order first (Status: pending_payment)
      const savedOrder = await saveOrder(user.uid, orderData);

      // 2. Close the modal forms
      setShowOrderForm(false);

      // 3. Initiate Payment immediately? 
      // NO - On iOS/Safari, the async 'saveOrder' above breaks the user gesture context.
      // We must redirect to the Order Page and let the user click "Pay Now" manually.

      showToast('Order placed! Please complete payment.', 'success');
      navigate(`/orders/${savedOrder.id}`);

    } catch (error) {
      console.error('Order creation error:', error);
      showToast('Failed to place order', 'error');
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
          <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
            Design Not Found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-300 mb-6">
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
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            <Link to="/" className="hover:text-neutral-900 dark:hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/designs" className="hover:text-neutral-900 dark:hover:text-white">My Designs</Link>
            <span className="mx-2">/</span>
            <span className="text-neutral-900 dark:text-white capitalize">{design.furnitureType}</span>
          </div>

          {/* Design Header */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white capitalize mb-2">
                  {design.furnitureType}
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-1 capitalize">
                    <span className="font-medium">Material:</span> {design.material}
                  </span>
                  <span className="flex items-center gap-1">
                    <div
                      className="w-4 h-4 rounded border border-neutral-300 dark:border-neutral-600"
                      style={{ backgroundColor: design.materialColor }}
                    />
                    <span className="font-medium">Color:</span> {design.materialColor}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                  Created {formatDate(design.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-ikea-blue">
                  ₹{design.totalCost.toFixed(2)}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Total Cost</div>
              </div>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-earth-beige dark:bg-neutral-800 rounded-lg transition-colors">
              <div className="text-center">
                <div className="text-base sm:text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">
                  {design.dimensions.length} <span className="text-xs sm:text-base">cm</span>
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">Length</div>
              </div>
              <div className="text-center">
                <div className="text-base sm:text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">
                  {design.dimensions.width} <span className="text-xs sm:text-base">cm</span>
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">Width</div>
              </div>
              <div className="text-center">
                <div className="text-base sm:text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">
                  {design.dimensions.height} <span className="text-xs sm:text-base">cm</span>
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">Height</div>
              </div>
            </div>

            {/* Assembly Info */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">
                <span className="font-medium">Parts:</span> {design.parts.length} types
              </span>
              <span className="text-neutral-600 dark:text-neutral-400">
                <span className="font-medium">Assembly time:</span> ~{design.assemblyTime} min
              </span>
            </div>
          </div>

          {/* Parts List */}
          <div className="card">
            <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white mb-4">Parts List</h3>
            <DesignPartsTable parts={design.parts} />
          </div>

          {/* Cost Breakdown */}
          <CostBreakdown
            parts={design.parts}
            material={design.material}
            totalCost={design.totalCost}
            pricingSnapshot={design.pricingSnapshot}
          />

          {/* Assembly Instructions */}
          <div className="card">
            <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white mb-4">
              Assembly Instructions
            </h3>
            <ol className="space-y-2">
              {(design.instructions || design.assemblyInstructions || []).map((instruction, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ikea-blue text-white text-sm font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 pt-0.5">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* AI Badge if applicable */}
          {design.aiEnhanced && (
            <div className="card bg-gradient-to-r from-ikea-blue to-ikea-electric text-white border-none">
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

          {/* Order Form Modal */}
          {showOrderForm && (
            <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
              <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-2xl w-full my-4 sm:my-8 max-h-[95vh] overflow-y-auto border border-neutral-200 dark:border-neutral-700 shadow-xl">
                <div className="p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">Place Your Order</h2>
                  <OrderForm
                    design={design}
                    onSubmit={handleOrderSubmit}
                    onCancel={() => setShowOrderForm(false)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="card bg-earth-beige/50 dark:bg-neutral-800/50">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Export Options</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <Button
                variant="secondary"
                onClick={handleExportPDF}
                className="w-full"
              >
                📄 Export as PDF
              </Button>
              <Button
                variant="secondary"
                onClick={handleExportInstructions}
                className="w-full"
              >
                📋 Assembly Instructions
              </Button>
              <Button
                variant="secondary"
                onClick={handleExportCSV}
                className="w-full"
              >
                📊 Parts List (CSV)
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/designs" className="flex-1">
              <Button variant="secondary" className="w-full">
                ← Back to My Designs
              </Button>
            </Link>
            <Button
              onClick={handleDelete}
              loading={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Design
            </Button>
            <Button
              onClick={handleCreateOrder}
              className="flex-1"
            >
              Create Order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
