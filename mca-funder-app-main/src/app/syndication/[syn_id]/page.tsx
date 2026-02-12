'use client';

import { useParams } from 'next/navigation';
import SyndicationDetailView from './_components/SyndicationDetailView';
import DashboardShell from '@/components/DashboardShell';

export default function SyndicationDetailPage() {
  const params = useParams();
  const syn_id = params.syn_id as string;

  return (
    <DashboardShell>
    <div className="w-full border-gray-100 bg-gray-100 rounded-xl p-4">
      <SyndicationDetailView 
        title="Syndication Detail"
        id={syn_id}
      />
    </div>
    </DashboardShell>
  );
} 