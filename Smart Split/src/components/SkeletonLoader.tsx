'use client';

/**
 * Reusable skeleton loader components for instant-feeling page loads.
 * Uses CSS shimmer animation for the "gray shimmering boxes" effect.
 */

// Base shimmer block
export function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`bg-gray-200 rounded animate-pulse ${className}`}
        />
    );
}

// Full-page skeleton (replaces "Loading..." / "Authenticating...")
export function PageSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header skeleton */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <Skeleton className="w-24 h-6" />
                        <Skeleton className="w-10 h-10 rounded-full" />
                    </div>
                </div>
            </div>
            {/* Content skeleton */}
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
                <Skeleton className="w-full h-32 rounded-xl" />
                <Skeleton className="w-full h-48 rounded-xl" />
                <Skeleton className="w-full h-24 rounded-xl" />
            </div>
        </div>
    );
}

// Dashboard analytics skeleton
export function DashboardSkeleton() {
    return (
        <div className="space-y-4">
            {/* Insights card skeleton */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100">
                <div className="flex items-start gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-48 h-3" />
                    </div>
                </div>
            </div>
            {/* Outstanding balances skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
                <Skeleton className="w-36 h-4" />
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <Skeleton className="w-24 h-3" />
                        </div>
                        <Skeleton className="w-16 h-3" />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <Skeleton className="w-20 h-3" />
                        </div>
                        <Skeleton className="w-16 h-3" />
                    </div>
                </div>
            </div>
            {/* Filter toggle skeleton */}
            <Skeleton className="w-full h-10 rounded-xl" />
            {/* Chart skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
                <Skeleton className="w-28 h-4" />
                <Skeleton className="w-full h-40 rounded-lg" />
            </div>
            {/* Budget skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
                <div className="flex justify-between">
                    <Skeleton className="w-16 h-3" />
                    <Skeleton className="w-20 h-4" />
                </div>
                <Skeleton className="w-full h-3 rounded-full" />
            </div>
        </div>
    );
}

// Friends list skeleton
export function FriendsListSkeleton() {
    return (
        <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="w-28 h-4" />
                            <Skeleton className="w-20 h-3" />
                        </div>
                    </div>
                    <Skeleton className="w-20 h-4" />
                </div>
            ))}
        </div>
    );
}

// Groups list skeleton
export function GroupsListSkeleton() {
    return (
        <div className="divide-y divide-gray-200">
            {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="w-32 h-5" />
                            <Skeleton className="w-20 h-3" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-24 h-4" />
                        <Skeleton className="w-14 h-6 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Activity feed skeleton
export function ActivitySkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-start gap-3">
                        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between">
                                <Skeleton className="w-40 h-4" />
                                <Skeleton className="w-16 h-4" />
                            </div>
                            <Skeleton className="w-32 h-3" />
                            <Skeleton className="w-24 h-3" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
