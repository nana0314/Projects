'use client';

import { useState, useEffect } from 'react';
import ChartModal from './ChartModal';

interface BudgetVsActualProps {
    budget: number | null;
    actual: number;
    onBudgetChange: (amount: number) => void;
}

export default function BudgetVsActual({ budget, actual, onBudgetChange }: BudgetVsActualProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (budget !== null) {
            setInputValue(budget.toString());
        }
    }, [budget]);

    const handleSave = () => {
        const amount = parseFloat(inputValue);
        if (!isNaN(amount) && amount > 0) {
            onBudgetChange(amount);
            setIsEditing(false);
        }
    };

    const difference = budget !== null ? budget - actual : 0;
    const isOverBudget = difference < 0;
    const percentUsed = budget && budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;

    const getProgressColor = () => {
        if (percentUsed >= 100) return 'bg-red-500';
        if (percentUsed >= 80) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const renderContent = (expanded: boolean) => (
        <div className={expanded ? 'space-y-6' : 'space-y-3'}>
            {/* Budget Input */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Budget</span>
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-24 px-2 py-1 text-right text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                        />
                        <button
                            onClick={handleSave}
                            className="px-2 py-1 text-xs bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        className="text-sm font-semibold text-gray-800 hover:text-indigo-600 flex items-center gap-1"
                    >
                        ${budget?.toFixed(2) ?? 'Set Budget'}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            {budget !== null && budget > 0 && (
                <div className="space-y-1">
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getProgressColor()} transition-all duration-300`}
                            style={{ width: `${percentUsed}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>${actual.toFixed(2)} spent</span>
                        <span>{percentUsed.toFixed(0)}%</span>
                    </div>
                </div>
            )}

            {/* Difference */}
            {budget !== null && (
                <div className={`text-center py-2 rounded-lg ${isOverBudget ? 'bg-red-50' : 'bg-green-50'}`}>
                    <span className={`text-sm font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                        {isOverBudget ? 'Overspent by ' : 'Underspent by '}
                        ${Math.abs(difference).toFixed(2)}
                    </span>
                </div>
            )}

            {budget === null && (
                <p className="text-xs text-gray-400 text-center py-2">
                    Set a budget to track your spending
                </p>
            )}
        </div>
    );

    return (
        <>
            <div
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => !isEditing && setIsModalOpen(true)}
            >
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Budget vs Actual</h3>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </div>
                {renderContent(false)}
            </div>

            <ChartModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Budget vs Actual"
            >
                {renderContent(true)}
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase">Total Budget</p>
                        <p className="text-2xl font-bold text-gray-800">
                            ${budget?.toFixed(2) ?? '—'}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase">Total Spent</p>
                        <p className="text-2xl font-bold text-gray-800">
                            ${actual.toFixed(2)}
                        </p>
                    </div>
                </div>
            </ChartModal>
        </>
    );
}
