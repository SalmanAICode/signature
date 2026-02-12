// components/ISODetailView.tsx
'use client';

import { useEffect, useState, ReactNode } from 'react';
import { getISOById } from '@/lib/api/isos';
import { ISO } from '@/types/iso';
import ISOInformationTab from './ISOInformationTab';
import ISORepresentativeTab from './ISORepresentativeTab';
import ISOApplicationTab from './ISOApplicationTab';

interface ISODetailViewProps {
  id: string;
  title?: string;
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const TabButton = ({ active, onClick, children }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
      active
        ? 'bg-white text-blue-600 border-b-2 border-blue-600'
        : 'bg-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-300'
    }`}
  >
    {children}
  </button>
);

export default function ISODetailView({ id, title }: ISODetailViewProps) {
  const [data, setData] = useState<ISO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    getISOById(id)
      .then((res) => setData(res))
      .catch((err) => {
        console.error('Error fetching ISO:', err);
        setError(err.message || 'Failed to load ISO details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-left">Loading...</p>;
  if (error) return (
    <div className="w-screen bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <div className="flex-1 text-left">
        <h3 className="text-red-800 font-medium text-sm">Unable to Load ISO Details</h3>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    </div>
  );
  if (!data) return <p className="text-left">ISO not found.</p>;

  return (
    <div className="h-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <TabButton
          active={activeTab === 'details'}
          onClick={() => setActiveTab('details')}
        >
          ISO Information
        </TabButton>
        <TabButton
          active={activeTab === 'representatives'}
          onClick={() => setActiveTab('representatives')}
        >
          ISO Representatives
        </TabButton>
        <TabButton
          active={activeTab === 'applications'}
          onClick={() => setActiveTab('applications')}
        >
          ISO Applications
        </TabButton>
      </div>

      {/* Tab Content */}
      <div className="flex justify-center items-center text-left">
        {activeTab === 'details' && <ISOInformationTab data={data} />}
        {activeTab === 'representatives' && <ISORepresentativeTab isoId={data._id} />}
        {activeTab === 'applications' && <ISOApplicationTab isoId={data._id} />}
      </div>
    </div>
  );
}