import {
  collection, doc, addDoc, deleteDoc, getDocs,
  query, orderBy, serverTimestamp, setDoc, Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/config/firebase';
import { Comment } from '@/src/types';
import { incrementCommentCount } from './PostService';
import { getE2E } from '@/src/lib/testMode';

function commentsCol(postId: string) {
  return collection(db, 'posts', postId, 'comments');
}

export async function addComment(
  postId: string,
  data: { authorId: string; authorName: string; authorPhoto: string; body: string; parentId: string | null }
): Promise<Comment> {
  if (getE2E()) {
    return { id: `comment-e2e-${Date.now()}`, ...data, createdAt: Timestamp.now() };
  }
  const ref = await addDoc(commentsCol(postId), {
    ...data,
    createdAt: serverTimestamp(),
  });
  await incrementCommentCount(postId, 1);

  // track in user's commentedPosts
  await setDoc(
    doc(db, 'users', data.authorId, 'commentedPosts', postId),
    { postId, firstCommentedAt: Timestamp.now() },
    { merge: true }
  );

  return { id: ref.id, ...data, createdAt: Timestamp.now() };
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  if (getE2E()) return; // E2E mode: skip real write
  await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
  await incrementCommentCount(postId, -1);
}

export async function listComments(postId: string): Promise<Comment[]> {
  const e2e = getE2E();
  if (e2e?.commentsByPost !== undefined) return e2e.commentsByPost[postId] ?? [];
  const snap = await getDocs(query(commentsCol(postId), orderBy('createdAt', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
}
