'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { calculateFriendOnlyBalances, calculateGroupBalances } from '@/src/utils/expenses';
import { getUserGroups } from '@/src/utils/groups';
import { getUserById } from '@/src/utils/users';
import { performSettleUpForFriend, performSettleUpForGroup } from '@/src/utils/settleUpStorage';

type SettleTarget = { type: 'friend'; id: string; name: string; photoURL?: string; net: number } | { type: 'group'; id: string; name: string; photoURL?: string; net: number };

export default function FloatingSettleUp() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [targets, setTargets] = useState<SettleTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [settling, setSettling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New state for inline confirmation and settled status
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [settledIds, setSettledIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (showModal && user) {
      loadTargets();
      setSettledIds(new Set()); // Reset settled status when modal opens
      setConfirmTarget(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, user]);

  const loadTargets = async () => {
    // ... (rest of loadTargets is fine, handled by previous code or unchanged)
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const list: SettleTarget[] = [];

      const friendBalances = await calculateFriendOnlyBalances(user.uid);
      const friendIds = new Set<string>();
      Object.entries(friendBalances.owedTo).forEach(([id, amt]) => {
        if (amt > 0) friendIds.add(id);
      });
      Object.entries(friendBalances.owedFrom).forEach(([id, amt]) => {
        if (amt > 0) friendIds.add(id);
      });
      for (const fid of friendIds) {
        const to = friendBalances.owedTo[fid] ?? 0;
        const from = friendBalances.owedFrom[fid] ?? 0;
        const net = from - to;
        if (Math.abs(net) < 0.01) continue;
        const u = await getUserById(fid);
        list.push({ type: 'friend', id: fid, name: u?.displayName ?? 'Unknown', photoURL: u?.photoURL, net });
      }

      const groups = await getUserGroups(user.uid);
      for (const g of groups) {
        try {
          const b = await calculateGroupBalances(g.id, user.uid);
          const to = Object.values(b.owedTo).reduce((s, a) => s + a, 0);
          const from = Object.values(b.owedFrom).reduce((s, a) => s + a, 0);
          const net = from - to;
          if (Math.abs(net) < 0.01) continue;
          list.push({ type: 'group', id: g.id, name: g.name, photoURL: undefined, net });
        } catch {
          /* skip */
        }
      }

      setTargets(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load balances');
      setTargets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (t: SettleTarget) => {
    if (!user) return;
    // Removed native confirm() dialog in favor of inline UI

    setSettling(true);
    setError('');
    // setSuccess(''); // Don't wipe previous success messages immediately if we want to show per-item status? 
    // actually per-item status is handled by settledIds.

    try {
      if (t.type === 'friend') {
        await performSettleUpForFriend(user.uid, t.id);
      } else {
        await performSettleUpForGroup(user.uid, t.id);
      }

      // Mark as settled locally
      setSettledIds(prev => new Set(Array.from(prev).concat([t.id])));
      setConfirmTarget(null); // Close confirm UI

      // Reload after a delay to refresh data, but allow user to see "Settled up"
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to settle up');
    } finally {
      setSettling(false);
    }
  };

  // Only show on specific pages: Friends, Activity, Groups, Expenses
  const allowedPaths = ['/activity', '/friends', '/groups', '/expenses'];
  const isAllowed = pathname && allowedPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

  if (!user || !isAllowed) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed flex flex-row items-center justify-center gap-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 overflow-hidden"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 200px)',
          right: '1rem',
          zIndex: 10000,
          padding: '12px 18px',
        }}
      >
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-semibold text-sm whitespace-nowrap">Settle up</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4 animate-fade-in">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-semibold text-gray-800">Settle up</h2>
              <button
                onClick={() => { setShowModal(false); setError(''); setSuccess(''); }}
                className="text-gray-400 hover:text-gray-600 active:scale-95 transition-transform"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <p className="mb-4 text-sm text-gray-500">
                Tap <strong className="text-gray-700">Settle</strong> next to a friend or group to clear the balance.
              </p>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {success}
                </div>
              )}
              {loading ? (
                <div className="py-8 text-center text-gray-500">Loading…</div>
              ) : targets.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No friends or groups with outstanding amounts.
                </div>
              ) : (
                <ul className="space-y-2">
                  {targets.map((t) => {
                    const isSettled = settledIds.has(t.id);
                    const isConfirming = confirmTarget === t.id;

                    return (
                      <li
                        key={`${t.type}-${t.id}`}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isSettled ? 'bg-green-50 border-green-200' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {t.photoURL ? (
                            <img
                              src={t.photoURL}
                              alt={t.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm text-gray-500 font-medium">
                                {t.type === 'group' ? 'G' : t.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-4">
                            <span className={`font-medium ${isSettled ? 'text-green-800' : 'text-gray-800'}`}>
                              {t.type === 'group' ? `Group: ${t.name}` : t.name}
                            </span>
                            <span className={`text-sm ${isSettled ? 'text-green-600 font-medium' : t.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {isSettled ? 'Settled up ✓' : (t.net >= 0 ? `You're owed $${t.net.toFixed(2)}` : `You owe $${Math.abs(t.net).toFixed(2)}`)}
                            </span>
                          </div>
                        </div>

                        {isSettled ? null : isConfirming ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setConfirmTarget(null)}
                              className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSettle(t)}
                              disabled={settling}
                              className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              Confirm
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmTarget(t.id)}
                            disabled={settling}
                            className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-transform"
                          >
                            Settle
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
