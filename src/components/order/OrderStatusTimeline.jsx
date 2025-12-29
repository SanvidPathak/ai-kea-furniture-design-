import { getOrderStatusDisplay } from '../../services/orderService.js';

export function OrderStatusTimeline({ order }) {
  const allStatuses = [
    { key: 'processing', label: 'Processing', icon: '⏳' },
    { key: 'confirmed', label: 'Confirmed', icon: '✓' },
    { key: 'manufacturing', label: 'Manufacturing', icon: '🔨' },
    { key: 'shipped', label: 'Shipped', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '📦' },
  ];

  const currentStatusIndex = allStatuses.findIndex(s => s.key === order.status);
  const isCancelled = order.status === 'cancelled';

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isCancelled) {
    return (
      <div className="card bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50">
        <div className="text-center py-8">
          <div className="text-5xl mb-3">❌</div>
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Order Cancelled</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            This order was cancelled on {formatDate(order.updatedAt || order.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">Order Progress</h3>

      <div className="relative">
        <div className="space-y-0">
          {allStatuses.map((status, index) => {
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const isLast = index === allStatuses.length - 1;
            const statusHistory = order.statusHistory?.find(h => h.status === status.key);

            return (
              <div key={status.key} className="relative flex gap-4 pb-8 last:pb-0">
                {/* Connecting Line (drawn per item) */}
                {!isLast && (
                  <div className={`absolute left-6 top-10 bottom-0 w-0.5 -ml-[1px] ${index < currentStatusIndex ? 'bg-ikea-blue' : 'bg-neutral-200 dark:bg-neutral-700'
                    }`} />
                )}

                {/* Icon */}
                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all shrink-0 ${isCompleted
                    ? 'bg-ikea-blue text-white shadow-md'
                    : 'bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600'
                  }`}>
                  {status.icon}
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <div className={`font-semibold ${isCompleted ? 'text-neutral-900 dark:text-neutral-200' : 'text-neutral-500 dark:text-neutral-600'}`}>
                    {status.label}
                    {isCurrent && (
                      <span className="ml-2 text-xs font-normal text-ikea-blue shrink-0">
                        (Current)
                      </span>
                    )}
                  </div>
                  {statusHistory && (
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      {formatDate(statusHistory.timestamp)}
                    </div>
                  )}
                  {!isCompleted && !isCurrent && (
                    <div className="text-xs text-neutral-400 dark:text-neutral-600 mt-1">
                      Pending
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
