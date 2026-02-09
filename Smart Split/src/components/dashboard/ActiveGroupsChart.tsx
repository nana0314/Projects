'use client';

import { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { Group } from '@/src/types';
import { PeriodSpending } from '@/src/types/analytics';
import ChartModal from './ChartModal';

interface GroupWithAnalytics {
    group: Group;
    isActive: boolean;
    currentPeriodSpending: number;
    trendData: PeriodSpending[];
}

interface ActiveGroupsChartProps {
    groups: GroupWithAnalytics[];
}

export default function ActiveGroupsChart({ groups }: ActiveGroupsChartProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<GroupWithAnalytics | null>(null);

    const activeGroups = groups.filter((g) => g.isActive);

    const handleGroupClick = (group: GroupWithAnalytics) => {
        setSelectedGroup(group);
        setIsModalOpen(true);
    };

    const renderMiniChart = (trendData: PeriodSpending[]) => {
        const data = trendData.map((p) => ({
            name: p.label,
            value: p.totalSpending,
        }));

        return (
            <ResponsiveContainer width="100%" height={40}>
                <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Bar dataKey="value" fill="#6366f1" radius={[2, 2, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    const renderDetailChart = (trendData: PeriodSpending[]) => {
        const data = trendData.map((p) => ({
            name: p.label,
            spending: p.totalSpending,
        }));

        return (
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                        formatter={(value) => [`$${(value as number)?.toFixed(2) ?? '0.00'}`, 'Spending']}
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                    />
                    <Bar dataKey="spending" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    if (activeGroups.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Active Groups</h3>
                <div className="text-center py-4">
                    <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm text-gray-500">No active groups in the last 3 days</p>
                    <p className="text-xs text-gray-400 mt-1">View group details for analytics</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Active Groups</h3>
                    <span className="text-xs text-gray-400">{activeGroups.length} active</span>
                </div>

                <div className="space-y-3">
                    {activeGroups.slice(0, 3).map((groupData) => (
                        <div
                            key={groupData.group.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleGroupClick(groupData)}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">
                                    {groupData.group.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    ${groupData.currentPeriodSpending.toFixed(2)} this period
                                </p>
                            </div>
                            <div className="w-16">
                                {renderMiniChart(groupData.trendData)}
                            </div>
                        </div>
                    ))}
                </div>

                {activeGroups.length > 3 && (
                    <p className="text-xs text-center text-gray-400 mt-2">
                        +{activeGroups.length - 3} more active groups
                    </p>
                )}
            </div>

            <ChartModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedGroup(null); }}
                title={selectedGroup?.group.name || 'Group Analytics'}
            >
                {selectedGroup && (
                    <>
                        {renderDetailChart(selectedGroup.trendData)}
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            {selectedGroup.trendData.map((period, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">{period.label}</p>
                                    <p className="text-lg font-semibold text-gray-800">
                                        ${period.totalSpending.toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </ChartModal>
        </>
    );
}
