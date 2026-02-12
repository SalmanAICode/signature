"use client";

import { useParams } from 'next/navigation';
import UserDetailView from "./_components/UserDetailView";
import DashboardShell from '@/components/DashboardShell';

export default function UserDetailsPage() {
  const params = useParams();
  const user_id = params?.user_id as string;

  if (!user_id) {
    return (
      <DashboardShell>
      <div className="w-full border-gray-100 bg-white rounded-xl p-4 flex justify-center items-center">
        <div className="text-gray-500">Loading...</div>
      </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>	
    <div className="w-full border-gray-100 bg-gray-100 p-4 rounded-xl overflow-hidden text-center">
      <UserDetailView id={user_id} />
    </div>
    </DashboardShell>
  );
}
  