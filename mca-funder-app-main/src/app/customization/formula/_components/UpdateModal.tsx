'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/lib/store/modal';
import useModalStore from '@/lib/store/modal';
import useFormulaStore from '@/lib/store/formula';
import Card, { CardField } from '@/components/Card';
import { getUpdateModalCardSections } from '../_config/cardSections';
import { Calculate } from '@/types/calculate';
import { Tier, TierList } from '@/types/tier';
import { Formula, UpdateFormulaData } from '@/types/formula';
import { toast } from 'react-hot-toast';

// Formula update modal content component
export function FormulaUpdateModalContent({ modalData }: { modalData: Modal }) {
    const formula = modalData.data as Formula;
    
    // Initialize form data from existing formula
    const [formData, setFormData] = useState<Partial<UpdateFormulaData>>({
        name: formula.name || '',
        calculate_type: formula.calculate_type,
        base_item: formula.base_item || undefined,
        tier_type: formula.tier_type || undefined,
        shared: formula.shared || false,
        inactive: formula.inactive || false
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tierList, setTierList] = useState<TierList[]>(
        formula.tier_list?.length > 0 
            ? formula.tier_list 
            : [{ min_number: 0, max_number: 0, amount: 0, percent: 0 }]
    );
    
    const { updateFormula } = useFormulaStore();
    const updating = useFormulaStore(state => state.updating);
    const error = useFormulaStore(state => state.error);
    const closeModal = useModalStore(state => state.closeModal);

    // Monitor updating state and close modal when update is successful
    useEffect(() => {
        if (isSubmitting && !updating && !error) {
            closeModal(modalData.key);
        }
    }, [updating, error, isSubmitting, closeModal, modalData.key]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate required fields
        if (!formData.name || formData.name.trim() === '') {
            toast.error('Formula Name is required');
            return;
        }
        
        if (!formData.calculate_type) {
            toast.error('Calculate Type is required');
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
        
        const updateData: UpdateFormulaData = {
            name: formData.name.trim(),
            calculate_type: formData.calculate_type,
            tier_list: tierList,
            shared: formData.shared || false,
            inactive: formData.inactive || false,
            ...(formData.calculate_type === 'PERCENT' && formData.base_item && {
                base_item: formData.base_item
            }),
            ...(formData.tier_type && formData.tier_type !== 'NONE' && {
                tier_type: formData.tier_type
            })
        };

        updateFormula(formula._id, updateData);
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
        inactive: formData.inactive || false,
        // Add single amount/percent for when tier_type is None
        single_amount: tierList[0]?.amount || 0,
        single_percent: tierList[0]?.percent || 0
    };

    // Get Card sections from configuration (using update modal config)
    const cardSections = getUpdateModalCardSections(
        { 
            name: formData.name || '',
            calculate_type: formData.calculate_type || 'AMOUNT',
            base_item: formData.base_item || null,
            tier_type: formData.tier_type || null,
            tier_list: tierList,
            shared: formData.shared || false,
            inactive: formData.inactive || false
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
                        disabled={updating}
                        className="px-8 py-3 text-sm font-medium text-theme-primary-foreground bg-theme-primary border border-transparent rounded-md hover:bg-theme-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-theme-sm transition-all duration-200"
                    >
                        {updating ? 'Updating...' : 'Update Formula'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default FormulaUpdateModalContent; 