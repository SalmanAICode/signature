'use client';

import { useEffect, useState } from 'react';
import { getSyndicationOfferById } from '@/lib/api/sydicationOffers';
import { getFundingById, FundingResponse } from '@/lib/api/fundings';
import { SyndicationOffer } from '@/types/syndicationOffer';
import { Funding } from '@/types/funding';
import SyndicationOfferInformation from './SyndicationOffer';
import ApplicationInformationTab from './ApplicationInformationTab';
import FundingTab from './FundingTab';

interface SyndicationOfferDetailViewProps {
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

export default function SyndicationOfferDetailView({ id }: SyndicationOfferDetailViewProps) {
  const [data, setData] = useState<SyndicationOffer | null>(null);
  const [funding, setFunding] = useState<Funding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'information' | 'funding' | 'application'>('information');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await getSyndicationOfferById(id);
        setData(res);

        // If there's funding information, fetch the funding details
        if (res.funding?._id) {
          try {
            const fundingResponse = await getFundingById(res.funding._id);
            setFunding(fundingResponse.data);
          } catch (err) {
            setError('Failed to load funding details');
            console.error('Error fetching funding details:', err);
          }
        }
      } catch (err) {
        setError('Failed to load syndication offer information');
        console.error('Error fetching syndication offer:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <p className="text-left">Loading...</p>;
  if (error) return (
    <div className="w-screen bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <div className="flex-1 text-left">
        <h3 className="text-red-800 font-medium text-sm">Unable to Load Syndication Offer Information</h3>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    </div>
  );
  if (!data) return <p className="text-left">Syndication offer not found</p>;

  return (
    <div className="h-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-gray-200 mb-4">
        <TabButton
          active={activeTab === 'information'}
          onClick={() => setActiveTab('information')}
        >
          Information
        </TabButton>
        {funding && (
          <TabButton
            active={activeTab === 'funding'}
            onClick={() => setActiveTab('funding')}
          >
            Funding
          </TabButton>
        )}
        {funding?.application && (
          <TabButton
            active={activeTab === 'application'}
            onClick={() => setActiveTab('application')}
          >
            Application
          </TabButton>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex justify-center items-center text-left">
        {activeTab === 'information' && <SyndicationOfferInformation data={data} />}
        {activeTab === 'funding' && <FundingTab data={funding} />}
        {activeTab === 'application' && <ApplicationInformationTab offerId={id} />}
      </div>
    </div>
  );
} 