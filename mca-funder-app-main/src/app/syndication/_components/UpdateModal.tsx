'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/lib/store/modal';
import useModalStore from '@/lib/store/modal';
import useSyndicationStore from '@/lib/store/syndication';
import { UpdateSyndicationData, Syndication } from '@/types/syndication';
import Card, { CardField } from '@/components/Card';
import { getUpdateModalCardSections } from '../_config/cardSections';
import Loading from '@/components/Loading';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Syndication update modal content component
export function SyndicationUpdateModalContent({ modalData }: { modalData: Modal }) {
    // Get original syndication data from modalData
    const originalItem = modalData.data as Syndication;
    
    // Get the current syndication data from store based on ID
    // This will automatically update when store data changes
    const syndications = useSyndicationStore(state => state.syndications);
    const loading = useSyndicationStore(state => state.loading);
    const { updateExistingSyndication } = useSyndicationStore();
    const updating = useSyndicationStore(state => state.updating);
    const error = useSyndicationStore(state => state.error);
    const closeModal = useModalStore(state => state.closeModal);

    // All Hooks must be called before any early returns
    const currentItem = originalItem ? syndications?.find(s => s._id === originalItem._id) : null;
    const syndicationData = currentItem || originalItem;
    
    // Create initial values function to get form data from syndication
    const createInitialValues = (data: Syndication | null): UpdateSyndicationData => {
        if (!data) {
            return {
                end_date: '',
                status: 'ACTIVE'
            };
        }
        
        return {
            end_date: data.end_date || '',
            status: data.status || 'ACTIVE'
        };
    };

    const [formData, setFormData] = useState<UpdateSyndicationData>(createInitialValues(syndicationData));
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update form data when syndication data changes from store
    useEffect(() => {
        if (syndicationData) {
            setFormData(createInitialValues(syndicationData));
        }
    }, [syndicationData?._id, syndicationData?.end_date]);

    // Monitor updating state and close modal when update is successful
    useEffect(() => {
        if (isSubmitting && !updating && !error) {
            // Update was successful, close the modal
            closeModal(modalData.key);
        }
    }, [updating, error, isSubmitting, closeModal, modalData.key]);

    // Now we can do early returns after all Hooks have been called
    if (!originalItem) {
        return (
            <div className="p-6 text-center">
                <p className="text-theme-muted-foreground">No syndication data found</p>
            </div>
        );
    }

    // Show loading state
    if (loading) {
        return <Loading title="Loading..." description="Fetching syndication data..." />;
    }

    // Check different data states
    const isDataNotFound = syndications && !currentItem;

    // If data was not found, show simple notice
    if (isDataNotFound) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-center p-6 bg-theme-muted border border-theme-border rounded-lg shadow-theme-sm max-w-md">
                    <div className="mb-4">
                        <ExclamationTriangleIcon className="w-12 h-12 text-warning mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-theme-foreground mb-2">
                        Data Not Found
                    </h3>
                    <p className="text-theme-muted mb-4 text-sm">
                        Data not found after update. Please reselect from the table.
                    </p>
                </div>
            </div>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate that at least one field is provided
        if ((!formData.end_date || formData.end_date.trim() === '') && 
            (!formData.status || formData.status.trim() === '')) {
            alert('Please provide at least end date or status to update');
            return;
        }

        // Validate syndication ID
        if (!originalItem._id || originalItem._id.trim() === '') {
            alert('Invalid syndication ID. Please close and reopen the modal.');
            setIsSubmitting(false);
            return;
        }
        
        setIsSubmitting(true);
        
        // Filter out empty optional fields
        const filteredData = Object.fromEntries(
            Object.entries(formData).filter(([key, value]) => {
                // Filter out empty strings, null, and undefined
                return value !== '' && value !== undefined && value !== null;
            })
        ) as UpdateSyndicationData;

        updateExistingSyndication(originalItem._id, filteredData);
    };

    // Handle input changes from Card component
    const handleInputChange = (value: any, field: CardField) => {
        setFormData(prev => ({
            ...prev,
            [field.key]: value
        }));
    };

    // Get Card sections from configuration
    const cardSections = getUpdateModalCardSections(
        handleInputChange,
        [],
        [],
        [],
        false,
        false,
        false
    );

    return (
        <div className="p-6 bg-theme-background">
            
            {error && (
                <div className="mb-6 p-4 bg-error text-theme-primary-foreground rounded-md border border-error shadow-theme-sm">
                    <p className="text-sm">{error}</p>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
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
                        disabled={updating}
                        className="px-8 py-3 text-sm font-medium text-theme-primary-foreground bg-theme-primary border border-transparent rounded-md hover:bg-theme-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-theme-sm transition-all duration-200"
                    >
                        {updating ? 'Updating...' : 'Update Syndication'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default SyndicationUpdateModalContent; 