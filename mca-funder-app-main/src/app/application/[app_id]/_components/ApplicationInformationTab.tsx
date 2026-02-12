'use client';

import { Application } from '@/types/application';
import ApplicationInformationTab from '@/components/Application/ApplicationInformationTab';

interface ApplicationInformationTabProps {
  data: Application;
}

export default function ApplicationInformationTabWrapper({ data }: ApplicationInformationTabProps) {
  return <ApplicationInformationTab data={data} />;
} 