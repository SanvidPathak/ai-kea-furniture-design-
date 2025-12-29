import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export function AnalyticsDashboard({ orders = [] }) {
    const stats = useMemo(() => {
        const total = orders.length;
        const totalRevenue = orders.reduce((sum, order) => {
            const cost = order.designSnapshot?.totalCost || order.totalAmount || 0;
            return sum + (Number(cost) || 0);
        }, 0);

        const statusCounts = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        const confirmedRevenue = orders
            .filter(o => o.status !== 'processing' && o.status !== 'cancelled')
            .reduce((sum, order) => {
                const cost = order.designSnapshot?.totalCost || order.totalAmount || 0;
                return sum + (Number(cost) || 0);
            }, 0);

        return {
            total,
            totalRevenue,
            confirmedRevenue,
            statusCounts,
            avgOrderValue: total > 0 ? totalRevenue / total : 0
        };
    }, [orders]);

    const statCards = [
        {
            label: 'Estimated Revenue',
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            icon: '💰',
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-900/20'
        },
        {
            label: 'Confirmed Revenue',
            value: `₹${stats.confirmedRevenue.toLocaleString()}`,
            icon: '✅',
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20'
        },
        {
            label: 'Total Orders',
            value: stats.total,
            icon: '📦',
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-900/20'
        },
        {
            label: 'Avg. Order Value',
            value: `₹${Math.round(stats.avgOrderValue).toLocaleString()}`,
            icon: '📈',
            color: 'text-orange-600',
            bg: 'bg-orange-50 dark:bg-orange-900/20'
        },
    ];

    return (
        <div className="space-y-8">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, idx) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`${card.bg} rounded-2xl p-6 border border-white/50 dark:border-white/5 shadow-sm`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{card.icon}</span>
                            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 capitalize">{card.label}</span>
                        </div>
                        <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${card.color}`}>
                            {card.value}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Status Breakdown */}
            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-6 flex items-center gap-2">
                    <span>📊</span> Status Breakdown
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {['processing', 'confirmed', 'manufacturing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                        <div key={status} className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
                            <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">{status}</div>
                            <div className="text-xl font-bold text-neutral-700 dark:text-neutral-300">
                                {stats.statusCounts[status] || 0}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
