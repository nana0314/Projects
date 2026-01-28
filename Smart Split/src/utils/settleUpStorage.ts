const KEY_PREFIX = 'smart_split_settleup_';

export interface SettleUpData {
  lastSettleUpAt: number;
  friendIds: string[];
  groupIds: string[];
}

export function getSettleUpData(userId: string): SettleUpData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY_PREFIX + userId);
    if (!raw) return null;
    return JSON.parse(raw) as SettleUpData;
  } catch {
    return null;
  }
}

export function saveSettleUpData(userId: string, data: SettleUpData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_PREFIX + userId, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export const SETTLE_UP_HIDE_DAYS = 7;

/** Only hide settled-up friends/groups after 7 days since last settle up. */
export function shouldHideSettledUp(data: SettleUpData | null): boolean {
  if (!data) return false;
  const now = Date.now();
  const daysSince = (now - data.lastSettleUpAt) / (1000 * 60 * 60 * 24);
  return daysSince >= SETTLE_UP_HIDE_DAYS;
}

/**
 * Record settle-up metadata (friend/group IDs with balances), then call settleUpExpenses.
 * Call this instead of settleUpExpenses when the user clicks "Settle up".
 */
export async function performSettleUp(userId: string): Promise<void> {
  const { calculateUserBalances, settleUpExpenses, calculateGroupBalances } =
    await import('@/src/utils/expenses');
  const { getUserGroups } = await import('@/src/utils/groups');

  const balances = await calculateUserBalances(userId);
  const friendIds = new Set<string>();
  Object.entries(balances.owedTo).forEach(([id, amt]) => {
    if (amt > 0) friendIds.add(id);
  });
  Object.entries(balances.owedFrom).forEach(([id, amt]) => {
    if (amt > 0) friendIds.add(id);
  });

  const groups = await getUserGroups(userId);
  const groupIds: string[] = [];
  for (const g of groups) {
    try {
      const b = await calculateGroupBalances(g.id, userId);
      const to = Object.values(b.owedTo).reduce((s, a) => s + a, 0);
      const from = Object.values(b.owedFrom).reduce((s, a) => s + a, 0);
      if (Math.abs(from - to) > 0.01) groupIds.push(g.id);
    } catch {
      /* skip */
    }
  }

  saveSettleUpData(userId, {
    lastSettleUpAt: Date.now(),
    friendIds: Array.from(friendIds),
    groupIds,
  });
  await settleUpExpenses(userId);
}

/**
 * Settle up with a specific friend only (friend-to-friend expenses).
 * Updates settle-up storage and deletes those expenses.
 */
export async function performSettleUpForFriend(userId: string, friendId: string): Promise<void> {
  const { settleUpExpensesForFriend } = await import('@/src/utils/expenses');
  const existing = getSettleUpData(userId);
  const friendIds = new Set(existing?.friendIds ?? []);
  friendIds.add(friendId);
  saveSettleUpData(userId, {
    lastSettleUpAt: Date.now(),
    friendIds: Array.from(friendIds),
    groupIds: existing?.groupIds ?? [],
  });
  await settleUpExpensesForFriend(userId, friendId);
}

/**
 * Settle up for a specific group only.
 * Updates settle-up storage and deletes that group's expenses.
 */
export async function performSettleUpForGroup(userId: string, groupId: string): Promise<void> {
  const { settleUpExpensesForGroup } = await import('@/src/utils/expenses');
  const existing = getSettleUpData(userId);
  const prev = existing?.groupIds ?? [];
  const groupIds = prev.includes(groupId) ? prev : [...prev, groupId];
  saveSettleUpData(userId, {
    lastSettleUpAt: Date.now(),
    friendIds: existing?.friendIds ?? [],
    groupIds,
  });
  await settleUpExpensesForGroup(groupId);
}
