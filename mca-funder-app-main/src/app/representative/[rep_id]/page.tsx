'use client';

import { useParams } from 'next/navigation';
import RepresentativeDetailView from './_components/RepresentativeDetailView';
import DashboardShell from '@/components/DashboardShell';

export default function Page() {
  const params = useParams();
  const rep_id = params?.rep_id as string;

  if (!rep_id) {
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
      <RepresentativeDetailView title="Representative Detail" id={rep_id} />
    </div>
    </DashboardShell>
  );
} 