'use client';

import { useState, useEffect, useCallback } from 'react';
import { FriendRequest, UserProfile } from '@/src/types';
import {
  getIncomingRequests,
  getFriendProfiles,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  areFriends,
  getOutgoingRequest,
} from '@/src/services/FriendService';
import { getE2E } from '@/src/lib/testMode';

export function useFriends(userId: string | null) {
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [fr, fp] = await Promise.all([
      getIncomingRequests(userId),
      getFriendProfiles(userId),
    ]);
    setIncoming(fr);
    setFriends(fp);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const sendRequest = useCallback(async (
    from: { uid: string; displayName: string; photoURL: string },
    toId: string
  ) => {
    await sendFriendRequest(from, toId);
  }, []);

  const accept = useCallback(async (req: FriendRequest) => {
    await acceptFriendRequest(req.id, req.fromId, req.toId);
    setIncoming(prev => prev.filter(r => r.id !== req.id));
    if (!getE2E()) await refresh(); // skip refresh in E2E to avoid re-loading mock requests
  }, [refresh]);

  const decline = useCallback(async (requestId: string) => {
    await declineFriendRequest(requestId);
    setIncoming(prev => prev.filter(r => r.id !== requestId));
  }, []);

  const cancel = useCallback(async (requestId: string) => {
    await cancelFriendRequest(requestId);
  }, []);

  const remove = useCallback(async (otherId: string) => {
    if (!userId) return;
    await removeFriend(userId, otherId);
    setFriends(prev => prev.filter(f => f.uid !== otherId));
  }, [userId]);

  return { friends, incoming, loading, sendRequest, accept, decline, cancel, remove, areFriends, getOutgoingRequest, refresh };
}
