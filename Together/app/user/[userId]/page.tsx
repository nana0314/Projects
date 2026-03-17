'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import {
  getUserProfile,
  sendFriendRequest,
  areFriends,
  getOutgoingRequest,
  removeFriend,
  blockUser,
  reportUser,
} from '@/src/services/FriendService';
import { getPostsByAuthor } from '@/src/services/PostService';
import { createDM } from '@/src/services/ChatService';
import { UserProfile, Post } from '@/src/types';
import Avatar from '@/src/components/Avatar';
import PostCard from '@/src/components/PostCard';

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<'none' | 'friends' | 'pending_sent' | 'self'>('none');
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [prof, userPosts] = await Promise.all([
        getUserProfile(userId),
        getPostsByAuthor(userId),
      ]);
      setProfile(prof);
      setPosts(userPosts);

      if (user) {
        if (user.uid === userId) {
          setFriendStatus('self');
        } else {
          const [friends, outgoing] = await Promise.all([
            areFriends(user.uid, userId),
            getOutgoingRequest(user.uid, userId),
          ]);
          if (friends) setFriendStatus('friends');
          else if (outgoing) { setFriendStatus('pending_sent'); setPendingRequestId(outgoing.id); }
          else setFriendStatus('none');
        }
      }
      setLoading(false);
    }
    load();
  }, [userId, user]);

  const handleAddFriend = async () => {
    if (!user || !profile) return;
    setActionLoading(true);
    await sendFriendRequest(
      { uid: user.uid, displayName: user.displayName ?? 'User', photoURL: user.photoURL ?? '' },
      userId
    );
    setFriendStatus('pending_sent');
    setActionLoading(false);
  };

  const handleRemoveFriend = async () => {
    if (!user) return;
    setActionLoading(true);
    await removeFriend(user.uid, userId);
    setFriendStatus('none');
    setActionLoading(false);
    setShowMoreMenu(false);
  };

  const handleBlock = async () => {
    if (!user) return;
    setActionLoading(true);
    await blockUser(user.uid, userId);
    setShowMoreMenu(false);
    router.push('/');
  };

  const handleMessage = async () => {
    if (!user || !profile) return;
    setActionLoading(true);
    const profiles = {
      [user.uid]: { uid: user.uid, displayName: user.displayName ?? 'User', email: user.email ?? '', photoURL: user.photoURL ?? '' },
      [userId]: profile,
    };
    const chatId = await createDM(user.uid, userId, profiles);
    router.push(`/chat/${chatId}/`);
  };

  const handleReport = async () => {
    if (!user || !reportReason.trim()) return;
    await reportUser(user.uid, userId, reportReason.trim());
    setShowReport(false);
    setShowMoreMenu(false);
    setReportReason('');
    alert('Report submitted.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f3ff]">
        <div className="bg-white h-48 animate-pulse skeleton-shimmer" />
        <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm h-24 skeleton-shimmer animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">User not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ff]" data-testid="user-profile-page">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-gray-500 p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-900">{profile.displayName}</h1>
        {user && friendStatus !== 'self' && (
          <div className="relative">
            <button onClick={() => setShowMoreMenu(s => !s)} className="text-gray-400 p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-8 bg-white rounded-2xl shadow-lg border border-gray-100 py-1 w-40 z-50">
                {friendStatus === 'friends' && (
                  <button onClick={handleRemoveFriend} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    Remove Friend
                  </button>
                )}
                <button onClick={() => { setShowReport(true); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  Report User
                </button>
                <button onClick={handleBlock} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                  Block User
                </button>
              </div>
            )}
          </div>
        )}
        {friendStatus === 'self' && <div className="w-8" />}
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-4">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center gap-3 text-center">
          <Avatar src={profile.photoURL} name={profile.displayName} size={72} />
          <div>
            <h2 className="text-base font-bold text-gray-900">{profile.displayName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{posts.length} posts</p>
          </div>

          {/* Action buttons */}
          {user && friendStatus !== 'self' && (
            <div className="flex gap-2 w-full">
              {friendStatus === 'none' && (
                <button
                  onClick={handleAddFriend}
                  disabled={actionLoading}
                  data-testid="add-friend-btn"
                  className="flex-1 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl active:scale-95 transition-all disabled:opacity-50"
                >
                  Add Friend
                </button>
              )}
              {friendStatus === 'pending_sent' && (
                <button disabled className="flex-1 py-2.5 bg-gray-100 text-gray-400 text-sm font-semibold rounded-xl">
                  Request Sent
                </button>
              )}
              {friendStatus === 'friends' && (
                <>
                  <button
                    onClick={handleMessage}
                    disabled={actionLoading}
                    data-testid="message-btn"
                    className="flex-1 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl active:scale-95 transition-all"
                  >
                    Message
                  </button>
                  <button
                    disabled
                    className="flex-1 py-2.5 bg-green-50 text-green-600 text-sm font-semibold rounded-xl border border-green-200"
                  >
                    Friends ✓
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Report form */}
        {showReport && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-800">Report {profile.displayName}</p>
            <textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="Describe the issue…"
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowReport(false)} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl">Cancel</button>
              <button onClick={handleReport} className="flex-1 py-2 text-sm text-white bg-red-500 rounded-xl font-semibold">Submit</button>
            </div>
          </div>
        )}

        {/* Posts */}
        <h3 className="text-sm font-semibold text-gray-500 px-1">Posts</h3>
        {posts.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No public posts yet.</p>
        ) : (
          posts.map(p => <PostCard key={p.id} post={p} />)
        )}
      </main>
    </div>
  );
}
