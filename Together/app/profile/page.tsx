'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { getPostsByAuthor } from '@/src/services/PostService';
import { getDocs, getDoc, doc, query, collection, orderBy } from 'firebase/firestore';
import { db } from '@/src/config/firebase';
import { getE2E } from '@/src/lib/testMode';
import { Post } from '@/src/types';
import SignInPrompt from '@/src/components/SignInPrompt';
import PostCard from '@/src/components/PostCard';

type Tab = 'posts' | 'commented';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('posts');
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [commentedPosts, setCommentedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      const posts = await getPostsByAuthor(user!.uid, false);
      setMyPosts(posts);

      // Load commented posts
      if (getE2E()) {
        setCommentedPosts([]); // E2E: no commented posts data, skip Firestore
      } else {
        const commentedSnap = await getDocs(
          query(collection(db, 'users', user!.uid, 'commentedPosts'), orderBy('firstCommentedAt', 'desc'))
        );
        const postIds = commentedSnap.docs.map(d => d.data().postId as string);
        const fetched = await Promise.all(
          postIds.map(async (pid) => {
            const snap = await getDoc(doc(db, 'posts', pid));
            if (!snap.exists()) return null;
            return { id: snap.id, ...snap.data() } as Post;
          })
        );
        setCommentedPosts(fetched.filter(Boolean) as Post[]);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  if (!user) return <SignInPrompt message="Sign in to view your profile" />;

  return (
    <div className="min-h-screen bg-[#f5f3ff]" data-testid="profile-page">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
        <h1 className="text-lg font-bold text-gray-900">Profile</h1>
        <button
          onClick={signOut}
          className="text-xs text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-xl hover:bg-red-50"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-4">
        {/* Account card */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName ?? 'avatar'}
                className="w-14 h-14 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xl">
                {user.displayName?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-900 truncate">{user.displayName}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-gray-500">{myPosts.length} posts</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500">{commentedPosts.length} commented</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl shadow-sm p-1 gap-1">
          {(['posts', 'commented'] as Tab[]).map(t => (
            <button
              key={t}
              data-testid={t === 'posts' ? 'tab-posts' : 'tab-commented'}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                tab === t ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'posts' ? 'My Posts' : 'Commented'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-sm h-24 animate-pulse skeleton-shimmer" />
            ))}
          </div>
        ) : tab === 'posts' ? (
          myPosts.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">You haven&apos;t posted anything yet.</p>
          ) : (
            myPosts.map(p => <PostCard key={p.id} post={p} />)
          )
        ) : (
          commentedPosts.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">You haven&apos;t commented on any posts yet.</p>
          ) : (
            commentedPosts.map(p => <PostCard key={p.id} post={p} />)
          )
        )}
      </main>
    </div>
  );
}
