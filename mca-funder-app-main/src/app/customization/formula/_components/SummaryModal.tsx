'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Modal, OpenModalInput } from '@/lib/store/modal';
import useModalStore from '@/lib/store/modal';
import { Formula } from '@/types/formula';
import useFormulaStore from '@/lib/store/formula';
import { FormulaUpdateModalContent } from './UpdateModal';
import Loading from '@/components/Loading';
import Display from '@/components/Display';
import {
    PencilIcon,
    ExclamationTriangleIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { getSummaryConfig } from '../_config/summarySections';
import { toast } from 'react-hot-toast';

// Formula detail modal content - now watches store for changes
export function FormulaSummaryModalContent({ modalData }: { modalData: Modal }) {
    const originalItem = modalData.data as Formula;
    const openModal = useModalStore(state => state.openModal);
    const closeModal = useModalStore(state => state.closeModal);
    const router = useRouter();

    // Get the current formula data from store based on ID
    // This will automatically update when store data changes
    const formulas = useFormulaStore(state => state.formulas);
    const loading = useFormulaStore(state => state.loading);
    const deleteFormulaById = useFormulaStore(state => state.deleteFormulaById);
    const currentItem = formulas?.find(f => f._id === originalItem._id);

    // Check different data states
    const isDataNotFound = formulas && !currentItem; // Found formulas but no matching item
    const fallbackItem = currentItem || originalItem; // Use current if available, otherwise original

    const handleDeleteClick = () => {
        if (fallbackItem) {
            const formulaId = fallbackItem._id || '';
            deleteFormulaById(formulaId);
            closeModal(modalData.key);
        }
    };

    const handleEditClick = () => {
        if (fallbackItem) {
            const formulaData = fallbackItem;
            const formulaName = formulaData.name || 'Unknown';
            const formulaId = formulaData._id || '';

            if (!formulaId || formulaId.trim() === '') {
                toast.error('Cannot update: Invalid formula ID');
                return;
            }

            openModal({
                key: `update-Formula-${formulaId}`,
                title: `Update Formula - ${formulaName}`,
                component: FormulaUpdateModalContent,
                data: formulaData,
            } as OpenModalInput);
        }
    };

    // Show loading state
    if (loading) {
        return <Loading title="Loading..." description="Fetching formula data..." />;
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
                        Formula data not found after update. Please reselect from the table.
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

            {/* Formula information card */}
            <Display
                data={transformedData}
                config={getSummaryConfig(transformedData)}
                title="Formula Summary"
            />
            <div className="flex justify-evenly gap-2">
                <button
                    onClick={handleEditClick}
                    className="btn-primary btn-icon-scale"
                >
                    <PencilIcon className="w-4 h-4" />
                    <span>Update</span>
                </button>
                <button
                    onClick={handleDeleteClick}
                    className="btn-danger btn-icon-scale"
                >
                    <TrashIcon className="w-4 h-4" />
                    <span>Delete</span>
                </button>
            </div>
        </div>
    );
}

export default FormulaSummaryModalContent;
