'use client';

import { useState, useEffect, useCallback } from 'react';
import { Comment } from '@/src/types';
import { listComments, addComment, deleteComment } from '@/src/services/CommentService';

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const data = await listComments(postId);
    setComments(data);
    setLoading(false);
  }, [postId]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (
    data: { authorId: string; authorName: string; authorPhoto: string; body: string; parentId: string | null }
  ) => {
    const newComment = await addComment(postId, data);
    setComments(prev => [...prev, newComment]);
  }, [postId]);

  const remove = useCallback(async (commentId: string) => {
    await deleteComment(postId, commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  }, [postId]);

  return { comments, loading, add, remove, refresh: fetch };
}
