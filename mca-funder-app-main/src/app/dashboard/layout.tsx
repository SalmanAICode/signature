'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/auth';
import Navbar from './_components/Navbar';
import Subnav from './_components/Subnav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {


  return (
    <div className="flex flex-col h-screen bg-[#3A5075]" id="dashboard-layout">
      <Navbar />
      <Subnav />
      <main className="flex-1 p-6 overflow-auto bg-[#3A5075]">{children}</main>
    </div>
  );
}