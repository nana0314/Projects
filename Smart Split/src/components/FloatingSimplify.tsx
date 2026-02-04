'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';

export default function FloatingSimplify() {
    const pathname = usePathname();
    const { user } = useAuth();
    const [simplifyEnabled, setSimplifyEnabled] = useState(false);

    // Load simplify state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('simplifyEnabled');
        setSimplifyEnabled(saved === 'true');
    }, []);

    // Save simplify state to localStorage
    const toggleSimplify = () => {
        const newState = !simplifyEnabled;
        setSimplifyEnabled(newState);
        localStorage.setItem('simplifyEnabled', String(newState));

        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('simplifyToggled', { detail: { enabled: newState } }));
    };

    // Only show on specific pages: Friends, Activity, Groups, Expenses
    const allowedPaths = ['/activity', '/friends', '/groups', '/expenses'];
    const isAllowed = pathname && allowedPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

    if (!user || !isAllowed) {
        return null;
    }

    return (
        <button
            onClick={toggleSimplify}
            className={`fixed flex flex-row items-center justify-center gap-2 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 overflow-hidden border-2 ${simplifyEnabled
                ? 'bg-white border-purple-600 text-purple-600 font-bold ring-4 ring-purple-100' // ON matches OFF color (600)
                : 'bg-white border-purple-600 text-purple-600 font-semibold hover:bg-purple-50' // OFF
                }`}
            style={{
                bottom: 'calc(env(safe-area-inset-bottom, 0px) + 288px)',
                right: '1rem',
                zIndex: 10000,
                padding: '12px 18px',
            }}
            aria-label="Toggle debt simplification"
        >
            {simplifyEnabled ? (
                <>
                    <svg className="w-5 h-5 flex-shrink-0 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm whitespace-nowrap">Simplify ON</span>
                </>
            ) : (
                <>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm whitespace-nowrap">Simplify</span>
                </>
            )}
        </button>
    );
}
