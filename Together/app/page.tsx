'use client';

import { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useFeed } from '@/src/hooks/useFeed';
import PostCard from '@/src/components/PostCard';
import { useAuth } from '@/src/context/AuthContext';
import { useNotificationCount } from '@/src/hooks/useFriends';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2 animate-pulse">
      <div className="h-4 w-24 rounded-full skeleton-shimmer" />
      <div className="h-5 w-3/4 rounded skeleton-shimmer" />
      <div className="h-3 w-full rounded skeleton-shimmer" />
      <div className="h-3 w-2/3 rounded skeleton-shimmer" />
      <div className="flex gap-2 pt-1">
        <div className="h-6 w-6 rounded-full skeleton-shimmer" />
        <div className="h-3 w-20 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { posts, loading, hasMore, loadMore, refresh } = useFeed();
  const { user } = useAuth();
  const notifCount = useNotificationCount(user?.uid ?? null);

  useEffect(() => { refresh(); }, [refresh]);

  const handleScroll = useCallback(() => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;
    if (nearBottom) loadMore();
  }, [loadMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="min-h-screen bg-[#f5f3ff]" data-testid="feed-page">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900">pin</h1>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <Link href="/notifications/" aria-label="notifications" data-testid="notifications-link">
              <div className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {notifCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </div>
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-3" data-testid="posts-list">
        {loading && posts.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No posts yet. Be the first!</p>
            <Link href="/create/" className="px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-brand-600 transition-colors active:scale-95">
              Create Post
            </Link>
          </div>
        ) : (
          <>
            {posts.map(post => <PostCard key={post.id} post={post} />)}
            {loading && <SkeletonCard />}
            {!hasMore && posts.length > 0 && (
              <p className="text-center text-xs text-gray-400 py-4">You&apos;re all caught up</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
