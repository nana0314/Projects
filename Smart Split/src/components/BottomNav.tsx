'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/context/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname === '/') {
    return null;
  }

  // Determine which page is active
  const isFriendsActive = pathname === '/friends';
  const isGroupsActive = pathname === '/groups' || pathname.startsWith('/groups/');
  const isActivityActive = pathname === '/activity';
  const isAccountActive = pathname === '/profile';

  const showAccountPhoto = mounted && !!user?.photoURL;

  const accountIcon = showAccountPhoto ? (
    <img
      src={user!.photoURL!}
      alt="Account"
      className="w-6 h-6 mb-0.5 rounded-full object-cover"
    />
  ) : (
    <svg
      className="w-6 h-6 mb-0.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );

  return (
    <nav
      className="fixed left-0 right-0 bg-white border-t border-gray-200 shadow-sm"
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 9999,
        visibility: 'visible',
        opacity: 1,
        pointerEvents: 'auto',
      }}
    >
      <div
        className="relative flex justify-around items-center px-1 max-w-md mx-auto bg-white"
        style={{
          minHeight: '64px',
          paddingTop: '12px',
          paddingBottom: '8px',
          overflow: 'visible',
        }}
      >
        {/* Friends Button */}
        <div
          className={`flex-1 flex justify-center items-center h-full min-h-[44px] ${isFriendsActive ? 'nav-btn-blink' : ''}`}
        >
          <Link
            href="/friends"
            className={`flex flex-col items-center justify-center w-full h-full transition-all rounded-lg py-1 ${isFriendsActive ? 'text-gray-900' : 'text-gray-500'}`}
          >
            <svg
              className="w-6 h-6 mb-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs font-medium">Friends</span>
          </Link>
        </div>

        {/* Groups Button */}
        <div
          className={`flex-1 flex justify-center items-center h-full min-h-[44px] ${isGroupsActive ? 'nav-btn-blink' : ''}`}
        >
          <Link
            href="/groups"
            className={`flex flex-col items-center justify-center w-full h-full transition-all rounded-lg py-1 ${isGroupsActive ? 'text-gray-900' : 'text-gray-500'}`}
          >
            <svg
              className="w-6 h-6 mb-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="text-xs font-medium">Groups</span>
          </Link>
        </div>

        {/* Activity Button */}
        <div
          className={`flex-1 flex justify-center items-center h-full min-h-[44px] ${isActivityActive ? 'nav-btn-blink' : ''}`}
        >
          <Link
            href="/activity"
            className={`flex flex-col items-center justify-center w-full h-full transition-all rounded-lg py-1 ${isActivityActive ? 'text-gray-900' : 'text-gray-500'}`}
          >
            <svg
              className="w-6 h-6 mb-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span className="text-xs font-medium">Activity</span>
          </Link>
        </div>

        {/* Account Button */}
        <div
          className={`flex-1 flex justify-center items-center h-full min-h-[44px] ${isAccountActive ? 'nav-btn-blink' : ''}`}
        >
          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center w-full h-full transition-all rounded-lg py-1 ${isAccountActive ? 'text-gray-900' : 'text-gray-500'}`}
          >
            {accountIcon}
            <span className="text-xs font-medium">Account</span>
          </Link>
        </div>
      </div>

      {/* White padding layer at the bottom - separates buttons from screen edge and home indicator */}
      <div
        className="bg-white w-full"
        style={{
          height: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
          minHeight: '20px',
          flexShrink: 0
        }}
      />
    </nav>
  );
}
