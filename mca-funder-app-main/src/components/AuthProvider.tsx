'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '@/lib/store/auth';
import { useRouter, usePathname } from 'next/navigation';
import { logoutFunder } from '@/lib/api/auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { refreshSession, getAccessToken, funder } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'error' | 'offline' | 'public'>('loading');
  const [retryTrigger, setRetryTrigger] = useState(0);

  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/customization',
    '/lender-selection',
    // funder sub-routes
    '/lender',
    '/funder',
    '/user',
    '/lender',
    // funding sub-routes
    '/application',
    '/application-offer',
    '/funder-selection',
    '/funding',
    '/syndication-offer',
    '/syndication',
    // iso sub-routes
    '/iso',
    '/representative',
    // merchant sub-routes
    '/contact',
    '/merchant',
    // syndicator sub-routes
    '/syndicator',
  ];


  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    const checkAuth = async () => {
      // Check for pending logout first
      const isPendingLogout = localStorage.getItem('logout-pending') === 'true';
      if (isPendingLogout) {
        try {
          await logoutFunder();
          localStorage.removeItem('logout-pending');
        } catch (error) {
          console.warn('Pending logout failed, keeping pending flag for retry:', error);
        }
      }

      // If not on protected route, skip auth check
      if (!isProtectedRoute) {
        setAuthState('public');
        return;
      }

      // If already have token, we're good
      if (getAccessToken()) {
        setAuthState('authenticated');
        return;
      }

      // Try to refresh session
      try {
        await refreshSession(true);
        setAuthState('authenticated');
      } catch (error) {

        // Simple error check - if it looks like a network issue, show offline
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
        if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
          setAuthState('offline');
        } else {
          // Auth failed, redirect to login
          router.push('/login');
        }
      }
    };

    setAuthState('loading');
    checkAuth();
  }, [pathname, getAccessToken, refreshSession, router, retryTrigger]);

  // Check funder selection for authenticated users
  useEffect(() => {
    if (isProtectedRoute && !funder && authState === 'authenticated' && getAccessToken() && pathname !== '/funder-selection') {
      router.push('/funder-selection');
    }
  }, [authState, funder, router, getAccessToken, pathname]);

  const handleRetry = () => {
    setRetryTrigger(prev => prev + 1);
  };

  // Connection error state
  if (authState === 'offline') {
    return (
      <div className="flex items-center w-full justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
          <div className="flex justify-center mb-4">
            <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">
            Unable to connect to the server. Please check your connection or try again later.
          </p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (authState === 'loading') {
    return (
      <div className="flex items-center w-full justify-center h-screen">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span className="text-gray-600 text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  // Render children for both authenticated and public routes
  return <>{children}</>;
}