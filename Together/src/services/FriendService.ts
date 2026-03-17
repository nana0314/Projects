import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  query, where, or, serverTimestamp, setDoc, getDoc,
} from 'firebase/firestore';
import { db } from '@/src/config/firebase';
import { FriendRequest, Friendship, UserProfile } from '@/src/types';

const FR = 'friendRequests';
const FS = 'friendships';

// ── Friend Requests ────────────────────────────────────────────────────────────

export async function sendFriendRequest(
  from: { uid: string; displayName: string; photoURL: string },
  toId: string
): Promise<void> {
  // prevent duplicates
  const existing = await getDocs(
    query(collection(db, FR), where('fromId', '==', from.uid), where('toId', '==', toId))
  );
  if (!existing.empty) return;

  await addDoc(collection(db, FR), {
    fromId: from.uid,
    fromName: from.displayName,
    fromPhoto: from.photoURL,
    toId,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function acceptFriendRequest(requestId: string, uid1: string, uid2: string): Promise<void> {
  await updateDoc(doc(db, FR, requestId), { status: 'accepted' });
  // create friendship
  const friendshipId = [uid1, uid2].sort().join('_');
  await setDoc(doc(db, FS, friendshipId), {
    userIds: [uid1, uid2],
    createdAt: serverTimestamp(),
  });
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  await updateDoc(doc(db, FR, requestId), { status: 'declined' });
}

export async function cancelFriendRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(db, FR, requestId));
}

export async function removeFriend(uid1: string, uid2: string): Promise<void> {
  const friendshipId = [uid1, uid2].sort().join('_');
  await deleteDoc(doc(db, FS, friendshipId));
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getIncomingRequests(userId: string): Promise<FriendRequest[]> {
  const snap = await getDocs(
    query(collection(db, FR), where('toId', '==', userId), where('status', '==', 'pending'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
}

export async function getOutgoingRequest(fromId: string, toId: string): Promise<FriendRequest | null> {
  const snap = await getDocs(
    query(collection(db, FR), where('fromId', '==', fromId), where('toId', '==', toId), where('status', '==', 'pending'))
  );
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as FriendRequest;
}

export async function getFriends(userId: string): Promise<string[]> {
  const snap = await getDocs(
    query(collection(db, FS), where('userIds', 'array-contains', userId))
  );
  return snap.docs.map(d => {
    const ids = d.data().userIds as string[];
    return ids.find(id => id !== userId)!;
  });
}

export async function areFriends(uid1: string, uid2: string): Promise<boolean> {
  const friendshipId = [uid1, uid2].sort().join('_');
  const snap = await getDoc(doc(db, FS, friendshipId));
  return snap.exists();
}

// ── Block / Report ─────────────────────────────────────────────────────────────

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  await setDoc(doc(db, 'blocks', blockerId, 'blockedUsers', blockedId), {
    blockedAt: serverTimestamp(),
  });
  // also remove friendship if it exists
  await removeFriend(blockerId, blockedId);
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  await deleteDoc(doc(db, 'blocks', blockerId, 'blockedUsers', blockedId));
}

export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'blocks', blockerId, 'blockedUsers', blockedId));
  return snap.exists();
}

export async function reportUser(reporterId: string, reportedUserId: string, reason: string): Promise<void> {
  await addDoc(collection(db, 'reports'), {
    reporterId,
    reportedUserId,
    reason,
    createdAt: serverTimestamp(),
  });
}

// ── User Profile ───────────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
}

export async function getFriendProfiles(userId: string): Promise<UserProfile[]> {
  const friendIds = await getFriends(userId);
  if (!friendIds.length) return [];
  const profiles = await Promise.all(friendIds.map(id => getUserProfile(id)));
  return profiles.filter(Boolean) as UserProfile[];
}
