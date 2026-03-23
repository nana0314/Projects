import {
  collection, doc, addDoc, deleteDoc, getDoc, getDocs,
  query, where, orderBy, limit, startAfter,
  DocumentSnapshot, serverTimestamp, updateDoc, increment,
} from 'firebase/firestore';
import { db } from '@/src/config/firebase';
import { Post } from '@/src/types';
import { buildSearchTokens } from '@/src/lib/tokenizer';
import { getE2E } from '@/src/lib/testMode';

const POSTS = 'posts';

export async function createPost(
  data: Omit<Post, 'id' | 'createdAt' | 'searchTokens' | 'commentCount'>
): Promise<string> {
  const searchTokens = buildSearchTokens([data.header, data.title, data.body.slice(0, 150), ...data.hashtags]);
  const payload: Record<string, unknown> = {
    ...data,
    searchTokens,
    commentCount: 0,
    createdAt: serverTimestamp(),
  };
  if (!payload.imageURL) delete payload.imageURL;
  const ref = await addDoc(collection(db, POSTS), payload);
  return ref.id;
}

export async function deletePost(postId: string): Promise<void> {
  if (getE2E()) return; // E2E mode: skip real write
  await deleteDoc(doc(db, POSTS, postId));
}

export async function getPostById(postId: string): Promise<Post | null> {
  const e2e = getE2E();
  if (e2e?.postById?.[postId]) return e2e.postById[postId];
  if (e2e?.posts) return e2e.posts.find(p => p.id === postId) ?? null;
  const snap = await getDoc(doc(db, POSTS, postId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Post;
}

export async function getFeedPosts(
  pageSize = 10,
  cursor?: DocumentSnapshot
): Promise<{ posts: Post[]; cursor: DocumentSnapshot | null }> {
  const e2e = getE2E();
  if (e2e?.posts && !cursor) return { posts: e2e.posts, cursor: null };
  let q = query(
    collection(db, POSTS),
    where('visibility', '==', 'public'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  if (cursor) q = query(q, startAfter(cursor));
  const snap = await getDocs(q);
  const posts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
  const newCursor = snap.docs[snap.docs.length - 1] ?? null;
  return { posts, cursor: newCursor };
}

export async function getPostsByAuthor(authorId: string, publicOnly = true): Promise<Post[]> {
  const e2e = getE2E();
  if (e2e?.posts) {
    const posts = e2e.posts.filter(p => p.authorId === authorId);
    return publicOnly ? posts.filter(p => p.visibility === 'public') : posts;
  }
  // Always filter by visibility == 'public' when reading another user's posts so
  // Firestore security rules (which require visibility == 'public' for non-owners)
  // can be satisfied at query time. Pass publicOnly=false only when the caller is
  // the post owner and has already verified ownership separately.
  const constraints = publicOnly
    ? [where('authorId', '==', authorId), where('visibility', '==', 'public'), orderBy('createdAt', 'desc')]
    : [where('authorId', '==', authorId), orderBy('createdAt', 'desc')];
  const snap = await getDocs(query(collection(db, POSTS), ...constraints));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
}

export async function searchByHashtag(tag: string): Promise<Post[]> {
  const e2e = getE2E();
  if (e2e?.posts) return e2e.posts.filter(p => p.visibility === 'public' && p.hashtags.includes(tag.toLowerCase()));
  const snap = await getDocs(
    query(
      collection(db, POSTS),
      where('visibility', '==', 'public'),
      where('hashtags', 'array-contains', tag.toLowerCase()),
      orderBy('createdAt', 'asc')
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
}

export async function searchByKeywords(tokens: string[]): Promise<Post[]> {
  const e2e = getE2E();
  if (e2e?.posts) {
    return e2e.posts
      .filter(p => p.visibility === 'public' && tokens.some(t => p.searchTokens.includes(t)))
      .sort((a, b) => tokens.filter(t => b.searchTokens.includes(t)).length - tokens.filter(t => a.searchTokens.includes(t)).length);
  }
  const q = query(
    collection(db, POSTS),
    where('visibility', '==', 'public'),
    where('searchTokens', 'array-contains-any', tokens.slice(0, 30))
  );
  const snap = await getDocs(q);
  const posts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
  // rank by match count descending
  return posts.sort((a, b) => {
    const scoreA = tokens.filter(t => a.searchTokens.includes(t)).length;
    const scoreB = tokens.filter(t => b.searchTokens.includes(t)).length;
    return scoreB - scoreA;
  });
}

export async function incrementCommentCount(postId: string, delta: 1 | -1): Promise<void> {
  await updateDoc(doc(db, POSTS, postId), { commentCount: increment(delta) });
}
