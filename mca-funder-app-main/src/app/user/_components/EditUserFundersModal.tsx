import React, { useEffect, useState } from 'react';
import { getFunderList } from '@/lib/api/funders';
import { addUserFunder, removeUserFunder } from '@/lib/api/userFunders';
import { Funder } from '@/types/funder';
import Select from 'react-select';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

interface EditUserFundersModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (changes: { added: Funder[], removed: string[] }) => void;
  onFunderChange?: () => void;
  currentFunders: Funder[];
}

const EditUserFundersModal: React.FC<EditUserFundersModalProps> = ({ userId, isOpen, onClose, onSuccess, onFunderChange, currentFunders }) => {
  const [funders, setFunders] = useState<Funder[]>([]);
  const [fundersLoading, setFundersLoading] = useState(false);
  const [fundersError, setFundersError] = useState('');
  const [selectedFunders, setSelectedFunders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch funders on component mount
  useEffect(() => {
    const fetchFunders = async () => {
      setFundersLoading(true);
      setFundersError('');
      try {
        const fundersData = await getFunderList();
        setFunders(fundersData || []);
      } catch (err) {
        console.error('Failed to fetch funders:', err);
        setFundersError('Failed to fetch funders');
        setFunders([]);
      } finally {
        setFundersLoading(false);
      }
    };

    fetchFunders();
  }, []);

  // Initialize selectedFunders when modal opens or currentFunders changes
  useEffect(() => {
    if (isOpen && currentFunders) {
      setSelectedFunders(currentFunders.map((f: Funder) => ({ value: f._id, label: f.name })));
    }
  }, [isOpen, currentFunders]);

  const handleSave = async () => {
    // Validate that at least one funder is selected
    if (selectedFunders.length === 0) {
      setError('At least one funder must be selected');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Find funders to add and remove
      const originalIds = currentFunders.map(f => f._id);
      const newIds = selectedFunders.map(f => f.value);
      const toAdd = newIds.filter(id => !originalIds.includes(id));
      const toRemove = originalIds.filter(id => !newIds.includes(id));
      
      // Add new funders
      for (const funderId of toAdd) {
        await addUserFunder(userId, funderId);
      }
      
      // Remove unselected funders
      for (const funderId of toRemove) {
        await removeUserFunder(userId, funderId);
      }
      
      if (onSuccess) onSuccess({ added: toAdd.map(id => funders.find(f => f._id === id) || ({} as Funder)), removed: toRemove });
      if (onFunderChange) onFunderChange();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update funders');
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
          Edit Assigned Funders
        </h2>
        <div className="mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Current Funders</h3>
            <p className="text-xs text-blue-600 mb-2">This user is already assigned to:</p>
            {loading ? (
              <p className="text-xs text-blue-600">Loading...</p>
            ) : currentFunders.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-blue-700">
                {currentFunders.map(f => (
                  <li key={f._id}>{f.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-blue-600">No funders assigned</p>
            )}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Manage Funders <span className="text-red-500">*</span>
          </label>
          <Select
            isMulti
            options={(funders || []).map(f => ({ value: f._id, label: f.name }))}
            value={selectedFunders}
            onChange={val => setSelectedFunders(Array.isArray(val) ? [...val] : [])}
            isLoading={fundersLoading}
            placeholder="Select funders..."
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
          {fundersError && <div className="text-xs text-red-500 mt-1">{fundersError}</div>}
          {selectedFunders.length === 0 && (
            <div className="text-xs text-gray-500 mt-1">At least one funder is required</div>
          )}
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
              selectedFunders.length === 0 || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={handleSave}
            disabled={selectedFunders.length === 0 || loading}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserFundersModal; 