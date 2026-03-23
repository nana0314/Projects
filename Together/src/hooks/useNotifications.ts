'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/config/firebase';
import { getE2E } from '@/src/lib/testMode';

export function useNotificationCount(userId: string | null): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const e2e = getE2E();
    if (e2e?.friendRequests) {
      setCount(e2e.friendRequests.filter(r => r.toId === userId && r.status === 'pending').length);
      return;
    }
    const q = query(
      collection(db, 'friendRequests'),
      where('toId', '==', userId),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(q, snap => setCount(snap.size));
    return unsub;
  }, [userId]);

  return count;
}
