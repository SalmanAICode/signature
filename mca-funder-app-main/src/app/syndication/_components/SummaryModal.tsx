'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Modal, OpenModalInput } from '@/lib/store/modal';
import useModalStore from '@/lib/store/modal';
import { Syndication } from '@/types/syndication';
import useSyndicationStore from '@/lib/store/syndication';
import { SyndicationUpdateModalContent } from './UpdateModal';
import Loading from '@/components/Loading';
import { getSummaryConfig } from '../_config/summarySections';
import Display from '@/components/Display';
import {
    PencilIcon,
    ExclamationTriangleIcon,
    EyeIcon
} from '@heroicons/react/24/outline';
import { getSummaryModalCardSections } from '../_config/cardSections';

// Syndication detail modal content - now watches store for changes
export function SyndicationSummaryModalContent({ modalData }: { modalData: Modal }) {
    const originalItem = modalData.data as Syndication;
    const openModal = useModalStore(state => state.openModal);
    const closeModal = useModalStore(state => state.closeModal);
    const router = useRouter();

    // Get the current syndication data from store based on ID
    // This will automatically update when store data changes
    const syndications = useSyndicationStore(state => state.syndications);
    const loading = useSyndicationStore(state => state.loading);
    const currentItem = syndications?.find(s => s._id === originalItem._id);

    // Check different data states
    const isDataNotFound = syndications && !currentItem; // Found syndications but no matching item
    const fallbackItem = currentItem || originalItem; // Use current if available, otherwise original

    const handleEditClick = () => {
        if (fallbackItem) {
            const syndicationData = fallbackItem;
            const syndicationName = syndicationData._id || 'Unknown';
            const syndicationId = syndicationData._id || '';

            if (!syndicationId || syndicationId.trim() === '') {
                alert('Cannot update: Invalid syndication ID');
                return;
            }

            openModal({
                key: `update-Syndication-${syndicationId}`,
                title: `Update Syndication - ${syndicationName}`,
                component: SyndicationUpdateModalContent,
                data: syndicationData,
            } as OpenModalInput);
        }
    };

    const handleViewFullDetail = () => {
        if (fallbackItem) {
            const syndicationId = fallbackItem._id || '';

            if (!syndicationId || syndicationId.trim() === '') {
                alert('Cannot view: Invalid syndication ID');
                return;
            }

            // Close the modal first
            closeModal(modalData.key);

            // Navigate to the syndication detail page
            router.push(`/syndication/${syndicationId}`);
        }
    };

    // Show loading state
    if (loading) {
        return <Loading title="Loading..." description="Fetching syndication data..." />;
    }

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
                        Syndication data not found after update. Please reselect from the table.
                    </p>
                </div>
            </div>
        );
    }

    // Transform data to add 'active' field based on 'inactive'
    const transformedData = {
        ...fallbackItem,
        active: !fallbackItem.inactive // Convert inactive to active
    };

    return (
        <div className="space-y-6">
            {/* Syndication information card */}
            <Display
                data={transformedData}
                config={getSummaryConfig(transformedData)}
                title="Syndication Summary"
            />
            {/* Action buttons aligned to right */}
            <div className="flex justify-center gap-4 mb-4">
                <button
                    onClick={handleViewFullDetail}
                    className="btn-info btn-icon-scale flex-1 max-w-[200px]"
                >
                    <EyeIcon className="w-4 h-4" />
                    <span>View</span>
                </button>
                <button
                    onClick={handleEditClick}
                    className="btn-success btn-icon-scale flex-1 max-w-[200px]"
                >
                    <PencilIcon className="w-4 h-4" />
                    <span>Update</span>
                </button>
            </div>
        </div>
    );
}

export default SyndicationSummaryModalContent; 