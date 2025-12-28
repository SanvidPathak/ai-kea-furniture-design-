import React from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { motion } from 'framer-motion';
import { FactoryBoard } from '../components/admin/FactoryBoard.jsx';

export function StudioPage() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pt-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 p-8"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                                <span className="text-4xl">🛠️</span> Studio Command Center
                            </h1>
                            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                                Welcome back, <strong>{user?.name}</strong>. Managing global operations.
                            </p>
                        </div>
                        <div className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold border border-purple-200 dark:border-purple-800">
                            Admin Access Active
                        </div>
                    </div>

                    <div className="border-b border-neutral-200 dark:border-neutral-700 mb-6 pb-2">
                        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">🏭 Order Management (Simulation)</h2>
                    </div>

                    <FactoryBoard />

                </motion.div>
            </div>
        </div>
    );
}
