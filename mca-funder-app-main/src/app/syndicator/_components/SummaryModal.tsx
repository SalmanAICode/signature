'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Syndicator } from '@/types/syndicator';
import { UpdateModal } from './UpdateModal';
import DeleteModal from '@/components/DeleteModal';
import Display from '@/components/Display';
import { getSummaryConfig } from '../_config/summarySections';
import { SummaryModalLayout } from '@/components/SummaryModalLayout';

type SummaryModalProps = {
    title: string;
    data: Syndicator;
    onClose: () => void;
    onUpdate?: (values: any) => Promise<{ success: boolean; error?: string }>;
    onDelete?: (id: string) => void;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
    error?: string | null;
};

export function SyndicatorSummaryModal({ 
    title, 
    data, 
    onClose, 
    onUpdate, 
    onDelete,
    onSuccess,
    onError,
    error 
}: SummaryModalProps) {
    const router = useRouter();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Show initial error via toast if provided
    useEffect(() => {
        if (error && onError) {
            onError(error);
        }
    }, [error, onError]);

    const handleDelete = () => {
        if (onDelete) {
            onDelete(data._id);
        }
        setShowDeleteModal(false);
        onClose();
    };

    const handleUpdate = async (values: any) => {
        if (!onUpdate) {
            if (onError) onError('Update function not provided');
            return { success: false, error: 'Update function not provided' };
        }
        
        setLoading(true);
        try {
            const result = await onUpdate(values);
            if (result.success) {
                if (onSuccess) onSuccess('Syndicator updated successfully!');
                setShowUpdateModal(false);
            } else {
                if (onError) onError(result.error || 'Update failed');
            }
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Update failed';
            if (onError) onError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const handleViewFullDetail = () => {
        const syndicatorId = data._id || '';
        
        if (!syndicatorId || syndicatorId.trim() === '') {
            if (onError) onError('Cannot view: Invalid syndicator ID');
            return;
        }
        
        // Close the modal first
        onClose();
        
        // Navigate to the syndicator detail page
        router.push(`/syndicator/${syndicatorId}`);
    };

    // Transform data to add 'active' field based on 'inactive'
    const transformedData = {
        ...data,
        active: !data.inactive // Convert inactive to active
    };

    // Get dynamic configuration based on actual data
    const config = getSummaryConfig(transformedData);

    // Header component
    const header = (
        <h2 className="text-2xl font-bold text-center text-gray-800">{title}</h2>
    );

    // Content component
    const content = (
        <div>
            <Display 
                data={transformedData} 
                config={config}
                title="Syndicator Details"
                className=""
            />
        </div>
    );

    // Actions component
    const actions = (
        <div className="flex justify-evenly gap-2">
            <button
                onClick={handleViewFullDetail}
                className="flex-1 px-2 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
                View
            </button>
            {onUpdate && (
                <button
                    onClick={() => setShowUpdateModal(true)}
                    disabled={loading}
                    className="flex-1 px-2 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Loading...' : 'Update'}
                </button>
            )}
            {onDelete && (
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex-1 px-2 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
                >
                    Delete
                </button>
            )}
            <button
                onClick={onClose}
                className="flex-1 px-2 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-300 hover:text-gray-800 transition"
            >
                Close
            </button>
        </div>
    );

    return (
        <>
            <SummaryModalLayout
                header={header}
                content={content}
                actions={actions}
            />

            {/* Update Modal */}
            {showUpdateModal && (
                <UpdateModal
                    isOpen={showUpdateModal}
                    onClose={() => setShowUpdateModal(false)}
                    data={data}
                    onUpdate={handleUpdate}
                />
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <DeleteModal
                    isOpen={showDeleteModal}
                    onCancel={() => setShowDeleteModal(false)}
                    onConfirm={handleDelete}
                    title="Delete Syndicator"
                    message={`Are you sure you want to delete the syndicator "${data.name}"? This action cannot be undone.`}
                />
            )}
        </>
    );
}

// Keep old export for compatibility
export function SyndicatorSummaryModalContent({ modalData }: { modalData: any }) {
    return (
        <SyndicatorSummaryModal
            title={modalData.title || "Syndicator Summary"}
            data={modalData.data}
            onClose={modalData.onClose || (() => {})}
        />
    );
}

export default SyndicatorSummaryModal;