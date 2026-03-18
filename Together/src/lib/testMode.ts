/**
 * testMode.ts
 * Provides a lightweight test-data override mechanism.
 * Services check window.__E2E__ first; if present they skip real Firestore.
 * Data is injected by Playwright's addInitScript before the page loads.
 */

import { Post, UserProfile, FriendRequest, Chat, Message } from '@/src/types';

export interface E2EData {
  posts?:          Post[];
  postById?:       Record<string, Post>;
  commentsByPost?: Record<string, import('@/src/types').Comment[]>;
  users?:          Record<string, UserProfile>;
  friendRequests?: FriendRequest[];
  friendships?:    string[][];   // arrays of two UIDs
  chats?:          Chat[];
  chatById?:       Record<string, Chat>;
  messagesByChat?: Record<string, Message[]>;
}

export function getE2E(): E2EData | null {
  if (typeof window === 'undefined') return null;
  return (window as Record<string, unknown>).__E2E__ as E2EData ?? null;
}
