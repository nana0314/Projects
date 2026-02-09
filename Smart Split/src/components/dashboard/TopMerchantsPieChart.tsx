'use client';

import { useState } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts';
import { MerchantBreakdown } from '@/src/types/analytics';
import ChartModal from './ChartModal';

interface TopMerchantsPieChartProps {
    data: MerchantBreakdown[];
}

export default function TopMerchantsPieChart({ data }: TopMerchantsPieChartProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const chartData = data.map((item) => ({
        name: item.merchant,
        value: Math.round(item.amount * 100) / 100,
        percentage: item.percentage,
        color: item.color,
    }));

    const renderChart = (height: number, showLegend: boolean) => (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={height > 150 ? 40 : 25}
                    outerRadius={height > 150 ? 80 : 45}
                    paddingAngle={2}
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => [`$${(value as number)?.toFixed(2) ?? '0.00'}`, 'Amount']}
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                />
                {showLegend && (
                    <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        formatter={(value, entry: any) => (
                            <span className="text-xs text-gray-600">
                                {value} ({entry.payload.percentage.toFixed(1)}%)
                            </span>
                        )}
                    />
                )}
            </PieChart>
        </ResponsiveContainer>
    );

    if (data.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Merchants</h3>
                <div className="h-24 flex items-center justify-center text-gray-400 text-sm">
                    No spending data
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsModalOpen(true)}
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Top Merchants</h3>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </div>
                {renderChart(100, false)}
            </div>

            <ChartModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Top 3 Merchants"
            >
                {renderChart(250, true)}
                <div className="mt-4 space-y-2">
                    {data.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-sm text-gray-700">{item.merchant}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-semibold text-gray-800">${item.amount.toFixed(2)}</span>
                                <span className="text-xs text-gray-500 ml-2">({item.percentage.toFixed(1)}%)</span>
                            </div>
                        </div>
                    ))}
                </div>
            </ChartModal>
        </>
    );
}
