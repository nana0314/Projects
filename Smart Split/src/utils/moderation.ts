import {
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    addDoc,
    query,
    where,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/config/firebase';

// ============================================================================
// BLOCK USER
// ============================================================================

/**
 * Block a user. Creates a document in the blocker's blocked_users subcollection.
 */
export async function blockUser(userId: string, blockedId: string): Promise<void> {
    const ref = doc(db, `users/${userId}/blocked_users`, blockedId);
    await setDoc(ref, {
        blockedAt: serverTimestamp(),
        blockedId,
    });
}

/**
 * Unblock a user. Removes the document from blocked_users subcollection.
 */
export async function unblockUser(userId: string, blockedId: string): Promise<void> {
    const ref = doc(db, `users/${userId}/blocked_users`, blockedId);
    await deleteDoc(ref);
}

/**
 * Get list of blocked user IDs.
 */
export async function getBlockedUsers(userId: string): Promise<string[]> {
    const ref = collection(db, `users/${userId}/blocked_users`);
    const snapshot = await getDocs(ref);
    return snapshot.docs.map((d) => d.id);
}

// ============================================================================
// REPORT USER
// ============================================================================

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'fraud' | 'other';

/**
 * Report a user. Creates a document in the reports collection.
 */
export async function reportUser(
    reporterId: string,
    reportedId: string,
    reason: ReportReason,
    details?: string
): Promise<void> {
    await addDoc(collection(db, 'reports'), {
        reporterId,
        reportedId,
        reason,
        details: details || '',
        status: 'pending',
        createdAt: serverTimestamp(),
    });
}
