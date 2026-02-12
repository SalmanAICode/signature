"use client";

import { useParams } from 'next/navigation';
import LenderDetailView from "./_components/LenderDetailView";
import DashboardShell from '@/components/DashboardShell';

export default function LenderDetailsPage() {
  const params = useParams();
  const lender_id = params?.lender_id as string;

  if (!lender_id) {
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
      <LenderDetailView id={lender_id} />
    </div>
    </DashboardShell>
  );
} 