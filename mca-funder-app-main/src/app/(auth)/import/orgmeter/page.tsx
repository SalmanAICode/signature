import { Metadata } from 'next';
import OrgMeterImportClient from './_components/OrgMeterImportClient';

export const metadata: Metadata = {
  title: 'Import from OrgMeter - Funder CRM',
  description: 'Import your data from OrgMeter platform',
};

export default function OrgMeterImportPage() {
  return <OrgMeterImportClient />;
} 