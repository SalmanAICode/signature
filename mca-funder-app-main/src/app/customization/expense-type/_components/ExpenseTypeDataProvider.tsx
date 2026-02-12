'use client';

import React, { useState, useEffect, Suspense } from 'react';
import FormModalLayout from '@/components/FormModalLayout';
import { getFormulaList } from '@/lib/api/formulas';
import { Formula } from '@/types/formula';
import useAuthStore from '@/lib/store/auth';

// Define form values interface locally to avoid circular imports
export interface ExpenseTypeFormValues {
  funder: string;
  name: string;
  formula?: string;
  commission?: boolean;
  syndication?: boolean;
  inactive: boolean;
  default?: boolean;
}

interface ExpenseTypeDataProviderProps {
    onClose: () => void;
    onSubmit: (values: ExpenseTypeFormValues) => void;
    mode: 'create' | 'update';
    initialValues: ExpenseTypeFormValues;
    title: string;
    subtitle: string;
    expenseType?: any;
    loading?: boolean;
}

// Lazy load ExpenseTypeForm to avoid circular imports
const ExpenseTypeForm = React.lazy(() => import('./ExpenseTypeForm'));

export function ExpenseTypeDataProvider({
    onClose,
    onSubmit,
    mode,
    initialValues,
    title,
    subtitle,
    expenseType,
    loading: externalLoading = false
}: ExpenseTypeDataProviderProps) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [formulas, setFormulas] = useState<Formula[]>([]);
    const [loadingFormulas, setLoadingFormulas] = useState(false);

    // Get current funder from auth store
    const { funder } = useAuthStore();
    const currentFunderId = funder?._id;

    // Combine internal and external loading states
    const isLoading = loading || loadingFormulas || externalLoading;

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
    const handleSubmit = async (values: ExpenseTypeFormValues) => {
        try {
            onSubmit(values);
            // Don't close here, let the parent handle success
            setError('');
        } catch (err: any) {
            // Don't set error here, let the parent handle error display via toast
            console.error('Form submission error:', err);
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
                    <ExpenseTypeForm
                        key={currentFunderId}
                        initialValues={initialValues}
                        onSubmit={handleSubmit}
                        onCancel={() => {
                            setError('');
                            onClose();
                        }}
                        loading={isLoading}
                        mode={mode}
                        formulas={formulas}
                        currentFunder={funder}
                        expenseType={expenseType}
                    />
                </Suspense>
            )}
        </FormModalLayout>
    );
} 