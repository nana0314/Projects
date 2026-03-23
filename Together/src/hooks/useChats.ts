'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Unsubscribe } from 'firebase/firestore';
import { Chat, Message } from '@/src/types';
import {
  subscribeToChats,
  subscribeToMessages,
  subscribeToChatDoc,
  sendMessage,
  markChatAsRead,
} from '@/src/services/ChatService';

export function useChats(userId: string | null) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    unsubRef.current = subscribeToChats(userId, (data) => {
      setChats(data);
      setLoading(false);
    });
    return () => { unsubRef.current?.(); };
  }, [userId]);

  const totalUnread = chats.reduce((sum, c) => {
    const count = userId ? (c.unreadCounts?.[userId] ?? 0) : 0;
    return sum + count;
  }, 0);

  return { chats, loading, totalUnread };
}

export function useMessages(chatId: string | null, currentUserId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubMsgsRef = useRef<Unsubscribe | null>(null);
  const unsubChatRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!chatId) return;
    setLoading(true);

    // Subscribe to chat doc in real-time (so unreadCounts etc. stay fresh)
    unsubChatRef.current = subscribeToChatDoc(chatId, (c) => setChat(c));

    // Subscribe to messages in real-time
    unsubMsgsRef.current = subscribeToMessages(chatId, (data) => {
      setMessages(data);
      setLoading(false);
    });

    // Mark chat as read when we enter
    if (currentUserId) {
      markChatAsRead(chatId, currentUserId).catch(() => {});
    }

    return () => {
      unsubChatRef.current?.();
      unsubMsgsRef.current?.();
    };
  }, [chatId, currentUserId]);

  const send = useCallback(async (
    sender: { uid: string; displayName: string; photoURL: string },
    body: string
  ) => {
    if (!chatId) return;
    const recipients = chat?.participantIds.filter(id => id !== sender.uid) ?? [];
    await sendMessage(chatId, sender, body, recipients);
  }, [chatId, chat]);

  return { messages, chat, loading, send };
}
