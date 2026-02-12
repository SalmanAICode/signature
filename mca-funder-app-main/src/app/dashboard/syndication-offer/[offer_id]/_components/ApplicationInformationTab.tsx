'use client';

import { Application } from '@/types/application';
import Card from '@/components/Card';
import { getApplicationById } from '@/lib/api/applications';
import { getSyndicationOfferById } from '@/lib/api/sydicationOffers';
import { getFundingById } from '@/lib/api/fundings';
import { useState, useEffect } from 'react';
import Loading from '@/components/Loading';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getApplicationDetailCardSections } from '@/app/syndication/[syn_id]/_config/cardSections';

type ApplicationInformationTabProps = {
  offerId: string;
};

export default function ApplicationInformationTab({ offerId }: ApplicationInformationTabProps) {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!offerId) {
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    // Fetch syndication offer first to get funding ID
    getSyndicationOfferById(offerId)
      .then((res) => {
        if (res.funding) {
          // Get funding to get application ID
          return getFundingById(
            typeof res.funding === 'string' 
              ? res.funding 
              : res.funding._id
          );
        }
        throw new Error('No funding found for this syndication offer');
      })
      .then((res) => {
        if (res.data.application) {
          // Get application details
          return getApplicationById(
            typeof res.data.application === 'string'
              ? res.data.application
              : res.data.application._id
          );
        }
        throw new Error('No application found for this funding');
      })
      .then((res) => {
        setApplication(res);
      })
      .catch((err) => {
        console.error('Error fetching application:', err);
        setError(err.message || 'Failed to load application details');
        setApplication(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [offerId]);

  if (loading) {
    return <Loading title="Loading..." description="Fetching application details..." />;
  }

  if (error) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-red-800 font-medium text-sm">Unable to Load Application Details</h3>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return <div className="w-full p-8 text-center text-gray-400">No application found</div>;
  }

  // Transform data to add derived fields if needed
  const transformedData = {
    ...application,
    active: !application.inactive
  };

  return (
    <div className="p-4 w-full">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Card
          data={transformedData}
          sections={getApplicationDetailCardSections()}
          showEmptyFields={false}
          compact={false}
          variant="default"
          animated={true}
          interactive={false}
          maxDepth={5}
        />
      </div>
    </div>
  );
}
