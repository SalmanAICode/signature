'use client';

import React, { useState, useEffect, Suspense } from 'react';
import FormModalLayout from '@/components/FormModalLayout';
import { getFormulaList } from '@/lib/api/formulas';
import { Formula } from '@/types/formula';
import useAuthStore from '@/lib/store/auth';

// Define form values interface locally to avoid circular imports
export interface FeeTypeFormValues {
  funder: string;
  name: string;
  formula?: string;
  upfront?: boolean;
  inactive: boolean;
  default?: boolean;
}

interface FeeTypeDataProviderProps {
    onClose: () => void;
    onSubmit: (values: FeeTypeFormValues) => void;
    mode: 'create' | 'update';
    initialValues: FeeTypeFormValues;
    title: string;
    subtitle: string;
    feeType?: any;
}

// Lazy load FeeTypeForm to avoid circular imports
const FeeTypeForm = React.lazy(() => import('./FeeTypeForm'));

export function FeeTypeDataProvider({
    onClose,
    onSubmit,
    mode,
    initialValues,
    title,
    subtitle,
    feeType
}: FeeTypeDataProviderProps) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [formulas, setFormulas] = useState<Formula[]>([]);
    const [loadingFormulas, setLoadingFormulas] = useState(false);

    // Get current funder from auth store
    const { funder } = useAuthStore();
    const currentFunderId = funder?._id;

    // Load formulas when component mounts or funder changes
    useEffect(() => {
        if (!currentFunderId) return;

        const fetchFormulas = async () => {
            setLoadingFormulas(true);
            try {
                const formulaList = await getFormulaList(currentFunderId);
                setFormulas(formulaList.filter(f => !f.inactive)); // Only show active formulas
            } catch (err) {
                console.error('Failed to load formulas:', err);
                setError('Failed to load formulas');
            } finally {
                setLoadingFormulas(false);
            }
        };

        fetchFormulas();
    }, [currentFunderId]);

    // Handle form submission
    const handleSubmit = async (values: FeeTypeFormValues) => {
        setLoading(true);
        try {
            await onSubmit(values);
            onClose();
            setError('');
        } catch (err: any) {
            setError(err.message || `Failed to ${mode} fee type`);
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
                    <FeeTypeForm
                        key={currentFunderId}
                        initialValues={initialValues}
                        onSubmit={handleSubmit}
                        onCancel={() => {
                            setError('');
                            onClose();
                        }}
                        error={error}
                        loading={loading || loadingFormulas}
                        mode={mode}
                        formulas={formulas}
                        currentFunder={funder}
                        feeType={feeType}
                    />
                </Suspense>
            )}
        </FormModalLayout>
    );
} 