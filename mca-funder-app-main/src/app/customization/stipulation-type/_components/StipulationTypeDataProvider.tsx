'use client';

import React, { useState, Suspense } from 'react';
import FormModalLayout from '@/components/FormModalLayout';
import useAuthStore from '@/lib/store/auth';
import { StipulationType } from '@/types/stipulationType';

// Define form values interface locally to avoid circular imports
export interface StipulationTypeFormValues {
  funder: string;
  name: string;
  required?: boolean;
  inactive: boolean;
}

interface StipulationTypeDataProviderProps {
    onClose: () => void;
    onSubmit: (values: StipulationTypeFormValues) => void;
    mode: 'create' | 'update';
    initialValues: StipulationTypeFormValues;
    title: string;
    subtitle: string;
    stipulationType?: StipulationType;
}

// Lazy load StipulationTypeForm to avoid circular imports
const StipulationTypeForm = React.lazy(() => import('./StipulationTypeForm'));

export function StipulationTypeDataProvider({
    onClose,
    onSubmit,
    mode,
    initialValues,
    title,
    subtitle,
    stipulationType
}: StipulationTypeDataProviderProps) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Get current funder from auth store
    const { funder } = useAuthStore();
    const currentFunderId = funder?._id;

    // Handle form submission
    const handleSubmit = async (values: StipulationTypeFormValues) => {
        setLoading(true);
        try {
            await onSubmit(values);
            onClose();
            setError('');
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || `Failed to ${mode} stipulation type`);
            } else {
                setError(`Failed to ${mode} stipulation type`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormModalLayout
            title={title}
            subtitle={subtitle}
            onCancel={onClose}
            maxWidth={600}
        >
            {!funder ? (
                <div className="flex justify-center items-center py-8">
                    <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                        </svg>
                        <span className="text-gray-600">Loading funder data...</span>
                    </div>
                </div>
            ) : (
                <Suspense fallback={
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                }>
                    <StipulationTypeForm
                        key={currentFunderId}
                        initialValues={initialValues}
                        onSubmit={handleSubmit}
                        onCancel={() => {
                            setError('');
                            onClose();
                        }}
                        error={error}
                        loading={loading}
                        mode={mode}
                        currentFunder={funder}
                        stipulationType={stipulationType}
                    />
                </Suspense>
            )}
        </FormModalLayout>
    );
} 