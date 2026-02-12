'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Modal } from '@/lib/store/modal';
import useModalStore from '@/lib/store/modal';
import useFormulaStore from '@/lib/store/formula';
import useAuthStore from '@/lib/store/auth';
import Card, { CardField } from '@/components/Card';
import { getCreateModalCardSections } from '../_config/cardSections';
import { Calculate } from '@/types/calculate';
import { Tier, TierList } from '@/types/tier';
import { CreateFormulaData } from '@/types/formula';

// Initial values for the form
const initialValues: Partial<CreateFormulaData> = {
    name: '',
    calculate_type: 'AMOUNT' as Calculate,
    base_item: undefined,
    tier_type: undefined,
    tier_list: [],
    shared: false
};

// Formula create modal content component
export function FormulaCreateModalContent({ modalData }: { modalData: Modal }) {
    const [formData, setFormData] = useState<Partial<CreateFormulaData>>(initialValues);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tierList, setTierList] = useState<TierList[]>([
        { min_number: 0, max_number: 0, amount: 0, percent: 0 }
    ]);
    
    const { createNewFormula } = useFormulaStore();
    const creating = useFormulaStore(state => state.creating);
    const error = useFormulaStore(state => state.error);
    const clearError = useFormulaStore(state => state.clearError);
    const closeModal = useModalStore(state => state.closeModal);
    const funder = useAuthStore(state => state.funder);

    // Monitor creating state and close modal when creation is successful
    useEffect(() => {
        if (isSubmitting && !creating && !error) {
            closeModal(modalData.key);
        }
    }, [creating, error, isSubmitting, closeModal, modalData.key]);

    // Monitor error state and show toast when error occurs
    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear any previous errors
        clearError();
        
        // Validate required fields
        if (!formData.name || formData.name.trim() === '') {
            toast.error('Formula Name is required');
            return;
        }
        
        if (!formData.calculate_type) {
            toast.error('Calculate Type is required');
            return;
        }

        if (!funder?._id) {
            toast.error('No funder selected. Please select a funder first.');
            return;
        }

        if (formData.calculate_type === 'AMOUNT' && (tierList?.[0]?.amount === undefined || tierList?.[0]?.amount === null)) {
            toast.error('Amount is required');
            return;
        }

        if (formData.calculate_type === 'AMOUNT' && tierList?.[0] && tierList?.[0]?.amount < 0) {
            toast.error('Amount must be greater than 0');
            return;
        }

        if (formData.calculate_type === 'PERCENT' && tierList?.[0] && tierList?.[0]?.percent > 100) {
            toast.error('Percent must be less or equal to 100');
            return;
        }

        if (formData.calculate_type === 'PERCENT' && tierList?.[0] && tierList?.[0]?.percent < 0) {
            toast.error('Percent must be greater or equal to 0');
            return;
        }

        // Check if amount has more than 2 decimal places
        if (formData.calculate_type === 'AMOUNT' && tierList?.[0]?.amount !== undefined) {
            const amountStr = tierList[0].amount.toString();
            const decimalIndex = amountStr.indexOf('.');
            if (decimalIndex !== -1 && amountStr.length - decimalIndex - 1 > 2) {
                toast.error('Amount cannot have more than 2 decimal places');
                return;
            }
        }
        
        setIsSubmitting(true);
        
        const createData: CreateFormulaData = {
            funder: funder._id,
            name: formData.name.trim(),
            calculate_type: formData.calculate_type,
            tier_list: tierList,
            shared: formData.shared || false,
            ...(formData.calculate_type === 'PERCENT' && formData.base_item && {
                base_item: formData.base_item
            }),
            ...(formData.tier_type && formData.tier_type !== 'NONE' && {
                tier_type: formData.tier_type
            })
        };

        createNewFormula(createData);
    };

    // Handle input changes from Card component
    const handleInputChange = (value: any, field: CardField) => {
        const key = field.key;
        
        if (key === 'calculate_type') {
            setFormData(prev => ({
                ...prev,
                calculate_type: value as Calculate,
                ...(value === 'AMOUNT' && { base_item: undefined })
            }));
        } else if (key === 'tier_type') {
            setFormData(prev => ({
                ...prev,
                tier_type: value as Tier
            }));
            // Reset tier list when tier type changes
            if (!value || value === 'NONE') {
                // For None tier type, keep only one tier with default values
                setTierList([{ min_number: 0, max_number: 0, amount: 0, percent: 0 }]);
            } else {
                // For non-None tier types, ensure we have at least one tier for configuration
                if (tierList.length === 0) {
                    setTierList([{ min_number: 0, max_number: 0, amount: 0, percent: 0 }]);
                }
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [key]: value
            }));
        }
    };

    // Handle tier changes
    const handleTierChange = (index: number, tierField: string, value: any) => {
        setTierList(prev => prev.map((tier, i) => 
            i === index 
                ? { ...tier, [tierField]: Number(value) || 0 }
                : tier
        ));
    };

    // Add new tier
    const addTier = () => {
        setTierList(prev => [...prev, {
            min_number: 0,
            max_number: 0,
            amount: 0,
            percent: 0
        }]);
    };

    // Remove tier
    const removeTier = (index: number) => {
        if (tierList.length > 1) {
            setTierList(prev => prev.filter((_, i) => i !== index));
        }
    };

    // Prepare data for Card component
    const cardData = {
        name: formData.name || '',
        calculate_type: formData.calculate_type || '',
        base_item: formData.base_item || '',
        tier_type: formData.tier_type || '',
        shared: formData.shared || false,
        // Add single amount/percent for when tier_type is None
        single_amount: tierList[0]?.amount || 0,
        single_percent: tierList[0]?.percent || 0
    };

    // Get Card sections from configuration
    const cardSections = getCreateModalCardSections(
        { 
            name: formData.name || '',
            calculate_type: formData.calculate_type || 'AMOUNT',
            base_item: formData.base_item || null,
            tier_type: formData.tier_type || null,
            tier_list: tierList,
            shared: formData.shared || false
        },
        handleInputChange,
        handleTierChange,
        addTier,
        removeTier
    );

    return (
        <div className="p-6 bg-theme-background">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card
                    data={cardData}
                    sections={cardSections}
                    showEmptyFields={true}
                    animated={true}
                    variant="outlined"
                />

                {/* Form Actions */}
                <div className="flex justify-center pt-6 border-t border-theme-border bg-theme-muted rounded-lg p-4 mt-6">
                    <button
                        type="submit"
                        disabled={creating}
                        className="px-8 py-3 text-sm font-medium text-theme-primary-foreground bg-theme-primary border border-transparent rounded-md hover:bg-theme-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-theme-sm transition-all duration-200"
                    >
                        {creating ? 'Creating...' : 'Create Formula'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default FormulaCreateModalContent;
