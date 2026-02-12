import React, { useEffect, useState } from 'react';
import { useMerchants } from '@/hooks/useMerchants';
import { getContactMerchants, addContactMerchant, removeContactMerchant } from '@/lib/api/contacts';
import { Merchant } from '@/types/merchant';
import Select from 'react-select';

interface EditContactMerchantsModalProps {
  contactId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onMerchantChange?: () => void;
}

const EditContactMerchantsModal: React.FC<EditContactMerchantsModalProps> = ({ contactId, isOpen, onClose, onSuccess, onMerchantChange }) => {
  const { merchants, merchantsLoading, merchantsError } = useMerchants();
  const [currentMerchants, setCurrentMerchants] = useState<Merchant[]>([]);
  const [selectedMerchants, setSelectedMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCurrentMerchants();
    }
    // eslint-disable-next-line
  }, [isOpen, contactId]);

  const fetchCurrentMerchants = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getContactMerchants(contactId);
      const docs = res?.data?.docs || [];
      setCurrentMerchants(docs);
      setSelectedMerchants(docs.map((m: Merchant) => ({ value: m._id, label: m.name })));
    } catch (err: any) {
      setError('Failed to fetch current merchants');
    } finally {
      setLoading(false);
    }
  };

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
        await addContactMerchant(contactId, merchantId);
      }
      // Remove unselected merchants
      for (const merchantId of toRemove) {
        await removeContactMerchant(contactId, merchantId);
      }
      if (onSuccess) onSuccess();
      if (onMerchantChange) onMerchantChange();
      onClose();
    } catch (err: any) {
      setError('Failed to update merchants');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-4">Edit Assigned Merchants</h2>
        <div className="mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Current Merchants</h3>
            <p className="text-xs text-blue-600 mb-2">This contact is already assigned to:</p>
            {loading ? (
              <p className="text-xs text-blue-600">Loading...</p>
            ) : currentMerchants.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-blue-700">
                {currentMerchants.map(m => (
                  <li key={m._id}>{m?.merchant?.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-blue-600">No merchants assigned</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Manage Merchants</label>
          <Select
            isMulti
            options={merchants.map(m => ({ value: m._id, label: m.name }))}
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
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
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

export default EditContactMerchantsModal; 