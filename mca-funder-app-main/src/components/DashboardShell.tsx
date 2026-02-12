'use client';

import Navbar from '../app/dashboard/_components/Navbar';
import Subnav from '../app/dashboard/_components/Subnav';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-[#3A5075]" id="dashboard-layout">
      <Navbar />
      <Subnav />
      <main className="flex-1 p-6 overflow-auto bg-[#3A5075]">{children}</main>
    </div>
  );
} 