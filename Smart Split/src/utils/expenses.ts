import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/src/config/firebase';
import { Expense, ExpenseCategory } from '@/src/types';

/**
 * Create an expense
 */
export const createExpense = async (
  amount: number,
  category: ExpenseCategory,
  date: Date,
  payerId: string,
  participants: string[],
  splitType: 'equal' | 'custom',
  createdBy: string,
  groupId?: string,
  description?: string,
  splitAmounts?: { [userId: string]: number },
  participantNames?: { [userId: string]: string }
): Promise<string> => {
  const expensesRef = collection(db, 'expenses');
  const expenseRef = doc(expensesRef);

  // Validate custom split amounts
  if (splitType === 'custom' && splitAmounts) {
    const totalCustomAmount = Object.values(splitAmounts).reduce((sum, amt) => sum + amt, 0);
    if (Math.abs(totalCustomAmount - amount) > 0.01) {
      throw new Error('Custom split amounts must equal the total expense amount');
    }
  }

  const expenseData: any = {
    amount,
    category,
    date: Timestamp.fromDate(date),
    payerId,
    participants,
    splitType,
    createdAt: serverTimestamp() as any,
    createdBy,
  };

  // Only include optional fields if they have values
  if (splitType === 'custom' && splitAmounts) {
    expenseData.splitAmounts = splitAmounts;
  }
  if (groupId) {
    expenseData.groupId = groupId;
  }
  if (description) {
    expenseData.description = description;
  }
  if (participantNames) {
    expenseData.participantNames = participantNames;
  }

  await setDoc(expenseRef, expenseData);
  return expenseRef.id;
};

/**
 * Update an existing expense in-place (preserves original document ID, createdAt, and date)
 */
export const updateExpense = async (
  expenseId: string,
  userId: string,
  updates: {
    amount: number;
    category: ExpenseCategory;
    description?: string;
    payerId: string;
    participants: string[];
    splitType: 'equal' | 'custom';
    splitAmounts?: { [userId: string]: number };
    participantNames?: { [userId: string]: string };
    groupId?: string;
  }
): Promise<void> => {
  const expenseRef = doc(db, 'expenses', expenseId);
  const expenseDoc = await getDoc(expenseRef);

  if (!expenseDoc.exists()) {
    throw new Error('Expense not found');
  }

  const existing = expenseDoc.data() as Expense;

  // Only allow update if user is the creator or payer
  if (existing.createdBy !== userId && existing.payerId !== userId) {
    throw new Error('You do not have permission to edit this expense');
  }

  // Validate custom split amounts
  if (updates.splitType === 'custom' && updates.splitAmounts) {
    const totalCustomAmount = Object.values(updates.splitAmounts).reduce((sum, amt) => sum + amt, 0);
    if (Math.abs(totalCustomAmount - updates.amount) > 0.01) {
      throw new Error('Custom split amounts must equal the total expense amount');
    }
  }

  const updateData: any = {
    amount: updates.amount,
    category: updates.category,
    payerId: updates.payerId,
    participants: updates.participants,
    splitType: updates.splitType,
    updatedAt: serverTimestamp(),
  };

  if (updates.description) {
    updateData.description = updates.description;
  }
  if (updates.splitType === 'custom' && updates.splitAmounts) {
    updateData.splitAmounts = updates.splitAmounts;
  }
  if (updates.participantNames) {
    updateData.participantNames = updates.participantNames;
  }
  if (updates.groupId) {
    updateData.groupId = updates.groupId;
  }

  await updateDoc(expenseRef, updateData);
};

/**
 * Get expense by ID
 */
export const getExpenseById = async (expenseId: string): Promise<Expense | null> => {
  const expenseRef = doc(db, 'expenses', expenseId);
  const expenseDoc = await getDoc(expenseRef);

  if (expenseDoc.exists()) {
    return { id: expenseDoc.id, ...expenseDoc.data() } as Expense;
  }
  return null;
};

/**
 * Delete an expense
 */
export const deleteExpense = async (expenseId: string, userId: string): Promise<void> => {
  const expenseRef = doc(db, 'expenses', expenseId);
  const expenseDoc = await getDoc(expenseRef);

  if (!expenseDoc.exists()) {
    throw new Error('Expense not found');
  }

  const expense = expenseDoc.data() as Expense;

  // Only allow deletion if user is the creator or payer
  if (expense.createdBy !== userId && expense.payerId !== userId) {
    throw new Error('You do not have permission to delete this expense');
  }

  await deleteDoc(expenseRef);
};

/**
 * Get expenses for a user
 */
