import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { getOrder, deleteOrder, getOrderStatusDisplay, updateOrderStatus, subscribeToOrder } from '../services/orderService.js';
import { signOut } from '../services/authService.js';
import { initiatePayment } from '../services/paymentService.js';
import { exportDesignAsPDF, exportPartsAsCSV, exportAssemblyInstructionsAsPDF } from '../utils/exportUtils.js';
import { OrderStatusTimeline } from '../components/order/OrderStatusTimeline.jsx';
import { DesignPartsTable } from '../components/design/DesignPartsTable.jsx';
import { CostBreakdown } from '../components/design/CostBreakdown.jsx';
import { Button } from '../components/common/Button.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    let unsubscribe = () => { };

    if (isAuthenticated && user) {
      setLoading(true);
      unsubscribe = subscribeToOrder(id, (orderData) => {
        setLoading(false);
        if (!orderData) {
          setErrorMessage('Order not found or has been deleted.');
          setOrder(null);
          return;
        }

        // Verify ownership
        if (orderData.userId !== user.uid) {
          setErrorMessage('You do not have permission to view this order.');
          setOrder(null);
          return;
        }

        setOrder(orderData);
      });
    } else if (!authLoading) {
      setLoading(false);
    }

    return () => unsubscribe();
  }, [id, isAuthenticated, user, authLoading]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setErrorMessage('');

    try {
      await deleteOrder(id, user.uid);
      showToast('Order cancelled successfully!', 'success');
      navigate('/orders', { replace: true });
    } catch (error) {
      console.error('Cancel order error:', error);
      showToast('Failed to cancel order. Please try again.', 'error');
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

  const handlePayment = () => {
    if (!order) return;
    setIsPaying(true);

    // Construct Order Details for Payment
    const paymentDetails = {
      amount: order.designSnapshot.totalCost,
      receipt: `order_${order.id}`,
      userEmail: (order.customerInfo || order).email,
      userContact: (order.customerInfo || order).phone
    };

    initiatePayment(
      paymentDetails,
      // Success Callback
      async (response) => {
        try {
          // In a real app, you would verify signature on backend here
          console.log("Payment Success:", response);

          showToast('Payment successful! Updating order...', 'success');

          // Update Order Status in Firestore to 'confirmed' (or 'processing' if you prefer)
          await updateOrderStatus(order.id, 'confirmed');

          // Refresh order to show new status
          // loadOrder(); // Subscription handles this automatically now
        } catch (error) {
          console.error("Order Status Update Error:", error);
          showToast('Payment successful but failed to update order status. Please contact support.', 'error');
        } finally {
          setIsPaying(false);
        }
      },
      // Failure Callback
      (error) => {
        console.error("Payment Failed:", error);
        showToast(error.message || 'Payment failed or cancelled', 'error');
        setIsPaying(false);
      }
    );
  };

  const handleExportPDF = () => {
    try {
      exportDesignAsPDF(order.designSnapshot);
      showToast('PDF exported successfully!', 'success');
    } catch (error) {
      console.error('Export PDF error:', error);
      showToast(`Failed to export PDF: ${error.message}`, 'error');
    }
  };

  const handleExportInstructions = () => {
    try {
      exportAssemblyInstructionsAsPDF(order.designSnapshot);
      showToast('Assembly instructions exported successfully!', 'success');
    } catch (error) {
      console.error('Export instructions error:', error);
      showToast(`Failed to export instructions: ${error.message}`, 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      exportPartsAsCSV(order.designSnapshot);
      showToast('Parts list exported successfully!', 'success');
    } catch (error) {
      console.error('Export CSV error:', error);
      showToast(`Failed to export CSV: ${error.message}`, 'error');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleString('en-IN', {
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
      ) : !order ? (
        /* Error State */
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
            Order Not Found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-300 mb-6">
            This order may have been cancelled or you don't have permission to view it.
          </p>
          <Link to="/orders">
            <Button>Back to My Orders</Button>
          </Link>
        </div>
      ) : (
        /* Order Content */
        <div className="space-y-6">
          {/* Breadcrumb */}
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            <Link to="/" className="hover:text-neutral-900 dark:hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/orders" className="hover:text-neutral-900 dark:hover:text-white">My Orders</Link>
            <span className="mx-2">/</span>
            <span className="text-neutral-900 dark:text-white">Order #{order.id.slice(0, 8)}</span>
          </div>

          {/* Order Header */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-2">
                  Order #{order.id.slice(0, 8)}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getOrderStatusDisplay(order.status).color}`}>
                {getOrderStatusDisplay(order.status).label}
              </span>
            </div>
          </div>

          {/* Order Status Timeline */}
          <OrderStatusTimeline order={order} />

          {/* Design Details */}
          <div className="card">
            <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white mb-4">Ordered Design</h3>
            <div className="bg-earth-beige/50 dark:bg-neutral-800/50 rounded-lg p-4 mb-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white capitalize mb-1">
                    {order.designSnapshot.furnitureType}
                  </h4>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    <span className="capitalize">
                      <span className="font-medium">Material:</span> {order.designSnapshot.material}
                    </span>
                    <span className="flex items-center gap-1">
                      <div
                        className="w-4 h-4 rounded border border-neutral-300 dark:border-neutral-600"
                        style={{ backgroundColor: order.designSnapshot.materialColor }}
                      />
                      {order.designSnapshot.materialColor}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-bold text-ikea-blue">
                    ₹{order.designSnapshot.totalCost.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-white dark:bg-neutral-800 rounded">
                <div className="text-center">
                  <div className="text-sm sm:text-base md:text-lg font-bold text-neutral-900 dark:text-white">
                    {order.designSnapshot.dimensions.length} <span className="text-xs sm:text-base">cm</span>
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">Length</div>
                </div>
                <div className="text-center">
                  <div className="text-sm sm:text-base md:text-lg font-bold text-neutral-900 dark:text-white">
                    {order.designSnapshot.dimensions.width} <span className="text-xs sm:text-base">cm</span>
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">Width</div>
                </div>
                <div className="text-center">
                  <div className="text-sm sm:text-base md:text-lg font-bold text-neutral-900 dark:text-white">
                    {order.designSnapshot.dimensions.height} <span className="text-xs sm:text-base">cm</span>
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">Height</div>
                </div>
              </div>
            </div>

            {/* Parts List */}
            <h4 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-3 mt-6">Parts List</h4>
            <DesignPartsTable parts={order.designSnapshot.parts} />
          </div>

          {/* Cost Breakdown */}
          <CostBreakdown
            parts={order.designSnapshot.parts}
            material={order.designSnapshot.material}
            totalCost={order.designSnapshot.totalCost}
            pricingSnapshot={order.designSnapshot.pricingSnapshot}
          />

          {/* Delivery Information */}
          <div className="card">
            <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white mb-4">Delivery Information</h3>
            <div className="bg-earth-beige/50 dark:bg-neutral-800/50 rounded p-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Name</div>
                  <div className="text-sm sm:text-base text-neutral-900 dark:text-white">{(order.customerInfo || order).name}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Phone</div>
                  <div className="text-sm sm:text-base text-neutral-900 dark:text-white">{(order.customerInfo || order).phone}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</div>
                  <div className="text-sm sm:text-base text-neutral-900 dark:text-white">{(order.customerInfo || order).email}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Address</div>
                  <div className="text-sm sm:text-base text-neutral-900 dark:text-white">
                    {(order.customerInfo || order).address}, {(order.customerInfo || order).city}<br />
                    {(order.customerInfo || order).state} - {(order.customerInfo || order).pincode}
                  </div>
                </div>
              </div>
            </div>
          </div>

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
            <Link to="/orders" className="flex-1">
              <Button variant="secondary" className="w-full">
                ← Back to My Orders
              </Button>
            </Link>
            {order.designId && order.designId !== 'temp' && (
              <Link to={`/designs/${order.designId}`} className="flex-1">
                <Button variant="secondary" className="w-full">
                  View Original Design
                </Button>
              </Link>
            )}

            {/* Pay Now Button (Only for Processing i.e. Unpaid) */}
            {order.status === 'processing' && (
              <Button
                onClick={handlePayment}
                loading={isPaying}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                💳 Pay Now
              </Button>
            )}

            {order.status === 'processing' && (
              <Button
                onClick={handleCancelOrder}
                loading={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
