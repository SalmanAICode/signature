import { useState } from 'react';
import { ApplicationStipulation, ApplicationStipulationStatus, CreateApplicationStipulationData, UpdateApplicationStipulationData, applicationStipulationStatus } from '@/types/applicationStipulation';
import * as Yup from 'yup';
import { StipulationType } from '@/types/stipulationType';
import FormModalLayout from '@/components/FormModalLayout';
import ApplicationStipulationForm from './ApplicationStipulationForm';


interface CreateStipulationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (data: UpdateApplicationStipulationData) => Promise<void>;
    onCreate: (data: CreateApplicationStipulationData) => Promise<void>;
    stipulations: StipulationType[];
    isLoading: boolean;
    mode: 'create' | 'update';
    initialData?: ApplicationStipulation;
}

export default function CreateStipulationModal({
    isOpen,
    onClose,
    onUpdate,
    onCreate,
    stipulations,
    isLoading,
    mode,
    initialData
}: CreateStipulationModalProps) {
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (values: CreateApplicationStipulationData | UpdateApplicationStipulationData) => {
        try {
            if (mode === 'create') {
                await onCreate(values as CreateApplicationStipulationData);
            } else {
                await onUpdate(values as UpdateApplicationStipulationData);
            }
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit stipulation');
            throw err;
        }
    };

    if (!isOpen) return null;

    return (
        <FormModalLayout
            title={mode === 'create' ? 'Create Stipulation' : 'Update Stipulation'}
            subtitle={mode === 'create' ? 'Create a new stipulation below.' : 'Update the stipulation below.'}
            onCancel={() => {
                setError(null);
                onClose();
            }}
            maxWidth={500}
            showCloseButton={true}
            error={error ?? undefined}
        >
            <ApplicationStipulationForm
                onSubmit={handleSubmit}
                onCancel={onClose}
                stipulations={stipulations}
                loading={isLoading}
                mode={mode}
                initialData={initialData}
            />
        </FormModalLayout>
    );
} 