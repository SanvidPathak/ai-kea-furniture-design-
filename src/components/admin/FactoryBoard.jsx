import React, { useEffect, useState } from 'react';
import { subscribeToAllOrders, updateOrderStatus } from '../../services/adminService.js';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import { toast } from 'react-hot-toast';

export function FactoryBoard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToAllOrders((updatedOrders) => {
            setOrders(updatedOrders);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleStatusMove = async (order, nextStatus) => {
        try {
            const loadingToast = toast.loading(`Moving to ${nextStatus}...`);
            await updateOrderStatus(order.id, nextStatus, order.statusHistory);
            toast.dismiss(loadingToast);
            toast.success(`Moved to ${nextStatus}`);
            // loadOrders(); // Auto-updated via subscription
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (loading) return <LoadingSpinner size="lg" />;

    // Grouping
    const columns = {
        processing: orders.filter(o => o.status === 'processing'),
        confirmed: orders.filter(o => o.status === 'confirmed'),
        manufacturing: orders.filter(o => o.status === 'manufacturing'),
        shipped: orders.filter(o => o.status === 'shipped')
    };

    return (
        <div className="w-full pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 px-2">

                {/* New Orders */}
                <StatusColumn
                    title="New Orders"
                    icon="📥"
                    color="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"
                    orders={columns.processing}
                    onAction={(o) => handleStatusMove(o, 'confirmed')}
                    actionLabel="Confirm Payment"
                />

                {/* In Queue (Paid) */}
                <StatusColumn
                    title="Paid / Queue"
                    icon="💰"
                    color="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                    orders={columns.confirmed}
                    onAction={(o) => handleStatusMove(o, 'manufacturing')}
                    actionLabel="Start Build"
                />

                {/* In Production */}
                <StatusColumn
                    title="Manufacturing"
                    icon="🔨"
                    color="bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800"
                    orders={columns.manufacturing}
                    onAction={(o) => handleStatusMove(o, 'shipped')}
                    actionLabel="Mark Shipped"
                />

                {/* Shipped */}
                <StatusColumn
                    title="Shipped"
                    icon="🚚"
                    color="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                    orders={columns.shipped}
                    onAction={(o) => handleStatusMove(o, 'delivered')}
                    actionLabel="Mark Delivered"
                />
            </div>
        </div>
    );
}

function StatusColumn({ title, icon, color, orders, onAction, actionLabel }) {
    return (
        <div className={`rounded-xl border ${color} p-4 w-full flex flex-col`}>
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-inherit/90 backdrop-blur-sm p-1 rounded-lg z-10">
                <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                    <span>{icon}</span> {title}
                </h3>
                <span className="text-xs font-bold px-2 py-1 bg-white/50 dark:bg-black/20 rounded-full">
                    {orders.length}
                </span>
            </div>

            <div className="space-y-3">
                {orders.map(order => {
                    const cost = order.designSnapshot?.totalCost || order.totalAmount || 0;
                    const name = order.customerInfo?.name || order.shippingAddress?.fullName || 'Guest User';
                    const partsCount = order.designSnapshot?.parts?.length || order.parts?.length;

                    return (
                        <div key={order.id} className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-mono text-neutral-400">#{order.id.slice(0, 6)}</span>
                                <span className="text-xs font-bold text-green-600">₹{Number(cost).toFixed(2)}</span>
                            </div>
                            <h4 className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                                {name}
                            </h4>
                            <p className="text-xs text-neutral-500 mb-3">
                                {partsCount ? `${partsCount} items` : 'Custom Design'}
                            </p>

                            <button
                                onClick={() => onAction(order)}
                                className="w-full py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold rounded hover:opacity-90 transition-opacity"
                            >
                                {actionLabel}
                            </button>
                        </div>
                    );
                })}
                {orders.length === 0 && (
                    <div className="text-center py-8 opacity-40 text-sm">
                        No orders
                    </div>
                )}
            </div>
        </div>
    );
}