export const getUserExpenses = async (userId: string): Promise<Expense[]> => {
  const expensesRef = collection(db, 'expenses');

  // Get expenses where user is payer
  const payerQuery = query(
    expensesRef,
    where('payerId', '==', userId),
    orderBy('date', 'desc')
  );

  // Get expenses where user is participant
  const participantQuery = query(
    expensesRef,
    where('participants', 'array-contains', userId),
    orderBy('date', 'desc')
  );

  // Get expenses created by user
  const creatorQuery = query(
    expensesRef,
    where('createdBy', '==', userId),
    orderBy('date', 'desc')
  );

  let payerSnapshot;
  let participantSnapshot;
  let creatorSnapshot;

  try {
    payerSnapshot = await getDocs(payerQuery);
  } catch (error) {
    payerSnapshot = null;
  }

  try {
    participantSnapshot = await getDocs(participantQuery);
  } catch (error) {
    participantSnapshot = null;
  }

  try {
    creatorSnapshot = await getDocs(creatorQuery);
  } catch (error) {
    creatorSnapshot = null;
  }

  const expenseMap = new Map<string, Expense>();

  if (payerSnapshot) {
    payerSnapshot.forEach((doc) => {
      expenseMap.set(doc.id, { id: doc.id, ...doc.data() } as Expense);
    });
  }

  if (participantSnapshot) {
    participantSnapshot.forEach((doc) => {
      if (!expenseMap.has(doc.id)) {
        expenseMap.set(doc.id, { id: doc.id, ...doc.data() } as Expense);
      }
    });
  }

  if (creatorSnapshot) {
    creatorSnapshot.forEach((doc) => {
      if (!expenseMap.has(doc.id)) {
        expenseMap.set(doc.id, { id: doc.id, ...doc.data() } as Expense);
      }
    });
  }

  // Sort by date descending
  const expenses = Array.from(expenseMap.values()).sort((a, b) => {
    return b.date.toMillis() - a.date.toMillis();
  });

  return expenses;
};

/**
 * Get expenses for a group
 */
export const getGroupExpenses = async (groupId: string): Promise<Expense[]> => {
  const expensesRef = collection(db, 'expenses');
  const expensesQuery = query(
    expensesRef,
    where('groupId', '==', groupId),
    orderBy('date', 'desc')
  );

  const expensesSnapshot = await getDocs(expensesQuery);
  const expenses: Expense[] = [];

  expensesSnapshot.forEach((doc) => {
    expenses.push({ id: doc.id, ...doc.data() } as Expense);
  });

  return expenses;
};

/**
 * Calculate balances for a user
 */
export const calculateUserBalances = async (userId: string): Promise<{
  owedTo: { [userId: string]: number };
  owedFrom: { [userId: string]: number };
}> => {
  const expenses = await getUserExpenses(userId);
  const owedTo: { [userId: string]: number } = {};
  const owedFrom: { [userId: string]: number } = {};

  expenses.forEach((expense) => {
    // Skip settled expenses in balance calculations
    if (expense.settledAt) return;

    let splitAmounts: { [userId: string]: number } = {};

    if (expense.splitType === 'equal') {
      const amountPerPerson = expense.amount / expense.participants.length;
      expense.participants.forEach((participantId) => {
        splitAmounts[participantId] = amountPerPerson;
      });
    } else if (expense.splitAmounts) {
      splitAmounts = expense.splitAmounts;
    }

    // If user is the payer
    if (expense.payerId === userId) {
      Object.keys(splitAmounts).forEach((participantId) => {
        if (participantId !== userId && splitAmounts[participantId] > 0) {
          if (!owedFrom[participantId]) {
            owedFrom[participantId] = 0;
          }
          owedFrom[participantId] += splitAmounts[participantId];
        }
      });
    } else if (expense.participants.includes(userId)) {
      // User is a participant but not the payer
      const userShare = splitAmounts[userId] || 0;
      if (userShare > 0) {
        if (!owedTo[expense.payerId]) {
          owedTo[expense.payerId] = 0;
        }
        owedTo[expense.payerId] += userShare;
      }
    }
  });

  return { owedTo, owedFrom };
};

/**
 * Calculate balances for a group
 */
export const calculateGroupBalances = async (
  groupId: string,
  userId: string
): Promise<{
  owedTo: { [userId: string]: number };
  owedFrom: { [userId: string]: number };
}> => {
  const expenses = await getGroupExpenses(groupId);
  const owedTo: { [userId: string]: number } = {};
  const owedFrom: { [userId: string]: number } = {};

  expenses.forEach((expense) => {
    // Skip settled expenses in balance calculations
    if (expense.settledAt) return;

    let splitAmounts: { [userId: string]: number } = {};

    if (expense.splitType === 'equal') {
      const amountPerPerson = expense.amount / expense.participants.length;
      expense.participants.forEach((participantId) => {
        splitAmounts[participantId] = amountPerPerson;
      });
    } else if (expense.splitAmounts) {
      splitAmounts = expense.splitAmounts;
    }

    // If user is the payer
    if (expense.payerId === userId) {
      Object.keys(splitAmounts).forEach((participantId) => {
        if (participantId !== userId && splitAmounts[participantId] > 0) {
          if (!owedFrom[participantId]) {
            owedFrom[participantId] = 0;
          }
          owedFrom[participantId] += splitAmounts[participantId];
        }
      });
    } else if (expense.participants.includes(userId)) {
      // User is a participant but not the payer
      const userShare = splitAmounts[userId] || 0;
      if (userShare > 0) {
        if (!owedTo[expense.payerId]) {
          owedTo[expense.payerId] = 0;
        }
        owedTo[expense.payerId] += userShare;
      }
    }
  });

  return { owedTo, owedFrom };
};

