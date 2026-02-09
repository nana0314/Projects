'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { signInWithGoogle } from '@/src/utils/auth';

interface Ripple { id: number; x: number; y: number; size: number; delay: number }

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleIdRef = useRef(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const newRipples: Ripple[] = [];
    for (let i = 0; i < 3; i++) {
      const id = ++rippleIdRef.current;
      newRipples.push({ id, x, y, size, delay: i * 100 });
    }
    setRipples((prev) => [...prev, ...newRipples]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => !newRipples.some((n) => n.id === r.id)));
    }, 1200);

    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Sign-in error:', error);
      alert(`Sign-in failed: ${err.message || 'Please check your browser console for details.'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8eeff]">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#e8eeff] px-4">
      {/* Only "Smart Split" on top */}
      <h1
        className="w-full text-center text-4xl font-bold text-gray-800 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 3rem)', paddingBottom: '1.5rem' }}
      >
        Smart Split
      </h1>

      {/* Centered sign-in button */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md" style={{ marginTop: '-3cm' }}>
        <button
          ref={buttonRef}
          onClick={handleClick}
          className="relative w-28 h-28 rounded-full bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl hover:border-blue-300 hover:scale-105 active:scale-95 transition-all duration-200 flex flex-col items-center justify-center overflow-hidden"
        >
          {ripples.map((r) => (
            <span
              key={r.id}
              className="ripple-ring"
              style={{
                left: r.x,
                top: r.y,
                width: r.size,
                height: r.size,
                marginLeft: -r.size / 2,
                marginTop: -r.size / 2,
                animationDelay: `${r.delay}ms`,
              }}
            />
          ))}
          <svg className="w-8 h-8 mb-1 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-sm font-semibold text-gray-700">Sign in</span>
        </button>
      </div>

      {/* Terms at bottom */}
      <div className="pb-[max(env(safe-area-inset-bottom),2rem)] text-center text-sm text-gray-500">
        <p>By signing in, you agree to our Terms of Service</p>
      </div>
    </div>
  );
}