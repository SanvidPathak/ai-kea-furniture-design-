import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { FactoryBoard } from '../components/admin/FactoryBoard.jsx';
import { subscribeToAllOrders } from '../services/adminService.js';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard.jsx';
import { PriceConfigPanel } from '../components/admin/PriceConfigPanel.jsx';

export function StudioPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('simulation'); // simulation, analytics, config
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Centralized subscription for all admin tabs
        const unsubscribe = subscribeToAllOrders((updatedOrders) => {
            setOrders(updatedOrders);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const tabs = [
        { id: 'simulation', label: 'Order Simulation', icon: '🏭' },
        { id: 'analytics', label: 'Analytics', icon: '📊' },
        { id: 'config', label: 'Site Config', icon: '⚙️' },
    ];

    return (
        <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 pb-12">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6 md:p-8"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                                <span className="text-4xl">🛠️</span> Studio Command Center
                            </h1>
                            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                                Welcome back, <strong>{user?.name}</strong>. Managing global operations.
                            </p>
                        </div>
                        <div className="self-start md:self-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold border border-purple-200 dark:border-purple-800">
                            Admin Access Active
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex flex-wrap gap-2 mb-8 border-b border-neutral-200 dark:border-neutral-700 pb-px">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative ${activeTab === tab.id
                                    ? 'text-neutral-900 dark:text-white'
                                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'simulation' && (
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">🏭 Order Management (Simulation)</h2>
                                    </div>
                                    <FactoryBoard orders={orders} loading={loading} />
                                </section>
                            )}

                            {activeTab === 'analytics' && (
                                <AnalyticsDashboard orders={orders} />
                            )}

                            {activeTab === 'config' && (
                                <PriceConfigPanel />
                            )}
                        </motion.div>
                    </AnimatePresence>

                </motion.div>
            </div>
        </div>
    );
}
