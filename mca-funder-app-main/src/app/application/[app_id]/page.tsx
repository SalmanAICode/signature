// src/app/dashboard/application/[app_id]/page.tsx

'use client';

import { useParams } from 'next/navigation';
import ApplicationDetailView from './_components/ApplicationDetailView';
import DashboardShell from '@/components/DashboardShell';

export default function Page() {
  const params = useParams();
  const app_id = params?.app_id as string;

  if (!app_id) {
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
        <ApplicationDetailView title="Application Detail" id={app_id} />
      </div>
    </DashboardShell>
  );
}