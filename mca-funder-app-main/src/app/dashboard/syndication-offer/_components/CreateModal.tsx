'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import FormModalLayout from '@/components/FormModalLayout';
import { createSyndicationOffer } from '@/lib/api/sydicationOffers';
import { getFundingList } from '@/lib/api/fundings';
import { getSyndicatorList } from '@/lib/api/syndicators';
import { Funding } from '@/types/funding';
import { Syndicator } from '@/types/syndicator';
import Card from '@/components/Card';
import { getCreateModalCardSections } from '../_config/cardSections';
import { CreateSyndicationOfferData } from '@/types/syndicationOffer';

type SyndicationOfferStatus = 'SUBMITTED' | 'DECLINED' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED';

// Initial values for the form
const initialValues: Partial<CreateSyndicationOfferData> = {
  funding: '',
  syndicator: '',
  participate_amount: 0,
  participate_percent: 0,
  payback_amount: 0,
  fee_list: undefined,
  credit_list: undefined,
  offered_date: '',
  expired_date: '',
  status: 'SUBMITTED' as SyndicationOfferStatus,
};

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function CreateModal({ isOpen, onClose, onSuccess }: CreateModalProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateSyndicationOfferData>>(initialValues);
  const [fundings, setFundings] = useState<Funding[]>([]);
  const [syndicators, setSyndicators] = useState<Syndicator[]>([]);
  const [loadingFundings, setLoadingFundings] = useState(false);
  const [loadingSyndicators, setLoadingSyndicators] = useState(false);

  useEffect(() => {
    fetchFundings();
    fetchSyndicators();
  }, []);

  const fetchFundings = async () => {
    setLoadingFundings(true);
    try {
      const response = await getFundingList();
      setFundings(response.data);
    } catch (err) {
      console.error('Error fetching fundings:', err);
    } finally {
      setLoadingFundings(false);
    }
  };

  const fetchSyndicators = async () => {
    setLoadingSyndicators(true);
    try {
      const response = await getSyndicatorList();
      setSyndicators(response);
    } catch (err) {
      console.error('Error fetching syndicators:', err);
    } finally {
      setLoadingSyndicators(false);
    }
  };

  const handleInputChange = (value: any, field: any) => {
    setFormData(prev => ({
      ...prev,
      [field.key]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Basic validation
      if (!formData.funding?.trim()) {
        throw new Error('Please select a funding source');
      }

      if (!formData.syndicator?.trim()) {
        throw new Error('Please select a syndicator');
      }

      // Get selected funding to validate participate amount
      const selectedFunding = fundings.find(f => f._id === formData.funding);
      if (!selectedFunding) {
        throw new Error('Selected funding not found');
      }

      if (!formData.participate_amount || formData.participate_amount <= 0) {
        throw new Error('Please enter a valid participate amount greater than 0');
      }

      if (formData.participate_amount > selectedFunding.funded_amount) {
        throw new Error(`Participate amount cannot exceed funding amount ($${selectedFunding.funded_amount.toLocaleString()})`);
      }

      if (!formData.payback_amount || formData.payback_amount <= 0) {
        throw new Error('Please enter a valid payback amount greater than 0');
      }

      if (!formData.participate_percent || formData.participate_percent < 0 || formData.participate_percent > 100) {
        const funding = fundings.find(f => f._id === formData.funding);
        if (funding && funding.funded_amount) {
          formData.participate_percent = Number(((formData.participate_amount / funding.funded_amount) * 100).toFixed(2));
        } else {
          throw new Error('Please enter a valid participate percentage (0-100)');
        }
      }

      if (!formData.offered_date) {
        throw new Error('Please select an offered date');
      }

      if (!formData.status) {
        throw new Error('Please select a status');
      }

      // Clean up data before sending
      const cleanData: CreateSyndicationOfferData = {
        funding: formData.funding,
        syndicator: formData.syndicator,
        participate_amount: formData.participate_amount,
        participate_percent: formData.participate_percent,
        payback_amount: formData.payback_amount,
        offered_date: formData.offered_date,
        status: formData.status,
      };

      // Only include fee_list and credit_list if they have items
      if (formData.fee_list && formData.fee_list.length > 0) {
        cleanData.fee_list = formData.fee_list;
      }
      if (formData.credit_list && formData.credit_list.length > 0) {
        cleanData.credit_list = formData.credit_list;
      }

      await createSyndicationOffer(cleanData);
      onSuccess('Syndication offer created successfully');
      onClose();
    } catch (err: any) {
      console.error('Error creating syndication offer:', err);
      setError(err.message || 'Failed to create syndication offer');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseError = () => {
    setError('');
  };

  if (!isOpen) return null;

  // Get Card sections from configuration
  const cardSections = getCreateModalCardSections(
    handleInputChange,
    fundings,
    syndicators,
    loadingFundings,
    loadingSyndicators,
    formData
  );

  return (
    <FormModalLayout
      title="Create Syndication Offer"
      subtitle="Please enter syndication offer details below."
      onCancel={onClose}
      maxWidth={900}
    >
      <div className="p-6 bg-theme-background">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border border-red-200 shadow-sm relative flex items-start">
            <p className="text-sm flex-1 pr-6">{error}</p>
            <button
              onClick={handleCloseError}
              className="flex items-center justify-center h-5 w-5 text-red-400 hover:text-red-600 focus:outline-none"
              aria-label="Close error message"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card
            data={formData}
            sections={cardSections}
            showEmptyFields={true}
            animated={true}
            variant="outlined"
          />

          {/* Form Actions */}
          <div className="flex justify-center gap-4 pt-6 border-t border-theme-border bg-theme-muted rounded-lg p-4 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 text-sm font-medium text-theme-primary-foreground bg-theme-primary border border-transparent rounded-md hover:bg-theme-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-theme-sm transition-all duration-200 inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 text-sm font-medium text-theme-primary-foreground bg-error border border-theme-border rounded-md hover:bg-theme-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-theme-sm transition-all duration-200 inline-flex items-center gap-2"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </FormModalLayout>
  );
}