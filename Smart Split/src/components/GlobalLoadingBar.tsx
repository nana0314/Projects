'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Inner component that reads useSearchParams (requires Suspense boundary).
 */
function LoadingBarInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const prevPath = useRef(pathname + searchParams?.toString());

    const startLoading = useCallback(() => {
        setVisible(true);
        setProgress(0);

        // Simulate progress increments
        let p = 0;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            p += Math.random() * 15 + 5;
            if (p > 90) p = 90;
            setProgress(p);
        }, 200);
    }, []);

    const completeLoading = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setProgress(100);
        setTimeout(() => {
            setVisible(false);
            setProgress(0);
        }, 300);
    }, []);

    useEffect(() => {
        const currentPath = pathname + searchParams?.toString();
        if (currentPath !== prevPath.current) {
            // Route changed — complete loading
            completeLoading();
            prevPath.current = currentPath;
        }
    }, [pathname, searchParams, completeLoading]);

    // Intercept clicks on internal links to start loading bar
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement).closest('a');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;
            if (anchor.target === '_blank') return;

            const currentPath = pathname + searchParams?.toString();
            if (href !== currentPath && href !== pathname) {
                startLoading();
            }
        };

        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [pathname, searchParams, startLoading]);

    if (!visible) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[99999] h-[3px] pointer-events-none"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
        >
            <div
                className="h-full rounded-r-full transition-all duration-300 ease-out"
                style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
                    boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
                }}
            />
        </div>
    );
}

/**
 * Global loading bar with built-in Suspense boundary.
 */
export default function GlobalLoadingBar() {
    return (
        <Suspense fallback={null}>
            <LoadingBarInner />
        </Suspense>
    );
}
