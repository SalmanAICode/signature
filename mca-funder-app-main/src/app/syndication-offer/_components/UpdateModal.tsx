'use client';

import { useState } from 'react';
import Card from '@/components/Card';
import { updateSyndicationOffer } from '@/lib/api/sydicationOffers';
import { SyndicationOffer, UpdateSyndicationOfferData } from '@/types/syndicationOffer';
import { formatDateForInput } from '@/utils/dateUtils';
import { CardField } from '@/components/Card';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getUpdateModalCardSections } from '../_config/cardSections';

interface UpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string, updatedData: SyndicationOffer) => void;
    syndicationOffer: SyndicationOffer;
}

export function UpdateModal({ isOpen, onClose, onSuccess, syndicationOffer }: UpdateModalProps) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Helper function to clean fee/credit list items by removing _id fields
    const cleanArrayItems = (items: any[]) => {
        if (!items || !Array.isArray(items)) return [];
        return items.map(item => {
            if (!item || typeof item !== 'object') return item;
            const { _id, ...cleanItem } = item;
            return cleanItem;
        });
    };
    
    const [formData, setFormData] = useState({
        participate_percent: syndicationOffer.participate_percent || 0,
        participate_amount: syndicationOffer.participate_amount || 0,
        payback_amount: syndicationOffer.payback_amount || 0,
        offered_date: formatDateForInput(syndicationOffer.offered_date),
        expired_date: syndicationOffer.expired_date ? formatDateForInput(syndicationOffer.expired_date) : '',
        status: syndicationOffer.status,
        inactive: syndicationOffer.inactive || false,
        fee_list: cleanArrayItems(syndicationOffer.fee_list || []),
        credit_list: cleanArrayItems(syndicationOffer.credit_list || []),
        // Add display fields
        funding_name: syndicationOffer.funding?.name || '',
        syndicator_name: `${syndicationOffer.syndicator?.first_name || ''} ${syndicationOffer.syndicator?.last_name || ''}`.trim()
    });

    const handleFieldChange = (value: any, field: CardField) => {
        setFormData(prev => ({
            ...prev,
            [field.key]: value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.participate_percent || !formData.participate_amount || !formData.payback_amount) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const updateParams: UpdateSyndicationOfferData = {
                participate_percent: Number(formData.participate_percent),
                participate_amount: Number(formData.participate_amount),
                payback_amount: Number(formData.payback_amount),
                offered_date: formData.offered_date,
                expired_date: formData.expired_date || undefined,
                status: formData.status,
                inactive: formData.inactive,
                fee_list: cleanArrayItems(formData.fee_list),
                credit_list: cleanArrayItems(formData.credit_list)
            };

            const updatedOffer = await updateSyndicationOffer(syndicationOffer._id, updateParams);
            onSuccess(`Syndication offer has been successfully updated`, updatedOffer);
        } catch (err: any) {
            console.error('Error updating syndication offer:', err);
            setError(err.message || 'Failed to update syndication offer');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Get card sections from configuration
    const cardSections = getUpdateModalCardSections(handleFieldChange, syndicationOffer, formData);

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl w-full relative max-h-[90vh] overflow-hidden" style={{ maxWidth: 800 }}>
                <div className="p-6 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Update Syndication Offer</h2>
                            <p className="text-sm text-gray-500 mt-1">Update syndication offer details below.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="text-red-800 font-medium">{error}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
                    <Card
                        data={formData}
                        sections={cardSections}
                        showEmptyFields={true}
                        variant="outlined"
                        className="mb-6"
                    />
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <CheckCircleIcon className="w-4 h-4" />
                            )}
                            <span>{loading ? 'Updating...' : 'Update Offer'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 