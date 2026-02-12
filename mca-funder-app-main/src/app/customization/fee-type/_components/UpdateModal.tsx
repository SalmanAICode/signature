'use client';

import { FeeType, UpdateFeeType } from '@/types/feeType';
import { updateFeeType } from '@/lib/api/feeTypes';
import { FeeTypeFormValues } from './FeeTypeDataProvider';
import { FeeTypeDataProvider } from './FeeTypeDataProvider';

interface UpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (updatedFeeType: FeeType) => void;
    feeType: FeeType;
}

export function UpdateModal({ isOpen, onClose, onSuccess, feeType }: UpdateModalProps) {
    
    // Prepare initial values from the existing fee type
    const formInitialValues: FeeTypeFormValues = {
        funder: typeof feeType.funder === 'string' ? feeType.funder : feeType.funder._id,
        name: feeType.name,
        formula: typeof feeType.formula === 'string' ? feeType.formula : (feeType.formula?._id || ''),
        upfront: feeType.upfront || false,
        inactive: feeType.inactive || false,
        default: feeType.default || false,
    };

    const handleSubmit = async (values: FeeTypeFormValues) => {
        const updateData: UpdateFeeType = {
            name: values.name,
            formula: values.formula && values.formula.trim() ? values.formula : '',
            upfront: values.upfront,
            inactive: values.inactive,
            default: values.default,
        };
        
        const updatedFeeType = await updateFeeType(feeType._id, updateData);
        onSuccess(updatedFeeType);
    };

    if (!isOpen) return null;

    return (
        <FeeTypeDataProvider
            onClose={onClose}
            onSubmit={handleSubmit}
            mode="update"
            initialValues={formInitialValues}
            title="Update Fee Type"
            subtitle="Update the fee type details below."
            feeType={feeType}
        />
    );
}
