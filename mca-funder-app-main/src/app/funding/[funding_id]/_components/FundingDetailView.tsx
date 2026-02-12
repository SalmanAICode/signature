'use client';

import { useEffect, useState } from 'react';
import { getFundingById } from '@/lib/api/fundings';
import { Funding } from '@/types/funding';
import FundingInformation from './FundingInformation';
import SyndicationsOffers from './SyndicationsOffers';
import Syndications from './Syndications';
import Application from '@/app/application/[app_id]/_components/ApplicationInformationTab';
import ApplicationOffer from '@/app/application/[app_id]/_components/ApplicationOffersTab';
import Credits from './Credits';
import FeesTab from './FeesTab';
import PaybackPlans from './PaybackPlans';
import Paybacks from './Paybacks';
import Disbursements from './Disbursements';
import Commissions from './Commissions';

interface FundingDetailViewProps {
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
    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
      active
        ? 'bg-white text-blue-600 border-b-2 border-blue-600'
        : 'bg-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-300'
    }`}
  >
    {children}
  </button>
);

export default function FundingDetailView({ title, id }: FundingDetailViewProps) {
  const [data, setData] = useState<Funding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('information');

  useEffect(() => {
    getFundingById(id)
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error('Error fetching funding:', err);
        setError(err.message || 'Failed to load funding details');
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
        <h3 className="text-red-800 font-medium text-sm">Unable to Load Funding Details</h3>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    </div>
  );
  if (!data) return <p className="text-left">Funding not found.</p>;

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4 flex-shrink-0">
        <TabButton active={activeTab === 'information'} onClick={() => setActiveTab('information')}>Information</TabButton>
        <TabButton active={activeTab === 'application'} onClick={() => setActiveTab('application')}>Application</TabButton>
        <TabButton active={activeTab === 'application-offer'} onClick={() => setActiveTab('application-offer')}>Application Offer</TabButton>
        <TabButton active={activeTab === 'syndications-offers'} onClick={() => setActiveTab('syndications-offers')}>Syndications Offers</TabButton>
        <TabButton active={activeTab === 'syndications'} onClick={() => setActiveTab('syndications')}>Syndications</TabButton>
        <TabButton active={activeTab === 'payback-plans'} onClick={() => setActiveTab('payback-plans')}>Payback Plans</TabButton>
        <TabButton active={activeTab === 'paybacks'} onClick={() => setActiveTab('paybacks')}>Paybacks</TabButton>
        <TabButton active={activeTab === 'disbursements'} onClick={() => setActiveTab('disbursements')}>Disbursements</TabButton>
        <TabButton active={activeTab === 'commissions'} onClick={() => setActiveTab('commissions')}>Commissions</TabButton>
        <TabButton active={activeTab === 'fees'} onClick={() => setActiveTab('fees')}>Fees</TabButton>
        <TabButton active={activeTab === 'credits'} onClick={() => setActiveTab('credits')}>Credits</TabButton>
      </div>

      {/* Tab Content */}
      <div className="flex-grow overflow-y-auto">
        {activeTab === 'information' && <FundingInformation data={data} />}
        {activeTab === 'syndications-offers' && <SyndicationsOffers fundingId={data._id} />}
        {activeTab === 'syndications' && <Syndications fundingId={data._id} />}
        {activeTab === 'application' && data.application && (
          <Application 
            data={typeof data.application === 'string' ? { _id: data.application } as any : data.application} 
          />
        )}
        {activeTab === 'application-offer' && data.application && (
          <ApplicationOffer 
            data={typeof data.application === 'string' ? { _id: data.application } as any : data.application} 
          />
        )}
        {activeTab === 'payback-plans' && <PaybackPlans fundingId={data._id} />}
        {activeTab === 'paybacks' && <Paybacks fundingId={data._id} />}
        {activeTab === 'disbursements' && <Disbursements fundingId={data._id} />}
        {activeTab === 'commissions' && <Commissions fundingId={data._id} />}
        {activeTab === 'fees' && <FeesTab data={data} />}
        {activeTab === 'credits' && <Credits data={data} />}
      </div>
    </div>
  );
} 