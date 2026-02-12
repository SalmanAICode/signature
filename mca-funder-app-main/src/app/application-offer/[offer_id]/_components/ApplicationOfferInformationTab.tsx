'use client';

import { ApplicationOffer } from '@/types/applicationOffer';
import ApplicationOfferInformationTab from '@/components/ApplicationOffer/ApplicationOfferInformationTab';

interface ApplicationOfferInformationTabProps {
  data: ApplicationOffer;
}

export default function ApplicationOfferInformationTabWrapper({ data }: ApplicationOfferInformationTabProps) {
  return <ApplicationOfferInformationTab data={data} />;
} 