import { Application } from '@/types/application';
import Card from '@/components/Card';
import { getApplicationById } from '@/lib/api/applications';
import { getSyndication } from '@/lib/api/syndications';
import { getFundingById } from '@/lib/api/fundings';
import { useState, useEffect } from 'react';
import Loading from '@/components/Loading';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import BaseApplicationInformationTab from '@/app/application/[app_id]/_components/ApplicationInformationTab';

type ApplicationProps = {
  syndicationId: string;
};

export default function ApplicationDetailView({ syndicationId }: ApplicationProps) {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!syndicationId) {
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    // Fetch syndication first to get funding ID
    getSyndication(syndicationId)
      .then((res) => {
        if (res.data.funding) {
          // Get funding to get application ID
          return getFundingById(
            typeof res.data.funding === 'string' 
              ? res.data.funding 
              : res.data.funding._id
          );
        }
        throw new Error('No funding found for this syndication');
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
  }, [syndicationId]);

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

  return <BaseApplicationInformationTab data={application} />;
}