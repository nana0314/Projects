'use client';

import { useState } from 'react';
import { DailyAverageStats } from '@/src/types/analytics';
import { format } from 'date-fns';
import ChartModal from './ChartModal';

interface DailyAverageCardProps {
    stats: DailyAverageStats;
}

export default function DailyAverageCard({ stats }: DailyAverageCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const periodLabel = `${format(stats.periodStart, 'MMM d')} - ${format(stats.periodEnd, 'MMM d')}`;

    return (
        <>
            <div
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsModalOpen(true)}
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Daily Average</h3>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </div>

                <div className="text-center py-2">
                    <p className="text-2xl font-bold text-indigo-600">
                        ${stats.average.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">per active day</p>
                </div>
            </div>

            <ChartModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Daily Average Spending"
            >
                <div className="text-center mb-6">
                    <p className="text-4xl font-bold text-indigo-600">
                        ${stats.average.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">average per active day</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500 uppercase">Total Spent</p>
                        <p className="text-xl font-semibold text-gray-800">
                            ${stats.totalSpending.toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500 uppercase">Active Days</p>
                        <p className="text-xl font-semibold text-gray-800">
                            {stats.activeDays}
                        </p>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400">
                        Period: {periodLabel}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Only days with spending are counted
                    </p>
                </div>
            </ChartModal>
        </>
    );
}
