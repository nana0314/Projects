'use client';

import { useState, useCallback, useRef } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { Post } from '@/src/types';
import { getFeedPosts } from '@/src/services/PostService';

const PAGE_SIZE = 10;

export function useFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursor = useRef<DocumentSnapshot | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const { posts: newPosts, cursor: newCursor } = await getFeedPosts(PAGE_SIZE, cursor.current ?? undefined);
      setPosts(prev => {
        const ids = new Set(prev.map(p => p.id));
        return [...prev, ...newPosts.filter(p => !ids.has(p.id))];
      });
      cursor.current = newCursor;
      if (newPosts.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore]);

  const refresh = useCallback(async () => {
    cursor.current = null;
    setHasMore(true);
    setPosts([]);
    setLoading(true);
    try {
      const { posts: newPosts, cursor: newCursor } = await getFeedPosts(PAGE_SIZE);
      setPosts(newPosts);
      cursor.current = newCursor;
      if (newPosts.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return { posts, loading, hasMore, loadMore, refresh };
}
