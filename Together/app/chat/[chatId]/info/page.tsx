'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { useMessages } from '@/src/hooks/useChats';
import { getFriendProfiles, getUserProfile } from '@/src/services/FriendService';
import { addMemberToGroup, removeMemberFromGroup } from '@/src/services/ChatService';
import { UserProfile, Message } from '@/src/types';
import Avatar from '@/src/components/Avatar';
import SignInPrompt from '@/src/components/SignInPrompt';

const MUTE_KEY = (chatId: string) => `muted_${chatId}`;

export default function ChatInfoPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { messages, chat } = useMessages(chatId, user?.uid);

  const [memberSearch, setMemberSearch] = useState('');
  const [muted, setMuted] = useState(false);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addingMember, setAddingMember] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [showPhotos, setShowPhotos] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, UserProfile>>({});

  const isGroup = chat?.type === 'group';
  const isAdmin = chat?.adminId === user?.uid;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMuted(localStorage.getItem(MUTE_KEY(chatId)) === '1');
    }
  }, [chatId]);

  // Load profiles of all participants
  useEffect(() => {
    if (!chat) return;
    Promise.all(
      chat.participantIds.map(id => getUserProfile(id).then(p => p ? [id, p] as const : null))
    ).then(results => {
      const map: Record<string, UserProfile> = {};
      results.forEach(r => { if (r) map[r[0]] = r[1]; });
      setMemberProfiles(map);
    });
  }, [chat]);

  // Load friends for add-member sheet
  useEffect(() => {
    if (!showAddMembers || !user) return;
    getFriendProfiles(user.uid).then(setFriends);
  }, [showAddMembers, user]);

  if (!user) return <SignInPrompt />;

  const chatName = isGroup
    ? (chat?.groupName ?? 'Group')
    : (() => {
        const otherId = chat?.participantIds.find(id => id !== user.uid);
        return otherId && chat?.participantNames ? (chat.participantNames[otherId] ?? 'Chat') : 'Chat';
      })();

  const otherUserId = !isGroup ? chat?.participantIds.find(id => id !== user.uid) : undefined;

  const sharedPhotos = messages.filter(m => m.imageURL);

  const filteredMembers = chat?.participantIds.filter(id => {
    const p = memberProfiles[id];
    if (!p) return true;
    return p.displayName.toLowerCase().includes(memberSearch.toLowerCase());
  }) ?? [];

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(MUTE_KEY(chatId), next ? '1' : '0');
  };

  const handleLeave = async () => {
    if (!user || !chat) return;
    if (!confirm('Leave this conversation?')) return;
    await removeMemberFromGroup(chatId, user.uid);
    router.push('/chat/');
  };

  const handleAddMember = async (friendId: string) => {
    if (!user || addingMember) return;
    setAddingMember(friendId);
    const profile = await getUserProfile(friendId);
    if (profile) await addMemberToGroup(chatId, friendId, profile);
    setAddingMember(null);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!user || removingMember) return;
    if (!confirm('Remove this member?')) return;
    setRemovingMember(memberId);
    await removeMemberFromGroup(chatId, memberId);
    setRemovingMember(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f3ff]">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-3 max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-gray-500 p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-900 flex-1">{isGroup ? 'Group Info' : 'Chat Info'}</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-8 space-y-4">
        {/* Avatar + name */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center gap-2 text-center">
          {isGroup ? (
            <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-brand-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
          ) : (
            <Avatar
              src={otherUserId && chat?.participantPhotos ? chat.participantPhotos[otherUserId] : null}
              name={chatName}
              size={64}
            />
          )}
          <p className="text-base font-bold text-gray-900">{chatName}</p>
          {isGroup && (
            <p className="text-xs text-gray-400">{chat?.participantIds.length ?? 0} members</p>
          )}
          {!isGroup && otherUserId && (
            <button
              onClick={() => router.push(`/user/${otherUserId}/`)}
              className="mt-1 px-4 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 rounded-xl"
            >
              View Profile
            </button>
          )}
        </div>

        {/* Shared photos */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3"
            onClick={() => setShowPhotos(s => !s)}
          >
            <span className="text-sm font-semibold text-gray-800">Shared Photos</span>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-xs">{sharedPhotos.length}</span>
              <svg className={`w-4 h-4 transition-transform ${showPhotos ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </button>
          {showPhotos && (
            <div className="px-4 pb-4">
              {sharedPhotos.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No photos shared yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {sharedPhotos.map((m: Message) => (
                    <a key={m.id} href={m.imageURL} target="_blank" rel="noopener noreferrer">
                      <img src={m.imageURL} alt="" className="w-full aspect-square object-cover rounded-xl" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Members (group only) */}
        {isGroup && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 pt-3 pb-2 space-y-2">
              <p className="text-sm font-semibold text-gray-800">Members</p>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
                </svg>
                <input
                  type="text"
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Search members…"
                  className="flex-1 bg-transparent text-sm py-2 focus:outline-none"
                />
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {filteredMembers.map(id => {
                const profile = memberProfiles[id];
                const isMe = id === user.uid;
                const isThisAdmin = id === chat?.adminId;
                return (
                  <div key={id} className="flex items-center gap-3 px-4 py-2.5">
                    <Avatar src={profile?.photoURL ?? null} name={profile?.displayName ?? 'User'} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {profile?.displayName ?? 'Loading…'} {isMe && <span className="text-gray-400">(you)</span>}
                      </p>
                      {isThisAdmin && <p className="text-[10px] text-brand-500 font-semibold">Admin</p>}
                    </div>
                    {isAdmin && !isMe && (
                      <button
                        onClick={() => handleRemoveMember(id)}
                        disabled={removingMember === id}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {isAdmin && (
              <div className="px-4 py-3 border-t border-gray-100">
                <button
                  onClick={() => setShowAddMembers(true)}
                  className="w-full flex items-center gap-2 py-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  Add Members
                </button>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
          {/* Mute */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              <p className="text-sm font-medium text-gray-800">Mute notifications</p>
            </div>
            <button
              onClick={toggleMute}
              className={`relative w-10 h-5.5 rounded-full transition-colors ${muted ? 'bg-brand-500' : 'bg-gray-300'}`}
              style={{ height: '22px', width: '40px' }}
            >
              <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${muted ? 'translate-x-[18px]' : 'translate-x-0'}`}
                style={{ width: '18px', height: '18px' }} />
            </button>
          </div>

          {/* Leave group / clear history */}
          {isGroup ? (
            <button
              onClick={handleLeave}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span className="text-sm font-semibold">Leave Group</span>
            </button>
          ) : (
            <button
              onClick={() => router.push(`/user/${otherUserId}/`)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              </svg>
              <span className="text-sm font-semibold">View Profile</span>
            </button>
          )}
        </div>
      </main>

      {/* Add members bottom sheet */}
      {showAddMembers && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setShowAddMembers(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-t-3xl max-w-lg mx-auto w-full max-h-[60vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Add Members</h2>
              <button onClick={() => setShowAddMembers(false)} className="text-gray-400 p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-1">
              {friends
                .filter(f => !chat?.participantIds.includes(f.uid))
                .map(f => (
                  <button
                    key={f.uid}
                    onClick={() => handleAddMember(f.uid)}
                    disabled={addingMember === f.uid}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Avatar src={f.photoURL} name={f.displayName} size={40} />
                    <span className="flex-1 text-sm font-medium text-gray-900 text-left">{f.displayName}</span>
                    {addingMember === f.uid ? (
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-xs font-semibold text-brand-500 px-3 py-1 bg-brand-50 rounded-xl">Add</span>
                    )}
                  </button>
                ))}
              {friends.filter(f => !chat?.participantIds.includes(f.uid)).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">All friends are already in this group.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
