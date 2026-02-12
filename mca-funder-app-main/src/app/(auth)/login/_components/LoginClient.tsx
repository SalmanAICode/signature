'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginFunder, logoutFunder } from '@/lib/api/auth';
import LoginForm from './LoginForm';

export default function LoginClient() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError('');
    
    try {
      // Check for pending logout first
      const isPendingLogout = localStorage.getItem('logout-pending') === 'true';
      if (isPendingLogout) {
        try {
          await logoutFunder();
          console.log('Logout successful');
          localStorage.removeItem('logout-pending');
        } catch (error) {
          console.warn('Logout failed, but proceeding with login:', error);
          // Don't clear logout-pending flag, let it retry later
        }
      }

      // access token is set in the loginFunder function
      const { funder } = await loginFunder(email, password);
      localStorage.removeItem('logout-pending');
      // Check if funder ID exists in the response
      if (funder) {
        // If funder ID exists, redirect to dashboard
        router.replace('/dashboard');
      } else {
        // If no funder ID, redirect to funder selection page
        router.replace('/funder-selection');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      throw err; // Re-throw to trigger failed state in LoginForm
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen w-full gap-[32px] justify-center items-center p-4 bg-custom-blue">
      <LoginForm 
        onSubmit={handleLogin}
        loading={loading}
        error={error}
      />
    </main>
  );
} 