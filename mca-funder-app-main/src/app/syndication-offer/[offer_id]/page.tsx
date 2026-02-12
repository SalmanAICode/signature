// src/app/dashboard/syndication-offer/[offer_id]/page.tsx

'use client';

import { useParams } from 'next/navigation';
import SyndicationOfferDetailView from './_components/SyndicationOfferDetailView';
import DashboardShell from '@/components/DashboardShell';

export default function Page() {
  const params = useParams();
  const offer_id = params?.offer_id as string;

  if (!offer_id) {
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
        <SyndicationOfferDetailView id={offer_id} />
      </div>
    </DashboardShell>
  );
} 