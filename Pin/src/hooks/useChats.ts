'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Unsubscribe } from 'firebase/firestore';
import { Chat, Message } from '@/src/types';
import { subscribeToChats, subscribeToMessages, sendMessage, getChatById } from '@/src/services/ChatService';

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

  return { chats, loading };
}

export function useMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!chatId) return;
    setLoading(true);
    getChatById(chatId).then(c => setChat(c));
    unsubRef.current = subscribeToMessages(chatId, (data) => {
      setMessages(data);
      setLoading(false);
    });
    return () => { unsubRef.current?.(); };
  }, [chatId]);

  const send = useCallback(async (
    sender: { uid: string; displayName: string; photoURL: string },
    body: string
  ) => {
    if (!chatId) return;
    await sendMessage(chatId, sender, body);
  }, [chatId]);

  return { messages, chat, loading, send };
}
