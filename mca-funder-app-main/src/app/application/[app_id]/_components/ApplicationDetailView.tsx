'use client';

import { useEffect, useState, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getApplicationById } from '@/lib/api/applications';
import { Application } from '@/types/application';
import ApplicationInformationTab from './ApplicationInformationTab';
import ApplicationDocumentsTab from './ApplicationDocumentsTab';
import ApplicationOffersTab from './ApplicationOffersTab';
import ApplicationStipulationsTab from './ApplicationStipulationsTab';
import useAuthStore from '@/lib/store/auth';

interface ApplicationDetailViewProps {
  title: string;
  id: string;
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
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
}

export default function ApplicationDetailView({ title, id }: ApplicationDetailViewProps) {
  const [data, setData] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const router = useRouter();
  const prevFunderIdRef = useRef<string | undefined>(undefined);
  
  // Get current user's funder from auth store
  const { funder } = useAuthStore();
  const currentFunderId = funder?._id;

  // Watch for funder changes and redirect to /application
  useEffect(() => {
    const prevFunderId = prevFunderIdRef.current;
    
    // Redirect if we had a previous funder and now have a different funder
    if (prevFunderId && currentFunderId && prevFunderId !== currentFunderId) {
      router.push('/application');
    }
    
    // Also redirect if we had a funder and now it's undefined (funder was cleared)
    if (prevFunderId && !currentFunderId) {
      console.log('Redirecting to /application due to funder being cleared');
      router.push('/application');
    }
    
    // Update the ref for next comparison
    prevFunderIdRef.current = currentFunderId;
  }, [currentFunderId, router]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getApplicationById(id)
        .then((res) => setData(res))
        .catch((err) => {
          console.error('Error fetching application:', err);
          setError(err.message || 'Failed to load application details');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <p className="text-left">Loading...</p>;
  if (error) return (
    <div className="w-screen bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <div className="flex-1 text-left">
        <h3 className="text-red-800 font-medium text-sm">Unable to Load Application Details</h3>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    </div>
  );
  if (!data) return <p className="text-left">Application not found.</p>;

  return (
    <div className="h-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <TabButton
          active={activeTab === 'details'}
          onClick={() => setActiveTab('details')}
        >
          Application Information
        </TabButton>
        <TabButton
          active={activeTab === 'stipulations'}
          onClick={() => setActiveTab('stipulations')}
        >
          Stipulations
        </TabButton>
        <TabButton
          active={activeTab === 'documents'}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </TabButton>
        <TabButton
          active={activeTab === 'offers'}
          onClick={() => setActiveTab('offers')}
        >
          Offers
        </TabButton>

      </div>

      {/* Tab Content */}
      <div className="flex justify-center items-center text-left">
        {activeTab === 'details' && <ApplicationInformationTab data={data} />}
        {activeTab === 'documents' && <ApplicationDocumentsTab data={data} />}
        {activeTab === 'offers' && <ApplicationOffersTab data={data} />} 
        {activeTab === 'stipulations' && <ApplicationStipulationsTab data={data} />}
      </div>
    </div>
  );
} 