import { useState } from 'react';
import { FundingCredit, CreateFundingCreditParams, UpdateFundingCreditParams } from '@/types/fundingCredit';
import FormModalLayout from '@/components/FormModalLayout';
import FundingCreditForm from './FundingCreditForm';

interface CreateCreditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: CreateFundingCreditParams) => Promise<void>;
    onUpdate: (data: UpdateFundingCreditParams) => Promise<void>;
    isLoading: boolean;
    mode: 'create' | 'update';
    initialData?: FundingCredit;
}

export default function CreateCreditModal({
    isOpen,
    onClose,
    onCreate,
    onUpdate,
    isLoading,
    mode,
    initialData
}: CreateCreditModalProps) {
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (values: CreateFundingCreditParams | UpdateFundingCreditParams) => {
        try {
            if (mode === 'create') {
                await onCreate(values as CreateFundingCreditParams);
            } else {
                await onUpdate(values as UpdateFundingCreditParams);
            }
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit credit');
            throw err;
        }
    };

    if (!isOpen) return null;

    return (
        <FormModalLayout
            title={mode === 'create' ? 'Create Credit' : 'Update Credit'}
            subtitle={mode === 'create' ? 'Create a new credit below.' : 'Update the credit below.'}
            onCancel={() => {
                setError(null);
                onClose();
            }}
            maxWidth={500}
            showCloseButton={true}
            error={error ?? undefined}
        >
            <FundingCreditForm
                onSubmit={handleSubmit}
                onCancel={onClose}
                loading={isLoading}
                mode={mode}
                initialData={initialData}
            />
        </FormModalLayout>
    );
} 