"use client";

import { useParams } from 'next/navigation';
import FundingDetailView from './_components/FundingDetailView';
import DashboardShell from '@/components/DashboardShell';

export default function Page() {
  const params = useParams();
  const funding_id = params?.funding_id as string;

  if (!funding_id) {
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
      <FundingDetailView title="Funding Detail" id={funding_id} />
    </div>
    </DashboardShell>
  );
} 