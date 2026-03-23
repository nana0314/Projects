'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/context/AuthContext';
import { useChats } from '@/src/hooks/useChats';
import { getFriendProfiles, getUserProfile } from '@/src/services/FriendService';
import { createDM } from '@/src/services/ChatService';
import SignInPrompt from '@/src/components/SignInPrompt';
import Avatar from '@/src/components/Avatar';
import { Chat, UserProfile } from '@/src/types';

function timeAgo(ts: { seconds: number } | null | undefined): string {
  if (!ts) return '';
  const diff = Date.now() / 1000 - ts.seconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ChatItem({ chat, currentUserId }: { chat: Chat; currentUserId: string }) {
  const isGroup = chat.type === 'group';
  let name = chat.groupName ?? 'Group';
  let photo: string | null = null;

  if (!isGroup) {
    const otherId = chat.participantIds.find(id => id !== currentUserId);
    if (otherId && chat.participantNames) name = chat.participantNames[otherId] ?? 'User';
    if (otherId && chat.participantPhotos) photo = chat.participantPhotos[otherId] ?? null;
  }

  const unread = chat.unreadCounts?.[currentUserId] ?? 0;

  return (
    <Link href={`/chat/${chat.id}/`} data-testid="chat-item">
      <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:shadow-md active:scale-[0.99] transition-all">
        <div className="relative">
          <Avatar src={photo} name={name} size={46} />
          {isGroup && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>{name}</p>
            <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{timeAgo(chat.lastMessageAt)}</span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className={`text-xs truncate flex-1 ${unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
              {chat.lastMessage || 'No messages yet'}
            </p>
            {unread > 0 && (
              <span className="ml-2 min-w-[18px] h-[18px] px-1 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ChatListPage() {
  const { user } = useAuth();
  const { chats, loading } = useChats(user?.uid ?? null);
  const router = useRouter();
  const [showNewChat, setShowNewChat] = useState(false);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [startingDM, setStartingDM] = useState<string | null>(null);

  useEffect(() => {
    if (!showNewChat || !user) return;
    setLoadingFriends(true);
    getFriendProfiles(user.uid).then(f => { setFriends(f); setLoadingFriends(false); });
  }, [showNewChat, user]);

  const handleStartDM = async (friend: UserProfile) => {
    if (!user || startingDM) return;
    setStartingDM(friend.uid);
    const myProfile = await getUserProfile(user.uid);
    const profiles: Record<string, UserProfile> = { [friend.uid]: friend };
    if (myProfile) profiles[user.uid] = myProfile;
    const chatId = await createDM(user.uid, friend.uid, profiles);
    router.push(`/chat/${chatId}/`);
  };

  if (!user) return <SignInPrompt message="Sign in to access chats" />;

  return (
    <div className="min-h-screen bg-[#f5f3ff]" data-testid="chat-list-page">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
        <h1 className="text-lg font-bold text-gray-900">Chats</h1>
        <div className="flex items-center gap-1">
          {/* New DM button */}
          <button
            onClick={() => setShowNewChat(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="New direct message"
          >
            <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          {/* New group button */}
          <Link
            href="/chat/new-group/"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="New group"
          >
            <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm h-[72px] animate-pulse skeleton-shimmer" />
          ))
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">No chats yet</p>
              <p className="text-xs text-gray-400 mt-1">Tap + to message a friend</p>
            </div>
          </div>
        ) : (
          chats.map(chat => <ChatItem key={chat.id} chat={chat} currentUserId={user.uid} />)
        )}
      </main>

      {/* New DM bottom sheet */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setShowNewChat(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-t-3xl max-w-lg mx-auto w-full max-h-[70vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">New Message</h2>
              <button onClick={() => setShowNewChat(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-1">
              {loadingFriends ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl skeleton-shimmer animate-pulse" />
                ))
              ) : friends.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-500">No friends yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Add friends first to message them.</p>
                </div>
              ) : (
                friends.map(f => (
                  <button
                    key={f.uid}
                    onClick={() => handleStartDM(f)}
                    disabled={startingDM === f.uid}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <Avatar src={f.photoURL} name={f.displayName} size={42} />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900">{f.displayName}</p>
                    </div>
                    {startingDM === f.uid ? (
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
            <div className="px-4 pb-4 pt-2 border-t border-gray-100">
              <Link
                href="/chat/new-group/"
                onClick={() => setShowNewChat(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-brand-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-brand-600">New Group Chat</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
