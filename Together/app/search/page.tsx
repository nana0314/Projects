'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Post, UserProfile } from '@/src/types';
import { searchByHashtag, searchByKeywords, getPostsByAuthor } from '@/src/services/PostService';
import { searchUsers } from '@/src/services/FriendService';
import { tokenize } from '@/src/lib/tokenizer';
import PostCard from '@/src/components/PostCard';
import Avatar from '@/src/components/Avatar';

function SearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get('q') ?? '';

  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<Post[]>([]);
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [mode, setMode] = useState<'hashtag' | 'keyword'>('keyword');

  const handleSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setSearched(true);
    setUserResults([]);

    let posts: Post[] = [];
    if (trimmed.startsWith('#')) {
      setMode('hashtag');
      posts = await searchByHashtag(trimmed.slice(1).toLowerCase());
    } else {
      setMode('keyword');
      const tokens = tokenize(trimmed);
      const [keywordPosts, users] = await Promise.all([
        searchByKeywords(tokens),
        searchUsers(trimmed),
      ]);
      // also fetch posts from matching authors and merge (dedup by id)
      const authorPostArrays = await Promise.all(users.map(u => getPostsByAuthor(u.uid)));
      const authorPosts = authorPostArrays.flat();
      const seen = new Set(keywordPosts.map(p => p.id));
      const merged = [...keywordPosts, ...authorPosts.filter(p => !seen.has(p.id))];
      posts = merged;
      setUserResults(users);
    }
    setResults(posts);
    setLoading(false);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch(query);
  };

  return (
    <div className="min-h-screen bg-[#f5f3ff]" data-testid="search-page">
      {/* Search header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 gap-2 focus-within:border-brand-400 transition-colors">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="#hashtag or keywords… 中文支持"
              data-testid="search-input"
              className="flex-1 bg-transparent text-sm py-2.5 focus:outline-none text-gray-800 placeholder-gray-400"
              autoFocus
            />
            {query && (
              <button data-testid="clear-search-btn" onClick={() => { setQuery(''); setResults([]); setSearched(false); }} className="text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={() => handleSearch(query)}
            disabled={!query.trim()}
            className="px-4 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl disabled:opacity-40 active:scale-95 transition-all"
          >
            Search
          </button>
        </div>

        <div className="flex items-center gap-3 mt-2 px-1">
          <p className="text-[11px] text-gray-400">
            {query.startsWith('#')
              ? 'Searching by exact hashtag'
              : 'Searching by keywords + people (English + 中文)'}
          </p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-3">
        {!searched && !loading && (
          <div className="space-y-4 pt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tips</p>
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              {[
                { icon: '#', label: 'Search by hashtag', example: '#rideshare' },
                { icon: '🔤', label: 'Search by English keywords', example: 'cambridge station uber' },
                { icon: '🀄', label: 'Search by Chinese keywords', example: '剑桥 优步' },
                { icon: '👤', label: 'Search by person name', example: 'John' },
              ].map(tip => (
                <div key={tip.label} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{tip.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-gray-700">{tip.label}</p>
                    <button
                      onClick={() => { setQuery(tip.example); handleSearch(tip.example); }}
                      className="text-[11px] text-brand-500 font-mono"
                    >
                      {tip.example}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm h-28 animate-pulse skeleton-shimmer" />
          ))
        )}

        {searched && !loading && results.length === 0 && userResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No posts found for &quot;{query}&quot;</p>
          </div>
        )}

        {!loading && userResults.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">People</p>
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
              {userResults.map(u => (
                <button
                  key={u.uid}
                  onClick={() => router.push(`/user/${u.uid}/`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                >
                  <Avatar src={u.photoURL} name={u.displayName} size={40} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{u.displayName}</p>
                    <p className="text-xs text-gray-400">View profile</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              ))}
            </div>
          </>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
              Posts — {results.length} result{results.length !== 1 ? 's' : ''} ({mode === 'hashtag' ? 'exact hashtag' : 'keyword'} match)
            </p>
            {results.map(p => <PostCard key={p.id} post={p} />)}
          </>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f3ff]" />}>
      <SearchInner />
    </Suspense>
  );
}
