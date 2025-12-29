import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { subscribeToPricing, updatePricingConfig, DEFAULT_PRICING } from '../../services/configService.js';
import { toast } from 'react-hot-toast';

export function PriceConfigPanel() {
    const [config, setConfig] = useState(DEFAULT_PRICING);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToPricing((newConfig) => {
            setConfig(newConfig);
        });
        return () => unsubscribe();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        const loadingToast = toast.loading('Saving configuration...');
        try {
            await updatePricingConfig(config);
            toast.dismiss(loadingToast);
            toast.success('Configuration saved successfully!');
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (material, field, value) => {
        setConfig(prev => ({
            ...prev,
            [material]: {
                ...prev[material],
                [field]: Number(value)
            }
        }));
    };

    const handleLaborChange = (value) => {
        setConfig(prev => ({
            ...prev,
            laborRate: Number(value)
        }));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">⚙️ Website Configuration</h2>
                    <p className="text-sm text-neutral-500 mt-1">Manage global material rates and engineering constants.</p>
                </div>
                <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="px-6 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Material Costs */}
                <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Material Rates (INR per cm³)</h3>
                    <div className="grid gap-4">
                        {Object.entries(config).map(([key, val]) => {
                            if (key === 'laborRate') return null;
                            return (
                                <div key={key} className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">{val.label}</label>
                                        <span className="text-xs text-neutral-400 font-mono capitalize">{key}</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-xs text-neutral-400 block mb-1">Cost per cm³</span>
                                            <input
                                                type="number"
                                                step="0.001"
                                                value={val.cost}
                                                onChange={(e) => handleChange(key, 'cost', e.target.value)}
                                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-xs text-neutral-400 block mb-1">Density (g/cm³)</span>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={val.density}
                                                onChange={(e) => handleChange(key, 'density', e.target.value)}
                                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Other Config */}
                <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Engineering & Labor</h3>
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Base Labor Multiplier</label>
                            <span className="text-xs text-neutral-400 font-mono">laborRate</span>
                        </div>
                        <p className="text-xs text-neutral-500 mb-4">Global multiplier applied to complex part calculations.</p>
                        <input
                            type="number"
                            step="1"
                            value={config.laborRate}
                            onChange={(e) => handleLaborChange(e.target.value)}
                            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        />
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-2xl border border-purple-100 dark:border-purple-800/30">
                        <h4 className="text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">Note for Admins</h4>
                        <p className="text-xs text-purple-600/80 dark:text-purple-400/80 leading-relaxed">
                            Changes made here will affect ALL future designs generated by users. Existing designs saved in the database will retain their original cost at the time of creation to ensure historical accuracy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
