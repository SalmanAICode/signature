'use client';

import { useState, useEffect } from 'react';
import { Syndication } from '@/types/syndication';
import { getSyndication } from '@/lib/api/syndications';
import SyndicationInformation from './Syndication';
import ApplicationDetailView from './Application';
import Loading from '@/components/Loading';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Payout from './Payout';

interface SyndicationDetailViewProps {
  title: string;
  id: string;
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const TabButton = ({ active, onClick, children }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${active
        ? 'bg-white text-blue-600 border-b-2 border-blue-600'
        : 'bg-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-300'
      }`}
  >
    {children}
  </button>
);

export default function SyndicationDetailView({ title, id }: SyndicationDetailViewProps) {
  const [data, setData] = useState<Syndication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    getSyndication(id)
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error('Error fetching syndication:', err);
        setError(err.message || 'Failed to load syndication details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading title="Loading..." description="Fetching syndication details..." />;

  if (error) return (
    <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-red-800 font-medium text-sm">Unable to Load Syndication Details</h3>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    </div>
  );

  if (!data) return <p className="text-left">Syndication not found.</p>;

  return (
    <div className="h-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-gray-200 mb-4">
        <TabButton
          active={activeTab === 'details'}
          onClick={() => setActiveTab('details')}
        >
          Information
        </TabButton>
        {data.funding && (
          <TabButton
            active={activeTab === 'applications'}
            onClick={() => setActiveTab('applications')}
          >
            Application
          </TabButton>
        )}
        {data.funding && (
          <TabButton
            active={activeTab === 'payouts'}
            onClick={() => setActiveTab('payouts')}
          >
            Payouts
          </TabButton>
        )}
        {/* You can add more tabs here in the future */}
      </div>

      {/* Tab Content */}
      <div className="flex justify-center items-center text-left w-full">
        {activeTab === 'details' && <SyndicationInformation data={data} />}
        {activeTab === 'applications' && data.funding && (
          <ApplicationDetailView syndicationId={id} />
        )}
        {activeTab === 'payouts' && data.funding && (
          <Payout syndicationId={id} />
        )}
      </div>
    </div>
  );
} 