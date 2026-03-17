'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { getFriendProfiles, getUserProfile } from '@/src/services/FriendService';
import { createGroup } from '@/src/services/ChatService';
import { UserProfile } from '@/src/types';
import SignInPrompt from '@/src/components/SignInPrompt';
import Avatar from '@/src/components/Avatar';

export default function NewGroupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    getFriendProfiles(user.uid).then(f => { setFriends(f); setLoading(false); });
  }, [user]);

  if (!user) return <SignInPrompt />;

  const toggle = (uid: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selected.size === 0) return;
    setCreating(true);
    const myProfile = await getUserProfile(user.uid);
    const profiles: Record<string, UserProfile> = {};
    if (myProfile) profiles[user.uid] = myProfile;
    friends.filter(f => selected.has(f.uid)).forEach(f => { profiles[f.uid] = f; });

    const chatId = await createGroup(user.uid, groupName.trim(), Array.from(selected), profiles);
    router.push(`/chat/${chatId}/`);
  };

  return (
    <div className="min-h-screen bg-[#f5f3ff]" data-testid="create-group-page">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-gray-500 p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-900">New Group</h1>
        <button
          onClick={handleCreate}
          disabled={creating || selected.size === 0 || !groupName.trim()}
          className="px-4 py-1.5 bg-brand-500 text-white text-sm font-semibold rounded-xl disabled:opacity-40 active:scale-95 transition-all"
        >
          {creating ? 'Creating…' : 'Create'}
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-4">
        {/* Group name */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Group Name</label>
          <input
            type="text"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="e.g. Cambridge Ride Share"
            data-testid="group-name-input"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        {/* Friend list */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Add Friends ({selected.size} selected)
          </label>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 rounded-xl skeleton-shimmer animate-pulse" />
              ))}
            </div>
          ) : friends.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No friends yet. Add friends first.</p>
          ) : (
            friends.map(f => (
              <button
                key={f.uid}
                onClick={() => toggle(f.uid)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                  selected.has(f.uid) ? 'bg-brand-50 border border-brand-200' : 'hover:bg-gray-50'
                }`}
              >
                <Avatar src={f.photoURL} name={f.displayName} size={36} />
                <span className="flex-1 text-sm font-medium text-gray-800 text-left">{f.displayName}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected.has(f.uid) ? 'bg-brand-500 border-brand-500' : 'border-gray-300'
                }`}>
                  {selected.has(f.uid) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
