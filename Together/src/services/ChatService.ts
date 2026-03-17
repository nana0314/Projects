import {
  collection, doc, addDoc, getDocs, getDoc,
  query, where, orderBy, limit, onSnapshot,
  serverTimestamp, updateDoc, arrayUnion, arrayRemove,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/src/config/firebase';
import { Chat, Message, UserProfile } from '@/src/types';

const CHATS = 'chats';

// ── Create ─────────────────────────────────────────────────────────────────────

export async function createDM(uid1: string, uid2: string, profiles: Record<string, UserProfile>): Promise<string> {
  // Check if DM already exists
  const snap = await getDocs(
    query(collection(db, CHATS), where('type', '==', 'dm'), where('participantIds', 'array-contains', uid1))
  );
  for (const d of snap.docs) {
    const ids: string[] = d.data().participantIds;
    if (ids.includes(uid2)) return d.id;
  }

  const participantNames: Record<string, string> = {};
  const participantPhotos: Record<string, string> = {};
  [uid1, uid2].forEach(id => {
    participantNames[id] = profiles[id]?.displayName ?? 'User';
    participantPhotos[id] = profiles[id]?.photoURL ?? '';
  });

  const ref = await addDoc(collection(db, CHATS), {
    type: 'dm',
    participantIds: [uid1, uid2],
    participantNames,
    participantPhotos,
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function createGroup(
  adminId: string,
  groupName: string,
  memberIds: string[],
  profiles: Record<string, UserProfile>
): Promise<string> {
  const participantIds = Array.from(new Set([adminId, ...memberIds]));
  const participantNames: Record<string, string> = {};
  const participantPhotos: Record<string, string> = {};
  participantIds.forEach(id => {
    participantNames[id] = profiles[id]?.displayName ?? 'User';
    participantPhotos[id] = profiles[id]?.photoURL ?? '';
  });

  const ref = await addDoc(collection(db, CHATS), {
    type: 'group',
    groupName,
    adminId,
    participantIds,
    participantNames,
    participantPhotos,
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Messages ───────────────────────────────────────────────────────────────────

export async function sendMessage(
  chatId: string,
  sender: { uid: string; displayName: string; photoURL: string },
  body: string
): Promise<void> {
  await addDoc(collection(db, CHATS, chatId, 'messages'), {
    senderId: sender.uid,
    senderName: sender.displayName,
    senderPhoto: sender.photoURL,
    body,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, CHATS, chatId), {
    lastMessage: body.slice(0, 60),
    lastMessageAt: serverTimestamp(),
  });
}

export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, CHATS, chatId, 'messages'), orderBy('createdAt', 'asc')),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)))
  );
}

// ── Chat list ──────────────────────────────────────────────────────────────────

export async function getUserChats(userId: string): Promise<Chat[]> {
  const snap = await getDocs(
    query(collection(db, CHATS), where('participantIds', 'array-contains', userId), orderBy('lastMessageAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Chat));
}

export function subscribeToChats(userId: string, callback: (chats: Chat[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, CHATS), where('participantIds', 'array-contains', userId), orderBy('lastMessageAt', 'desc')),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Chat)))
  );
}

export async function getChatById(chatId: string): Promise<Chat | null> {
  const snap = await getDoc(doc(db, CHATS, chatId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Chat;
}

// ── Group management ───────────────────────────────────────────────────────────

export async function addMemberToGroup(
  chatId: string,
  newMemberId: string,
  profile: UserProfile
): Promise<void> {
  await updateDoc(doc(db, CHATS, chatId), {
    participantIds: arrayUnion(newMemberId),
    [`participantNames.${newMemberId}`]: profile.displayName,
    [`participantPhotos.${newMemberId}`]: profile.photoURL,
  });
}

export async function removeMemberFromGroup(chatId: string, memberId: string): Promise<void> {
  await updateDoc(doc(db, CHATS, chatId), {
    participantIds: arrayRemove(memberId),
  });
}
