import { Metadata } from 'next';
import ImportClient from './_components/ImportClient';

export const metadata: Metadata = {
  title: 'Import Data - Funder CRM',
  description: 'Import your data from other platforms',
};

export default function ImportPage() {
  return <ImportClient />;
} 