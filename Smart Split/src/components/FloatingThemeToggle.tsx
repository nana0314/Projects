'use client';

import { usePathname } from 'next/navigation';
import { useTheme } from '@/src/context/ThemeContext';

export default function FloatingThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();

    // Only show on the dashboard page
    const isAllowed = pathname === '/dashboard';

    if (!isAllowed) return null;

    return (
        <button
            onClick={toggleTheme}
            className="fixed z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 active:scale-90 hover:scale-105 bg-gray-800 dark:bg-yellow-400 text-yellow-300 dark:text-gray-900"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 110px)', right: '1rem' }}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                /* Moon icon */
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                </svg>
            ) : (
                /* Sun icon */
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </svg>
            )}
        </button>
    );
}

