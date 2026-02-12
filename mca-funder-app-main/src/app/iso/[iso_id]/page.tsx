// src/app/offers/[id]/page.tsx

"use client";

import { useParams } from 'next/navigation';
import ISODetailView from './_components/ISODetailView';
import DashboardShell from '@/components/DashboardShell';

export default function ISODetailsPage() {
  const params = useParams();
  const iso_id = params?.iso_id as string;

  if (!iso_id) {
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
    <div className="w-full border-gray-100  bg-gray-100 p-4 rounded-xl overflow-hidden text-center">
      <ISODetailView id={iso_id} />
    </div>
    </DashboardShell>
  );
}