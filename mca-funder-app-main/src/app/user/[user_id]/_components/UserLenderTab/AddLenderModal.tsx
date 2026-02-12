import React, { useEffect, useState } from 'react';
import { getLenderList } from '@/lib/api/lenders';
import { Lender } from '@/types/lender';
import Select from 'react-select';
import { PlusIcon } from '@heroicons/react/24/outline';

interface AddLenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (lenderId: string) => void;
  currentLenders: Lender[];
}

const AddLenderModal: React.FC<AddLenderModalProps> = ({ isOpen, onClose, onCreate, currentLenders }) => {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [lendersLoading, setLendersLoading] = useState(false);
  const [lendersError, setLendersError] = useState('');
  const [selectedLender, setSelectedLender] = useState<any>(null);
  const [error, setError] = useState('');

  // Fetch lenders on component mount
  useEffect(() => {
    const fetchLenders = async () => {
      setLendersLoading(true);
      setLendersError('');
      try {
        const lendersData = await getLenderList();
        // Filter out lenders that are already assigned to this user
        const availableLenders = lendersData.filter((lender: Lender) => 
          !currentLenders.some(current => current._id === lender._id)
        );
        setLenders(availableLenders || []);
      } catch (err) {
        setLendersError('Failed to fetch lenders');
        setLenders([]);
      } finally {
        setLendersLoading(false);
      }
    };

    if (isOpen) {
      fetchLenders();
    }
  }, [isOpen, currentLenders]);

  // Reset selected lender when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedLender(null);
      setError('');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!selectedLender) {
      setError('Please select a lender to add');
      return;
    }
    onCreate(selectedLender.value);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-4 flex items-center justify-center gap-2">
          <PlusIcon className="h-5 w-5 text-green-600" />
          Add Lender
        </h2>
        
        <div className="mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Current Lenders</h3>
            <p className="text-xs text-blue-600 mb-2">This user is currently assigned to:</p>
            {currentLenders.length > 0 ? (
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
            Select Lender to Add <span className="text-red-500">*</span>
          </label>
          <Select
            isClearable
            options={(lenders || []).map(l => ({ value: l._id, label: l.name }))}
            value={selectedLender}
            onChange={val => setSelectedLender(val)}
            isLoading={lendersLoading}
            placeholder="Select a lender to add..."
            classNamePrefix="select"
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
            styles={{
              input: base => ({ ...base, fontSize: '0.875rem' }),
              option: base => ({ ...base, fontSize: '0.875rem' }),
              singleValue: base => ({ ...base, fontSize: '0.875rem' }),
              menuPortal: base => ({ ...base, zIndex: 9999 }),
            }}
          />
          {lendersError && <div className="text-xs text-red-500 mt-1">{lendersError}</div>}
          {lenders.length === 0 && !lendersLoading && (
            <div className="text-xs text-gray-500 mt-1">No available lenders to add</div>
          )}
        </div>
        
        {error && <div className="text-xs text-red-500 mb-2">{error}</div>}
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-300 hover:text-gray-800 transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              !selectedLender
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            onClick={handleSave}
            disabled={!selectedLender}
          >
            Add Lender
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLenderModal; 