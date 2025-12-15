import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { getUserOrders, deleteOrder, getOrderStatusDisplay } from '../services/orderService.js';
import { signOut } from '../services/authService.js';
import { Button } from '../components/common/Button.jsx';
import { SkeletonList } from '../components/common/SkeletonCard.jsx';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';

export function MyOrdersPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, processing, confirmed, manufacturing, shipped, delivered, cancelled
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, cost

  useEffect(() => {
    if (isAuthenticated && user) {
      loadOrders();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading]);

  const loadOrders = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const userOrders = await getUserOrders(user.uid);
      setOrders(userOrders);
    } catch (error) {
      console.error('Load orders error:', error);
      setErrorMessage('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setDeletingOrderId(orderId);
    try {
      await deleteOrder(orderId, user.uid);
      setOrders(orders.filter(o => o.id !== orderId));
      showToast('Order cancelled successfully!', 'success');
    } catch (error) {
      console.error('Cancel order error:', error);
      showToast('Failed to cancel order. Please try again.', 'error');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Filter and sort orders
  const getFilteredAndSortedOrders = () => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.designSnapshot?.furnitureType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerInfo || order).name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'cost':
          return (b.designSnapshot?.totalCost || 0) - (a.designSnapshot?.totalCost || 0);
        default:
          return 0;
      }
    });

    return sorted;
  };

  const filteredOrders = getFilteredAndSortedOrders();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="section-container py-8">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-2">
            My Orders
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Track and manage your furniture orders
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-6 border-b border-neutral-200 dark:border-neutral-700">
          <Link
            to="/designs"
            className="pb-3 px-1 text-neutral-600 dark:text-neutral-400 hover:text-ikea-blue dark:hover:text-ikea-blue transition-colors"
          >
            My Designs
          </Link>
          <div className="pb-3 px-1 text-ikea-blue border-b-2 border-ikea-blue font-semibold">
            My Orders
          </div>
        </div>

        <ErrorMessage message={errorMessage} onClose={() => setErrorMessage('')} />

        {/* Search and Filter */}
        {!loading && orders.length > 0 && (
          <div className="card mb-6">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div>
                <label htmlFor="order-search" className="sr-only">
                  Search orders
                </label>
                <div className="relative">
                  <input
                    id="order-search"
                    type="text"
                    placeholder="Search by order ID, furniture type, or customer name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-ikea-blue bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400"
                    aria-label="Search orders by ID, furniture type, or customer name"
                  />
                  <svg
                    className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="status-filter" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Status
                  </label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-ikea-blue bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    aria-label="Filter orders by status"
                  >
                    <option value="all">All Statuses</option>
                    <option value="processing">Processing</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label htmlFor="order-sort" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Sort By
                  </label>
                  <select
                    id="order-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort orders"
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-ikea-blue bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="cost">By Cost (High-Low)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <SkeletonList count={5} />
        ) : orders.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              No Orders Yet
            </h3>
            <p className="text-neutral-600 dark:text-neutral-300 mb-6">
              You haven't placed any orders yet. Create a design and place your first order!
            </p>
            <Link to="/create">
              <Button>Create Your First Design</Button>
            </Link>
          </div>
        ) : filteredOrders.length === 0 && (searchTerm || statusFilter !== 'all') ? (
          /* No Search/Filter Results */
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
              No Orders Found
            </h3>
            <p className="text-neutral-600 dark:text-neutral-300 mb-6 max-w-md mx-auto">
              No orders match your search criteria. Try adjusting your filters.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
              <Button variant="secondary" onClick={() => setStatusFilter('all')}>
                Clear Filters
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Showing {filteredOrders.length} of {orders.length} order{orders.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusDisplay = getOrderStatusDisplay(order.status);
                const design = order.designSnapshot;
                // Handle legacy orders where customer info was saved at root
                const customerInfo = order.customerInfo || order;

                return (
                  <div key={order.id} className="card">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white capitalize">
                              {design.furnitureType}
                            </h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              Order placed on {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.color} w-fit`}
                          >
                            {statusDisplay.label}
                          </span>
                        </div>

                        {/* Design Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                          <div>
                            <span className="text-neutral-600 dark:text-neutral-400">Material:</span>
                            <div className="font-medium capitalize dark:text-neutral-200">{design.material}</div>
                          </div>
                          <div>
                            <span className="text-neutral-600 dark:text-neutral-400">Dimensions:</span>
                            <div className="font-medium font-mono text-xs dark:text-neutral-200">
                              {design.dimensions.length} × {design.dimensions.width} × {design.dimensions.height} cm
                            </div>
                          </div>
                          <div>
                            <span className="text-neutral-600 dark:text-neutral-400">Parts:</span>
                            <div className="font-medium dark:text-neutral-200">{design.parts.length} types</div>
                          </div>
                          <div>
                            <span className="text-neutral-600 dark:text-neutral-400">Total Cost:</span>
                            <div className="font-bold text-ikea-blue text-base">
                              ₹{design.totalCost.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="bg-earth-beige/50 dark:bg-neutral-800/50 rounded p-3 mb-4">
                          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                            Delivery Address
                          </h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {customerInfo.name}<br />
                            {customerInfo.address}, {customerInfo.city}<br />
                            {customerInfo.state} - {customerInfo.pincode}<br />
                            {customerInfo.phone} | {customerInfo.email}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Link to={`/orders/${order.id}`} className="flex-1">
                            <Button className="w-full">
                              View Order Details
                            </Button>
                          </Link>
                          {order.designId && order.designId !== 'temp' && (
                            <Link to={`/designs/${order.designId}`} className="flex-1">
                              <Button variant="secondary" className="w-full">
                                View Design
                              </Button>
                            </Link>
                          )}
                          {order.status === 'processing' && (
                            <Button
                              variant="secondary"
                              onClick={() => handleCancelOrder(order.id)}
                              loading={deletingOrderId === order.id}
                              className="flex-1 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/30"
                            >
                              Cancel Order
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
