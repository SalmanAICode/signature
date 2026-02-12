'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import { useRouter } from 'next/navigation';
import { getApplicationOfferList } from '@/lib/api/applicationOffers';
import { ApplicationOffer } from '@/types/applicationOffer';
import { Template } from './TemplateSelector';
import { generateDocumentFromTemplate } from '@/lib/api/documents';
import { toast } from 'react-hot-toast';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  onDocumentCreated?: () => void;
}

export function TemplatePreviewModal({
  isOpen,
  onClose,
  template,
  onDocumentCreated,
}: TemplatePreviewModalProps) {
  const router = useRouter();
  const [selectedOffer, setSelectedOffer] = useState<ApplicationOffer | null>(null);
  const [offers, setOffers] = useState<ApplicationOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOffers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedOffer) {
      generatePreview();
    }
  }, [isOpen, selectedOffer, template]);

  const fetchOffers = async () => {
    try {
      setLoadingOffers(true);
      const offerList = await getApplicationOfferList({
        include_inactive: false
      });
      setOffers(offerList);
    } catch (error) {
      toast.error('Failed to load application offers');
      console.error('Error fetching offers:', error);
    } finally {
      setLoadingOffers(false);
    }
  };

  const generatePreview = async () => {
    if (!selectedOffer) return;

    try {
      setLoadingPreview(true);
      // For now, we'll create a simple preview with sample data
      // In production, this should call an API endpoint to render the template
      const previewData = mapOfferToTemplateData(selectedOffer);
      setPreviewHtml(generateSamplePreview(previewData));
    } catch (error) {
      toast.error('Failed to generate preview');
      console.error('Error generating preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const mapOfferToTemplateData = (offer: ApplicationOffer) => {
    // Map application offer data to template variables
    return {
      customerName: offer.merchant?.name || offer.application?.name || 'N/A',
      lpoNumber: offer.application?._id?.substring(0, 8) || 'N/A',
      invoiceNumber: `INV-${offer._id.substring(0, 8)}`,
      invoiceDate: new Date().toLocaleDateString(),
      deliverySite: offer.merchant?.address_list?.[0] 
        ? `${offer.merchant.address_list[0].address_1}, ${offer.merchant.address_list[0].city}`
        : 'N/A',
      items: [
        {
          name: 'Funding Amount',
          description: 'Merchant Cash Advance',
          quantity: 1,
          price: offer.offered_amount?.toLocaleString() || '0',
          total: offer.offered_amount?.toLocaleString() || '0'
        }
      ],
      subTotal: offer.offered_amount?.toLocaleString() || '0',
      taxAmount: '0',
      grandTotal: offer.payback_amount?.toLocaleString() || '0',
      receiverName: offer.merchant?.primary_contact 
        ? `${offer.merchant.primary_contact.first_name} ${offer.merchant.primary_contact.last_name}`
        : 'N/A',
      receiverMobile: offer.merchant?.primary_contact?.phone || 'N/A',
      logoDataUri: ''
    };
  };

  const generateSamplePreview = (data: any) => {
    // This is a simplified preview - in production, this should come from the API
    return `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2>Template Preview: ${template.name}</h2>
        <div style="border: 1px solid #ddd; padding: 15px; margin-top: 10px;">
          <p><strong>Customer:</strong> ${data.customerName}</p>
          <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
          <p><strong>Amount:</strong> $${data.grandTotal}</p>
          <p style="margin-top: 10px; color: #666; font-size: 12px;">
            This is a preview. The full template will be rendered on the preview page.
          </p>
        </div>
      </div>
    `;
  };

  const handleGenerate = async () => {
    if (!selectedOffer) {
      toast.error('Please select an application offer');
      return;
    }

    try {
      setLoadingPreview(true);
      // Generate document from template - creates and saves document in our DB
      const doc = await generateDocumentFromTemplate(template.id, selectedOffer._id);
      onDocumentCreated?.(); // Refresh document list
      router.push(`/document/${doc._id || doc.id}`);
      onClose();
    } catch (error: any) {
      console.error('Full error object:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to generate document';
      
      // Show detailed error message
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        toast.error('API endpoint not found. The backend endpoint /api/v1/documents/generate-from-template needs to be implemented.');
      } else if (errorMessage.includes('Failed to generate document')) {
        toast.error(errorMessage);
      } else {
        toast.error(`Error: ${errorMessage}`);
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  const offerOptions = offers.map(offer => ({
    value: offer._id,
    label: `Offer $${offer.offered_amount?.toLocaleString()} → $${offer.payback_amount?.toLocaleString()} (${offer.status || 'N/A'})`,
    offer: offer
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Template Preview: {template.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Application Offer Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Application Offer
            </label>
            <Select
              options={offerOptions}
              value={selectedOffer ? {
                value: selectedOffer._id,
                label: `Offer $${selectedOffer.offered_amount?.toLocaleString()} → $${selectedOffer.payback_amount?.toLocaleString()} (${selectedOffer.status || 'N/A'})`,
                offer: selectedOffer
              } : null}
              onChange={(option) => setSelectedOffer(option?.offer || null)}
              placeholder="Select an application offer..."
              className="text-sm"
              classNamePrefix="select"
              isSearchable
              isLoading={loadingOffers}
              menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
              menuPosition="fixed"
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </div>

          {/* Preview */}
          {selectedOffer && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
              {loadingPreview ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div 
                  className="bg-white rounded p-4 border"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!selectedOffer || loadingPreview}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
