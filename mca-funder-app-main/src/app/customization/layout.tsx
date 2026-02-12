'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/auth';
import { getCurrentUser } from '@/lib/api/users';
import { User } from '@/types/user';
import Navbar from '../dashboard/_components/Navbar';
import Subnav from './_components/Subnav';

export default function CustomizationLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, user: authUser } = useAuthStore();

  useEffect(() => {
    // Redirect if no access token
    if (!accessToken) {
      console.log('No access token in customization, redirecting to login');
      router.push('/login');
      return;
    }
  }, [accessToken, router]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (accessToken && !authUser) {
        try {
          const userData = await getCurrentUser();
          useAuthStore.getState().setUser(userData as User);
        } catch {
          router.push('/login');
        }
      }
    };

    fetchCurrentUser();
  }, [accessToken, authUser, router]);

  // Check if user is funder_manager
  useEffect(() => {
    if (authUser && authUser.type !== 'funder_manager') {
      router.push('/dashboard');
      return;
    }
  }, [authUser, router]);

  // If no token, don't render (redirect will happen)
  if (!accessToken) {
    return null;
  }

  // Show loading while fetching user data
  if (!authUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary-foreground mx-auto mb-4"></div>
          <p className="text-theme-primary-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is funder_manager
  if (authUser.type !== 'funder_manager') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme-primary">
        <div className="text-center">
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded mb-4">
            <strong className="font-bold">Access Denied!</strong>
            <p className="block sm:inline"> You need Funder Admin privileges to access this page.</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-theme-primary hover:bg-theme-primary/80 text-theme-primary-foreground font-bold py-2 px-4 rounded"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-theme-primary" id="customization-layout">
      <Navbar />
      <Subnav />
      <main className="flex-1 p-6 overflow-auto bg-theme-secondary">{children}</main>
    </div>
  );
}