/**
 * Calculate friend-only balances (expenses without groupId).
 * Used to list friends with outstanding amounts for per-friend settle up.
 */
export const calculateFriendOnlyBalances = async (userId: string): Promise<{
  owedTo: { [userId: string]: number };
  owedFrom: { [userId: string]: number };
}> => {
  const expenses = await getUserExpenses(userId);
  const friendOnly = expenses.filter((e) => !e.groupId && !e.settledAt);
  const owedTo: { [userId: string]: number } = {};
  const owedFrom: { [userId: string]: number } = {};

  friendOnly.forEach((expense) => {
    let splitAmounts: { [userId: string]: number } = {};
    if (expense.splitType === 'equal') {
      const amountPerPerson = expense.amount / expense.participants.length;
      expense.participants.forEach((pid) => {
        splitAmounts[pid] = amountPerPerson;
      });
    } else if (expense.splitAmounts) {
      splitAmounts = expense.splitAmounts;
    }
    if (expense.payerId === userId) {
      Object.keys(splitAmounts).forEach((pid) => {
        if (pid !== userId && splitAmounts[pid] > 0) {
          owedFrom[pid] = (owedFrom[pid] ?? 0) + splitAmounts[pid];
        }
      });
    } else if (expense.participants.includes(userId)) {
      const userShare = splitAmounts[userId] ?? 0;
      if (userShare > 0) {
        owedTo[expense.payerId] = (owedTo[expense.payerId] ?? 0) + userShare;
      }
    }
  });
  return { owedTo, owedFrom };
};

/**
 * Settle up expenses between user and a specific friend (friend-to-friend only, no group).
 * Marks expenses as settled instead of deleting to preserve history.
 */
export const settleUpExpensesForFriend = async (userId: string, friendId: string): Promise<void> => {
  const expenses = await getUserExpenses(userId);
  const toSettle = expenses.filter(
    (e) => !e.groupId && e.participants.includes(friendId) && !e.settledAt
  );
  await Promise.all(toSettle.map((e) =>
    updateDoc(doc(db, 'expenses', e.id), { settledAt: serverTimestamp() })
  ));
};

/**
 * Settle up all expenses for a specific group.
 * Marks expenses as settled instead of deleting to preserve history.
 */
export const settleUpExpensesForGroup = async (groupId: string): Promise<void> => {
  const expenses = await getGroupExpenses(groupId);
  const toSettle = expenses.filter((e) => !e.settledAt);
  await Promise.all(toSettle.map((e) =>
    updateDoc(doc(db, 'expenses', e.id), { settledAt: serverTimestamp() })
  ));
};

/**
 * Create a settlement expense — records a partial payment between two users.
 * This creates an expense with type='settlement' that offsets existing balances.
 */
export const createSettlementExpense = async (
  payerId: string,
  receiverId: string,
  amount: number,
  payerName: string,
  receiverName: string,
  groupId?: string
): Promise<string> => {
  const expensesRef = collection(db, 'expenses');
  const expenseRef = doc(expensesRef);

  const expenseData: any = {
    amount,
    category: 'Other' as ExpenseCategory,
    date: Timestamp.fromDate(new Date()),
    payerId,
    participants: [payerId, receiverId],
    splitType: 'custom',
    splitAmounts: { [payerId]: 0, [receiverId]: amount },
    type: 'settlement',
    description: `Settlement payment`,
    participantNames: {
      [payerId]: payerName,
      [receiverId]: receiverName,
    },
    createdAt: serverTimestamp() as any,
    createdBy: payerId,
  };

  if (groupId) {
    expenseData.groupId = groupId;
  }

  await setDoc(expenseRef, expenseData);
  return expenseRef.id;
};

/**
 * Settle up all expenses for a user (mark all expenses as settled by deleting them)
 */
export const settleUpExpenses = async (userId: string): Promise<void> => {
  const expensesRef = collection(db, 'expenses');

  // Get all expenses where user is involved
  const payerQuery = query(expensesRef, where('payerId', '==', userId));
  const participantQuery = query(expensesRef, where('participants', 'array-contains', userId));

  let payerSnapshot;
  let participantSnapshot;

  try {
    payerSnapshot = await getDocs(payerQuery);
  } catch (error) {
    payerSnapshot = null;
  }

  try {
    participantSnapshot = await getDocs(participantQuery);
  } catch (error) {
    participantSnapshot = null;
  }

  const expenseIds = new Set<string>();

  if (payerSnapshot) {
    payerSnapshot.forEach((doc) => {
      expenseIds.add(doc.id);
    });
  }

  if (participantSnapshot) {
    participantSnapshot.forEach((doc) => {
      expenseIds.add(doc.id);
    });
  }

  // Delete all expenses
  const deletePromises = Array.from(expenseIds).map((expenseId) => {
    const expenseRef = doc(db, 'expenses', expenseId);
    return deleteDoc(expenseRef);
  });

  await Promise.all(deletePromises);
};