'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/context/AuthContext';
import { getAllInsights, getInsightSettings, setInsightEnabled } from '@/src/utils/insights';
import { WeeklyInsight } from '@/src/types/insights';
import { format } from 'date-fns';

export default function InsightsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [insights, setInsights] = useState<WeeklyInsight[]>([]);
    const [enabled, setEnabled] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
            return;
        }
        if (user) loadData();
    }, [user, loading]);

    const loadData = async () => {
        if (!user) return;
        try {
            setLoadingData(true);
            const [settings, allInsights] = await Promise.all([
                getInsightSettings(user.uid),
                getAllInsights(user.uid),
            ]);
            setEnabled(settings.enabled);
            setInsights(allInsights);
        } catch (err) {
            console.error('Failed to load insights:', err);
        } finally {
            setLoadingData(false);
        }
    };

    const handleToggle = async () => {
        if (!user) return;
        setToggling(true);
        try {
            await setInsightEnabled(user.uid, !enabled);
            setEnabled(!enabled);
        } catch (err) {
            console.error('Toggle error:', err);
        } finally {
            setToggling(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <Link
                    href="/dashboard"
                    className="text-gray-600 hover:text-gray-900 flex items-center gap-1 active:scale-95 transition-transform"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </Link>
                <h1 className="text-lg font-semibold text-gray-900">🤖 AI Insights</h1>
                <div className="w-14" />
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                {/* Settings */}
                <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800">Weekly AI Insights</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {enabled ? 'Your spending is analyzed weekly by AI' : 'Enable to get personalized spending analysis'}
                        </p>
                    </div>
                    <button
                        onClick={handleToggle}
                        disabled={toggling}
                        className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-purple-600' : 'bg-gray-300'}`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : ''}`}
                        />
                    </button>
                </div>

                {loadingData ? (
                    <div className="text-center py-12 text-gray-500">Loading insights...</div>
                ) : insights.length === 0 ? (
                    <div className="bg-white rounded-xl shadow p-8 text-center">
                        <span className="text-4xl">🤖</span>
                        <h3 className="text-lg font-semibold text-gray-800 mt-3">No Insights Yet</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {enabled
                                ? 'Your first insight will be generated this Sunday. Keep tracking your expenses!'
                                : 'Enable AI Insights above to start receiving weekly spending analysis.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {insights.map((insight) => (
                            <div key={insight.id} className="bg-white rounded-xl shadow p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-800">
                                        Week of {format(insight.weekOf.toDate(), 'MMM dd, yyyy')}
                                    </h3>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${insight.comparisonToPrevWeek <= 0
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-red-50 text-red-700'
                                        }`}>
                                        {insight.comparisonToPrevWeek > 0 ? '↑' : '↓'} {Math.abs(insight.comparisonToPrevWeek).toFixed(0)}%
                                    </span>
                                </div>

                                <p className="text-sm text-gray-700 leading-relaxed mb-3">{insight.summary}</p>

                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                        <p className="text-xs text-gray-500">Total</p>
                                        <p className="text-sm font-bold text-gray-800">${insight.totalSpent.toFixed(0)}</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-2 text-center">
                                        <p className="text-xs text-purple-600">Personal</p>
                                        <p className="text-sm font-bold text-purple-800">${insight.personalExpenses.toFixed(0)}</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                                        <p className="text-xs text-blue-600">Shared</p>
                                        <p className="text-sm font-bold text-blue-800">${insight.sharedExpenses.toFixed(0)}</p>
                                    </div>
                                </div>

                                {/* Top category */}
                                <div className="text-xs text-gray-500 mb-2">
                                    Top category: <span className="font-medium text-gray-700">{insight.topCategory}</span> (${insight.topCategoryAmount.toFixed(0)})
                                </div>

                                {/* Tips */}
                                {insight.tips.length > 0 && (
                                    <div className="border-t border-gray-100 pt-3 mt-2">
                                        <p className="text-xs font-semibold text-gray-600 mb-1.5">💡 Tips</p>
                                        <ul className="space-y-1">
                                            {insight.tips.map((tip, i) => (
                                                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                                    <span className="text-purple-500 mt-0.5">•</span>
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
