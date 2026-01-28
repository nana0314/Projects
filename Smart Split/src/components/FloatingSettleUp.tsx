'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { calculateFriendOnlyBalances, calculateGroupBalances } from '@/src/utils/expenses';
import { getUserGroups } from '@/src/utils/groups';
import { getUserById } from '@/src/utils/users';
import { performSettleUpForFriend, performSettleUpForGroup } from '@/src/utils/settleUpStorage';

type SettleTarget = { type: 'friend'; id: string; name: string; net: number } | { type: 'group'; id: string; name: string; net: number };

export default function FloatingSettleUp() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [targets, setTargets] = useState<SettleTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [settling, setSettling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (showModal && user) {
      loadTargets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, user]);

  const loadTargets = async () => {
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
        list.push({ type: 'friend', id: fid, name: u?.displayName ?? 'Unknown', net });
      }

      const groups = await getUserGroups(user.uid);
      for (const g of groups) {
        try {
          const b = await calculateGroupBalances(g.id, user.uid);
          const to = Object.values(b.owedTo).reduce((s, a) => s + a, 0);
          const from = Object.values(b.owedFrom).reduce((s, a) => s + a, 0);
          const net = from - to;
          if (Math.abs(net) < 0.01) continue;
          list.push({ type: 'group', id: g.id, name: g.name, net });
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
    const label = t.type === 'friend' ? t.name : `group "${t.name}"`;
    if (!confirm(`Settle up with ${label}? This will clear those expenses and cannot be undone.`)) return;

    setSettling(true);
    setError('');
    setSuccess('');
    try {
      if (t.type === 'friend') {
        await performSettleUpForFriend(user.uid, t.id);
      } else {
        await performSettleUpForGroup(user.uid, t.id);
      }
      setSuccess(`Settled up with ${label}`);
      setTimeout(() => {
        setShowModal(false);
        setSuccess('');
        window.location.reload();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to settle up');
    } finally {
      setSettling(false);
    }
  };

  // Hide on login page and Account page (profile). When user presses Account, both buttons disappear.
  const isAccountPage = pathname === '/account' || (pathname?.startsWith?.('/profile'));
  const isAddExpensePage = pathname === '/add-expense';
  if (!pathname || pathname === '/' || isAccountPage || isAddExpensePage || !user) {
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
                  {targets.map((t) => (
                    <li
                      key={`${t.type}-${t.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <div>
                        <span className="font-medium text-gray-800">
                          {t.type === 'group' ? `Group: ${t.name}` : t.name}
                        </span>
                        <span className={`ml-2 text-sm ${t.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {t.net >= 0 ? `You're owed $${t.net.toFixed(2)}` : `You owe $${Math.abs(t.net).toFixed(2)}`}
                        </span>
                      </div>
                      <button
                        onClick={() => handleSettle(t)}
                        disabled={settling}
                        className="px-3 py-1.5 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 active:scale-95 transition-transform"
                      >
                        Settle
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
