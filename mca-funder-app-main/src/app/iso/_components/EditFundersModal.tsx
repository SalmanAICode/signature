import React, { useEffect, useState } from 'react';
import { Funder } from '@/types/funder';
import { addFunderISO, deleteFunderISO, getIsoFunders } from '@/lib/api/isoFunders';
import Select from 'react-select';
import useAuthStore from '@/lib/store/auth';
import { IsoFunder } from '@/types/isoFunder';

interface EditFundersModalProps {
    isoId: string;
    isOpen: boolean;
    funderList: Funder[];
    onClose: () => void;
    onSuccess?: () => void;
}

const EditFundersModal: React.FC<EditFundersModalProps> = ({ isoId, isOpen, funderList, onClose, onSuccess }) => {
    const [currentFunders, setCurrentFunders] = useState<IsoFunder[]>([]);
    const [selectedFunders, setSelectedFunders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Get current funder from auth store
    const { funder } = useAuthStore();
    const currentFunderId = funder?._id;

    useEffect(() => {
        if (isOpen && currentFunderId) {
            fetchCurrentFunders();
        }
    }, [isOpen, isoId, currentFunderId]);

    const fetchCurrentFunders = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getIsoFunders({ iso: isoId });
            const docs = response.data || [];
            setCurrentFunders(docs);
            setSelectedFunders(docs.map((f: IsoFunder) => ({ 
                value: typeof f.funder === 'string' ? f.funder : f.funder._id, 
                label: typeof f.funder === 'string' ? 'Unknown Funder' : f.funder.name 
            })));
        } catch (err: any) {
            setError('Failed to fetch current funders');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError('');
        try {
            // Find funders to add and remove
            const originalFunderIds = currentFunders.map(f => 
                typeof f.funder === 'string' ? f.funder : f.funder._id
            );
            const newIds = selectedFunders.map(f => f.value);
            
            const toAdd = newIds.filter(id => !originalFunderIds.includes(id));
            const toRemove = originalFunderIds.filter(id => !newIds.includes(id));
            
            // Add new funders
            for (const funderId of toAdd) {
                await addFunderISO(funderId, isoId, '');
            }
            
            // Remove unselected funders
            for (const funderId of toRemove) {
                // Find the IsoFunder record to get its ID for deletion
                const isoFunder = currentFunders.find(f => 
                    (typeof f.funder === 'string' ? f.funder : f.funder._id) === funderId
                );
                if (isoFunder?._id) {
                    await deleteFunderISO(isoFunder._id);
                }
            }
            
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            setError('Failed to update funders');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-center text-gray-800 mb-4">Edit Assigned Funders</h2>
                <div className="mb-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-blue-800 mb-1">Current Funders</h3>
                        <p className="text-xs text-blue-600 mb-2">This ISO is already assigned to:</p>
                        {loading ? (
                            <p className="text-xs text-blue-600">Loading...</p>
                        ) : currentFunders.length > 0 ? (
                            <ul className="list-disc pl-5 text-sm text-blue-700">
                                {currentFunders.map((f, index) => (
                                    <li key={`funder-${f._id}-${index}`}>
                                        {typeof f.funder === 'string' ? 'Unknown Funder' : f.funder.name}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-blue-600">No funders assigned</p>
                        )}
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Manage Funders</label>
                    <Select
                        isMulti
                        options={funderList.map(f => ({ value: f._id, label: f.name }))}
                        value={selectedFunders}
                        onChange={val => setSelectedFunders(Array.isArray(val) ? [...val] : [])}
                        isLoading={loading}
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

export default EditFundersModal; 