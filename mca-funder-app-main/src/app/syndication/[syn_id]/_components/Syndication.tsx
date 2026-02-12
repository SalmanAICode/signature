'use client';

import { Syndication } from '@/types/syndication';
import Display from '@/components/Display';
import { getSummaryConfig } from '../_config/syndicationSections';

interface SyndicationInformationProps {
  data: Syndication;
}

export default function SyndicationInformation({ data }: SyndicationInformationProps) {
  // Transform data to add derived fields
  const transformedData = {
    ...data,
    active: data.status === 'ACTIVE',
    funder_name: typeof data.funding === 'object' ? data.funding.name : data.funding,
    syndicator_name: typeof data.syndicator === 'object' ? data.syndicator.name : data.syndicator,
  };

  // Get dynamic configuration based on actual data
  const config = getSummaryConfig(transformedData);

  return (
    <div className="p-4 w-full">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Display
          data={transformedData}
          config={config}
          title="Syndication Information"
          className=""
        />
      </div>
    </div>
  );
} 