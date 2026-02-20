'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import AIChatModal from './AIChatModal';
import { ChatMessage } from '@/src/types/receipt';

export default function AIChatBubble() {
    const pathname = usePathname();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    // Lifted state — persists across modal open/close and page navigation
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [actionFeedback, setActionFeedback] = useState<{ [msgId: string]: string }>({});

    // Show on main pages with bottom nav, hide on add-expense and login
    const allowedPaths = ['/friends', '/groups', '/activity', '/dashboard', '/expenses'];
    const isAllowed =
        pathname && allowedPaths.some((path) => pathname === path || pathname.startsWith(path + '/'));

    if (!user || !isAllowed) {
        return null;
    }

    return (
        <>
            {/* Floating chat bubble */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed flex items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
                style={{
                    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 170px)',
                    right: '1rem',
                    zIndex: 9500,
                    width: '52px',
                    height: '52px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                }}
                aria-label="Open AI Expense Assistant"
                title="AI Expense Assistant"
            >
                {/* Robot icon with pulse animation */}
                <span className="text-2xl animate-pulse">{'\u{1F916}'}</span>
            </button>

            {/* Chat modal — always pass lifted state */}
            {isOpen && (
                <AIChatModal
                    onClose={() => setIsOpen(false)}
                    messages={messages}
                    setMessages={setMessages}
                    actionFeedback={actionFeedback}
                    setActionFeedback={setActionFeedback}
                />
            )}
        </>
    );
}
