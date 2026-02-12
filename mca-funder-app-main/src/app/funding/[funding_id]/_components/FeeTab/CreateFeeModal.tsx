import { useState } from 'react';
import { FundingFee, CreateFundingFeeParams, UpdateFundingFeeParams } from '@/types/fundingFee';
import { FeeType } from '@/types/feeType';
import FormModalLayout from '@/components/FormModalLayout';
import FundingFeeForm from './FundingFeeForm';

interface CreateFeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: CreateFundingFeeParams) => Promise<void>;
    onUpdate: (data: UpdateFundingFeeParams) => Promise<void>;
    isLoading: boolean;
    mode: 'create' | 'update';
    initialData?: FundingFee;
    feeTypes: FeeType[];
}

export default function CreateFeeModal({
    isOpen,
    onClose,
    onCreate,
    onUpdate,
    isLoading,
    mode,
    initialData,
    feeTypes
}: CreateFeeModalProps) {
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (values: CreateFundingFeeParams | UpdateFundingFeeParams) => {
        try {
            if (mode === 'create') {
                await onCreate(values as CreateFundingFeeParams);
            } else {
                await onUpdate(values as UpdateFundingFeeParams);
            }
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit fee');
            throw err;
        }
    };

    if (!isOpen) return null;

    return (
        <FormModalLayout
            title={mode === 'create' ? 'Create Fee' : 'Update Fee'}
            subtitle={mode === 'create' ? 'Create a new fee below.' : 'Update the fee below.'}
            onCancel={() => {
                setError(null);
                onClose();
            }}
            maxWidth={500}
            showCloseButton={true}
            error={error ?? undefined}
        >
            <FundingFeeForm
                onSubmit={handleSubmit}
                onCancel={onClose}
                feeTypes={feeTypes}
                loading={isLoading}
                mode={mode}
                initialData={initialData}
            />
        </FormModalLayout>
    );
} 