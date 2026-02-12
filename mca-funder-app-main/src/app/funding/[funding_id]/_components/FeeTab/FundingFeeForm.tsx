'use client';

import { useFormik } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';
import { useState, useEffect } from 'react';
import { FundingFee, CreateFundingFeeParams, UpdateFundingFeeParams } from '@/types/fundingFee';
import { FeeType } from '@/types/feeType';

interface FormValues {
    fee_type: string;
    amount: number;
    fee_date: string;
    note: string;
}

interface FundingFeeFormProps {
    onSubmit: (data: CreateFundingFeeParams | UpdateFundingFeeParams) => Promise<void>;
    onCancel: () => void;
    feeTypes: FeeType[];
    loading: boolean;
    mode: 'create' | 'update';
    initialData?: FundingFee;
}

export default function FundingFeeForm({
    onSubmit,
    onCancel,
    feeTypes,
    loading,
    mode,
    initialData
}: FundingFeeFormProps) {
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
        fee_type: Yup.string().required('Fee type is required'),
        amount: Yup.number()
            .required('Amount is required')
            .moreThan(0, 'Amount must be greater than 0')
            .transform((value) => (isNaN(value) ? undefined : value))
            .typeError('Amount must be a valid number'),
        fee_date: Yup.string(),
        note: Yup.string()
    });

    const formik = useFormik<FormValues>({
        initialValues: {
            fee_type: initialData?.fee_type?.id || '',
            amount: initialData?.amount || 0,
            fee_date: formatDateForInput(initialData?.fee_date),
            note: initialData?.note || '',
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                await onSubmit({
                    fee_type: values.fee_type,
                    amount: values.amount,
                    fee_date: values.fee_date.trim(),
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
                    fee_type: initialData.fee_type?.id || '',
                    amount: initialData.amount || 0,
                    fee_date: formatDateForInput(initialData.fee_date),
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

    // Find the current fee type for display
    const currentFeeType = mode === 'update' && initialData?.fee_type
        ? {
            id: initialData.fee_type.id,
            name: initialData.fee_type.name
        }
        : feeTypes.find(f => f._id === formik.values.fee_type);

    return (
        <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Type {mode === 'create' && '*'}
                </label>
                {mode === 'update' && currentFeeType ? (
                    <div className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md bg-gray-50">
                        <div className="font-medium text-gray-900">{currentFeeType.name}</div>
                    </div>
                ) : (
                    <Select
                        name="fee_type"
                        value={formik.values.fee_type ? 
                            { value: formik.values.fee_type, label: feeTypes.find(f => f._id === formik.values.fee_type)?.name || '' } : 
                            null
                        }
                        onChange={(option) => formik.setFieldValue('fee_type', option?.value || '')}
                        onBlur={() => formik.setFieldTouched('fee_type', true)}
                        options={[
                            { value: '', label: 'Select a fee type...' },
                            ...feeTypes.map(feeType => ({
                                value: feeType._id,
                                label: feeType.name
                            }))
                        ]}
                        className="text-sm"
                        classNamePrefix="select"
                        placeholder="Select a fee type..."
                        isSearchable
                        styles={{
                            control: (base) => ({
                                ...base,
                                borderColor: formik.touched.fee_type && formik.errors.fee_type ? '#ef4444' : '#d1d5db',
                                '&:hover': {
                                    borderColor: formik.touched.fee_type && formik.errors.fee_type ? '#ef4444' : '#9ca3af'
                                }
                            }),
                            menuPortal: (base) => ({
                                ...base,
                                zIndex: 99999
                            }),
                            menu: (base) => ({
                                ...base,
                                zIndex: 99999
                            })
                        }}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                    />
                )}
                {formik.touched.fee_type && formik.errors.fee_type && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.fee_type}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                        Fee Date
                    </label>
                    <input
                        type="date"
                        name="fee_date"
                        value={formik.values.fee_date}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={mode === 'update'}
                        className={`mt-1 block w-full px-3 py-2 text-base border ${
                            formik.touched.fee_date && formik.errors.fee_date
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        } focus:outline-none sm:text-sm rounded-md ${
                            mode === 'update' ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                    />
                    {formik.touched.fee_date && formik.errors.fee_date && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.fee_date}</p>
                    )}
                </div>
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