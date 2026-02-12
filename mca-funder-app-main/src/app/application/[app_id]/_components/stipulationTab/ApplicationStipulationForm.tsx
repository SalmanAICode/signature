'use client';

import { useFormik } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';
import { useState, useEffect } from 'react';
import { ApplicationStipulation, CreateApplicationStipulationData, UpdateApplicationStipulationData } from '@/types/applicationStipulation';
import { StipulationType } from '@/types/stipulationType';
import { applicationStipulationStatus } from '@/types/applicationStipulation';

interface FormValues {
    stipulation_type: string;
    status: string;
    note: string;
    mode: 'create' | 'update';
}

interface ApplicationStipulationFormProps {
    onSubmit: (data: CreateApplicationStipulationData | UpdateApplicationStipulationData) => Promise<void>;
    onCancel: () => void;
    stipulations: StipulationType[];
    loading: boolean;
    mode: 'create' | 'update';
    initialData?: ApplicationStipulation;
}

const validationSchema = Yup.object({
    stipulation_type: Yup.string().when('mode', {
        is: 'create',
        then: (schema) => schema.required('Stipulation type is required'),
        otherwise: (schema) => schema.notRequired()
    }),
    status: Yup.string().required('Status is required'),
    note: Yup.string()
});

export default function ApplicationStipulationForm({
    onSubmit,
    onCancel,
    stipulations,
    loading,
    mode,
    initialData
}: ApplicationStipulationFormProps) {
    const formik = useFormik<FormValues>({
        initialValues: {
            stipulation_type: initialData?.stipulation_type?._id || '',
            status: initialData?.status || 'REQUESTED',
            note: initialData?.note || '',
            mode: mode,
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                if (mode === 'create') {
                    await onSubmit({
                        stipulation_type: values.stipulation_type,
                        status: values.status,
                        note: values.note.trim()
                    } as CreateApplicationStipulationData);
                } else {
                    await onSubmit({
                        status: values.status,
                        note: values.note.trim()
                    } as UpdateApplicationStipulationData);
                }
                // Only reset form on success
                formik.resetForm();
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
                    stipulation_type: initialData.stipulation_type?._id || '',
                    status: initialData.status || 'REQUESTED',
                    note: initialData.note || '',
                    mode: mode,
                }
            });
        }
    }, [initialData, mode]);

    // Find the current stipulation for display
    const currentStipulation = mode === 'update' && initialData?.stipulation_type
        ? {
            _id: initialData.stipulation_type._id,
            name: initialData.stipulation_type.name,
            required: initialData.stipulation_type.required
        }
        : stipulations.find(s => s._id === formik.values.stipulation_type);

    return (
        <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stipulation Type {mode === 'create' && '*'}
                </label>
                {mode === 'update' && currentStipulation ? (
                    <div className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md bg-gray-50">
                        <div className="font-medium text-gray-900">{currentStipulation.name}</div>
                    </div>
                ) : (
                    <Select
                        name="stipulation_type"
                        value={formik.values.stipulation_type ? 
                            { value: formik.values.stipulation_type, label: stipulations.find(s => s._id === formik.values.stipulation_type)?.name || '' } : 
                            null
                        }
                        onChange={(option) => formik.setFieldValue('stipulation_type', option?.value || '')}
                        onBlur={() => formik.setFieldTouched('stipulation_type', true)}
                        options={[
                            { value: '', label: 'Select a stipulation...' },
                            ...stipulations.map(stip => ({
                                value: stip._id,
                                label: stip.name
                            }))
                        ]}
                        className="text-sm"
                        classNamePrefix="select"
                        placeholder="Select a stipulation..."
                        isSearchable
                        styles={{
                            control: (base) => ({
                                ...base,
                                borderColor: formik.touched.stipulation_type && formik.errors.stipulation_type ? '#ef4444' : '#d1d5db',
                                '&:hover': {
                                    borderColor: formik.touched.stipulation_type && formik.errors.stipulation_type ? '#ef4444' : '#9ca3af'
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
                {formik.touched.stipulation_type && formik.errors.stipulation_type && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.stipulation_type}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                </label>
                <Select
                    name="status"
                    value={formik.values.status ? 
                        { value: formik.values.status, label: formik.values.status } : 
                        null
                    }
                    onChange={(option) => formik.setFieldValue('status', option?.value || '')}
                    onBlur={() => formik.setFieldTouched('status', true)}
                    options={applicationStipulationStatus.map(status => ({
                        value: status,
                        label: status
                    }))}
                    className="text-sm"
                    classNamePrefix="select"
                    placeholder="Select status..."
                    isSearchable
                    styles={{
                        control: (base) => ({
                            ...base,
                            borderColor: formik.touched.status && formik.errors.status ? '#ef4444' : '#d1d5db',
                            '&:hover': {
                                borderColor: formik.touched.status && formik.errors.status ? '#ef4444' : '#9ca3af'
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
                {formik.touched.status && formik.errors.status && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.status}</p>
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