'use client';

import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useState, useEffect } from 'react';
import { FundingCredit, CreateFundingCreditParams, UpdateFundingCreditParams } from '@/types/fundingCredit';

interface FormValues {
    credit_date: string;
    amount: number;
    note: string;
}

interface FundingCreditFormProps {
    onSubmit: (data: CreateFundingCreditParams | UpdateFundingCreditParams) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
    mode: 'create' | 'update';
    initialData?: FundingCredit;
}

export default function FundingCreditForm({
    onSubmit,
    onCancel,
    loading,
    mode,
    initialData
}: FundingCreditFormProps) {
    const [amountInput, setAmountInput] = useState('');

    // Helper function to format date for input field
    const formatDateForInput = (dateString: string | undefined): string => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
        } catch {
            return '';
        }
    };

    // Create dynamic validation schema based on mode
    const validationSchema = Yup.object({
        credit_date: Yup.string().required('Credit date is required'),
        amount: Yup.number()
            .required('Amount is required')
            .moreThan(0, 'Amount must be greater than 0')
            .transform((value) => (isNaN(value) ? undefined : value))
            .typeError('Amount must be a valid number'),
        note: Yup.string()
    });

    const formik = useFormik<FormValues>({
        initialValues: {
            credit_date: formatDateForInput(initialData?.credit_date),
            amount: initialData?.amount || 0,
            note: initialData?.note || '',
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                await onSubmit({
                    credit_date: values.credit_date.trim(),
                    amount: values.amount,
                    note: values.note.trim()
                } as any);
                formik.resetForm();
                setAmountInput('');
            } catch (error) {
                // Don't reset form on error - preserve user input
            }
        },
    });

    // Reset form when modal opens/closes or initialData changes
    useEffect(() => {
        if (initialData) {
            formik.resetForm({
                values: {
                    credit_date: formatDateForInput(initialData.credit_date),
                    amount: initialData.amount || 0,
                    note: initialData.note || '',
                }
            });
            setAmountInput(initialData.amount?.toString() || '');
        } else {
            setAmountInput('');
        }
    }, [initialData, mode]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setAmountInput(value);
            const numValue = value === '' ? 0 : parseFloat(value);
            formik.setFieldValue('amount', numValue);
        }
    };

    return (
        <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credit Date *
                </label>
                <input
                    type="date"
                    name="credit_date"
                    value={formik.values.credit_date}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={mode === 'update'}
                    className={`mt-1 block w-full px-3 py-2 text-base border ${
                        formik.touched.credit_date && formik.errors.credit_date
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } focus:outline-none sm:text-sm rounded-md ${
                        mode === 'update' ? 'bg-gray-50 cursor-not-allowed' : ''
                    }`}
                />
                {formik.touched.credit_date && formik.errors.credit_date && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.credit_date}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                </label>
                <input
                    type="text"
                    inputMode="decimal"
                    value={amountInput}
                    onChange={handleAmountChange}
                    onBlur={() => formik.setFieldTouched('amount', true)}
                    className={`mt-1 block w-full px-3 py-2 text-base border ${
                        formik.touched.amount && formik.errors.amount
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } focus:outline-none sm:text-sm rounded-md`}
                    placeholder="0.00"
                />
                {formik.touched.amount && formik.errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.amount}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                </label>
                <textarea
                    name="note"
                    value={formik.values.note}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    rows={3}
                    className={`mt-1 block w-full px-3 py-2 text-base border ${
                        formik.touched.note && formik.errors.note
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } focus:outline-none sm:text-sm rounded-md resize-none`}
                    placeholder="Add any additional notes..."
                />
                {formik.touched.note && formik.errors.note && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.note}</p>
                )}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-200">
                <button
                    type="submit"
                    disabled={loading || formik.isSubmitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                >
                    {loading || formik.isSubmitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            {mode === 'create' ? 'Creating...' : 'Updating...'}
                        </>
                    ) : (
                        mode === 'create' ? 'Create' : 'Update'
                    )}
                </button>
            </div>
        </form>
    );
} 