'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/context/AuthContext';
import { useFriends } from '@/src/hooks/useFriends';
import SignInPrompt from '@/src/components/SignInPrompt';
import Avatar from '@/src/components/Avatar';
import { FriendRequest } from '@/src/types';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { incoming, loading, accept, decline } = useFriends(user?.uid ?? null);

  if (!user) return <SignInPrompt message="Sign in to see notifications" />;

  return (
    <div className="min-h-screen bg-[#f5f3ff]" data-testid="notifications-page">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-3 max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-gray-500 p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-900">Notifications</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-sm h-16 animate-pulse skeleton-shimmer" />
            ))}
          </div>
        ) : incoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No new notifications</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Friend Requests</p>
            {incoming.map((req: FriendRequest) => (
              <div key={req.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3" data-testid="friend-request">
                <Link href={`/user/${req.fromId}/`}>
                  <Avatar src={req.fromPhoto} name={req.fromName} size={44} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/user/${req.fromId}/`}>
                    <p className="text-sm font-semibold text-gray-800 hover:text-brand-600">{req.fromName}</p>
                  </Link>
                  <p className="text-xs text-gray-400">wants to be friends</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => accept(req)}
                    data-testid="accept-request"
                    className="px-3 py-1.5 bg-brand-500 text-white text-xs font-semibold rounded-xl active:scale-95 transition-all"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => decline(req.id)}
                    data-testid="decline-request"
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl active:scale-95 transition-all"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
