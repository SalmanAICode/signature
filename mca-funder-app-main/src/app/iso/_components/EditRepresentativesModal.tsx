import React, { useEffect, useState } from 'react';
import { getRepresentativeList } from '@/lib/api/representatives';
import { getISORepresentativeList, addISORepresentative, deleteISORepresentative } from '@/lib/api/isoRepresentatives';
import { Representative } from '@/types/representative';
import Select from 'react-select';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

interface EditRepresentativesModalProps {
  isoId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedRepresentatives: Representative[]) => void;
  onRepresentativeChange?: () => void;
  currentRepresentatives: Representative[];
}

const EditRepresentativesModal: React.FC<EditRepresentativesModalProps> = ({ isoId, isOpen, onClose, onSuccess, onRepresentativeChange, currentRepresentatives }) => {
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [representativesLoading, setRepresentativesLoading] = useState(false);
  const [representativesError, setRepresentativesError] = useState('');
  const [selectedRepresentatives, setSelectedRepresentatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch representatives on component mount
  useEffect(() => {
    const fetchRepresentatives = async () => {
      setRepresentativesLoading(true);
      setRepresentativesError('');
      try {
        const representativesData = await getRepresentativeList({});
        setRepresentatives(representativesData || []);
      } catch (err) {
        console.error('Failed to fetch representatives:', err);
        setRepresentativesError('Failed to fetch representatives');
        setRepresentatives([]);
      } finally {
        setRepresentativesLoading(false);
      }
    };

    fetchRepresentatives();
  }, []);

  // Initialize selectedRepresentatives when modal opens or currentRepresentatives changes
  useEffect(() => {
    if (isOpen && currentRepresentatives) {
      setSelectedRepresentatives(currentRepresentatives.map((r: Representative) => ({ 
        value: r._id, 
        label: `${r.first_name} ${r.last_name}` 
      })));
    }
  }, [isOpen, currentRepresentatives]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      // Find representatives to add and remove
      const originalIds = currentRepresentatives.map(r => r._id);
      const newIds = selectedRepresentatives.map(r => r.value);
      const toAdd = newIds.filter(id => !originalIds.includes(id));
      const toRemove = originalIds.filter(id => !newIds.includes(id));
      
      // Add new representatives
      for (const representativeId of toAdd) {
        await addISORepresentative(isoId, representativeId);
      }
      
      // Remove unselected representatives
      for (const representativeId of toRemove) {
        try {
          await deleteISORepresentative(isoId, representativeId);
          console.log(`Deleted ISO representative relationship for representative: ${representativeId}`);
        } catch (deleteError) {
          console.error(`Failed to delete representative relationship for representative ${representativeId}:`, deleteError);
          // Continue with other deletions even if one fails
        }
      }
      
      // Get the updated representatives list based on selections
      const updatedRepresentatives = representatives.filter(r => selectedRepresentatives.some(sr => sr.value === r._id));
      
      if (onSuccess) onSuccess(updatedRepresentatives);
      if (onRepresentativeChange) onRepresentativeChange();
      onClose();
    } catch (err: any) {
      console.error('Failed to update representatives:', err);
      setError('Failed to update representatives');
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
          Edit Assigned Representatives
        </h2>
        <div className="mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Current Representatives</h3>
            <p className="text-xs text-blue-600 mb-2">This ISO is already assigned to:</p>
            {loading ? (
              <p className="text-xs text-blue-600">Loading...</p>
            ) : currentRepresentatives.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-blue-700">
                {currentRepresentatives.map(r => (
                  <li key={r._id}>{`${r.first_name} ${r.last_name}`}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-blue-600">No representatives assigned</p>
            )}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Manage Representatives
          </label>
          <Select
            isMulti
            options={(representatives || []).map(r => ({ 
              value: r._id, 
              label: `${r.first_name} ${r.last_name}` 
            }))}
            value={selectedRepresentatives}
            onChange={val => setSelectedRepresentatives(Array.isArray(val) ? [...val] : [])}
            isLoading={representativesLoading}
            placeholder="Select representatives..."
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
          {representativesError && <div className="text-xs text-red-500 mt-1">{representativesError}</div>}
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

export default EditRepresentativesModal; 