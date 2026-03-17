import {
  collection, doc, addDoc, deleteDoc, getDocs,
  query, orderBy, serverTimestamp, setDoc, Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/config/firebase';
import { Comment } from '@/src/types';
import { incrementCommentCount } from './PostService';

function commentsCol(postId: string) {
  return collection(db, 'posts', postId, 'comments');
}

export async function addComment(
  postId: string,
  data: { authorId: string; authorName: string; authorPhoto: string; body: string; parentId: string | null }
): Promise<Comment> {
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
  await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
  await incrementCommentCount(postId, -1);
}

export async function listComments(postId: string): Promise<Comment[]> {
  const snap = await getDocs(query(commentsCol(postId), orderBy('createdAt', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
}
