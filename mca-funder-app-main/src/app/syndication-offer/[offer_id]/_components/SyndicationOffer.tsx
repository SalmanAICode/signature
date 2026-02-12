'use client';

import { SyndicationOffer } from '@/types/syndicationOffer';
import Display from '@/components/Display';
import { getInformationConfig } from '../_config/syndicationOfferSections';

interface SyndicationOfferInformationProps {
  data: SyndicationOffer;
}

export default function SyndicationOfferInformation({ data }: SyndicationOfferInformationProps) {
  // Transform data to add derived fields
  const transformedData = {
    ...data,
    funder_name: typeof data.funding === 'object' ? data.funding.name : data.funding,
    syndicator_name: typeof data.syndicator === 'object' ? data.syndicator.name : data.syndicator,
  };

  // Get dynamic configuration based on actual data
  const config = getInformationConfig(transformedData);

  return (
    <div className="p-4 w-full">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Display
          data={transformedData}
          config={config}
          title="Syndication Offer Information"
          className=""
        />
      </div>
    </div>
  );
} 