'use client';

import { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { PeriodSpending, TrendComparison } from '@/src/types/analytics';
import ChartModal from './ChartModal';

interface SpendingTrendChartProps {
    trendData: PeriodSpending[];
    comparison: TrendComparison;
    compact?: boolean;
}

export default function SpendingTrendChart({ trendData, comparison, compact = true }: SpendingTrendChartProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const chartData = trendData.map((period) => ({
        name: period.label,
        spending: Math.round(period.totalSpending * 100) / 100,
    }));

    const getTrendMessage = () => {
        if (comparison.direction === 'no-data') {
            return 'No previous data to compare';
        }
        if (comparison.direction === 'unchanged') {
            return 'Spending unchanged from previous period';
        }
        const arrow = comparison.direction === 'increased' ? '↑' : '↓';
        const color = comparison.direction === 'increased' ? 'text-red-500' : 'text-green-500';
        return (
            <span className={color}>
                {arrow} {comparison.percentageChange?.toFixed(1)}% {comparison.direction} from previous period
            </span>
        );
    };

    const renderChart = (height: number) => (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#666' }}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 12, fill: '#666' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                    formatter={(value) => [`$${(value as number)?.toFixed(2) ?? '0.00'}`, 'Spending']}
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="spending"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#4f46e5' }}
                />
            </LineChart>
        </ResponsiveContainer>
    );

    return (
        <>
            <div
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsModalOpen(true)}
            >
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Spending Trend</h3>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </div>

                {compact ? renderChart(120) : renderChart(200)}

                <p className="text-xs text-gray-500 mt-2 text-center">
                    {getTrendMessage()}
                </p>
            </div>

            <ChartModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Spending Trend"
            >
                {renderChart(300)}
                <p className="text-sm text-gray-600 mt-4 text-center">
                    {getTrendMessage()}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    {trendData.map((period, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{period.label}</p>
                            <p className="text-lg font-semibold text-gray-800">${period.totalSpending.toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            </ChartModal>
        </>
    );
}
