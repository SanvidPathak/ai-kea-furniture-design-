import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { getOrder, deleteOrder, getOrderStatusDisplay } from '../services/orderService.js';
import { signOut } from '../services/authService.js';
import { OrderStatusTimeline } from '../components/order/OrderStatusTimeline.jsx';
import { DesignPartsTable } from '../components/design/DesignPartsTable.jsx';
import { CostBreakdown } from '../components/design/CostBreakdown.jsx';
import { Button } from '../components/common/Button.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';
import { Logo } from '../components/common/Logo.jsx';

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadOrder();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [id, isAuthenticated, user, authLoading]);

  const loadOrder = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const orderData = await getOrder(id);

      // Verify ownership
      if (orderData.userId !== user.uid) {
        setErrorMessage('You do not have permission to view this order.');
        return;
      }

      setOrder(orderData);
    } catch (error) {
      console.error('Load order error:', error);
      setErrorMessage('Failed to load order. It may have been deleted.');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-earth-beige">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="section-container py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/orders">
              <Button variant="secondary">My Orders</Button>
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
            <h3 className="text-2xl font-semibold text-neutral-900 mb-2">
              Order Not Found
            </h3>
            <p className="text-neutral-600 mb-6">
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
            <div className="text-sm text-neutral-600">
              <Link to="/" className="hover:text-neutral-900">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/orders" className="hover:text-neutral-900">My Orders</Link>
              <span className="mx-2">/</span>
              <span className="text-neutral-900">Order #{order.id.slice(0, 8)}</span>
            </div>

            {/* Order Header */}
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
                    Order #{order.id.slice(0, 8)}
                  </h2>
                  <p className="text-sm text-neutral-600">
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
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Ordered Design</h3>
              <div className="bg-earth-beige/50 rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-neutral-900 capitalize mb-1">
                      {order.designSnapshot.furnitureType}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                      <span className="capitalize">
                        <span className="font-medium">Material:</span> {order.designSnapshot.material}
                      </span>
                      <span className="flex items-center gap-1">
                        <div
                          className="w-4 h-4 rounded border border-neutral-300"
                          style={{ backgroundColor: order.designSnapshot.materialColor }}
                        />
                        {order.designSnapshot.materialColor}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-ikea-blue">
                      ₹{order.designSnapshot.totalCost.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-white rounded">
                  <div className="text-center">
                    <div className="text-lg font-bold text-neutral-900">
                      {order.designSnapshot.dimensions.length} cm
                    </div>
                    <div className="text-xs text-neutral-600">Length</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-neutral-900">
                      {order.designSnapshot.dimensions.width} cm
                    </div>
                    <div className="text-xs text-neutral-600">Width</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-neutral-900">
                      {order.designSnapshot.dimensions.height} cm
                    </div>
                    <div className="text-xs text-neutral-600">Height</div>
                  </div>
                </div>
              </div>

              {/* Parts List */}
              <h4 className="text-lg font-semibold text-neutral-900 mb-3 mt-6">Parts List</h4>
              <DesignPartsTable parts={order.designSnapshot.parts} />
            </div>

            {/* Cost Breakdown */}
            <CostBreakdown
              parts={order.designSnapshot.parts}
              material={order.designSnapshot.material}
              totalCost={order.designSnapshot.totalCost}
            />

            {/* Delivery Information */}
            <div className="card">
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Delivery Information</h3>
              <div className="bg-earth-beige/50 rounded p-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-neutral-700 mb-1">Name</div>
                    <div className="text-neutral-900">{order.customerInfo.name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-700 mb-1">Phone</div>
                    <div className="text-neutral-900">{order.customerInfo.phone}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-700 mb-1">Email</div>
                    <div className="text-neutral-900">{order.customerInfo.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-700 mb-1">Address</div>
                    <div className="text-neutral-900">
                      {order.customerInfo.address}, {order.customerInfo.city}<br />
                      {order.customerInfo.state} - {order.customerInfo.pincode}
                    </div>
                  </div>
                </div>
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

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-16">
        <div className="section-container py-6 text-center text-sm text-neutral-600">
          <p>AI-KEA © 2025 - Order Details</p>
        </div>
      </footer>
    </div>
  );
}
