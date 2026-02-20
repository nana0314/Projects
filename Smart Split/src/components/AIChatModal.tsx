'use client';

import { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { getUserFriends } from '@/src/utils/friends';
import { getUserGroups } from '@/src/utils/groups';
import { createExpense } from '@/src/utils/expenses';
import { parseTextExpense, buildContext, buildExpensePatterns, formatExpenseSummary } from '@/src/utils/aiAssistant';
import { scanReceipt } from '@/src/utils/receiptScanner';
import { User, Group, ExpenseCategory } from '@/src/types';
import { ChatMessage, ParsedExpense } from '@/src/types/receipt';

interface AIChatModalProps {
    onClose: () => void;
    messages: ChatMessage[];
    setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
    actionFeedback: { [msgId: string]: string };
    setActionFeedback: Dispatch<SetStateAction<{ [msgId: string]: string }>>;
}

export default function AIChatModal({ onClose, messages, setMessages, actionFeedback, setActionFeedback }: AIChatModalProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [friends, setFriends] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const expensePatternsRef = useRef<{ merchant: string; category: string; count: number }[]>([]);

    // Load friends, groups, and expense patterns on mount
    useEffect(() => {
        if (!user) return;
        Promise.all([
            getUserFriends(user.uid),
            getUserGroups(user.uid),
            buildExpensePatterns(user.uid),
        ])
            .then(([f, g, patterns]) => {
                setFriends(f || []);
                setGroups(g || []);
                // Store patterns in a ref so they're available when sending
                expensePatternsRef.current = patterns;
            })
            .catch(console.error);
    }, [user]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addMessage = (role: 'user' | 'assistant', content: string, parsedExpense?: ParsedExpense): ChatMessage => {
        const msg: ChatMessage = {
            id: crypto.randomUUID(),
            role,
            content,
            parsedExpense,
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev.slice(-9), msg]); // Keep last 10
        return msg;
    };

    const handleSend = async () => {
        if (!inputText.trim() || isLoading || !user) return;

        const userMessage = inputText.trim();
        setInputText('');
        addMessage('user', userMessage);
        setIsLoading(true);

        try {
            const friendsList = friends.map((f) => ({ uid: f.uid, displayName: f.displayName }));
            const groupsList = groups.map((g) => ({ id: g.id, name: g.name }));
            const history = messages.map((m) => ({ role: m.role, content: m.content }));

            const ctx = buildContext();
            ctx.recentPatterns = expensePatternsRef.current;

            const result = await parseTextExpense(
                userMessage,
                friendsList,
                groupsList,
                history,
                ctx
            );

            const botContent = result.message || formatExpenseSummary(result);
            // Only attach parsedExpense for actionable cards when no follow-up is needed
            const showCard = result.success && !result.needsFollowUp && result.total;
            addMessage('assistant', botContent, showCard ? result : undefined);
        } catch (err: any) {
            const errorMsg = err?.message || 'Something went wrong. Please try again.';
            addMessage('assistant', `\u274C ${errorMsg}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleScanReceipt = async (file: File) => {
        if (!user) return;
        setIsLoading(true);
        addMessage('user', '\u{1F4F8} Scanning receipt...');

        try {
            const result = await scanReceipt(user.uid, file);
            const botContent = result.success
                ? `I found the following from your receipt:\n${formatExpenseSummary(result)}`
                : result.message || 'Could not read the receipt. Please try again with a clearer image.';
            addMessage('assistant', botContent, result.success ? result : undefined);
        } catch (err: any) {
            addMessage('assistant', `\u274C ${err?.message || 'Failed to scan receipt. Please try again.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmSave = async (msg: ChatMessage) => {
        if (!user || !msg.parsedExpense) return;
        const parsed = msg.parsedExpense;

        try {
            setActionFeedback((prev) => ({ ...prev, [msg.id]: 'saving' }));

            const amount = parsed.total || 0;
            const category = (parsed.category as ExpenseCategory) || 'Other';
            const date = parsed.date ? new Date(parsed.date) : new Date();
            const description = parsed.merchant || undefined;

            // Build participants list
            const participantIds: string[] = [user.uid];
            const participantNames: { [uid: string]: string } = {
                [user.uid]: user.displayName || 'You',
            };

            if (parsed.participants) {
                for (const p of parsed.participants) {
                    if (p.matchedUid) {
                        participantIds.push(p.matchedUid);
                        participantNames[p.matchedUid] = p.matchedName || p.inputName;
                    }
                }
            }

            const splitType = participantIds.length > 1 ? (parsed.splitType || 'equal') : 'equal';

            await createExpense(
                amount,
                category,
                date,
                user.uid,        // payer
                participantIds,
                splitType,
                user.uid,        // createdBy
                parsed.groupId,
                description,
                undefined,       // splitAmounts (equal split)
                participantNames
            );

            setActionFeedback((prev) => ({ ...prev, [msg.id]: 'saved' }));
            addMessage('assistant', '\u2705 Expense saved successfully!');
        } catch (err: any) {
            setActionFeedback((prev) => ({ ...prev, [msg.id]: 'error' }));
            addMessage('assistant', `\u274C Failed to save: ${err?.message || 'Unknown error'}`);
        }
    };

    const handleEditInForm = (parsed: ParsedExpense) => {
        const params = new URLSearchParams();
        if (parsed.merchant) params.set('description', parsed.merchant);
        if (parsed.total) params.set('amount', parsed.total.toString());
        if (parsed.category) params.set('category', parsed.category);
        if (parsed.groupId) params.set('groupId', parsed.groupId);
        onClose();
        router.push(`/add-expense?${params.toString()}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const suggestedPrompts = [
        'Coffee 8.50, split with Sarah',
        'Uber 25, I paid for Weekend Trip group',
        'John owes me 15 for lunch',
    ];

    return (
        <div
            className="fixed inset-0 z-[10001] flex flex-col bg-white dark:bg-gray-900"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{"\u{1F916}"}</span>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Expense Assistant</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Close"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8">
                        <div className="text-6xl">{"\u{1F916}"}</div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                AI Expense Assistant
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                                Tell me about your expense in natural language and I&apos;ll help you log it!
                            </p>
                        </div>
                        <div className="w-full max-w-sm space-y-2">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Try saying:</p>
                            {suggestedPrompts.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setInputText(prompt);
                                    }}
                                    className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    &quot;{prompt}&quot;
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                ? 'bg-green-600 text-white rounded-br-md'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                                }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                            {/* Expense summary card with action buttons */}
                            {msg.role === 'assistant' && msg.parsedExpense && msg.parsedExpense.success && (
                                <div className="mt-3 p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 space-y-2">
                                    {/* Summary */}
                                    <div className="space-y-1 text-sm">
                                        {msg.parsedExpense.merchant && (
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {"\u{1F3EA}"} {msg.parsedExpense.merchant}
                                            </div>
                                        )}
                                        {msg.parsedExpense.total && (
                                            <div className="text-gray-700 dark:text-gray-300">
                                                {"\u{1F4B0}"} ${msg.parsedExpense.total.toFixed(2)}
                                            </div>
                                        )}
                                        {msg.parsedExpense.category && (
                                            <div className="text-gray-600 dark:text-gray-400">
                                                {"\u{1F4C2}"} {msg.parsedExpense.category}
                                            </div>
                                        )}
                                        {msg.parsedExpense.participants && msg.parsedExpense.participants.length > 0 && (
                                            <div className="text-gray-600 dark:text-gray-400">
                                                {"\u{1F465}"} Split with: {msg.parsedExpense.participants.map((p) => p.matchedName || p.inputName).join(', ')}
                                            </div>
                                        )}
                                        {msg.parsedExpense.groupName && (
                                            <div className="text-gray-600 dark:text-gray-400">
                                                {"\u{1F3E0}"} Group: {msg.parsedExpense.groupName}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    {actionFeedback[msg.id] === 'saved' ? (
                                        <div className="text-center text-sm text-green-600 font-medium py-1">
                                            {"\u2705"} Saved!
                                        </div>
                                    ) : actionFeedback[msg.id] === 'cancelled' ? (
                                        <div className="text-center text-sm text-gray-400 font-medium py-1">
                                            Cancelled
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 pt-1 flex-wrap">
                                            <button
                                                onClick={() => handleConfirmSave(msg)}
                                                disabled={actionFeedback[msg.id] === 'saving'}
                                                className="flex-1 min-w-[80px] px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                            >
                                                {actionFeedback[msg.id] === 'saving' ? 'Saving...' : '\u2705 Confirm'}
                                            </button>
                                            <button
                                                onClick={() => handleEditInForm(msg.parsedExpense!)}
                                                className="flex-1 min-w-[80px] px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                            >
                                                {"\u270F\uFE0F"} Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActionFeedback((prev) => ({ ...prev, [msg.id]: 'cancelled' }));
                                                    addMessage('assistant', 'No worries, I\'ve cancelled that expense. Feel free to tell me about another one!');
                                                }}
                                                className="flex-1 min-w-[80px] px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                            >
                                                {"\u274C"} Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="text-lg">{"\u{1F916}"}</span>
                                <span className="animate-pulse">Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
                <div className="flex items-center gap-2 max-w-xl mx-auto">
                    {/* Scan Receipt button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="p-2.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                        title="Scan Receipt"
                        aria-label="Scan Receipt"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                handleScanReceipt(file);
                                e.target.value = ''; // Reset so same file can be re-selected
                            }
                        }}
                    />

                    {/* Text input */}
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe your expense..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                    />

                    {/* Send button */}
                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim() || isLoading}
                        className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors active:scale-95"
                        aria-label="Send"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
