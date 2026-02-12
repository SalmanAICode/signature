import { useState, useEffect } from 'react';
import { CreateSyndicationData } from '@/types/syndication';
import { Syndicator } from '@/types/syndicator';
import { SyndicationOffer } from '@/types/syndicationOffer';
import useSyndicationStore from '@/lib/store/syndication';
import useModalStore, { Modal } from '@/lib/store/modal';
import { getFundingList } from '@/lib/api/fundings';
import { getSyndicatorList } from '@/lib/api/syndicators';
import { getSyndicationOfferList } from '@/lib/api/sydicationOffers';
import Card, { CardField } from '@/components/Card';
import { getCreateModalCardSections } from '../_config/cardSections';
import { Funding } from '@/types/funding';
import { toast } from 'react-hot-toast';

// Initial values for the form - strictly according to CreateSyndicationData
const initialValues: CreateSyndicationData = {
  funding: '', // Required - Funding ID
  syndicator: '', // Required - Syndicator ID
  syndication_offer: undefined, // Optional - Syndication offer ID
  participate_percent: 0, // Required
  participate_amount: 0, // Required
  payback_amount: 0, // Required
  fee_list: undefined, // Optional - Will be initialized when user adds a fee
  credit_list: undefined, // Optional - Will be initialized when user adds a credit
  start_date: '', // Required - Date as string
  status: 'ACTIVE' // Required
};

export function SyndicationCreateModalContent({ modalData }: { modalData: Modal }) {
  const createNewSyndication = useSyndicationStore(state => state.createNewSyndication);
  const creating = useSyndicationStore(state => state.creating);
  const error = useSyndicationStore(state => state.error);
  const closeModal = useModalStore(state => state.closeModal);

  // Extract initialFundingId from modalData.data
  const initialFundingId = modalData.data?.initialFundingId;

  const [formData, setFormData] = useState<CreateSyndicationData>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fundings, setFundings] = useState<Funding[]>([]);
  const [syndicators, setSyndicators] = useState<Syndicator[]>([]);
  const [syndicationOffers, setSyndicationOffers] = useState<SyndicationOffer[]>([]);
  const [loadingFundings, setLoadingFundings] = useState(false);
  const [loadingSyndicators, setLoadingSyndicators] = useState(false);
  const [loadingSyndicationOffers, setLoadingSyndicationOffers] = useState(false);

  // Fetch fundings, syndicators and syndication offers when component mounts
  useEffect(() => {
    fetchFundings();
    fetchSyndicators();
    fetchSyndicationOffers();
  }, []);

  // Monitor creating state and close modal when creation is successful
  useEffect(() => {
    if (isSubmitting && !creating && !error) {
      // Creation was successful, close the modal
      closeModal(modalData.key);
    }
  }, [creating, error, isSubmitting, closeModal, modalData.key]);

  // If initialFundingId is provided, set it and disable funding selection
  useEffect(() => {
    if (initialFundingId) {
      setFormData(prev => ({ ...prev, funding: initialFundingId }));
    }
  }, [initialFundingId]);

  const fetchFundings = async () => {
    setLoadingFundings(true);
    try {
      const fundingList = await getFundingList();
      setFundings(fundingList.data);
    } catch (err) {
      console.error('Error fetching fundings:', err);
    } finally {
      setLoadingFundings(false);
    }
  };

  const fetchSyndicators = async () => {
    setLoadingSyndicators(true);
    try {
      const syndicatorList = await getSyndicatorList();
      setSyndicators(syndicatorList);
    } catch (err) {
      console.error('Error fetching syndicators:', err);
    } finally {
      setLoadingSyndicators(false);
    }
  };

  const fetchSyndicationOffers = async () => {
    setLoadingSyndicationOffers(true);
    try {
      const syndicationOfferList = await getSyndicationOfferList({});
      setSyndicationOffers(syndicationOfferList);
    } catch (err) {
      console.error('Error fetching syndication offers:', err);
    } finally {
      setLoadingSyndicationOffers(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.funding.trim()) {
      toast.error('Please select a funding source');
      return;
    }
    
    if (!formData.syndicator.trim()) {
      toast.error('Please select a syndicator');
      return;
    }
    
    // Get selected funding to validate participate amount
    const selectedFunding = fundings.find(f => f._id === formData.funding);
    if (!selectedFunding) {
      toast.error('Selected funding not found');
      return;
    }
    
    if (!formData.participate_amount || formData.participate_amount <= 0) {
      toast.error('Please enter a valid participate amount greater than 0');
      return;
    }

    if (formData.participate_amount > selectedFunding.funded_amount) {
      toast.error(`Participate amount cannot exceed funding amount ($${selectedFunding.funded_amount.toLocaleString()})`);
      return;
    }

    if (!formData.payback_amount || formData.payback_amount <= 0) {
      toast.error('Please enter a valid payback amount greater than 0');
      return;
    }

    if (!formData.participate_percent || formData.participate_percent < 0 || formData.participate_percent > 100) {
      const funding = fundings.find(f => f._id === formData.funding);
      if (funding && funding.funded_amount) {
        formData.participate_percent = Number(((formData.participate_amount / funding.funded_amount) * 100).toFixed(2));
      } else {
        toast.error('Please enter a valid participate percentage (0-100)');
        return;
      } 
    }

    if (!formData.start_date.trim()) {
      toast.error('Please select a start date');
      return;
    }

    if (!formData.status) {
      toast.error('Please select a status');
      return;
    }

    if (!formData.payback_amount || formData.payback_amount <= 0) {
      toast.error('Please enter a valid payback amount greater than 0');
      return;
    }


    setIsSubmitting(true);
    
    // Clean up data before sending
    const cleanData = {
      ...formData,
      // Remove empty optional fields
      syndication_offer: formData.syndication_offer?.trim() || undefined,
      fee_list: formData.fee_list?.length ? formData.fee_list : undefined,
      credit_list: formData.credit_list?.length ? formData.credit_list : undefined,
    };

    createNewSyndication(cleanData);
  };

  // Handle input changes from Card component
  const handleInputChange = (value: any, field: CardField) => {
    setFormData(prev => ({
      ...prev,
      [field.key]: value
    }));
  };

  // Handle key down events to prevent form submission on Enter in input fields
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent form submission when Enter is pressed on input fields (except submit button)
    if (e.key === 'Enter' && e.target !== e.currentTarget) {
      const target = e.target as HTMLElement;
      // Only prevent if it's an input field, not the submit button
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  // Get Card sections from configuration
  const cardSections = getCreateModalCardSections(
    handleInputChange,
    fundings,
    syndicators,
    syndicationOffers,
    loadingFundings,
    loadingSyndicators,
    loadingSyndicationOffers,
    formData,
    initialFundingId
  );

  return (
    <div className="p-6 bg-theme-background">
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border border-red-200 shadow-sm">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
        <Card
          data={formData}
          sections={cardSections}
          showEmptyFields={true}
          animated={true}
          variant="outlined"
        />

        {/* Form Actions */}
        <div className="flex justify-center pt-6 border-t border-theme-border bg-theme-muted rounded-lg p-4 mt-6">
            <button
              type="submit"
              disabled={creating}
              className="px-8 py-3 text-sm font-medium text-theme-primary-foreground bg-theme-primary border border-transparent rounded-md hover:bg-theme-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-theme-sm transition-all duration-200"
            >
              {creating ? 'Creating...' : 'Create Syndication'}
            </button>
        </div>
      </form>
    </div>
  );
}

export default SyndicationCreateModalContent; 