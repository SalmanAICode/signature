import React, { useEffect, useState } from 'react';
import { getMerchantList } from '@/lib/api/merchants';
import { getISOMerchantList, addISOMerchant, deleteISOMerchant } from '@/lib/api/isoMerchants';
import { Merchant } from '@/types/merchant';
import Select from 'react-select';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

interface EditMerchantsModalProps {
  isoId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedMerchants: Merchant[]) => void;
  onMerchantChange?: () => void;
  currentMerchants: Merchant[];
}

const EditMerchantsModal: React.FC<EditMerchantsModalProps> = ({ isoId, isOpen, onClose, onSuccess, onMerchantChange, currentMerchants }) => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchantsLoading, setMerchantsLoading] = useState(false);
  const [merchantsError, setMerchantsError] = useState('');
  const [selectedMerchants, setSelectedMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch merchants on component mount
  useEffect(() => {
    const fetchMerchants = async () => {
      setMerchantsLoading(true);
      setMerchantsError('');
      try {
        const merchantsData = await getMerchantList();
        setMerchants(merchantsData || []);
      } catch (err) {
        console.error('Failed to fetch merchants:', err);
        setMerchantsError('Failed to fetch merchants');
        setMerchants([]);
      } finally {
        setMerchantsLoading(false);
      }
    };

    fetchMerchants();
  }, []);

  // Initialize selectedMerchants when modal opens or currentMerchants changes
  useEffect(() => {
    if (isOpen && currentMerchants) {
      setSelectedMerchants(currentMerchants.map((m: Merchant) => ({ value: m._id, label: m.name })));
    }
  }, [isOpen, currentMerchants]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      // Find merchants to add and remove
      const originalIds = currentMerchants.map(m => m._id);
      const newIds = selectedMerchants.map(m => m.value);
      const toAdd = newIds.filter(id => !originalIds.includes(id));
      const toRemove = originalIds.filter(id => !newIds.includes(id));
      
      // Add new merchants
      for (const merchantId of toAdd) {
        await addISOMerchant(isoId, merchantId);
      }
      
      // Remove unselected merchants
      for (const merchantId of toRemove) {
        try {
          // Get all ISO merchant relationships for this ISO
          const isoMerchants = await getISOMerchantList(isoId, '');
          
          // Find the specific relationship that connects this ISO to this merchant
          const isoMerchant = isoMerchants.find(im => {
            const merchantInRelationship = typeof im.merchant === 'object' ? im.merchant._id : im.merchant;
            return merchantInRelationship === merchantId;
          });
          
          if (isoMerchant) {
            // Delete the relationship using the relationship ID
            await deleteISOMerchant(isoMerchant._id);
            console.log(`Deleted ISO merchant relationship: ${isoMerchant._id}`);
          } else {
            console.warn(`No ISO merchant relationship found for merchant: ${merchantId}`);
          }
        } catch (deleteError) {
          console.error(`Failed to delete merchant relationship for merchant ${merchantId}:`, deleteError);
          // Continue with other deletions even if one fails
        }
      }
      
      // Get the updated merchants list based on selections
      const updatedMerchants = merchants.filter(m => selectedMerchants.some(sm => sm.value === m._id));
      
      if (onSuccess) onSuccess(updatedMerchants);
      if (onMerchantChange) onMerchantChange();
      onClose();
    } catch (err: any) {
      console.error('Failed to update merchants:', err);
      setError('Failed to update merchants');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-4 flex items-center justify-center gap-2">
          <PencilSquareIcon className="h-5 w-5 text-blue-600" />
          Edit Assigned Merchants
        </h2>
        <div className="mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Current Merchants</h3>
            <p className="text-xs text-blue-600 mb-2">This ISO is already assigned to:</p>
            {loading ? (
              <p className="text-xs text-blue-600">Loading...</p>
            ) : currentMerchants.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-blue-700">
                {currentMerchants.map(m => (
                  <li key={m._id}>{m.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-blue-600">No merchants assigned</p>
            )}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Manage Merchants
          </label>
          <Select
            isMulti
            options={(merchants || []).map(m => ({ value: m._id, label: m.name }))}
            value={selectedMerchants}
            onChange={val => setSelectedMerchants(Array.isArray(val) ? [...val] : [])}
            isLoading={merchantsLoading}
            placeholder="Select merchants..."
            classNamePrefix="select"
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
            styles={{
              input: base => ({ ...base, fontSize: '0.875rem' }),
              option: base => ({ ...base, fontSize: '0.875rem' }),
              singleValue: base => ({ ...base, fontSize: '0.875rem' }),
              multiValueLabel: base => ({ ...base, fontSize: '0.875rem' }),
              menuPortal: base => ({ ...base, zIndex: 9999 }),
            }}
          />
          {merchantsError && <div className="text-xs text-red-500 mt-1">{merchantsError}</div>}
        </div>
        {error && <div className="text-xs text-red-500 mb-2">{error}</div>}
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-300 hover:text-gray-800 transition"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={handleSave}
            disabled={loading}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMerchantsModal; 