// src/app/offers/[id]/page.tsx

"use client";

import { useParams } from 'next/navigation';
import SyndicatorDetailView from './_components/SyndicatorDetailView';
import DashboardShell from '@/components/DashboardShell';

export default function Page() {
  const params = useParams();
  const syn_id = params?.syn_id as string;

  if (!syn_id) {
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
    <div className="w-full border-gray-100 bg-gray-100 p-4 rounded-xl overflow-hidden">
      <SyndicatorDetailView title="Syndicator Detail" id={syn_id} />
    </div>
    </DashboardShell>
  );
}