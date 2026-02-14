import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  uniqueId: string; // Random generated unique ID
  aiInsightsEnabled?: boolean; // Opt-in for AI-powered weekly insights
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Friend {
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted';
  addedAt: Timestamp;
}

export interface FriendRequest {
  id: string;
  userId: string; // The user who sent the request
  friendId: string; // The user who received the request
  status: 'pending' | 'accepted';
  addedAt: Timestamp;
  senderInfo?: User; // Populated user info for UI display
}


export interface GroupMember {
  userId: string;
  uniqueId: string;
  displayName: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  photoURL?: string;
  createdBy: string;
  members: GroupMember[]; // Array of member objects with userId, uniqueId, and displayName
  memberIds?: string[]; // Array of user IDs for Firestore querying (kept in sync with members)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ExpenseCategory = 'Food' | 'Rental' | 'Groceries' | 'Entertainment' | 'Beverage' | 'Transportation' | 'Utilities' | 'Shopping' | 'Travel' | 'Other';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  date: Timestamp;
  payerId: string; // User who paid
  participants: string[]; // Array of user IDs who share the expense
  participantNames?: { [userId: string]: string }; // Map of user IDs to display names
  splitType: 'equal' | 'custom';
  splitAmounts?: { [userId: string]: number }; // For custom splits
  groupId?: string; // Optional: if expense is in a group
  description?: string;
  type?: 'expense' | 'settlement'; // Default: 'expense'. 'settlement' for partial payments
  createdAt: Timestamp;
  createdBy: string;
  settledAt?: Timestamp; // When expense was settled (for history)
}

export interface Balance {
  userId: string;
  owedTo: { [userId: string]: number }; // How much this user owes to others
  owedFrom: { [userId: string]: number }; // How much others owe this user
}