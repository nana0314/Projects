'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/src/context/AuthContext';
import { getLatestInsight, getInsightSettings, setInsightEnabled } from '@/src/utils/insights';
import { WeeklyInsight } from '@/src/types/insights';

export default function InsightsCard() {
    const { user } = useAuth();
    const [insight, setInsight] = useState<WeeklyInsight | null>(null);
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const [settings, latestInsight] = await Promise.all([
                getInsightSettings(user.uid),
                getLatestInsight(user.uid),
            ]);
            setEnabled(settings.enabled);
            setInsight(latestInsight);
        } catch (err) {
            console.error('Failed to load insights:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async () => {
        if (!user) return;
        setToggling(true);
        try {
            await setInsightEnabled(user.uid, !enabled);
            setEnabled(!enabled);
        } catch (err) {
            console.error('Failed to toggle insights:', err);
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100 animate-pulse">
                <div className="h-4 w-32 bg-purple-200 rounded mb-3" />
                <div className="h-3 w-48 bg-purple-100 rounded" />
            </div>
        );
    }

    // Not enabled yet — show CTA
    if (!enabled) {
        return (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">🤖</span>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-purple-900">AI Weekly Insights</h3>
                        <p className="text-xs text-purple-700 mt-1">
                            Get personalized spending analysis and savings tips powered by AI, delivered weekly.
                        </p>
                        <button
                            onClick={handleToggle}
                            disabled={toggling}
                            className="mt-3 px-4 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {toggling ? 'Enabling...' : 'Enable AI Insights'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Enabled but no insight yet
    if (!insight) {
        return (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">🤖</span>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-purple-900">AI Insights Enabled</h3>
                        <p className="text-xs text-purple-700 mt-1">
                            Your first weekly insight will be generated soon. Check back after this Sunday!
                        </p>
                        <button
                            onClick={handleToggle}
                            disabled={toggling}
                            className="mt-2 text-xs text-purple-500 underline hover:text-purple-700"
                        >
                            {toggling ? 'Disabling...' : 'Disable'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Has insight — show preview
    return (
        <Link href="/insights" className="block">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100 hover:border-purple-200 transition-colors">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl">🤖</span>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-purple-900">Weekly Insight</h3>
                            <p className="text-xs text-purple-800 mt-1 line-clamp-2">{insight.summary}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs font-medium text-purple-700">
                                    ${insight.totalSpent.toFixed(0)} spent
                                </span>
                                <span className={`text-xs font-medium ${insight.comparisonToPrevWeek <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {insight.comparisonToPrevWeek > 0 ? '↑' : '↓'} {Math.abs(insight.comparisonToPrevWeek).toFixed(0)}% vs last week
                                </span>
                            </div>
                        </div>
                    </div>
                    <svg className="w-4 h-4 text-purple-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}
