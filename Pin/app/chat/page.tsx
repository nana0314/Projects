'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/context/AuthContext';
import { useChats } from '@/src/hooks/useChats';
import SignInPrompt from '@/src/components/SignInPrompt';
import Avatar from '@/src/components/Avatar';
import { Chat } from '@/src/types';

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
            <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
            <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{timeAgo(chat.lastMessageAt)}</span>
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{chat.lastMessage || 'No messages yet'}</p>
        </div>
      </div>
    </Link>
  );
}

export default function ChatListPage() {
  const { user } = useAuth();
  const { chats, loading } = useChats(user?.uid ?? null);
  const router = useRouter();

  if (!user) return <SignInPrompt message="Sign in to access chats" />;

  return (
    <div className="min-h-screen bg-[#f5f3ff]" data-testid="chat-list-page">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
        <h1 className="text-lg font-bold text-gray-900">Chats</h1>
        <Link
          href="/chat/new-group/"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="New group"
        >
          <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </Link>
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
              <p className="text-xs text-gray-400 mt-1">Add a friend to start chatting</p>
            </div>
          </div>
        ) : (
          chats.map(chat => <ChatItem key={chat.id} chat={chat} currentUserId={user.uid} />)
        )}
      </main>
    </div>
  );
}
