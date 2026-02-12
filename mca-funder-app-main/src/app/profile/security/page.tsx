'use client';

import useAuthStore from '@/lib/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getCurrentUser } from '@/lib/api/users';
import { User } from '@/types/user';
import ChangePasswordItem from './_components/ChangePasswordItem';

export default function SecurityPage() {
  const router = useRouter();
  const { accessToken, user: authUser } = useAuthStore();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (accessToken && !authUser) {
        try {
          const userData = await getCurrentUser();
          useAuthStore.getState().setUser(userData as User);
        } catch (error) {
          router.push('/login');
        }
      }
    };

    fetchCurrentUser();
  }, [accessToken, authUser]);

  if (!authUser) {
    return (
      <div className="flex items-center w-full justify-center h-full">
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
          <span className="text-theme-muted text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl mx-auto p-8 min-h-screen bg-theme-secondary text-theme-foreground flex flex-col md:flex-row md:space-x-12">
      <ul className="space-y-6 w-full md:w-1/2">
        <ChangePasswordItem />
      </ul>
    </div>
  );
}