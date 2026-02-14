import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    updateDoc,
} from 'firebase/firestore';
import { db } from '@/src/config/firebase';
import { WeeklyInsight, InsightSettings } from '@/src/types/insights';

/**
 * Get the latest weekly insight for a user.
 */
export async function getLatestInsight(userId: string): Promise<WeeklyInsight | null> {
    const ref = collection(db, `users/${userId}/insights`);
    const q = query(ref, orderBy('weekOf', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as WeeklyInsight;
}

/**
 * Get all weekly insights for a user (for the full insights page).
 */
export async function getAllInsights(userId: string): Promise<WeeklyInsight[]> {
    const ref = collection(db, `users/${userId}/insights`);
    const q = query(ref, orderBy('weekOf', 'desc'), limit(12)); // Last 12 weeks
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as WeeklyInsight));
}

/**
 * Get AI insight settings for a user.
 */
export async function getInsightSettings(userId: string): Promise<InsightSettings> {
    const ref = doc(db, `users/${userId}/settings`, 'insights');
    const snap = await getDoc(ref);
    if (snap.exists()) {
        return snap.data() as InsightSettings;
    }
    return { enabled: false };
}

/**
 * Toggle AI insights on/off for a user.
 */
export async function setInsightEnabled(userId: string, enabled: boolean): Promise<void> {
    const ref = doc(db, `users/${userId}/settings`, 'insights');
    await setDoc(ref, { enabled }, { merge: true });

    // Also update the user document for easier Cloud Function querying
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { aiInsightsEnabled: enabled });
}
