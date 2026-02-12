'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { getApplicationOfferById } from '@/lib/api/applicationOffers';
import { ApplicationOffer } from '@/types/applicationOffer';
import { generateDocumentFromTemplate } from '@/lib/api/documents';
import { toast } from 'react-hot-toast';

export default function TemplatePreviewPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  const offerId = searchParams.get('offer');

  const [offer, setOffer] = useState<ApplicationOffer | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId || !offerId) {
      setError('Template and offer ID are required');
      setLoading(false);
      return;
    }

    fetchData();
  }, [templateId, offerId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch application offer
      const offerData = await getApplicationOfferById(offerId!);
      setOffer(offerData);

      // Generate document from template
      const html = await generateDocumentFromTemplate(templateId!, offerId!);
      setPreviewHtml(html);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preview';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex justify-center items-center min-h-screen">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-lg text-gray-600">Loading preview...</span>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error || !offer) {
    return (
      <DashboardShell>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg text-red-600">{error || 'Failed to load preview'}</div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="flex justify-center py-4">
        <div className="a4 bg-white shadow-lg" dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </div>
      <style jsx>{`
        .a4 {
          width: 210mm;
          min-height: 297mm;
          background: white;
          padding: 10mm;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          font-size: 12px;
          color: #000;
        }

        @media print {
          body {
            background: none;
          }
          .a4 {
            box-shadow: none;
            margin: 0;
          }
        }
      `}</style>
    </DashboardShell>
  );
}
