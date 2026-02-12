import React, { useEffect, useState } from 'react';
import { getFunderList } from '@/lib/api/funders';
import { Funder } from '@/types/funder';
import Select from 'react-select';
import { PlusIcon } from '@heroicons/react/24/outline';

interface AddFunderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (funderId: string) => void;
  currentFunders: Funder[];
}

const AddFunderModal: React.FC<AddFunderModalProps> = ({ isOpen, onClose, onCreate, currentFunders }) => {
  const [funders, setFunders] = useState<Funder[]>([]);
  const [fundersLoading, setFundersLoading] = useState(false);
  const [fundersError, setFundersError] = useState('');
  const [selectedFunder, setSelectedFunder] = useState<any>(null);
  const [error, setError] = useState('');

  // Fetch funders on component mount
  useEffect(() => {
    const fetchFunders = async () => {
      setFundersLoading(true);
      setFundersError('');
      try {
        const fundersData = await getFunderList();
        // Filter out funders that are already assigned to this user
        const availableFunders = fundersData.filter((funder: Funder) => 
          !currentFunders.some(current => current._id === funder._id)
        );
        setFunders(availableFunders || []);
      } catch (err) {
        setFundersError('Failed to fetch funders');
        setFunders([]);
      } finally {
        setFundersLoading(false);
      }
    };

    if (isOpen) {
      fetchFunders();
    }
  }, [isOpen, currentFunders]);

  // Reset selected funder when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFunder(null);
      setError('');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!selectedFunder) {
      setError('Please select a funder to add');
      return;
    }
    onCreate(selectedFunder.value);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-4 flex items-center justify-center gap-2">
          <PlusIcon className="h-5 w-5 text-green-600" />
          Add Funder
        </h2>
        
        <div className="mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Current Funders</h3>
            <p className="text-xs text-blue-600 mb-2">This user is currently assigned to:</p>
            {currentFunders.length > 0 ? (
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
            Select Funder to Add <span className="text-red-500">*</span>
          </label>
          <Select
            isClearable
            options={(funders || []).map(f => ({ value: f._id, label: f.name }))}
            value={selectedFunder}
            onChange={val => setSelectedFunder(val)}
            isLoading={fundersLoading}
            placeholder="Select a funder to add..."
            classNamePrefix="select"
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
            styles={{
              input: base => ({ ...base, fontSize: '0.875rem' }),
              option: base => ({ ...base, fontSize: '0.875rem' }),
              singleValue: base => ({ ...base, fontSize: '0.875rem' }),
              menuPortal: base => ({ ...base, zIndex: 9999 }),
            }}
          />
          {fundersError && <div className="text-xs text-red-500 mt-1">{fundersError}</div>}
          {funders.length === 0 && !fundersLoading && (
            <div className="text-xs text-gray-500 mt-1">No available funders to add</div>
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
              !selectedFunder
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            onClick={handleSave}
            disabled={!selectedFunder}
          >
            Add Funder
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFunderModal; 