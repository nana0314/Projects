'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/context/AuthContext';

export default function FloatingAddExpense() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAccountPage = pathname === '/account' || pathname?.startsWith?.('/profile');
  const isAddExpensePage = pathname === '/add-expense';
  if (!pathname || pathname === '/' || isAccountPage || isAddExpensePage || !user) {
    return null;
  }

  return (
    <Link
      href="/add-expense"
      className="fixed flex flex-row items-center justify-center gap-2 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all hover:scale-105 active:scale-95 overflow-hidden"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 112px)',
        right: '1rem',
        zIndex: 10000,
        padding: '12px 18px',
      }}
    >
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="font-semibold text-sm whitespace-nowrap">Add Expenses</span>
    </Link>
  );
}
