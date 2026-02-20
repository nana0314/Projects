import { ExpenseCategory } from './index';

/**
 * Shared response from the parseExpense Cloud Function.
 * Used by both receipt scanning and AI chat assistant.
 */
export interface ParsedExpense {
  success: boolean;
  confidence: number;
  merchant?: string;
  date?: string;               // YYYY-MM-DD
  items?: { name: string; price: number }[];
  total?: number;
  currency?: string;
  category?: ExpenseCategory;
  participants?: MatchedParticipant[];
  splitType?: 'equal' | 'custom';
  groupId?: string;
  groupName?: string;
  needsFollowUp?: boolean;     // true if Gemini needs more info
  followUpQuestion?: string;   // question to ask user
  message?: string;            // error/warning or bot response text
}

/**
 * Result of fuzzy-matching a user-typed name against the friend list.
 */
export interface MatchedParticipant {
  inputName: string;           // what user typed ("Jon")
  matchedUid: string | null;   // matched friend UID or null
  matchedName: string | null;  // matched display name ("John Smith")
  confidence: number;          // 0-1 match confidence
}

/**
 * Chat message for conversation history in the AI Chat Assistant.
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parsedExpense?: ParsedExpense;  // attached to bot messages with results
  timestamp: number;
}
