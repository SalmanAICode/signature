'use client';

import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/auth';
import Navbar from '../dashboard/_components/Navbar';
import Sidebar from './_components/sidebar';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      console.log('No access token in dashboard, redirecting to login');
      router.push('/login');
    }
  }, [accessToken, router]);

  if (!accessToken) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-[#3A5075]">
      <Navbar />
      <main className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 p-6 overflow-auto bg-theme-background">
          {children}
        </div>
      </main>
    </div>
  );
}
