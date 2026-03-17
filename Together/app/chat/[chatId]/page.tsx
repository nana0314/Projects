'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { useMessages } from '@/src/hooks/useChats';
import { Message } from '@/src/types';
import Avatar from '@/src/components/Avatar';
import SignInPrompt from '@/src/components/SignInPrompt';

function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  return (
    <div className={`flex gap-2 items-end ${isMine ? 'flex-row-reverse' : ''}`} data-testid="message-bubble">
      {!isMine && <Avatar src={message.senderPhoto} name={message.senderName} size={28} />}
      <div className={`max-w-[72%] space-y-0.5 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isMine && (
          <span className="text-[10px] text-gray-400 px-1">{message.senderName}</span>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
            isMine
              ? 'bg-brand-500 text-white rounded-br-sm'
              : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
          }`}
        >
          {message.body}
        </div>
      </div>
    </div>
  );
}

export default function ChatDetailPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { messages, chat, loading, send } = useMessages(chatId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) return <SignInPrompt />;

  const isGroup = chat?.type === 'group';
  let chatName = chat?.groupName ?? 'Group Chat';
  if (!isGroup && chat) {
    const otherId = chat.participantIds.find(id => id !== user.uid);
    if (otherId && chat.participantNames) chatName = chat.participantNames[otherId] ?? 'Chat';
  }

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await send(
      { uid: user.uid, displayName: user.displayName ?? 'User', photoURL: user.photoURL ?? '' },
      text.trim()
    );
    setText('');
    setSending(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f5f3ff]" data-testid="chat-detail-page">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-3 max-w-lg mx-auto w-full">
        <button onClick={() => router.back()} className="text-gray-500 p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {!isGroup && chat && (() => {
            const otherId = chat.participantIds.find(id => id !== user.uid);
            const photo = otherId && chat.participantPhotos ? chat.participantPhotos[otherId] : null;
            return <Avatar src={photo} name={chatName} size={32} />;
          })()}
          {isGroup && (
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
          )}
          <h1 className="text-sm font-bold text-gray-900 truncate">{chatName}</h1>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
            <p className="text-xs text-gray-400">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg: Message) => (
            <MessageBubble key={msg.id} message={msg} isMine={msg.senderId === user.uid} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 max-w-lg mx-auto w-full" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Message…"
            rows={1}
            data-testid="message-input"
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
            style={{ maxHeight: 100, overflowY: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            data-testid="send-message"
            className="w-10 h-10 flex items-center justify-center bg-brand-500 rounded-xl text-white disabled:opacity-40 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
