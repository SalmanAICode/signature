import React, { useEffect, useState } from 'react';
import { getLenderList } from '@/lib/api/lenders';
import { addUserLender, removeUserLender } from '@/lib/api/userLenders';
import { Lender } from '@/types/lender';
import Select from 'react-select';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

interface EditUserLenderModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (changes: { added: Lender[], removed: string[] }) => void;
  onLenderChange?: () => void;
  currentLenders: Lender[];
}

const EditUserLenderModal: React.FC<EditUserLenderModalProps> = ({ userId, isOpen, onClose, onSuccess, onLenderChange, currentLenders }) => {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [lendersLoading, setLendersLoading] = useState(false);
  const [lendersError, setLendersError] = useState('');
  const [selectedLenders, setSelectedLenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch lenders on component mount
  useEffect(() => {
    const fetchLenders = async () => {
      setLendersLoading(true);
      setLendersError('');
      try {
        const lendersData = await getLenderList();
        setLenders(lendersData || []);
      } catch (err) {
        console.error('Failed to fetch lenders:', err);
        setLendersError('Failed to fetch lenders');
        setLenders([]);
      } finally {
        setLendersLoading(false);
      }
    };

    fetchLenders();
  }, []);

  // Initialize selectedLenders when modal opens or currentLenders changes
  useEffect(() => {
    if (isOpen && currentLenders) {
      setSelectedLenders(currentLenders.map((l: Lender) => ({ value: l._id, label: l.name })));
    }
  }, [isOpen, currentLenders]);

  const handleSave = async () => {
    // Validate that at least one lender is selected
    if (selectedLenders.length === 0) {
      setError('At least one lender must be selected');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Find lenders to add and remove
      const originalIds = currentLenders.map(l => l._id);
      const newIds = selectedLenders.map(l => l.value);
      const toAdd = newIds.filter(id => !originalIds.includes(id));
      const toRemove = originalIds.filter(id => !newIds.includes(id));
      
      // Add new lenders
      for (const lenderId of toAdd) {
        await addUserLender(userId, lenderId);
      }
      
      // Remove unselected lenders
      for (const lenderId of toRemove) {
        await removeUserLender(userId, lenderId);
      }
      
      // Get the updated lenders list based on selections
      const updatedLenders = lenders.filter(l => selectedLenders.some(sl => sl.value === l._id));
      
      if (onSuccess) onSuccess({ added: toAdd.map(id => lenders.find(l => l._id === id) || ({} as Lender)), removed: toRemove });
      if (onLenderChange) onLenderChange();
      onClose();
    } catch (err: any) {
      setError('Failed to update lenders');
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
          Edit Assigned Lenders
        </h2>
        <div className="mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Current Lenders</h3>
            <p className="text-xs text-blue-600 mb-2">This user is already assigned to:</p>
            {loading ? (
              <p className="text-xs text-blue-600">Loading...</p>
            ) : currentLenders.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-blue-700">
                {currentLenders.map(l => (
                  <li key={l._id}>{l.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-blue-600">No lenders assigned</p>
            )}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Manage Lenders <span className="text-red-500">*</span>
          </label>
          <Select
            isMulti
            options={(lenders || []).map(l => ({ value: l._id, label: l.name }))}
            value={selectedLenders}
            onChange={val => setSelectedLenders(Array.isArray(val) ? [...val] : [])}
            isLoading={lendersLoading}
            placeholder="Select lenders..."
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
          {lendersError && <div className="text-xs text-red-500 mt-1">{lendersError}</div>}
          {selectedLenders.length === 0 && (
            <div className="text-xs text-gray-500 mt-1">At least one lender is required</div>
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
              selectedLenders.length === 0 || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={handleSave}
            disabled={selectedLenders.length === 0 || loading}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserLenderModal; 