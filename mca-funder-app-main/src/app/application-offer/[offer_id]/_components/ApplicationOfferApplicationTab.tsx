'use client';

import { ApplicationOffer } from '@/types/applicationOffer';
import ApplicationInformationTab from '@/components/Application/ApplicationInformationTab';
import { getApplicationById } from '@/lib/api/applications';
import { useEffect, useState } from 'react';
import { Application } from '@/types/application';

interface ApplicationOfferApplicationTabProps {
  data: ApplicationOffer;
}

export default function ApplicationOfferApplicationTab({ data }: ApplicationOfferApplicationTabProps) {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplication = async () => {
      const application = await getApplicationById(data.application._id);
      setApplication(application);
      setLoading(false);
    };
    fetchApplication();
  }, [data.application._id]);

  if (!application) {
    return (
      <div className="p-4 text-center text-gray-500">
        No application information available
      </div>
    );
  }

  return (
    <div className="w-full">
      {loading ? 'Loading...' : <ApplicationInformationTab data={application} />}
    </div>
  );
}
