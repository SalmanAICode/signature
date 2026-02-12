'use client';

import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Formula } from '@/types/formula';
import { FeeType } from '@/types/feeType';
import Select from 'react-select';
import clsx from 'clsx';

import { FeeTypeFormValues } from './FeeTypeDataProvider';

interface FeeTypeFormProps {
  initialValues: FeeTypeFormValues;
  onSubmit: (values: FeeTypeFormValues) => Promise<void>;
  onCancel: () => void;
  error?: string;
  loading?: boolean;
  mode: 'create' | 'update';
  formulas: Formula[];
  currentFunder: any;
  feeType?: FeeType | null;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Fee type name is required'),
  formula: Yup.string().optional(),
  upfront: Yup.boolean().optional(),
  inactive: Yup.boolean().optional(),
  default: Yup.boolean().optional(),
});

export default function FeeTypeForm({
  initialValues,
  onSubmit,
  onCancel,
  error,
  loading,
  mode,
  formulas,
  currentFunder,
  feeType
}: FeeTypeFormProps) {
  const inputClasses = clsx(
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500',
    loading && 'animate-pulse'
  );

  const labelClasses = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1';
  const errorClasses = 'mt-1 text-sm text-red-600';

  return (
    <Formik
      initialValues={{
        ...initialValues,
        funder: currentFunder?._id || initialValues.funder
      }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {({ values, setFieldValue, errors, touched }) => (
        <Form className="relative w-full">
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-50 z-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          )}

          <div className="space-y-4">
            {/* Show error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Fee Type Name */}
            <div>
              <label htmlFor="name" className={labelClasses}>
                Fee Type Name *
              </label>
              <Field
                type="text"
                id="name"
                name="name"
                className={inputClasses}
                placeholder="Enter fee type name"
                disabled={loading}
              />
              {errors.name && touched.name && (
                <ErrorMessage name="name" component="div" className={errorClasses} />
              )}
            </div>

            {/* Formula */}
            <div>
              <label htmlFor="formula" className={labelClasses}>
                Formula
              </label>
              <Select
                name="formula"
                options={formulas.map(formula => ({ value: formula._id, label: formula.name }))}
                value={values.formula ? {
                  value: values.formula,
                  label: formulas.find(f => f._id === values.formula)?.name || ''
                } : null}
                onChange={(selected) => {
                  setFieldValue('formula', selected?.value || '');
                }}
                className="text-sm"
                classNamePrefix="select"
                placeholder="Select formula..."
                isClearable
                isSearchable
                isDisabled={loading}
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                  menu: (base) => ({ ...base, zIndex: 99999 }),
                  control: (base, state) => ({
                    ...base,
                    backgroundColor: state.isDisabled ? '#f9fafb' : 'white',
                    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                    '&:hover': {
                      borderColor: state.isFocused ? '#3b82f6' : '#9ca3af'
                    }
                  }),
                  singleValue: (base, state) => ({
                    ...base,
                    color: state.isDisabled ? '#111827' : base.color
                  }),
                  placeholder: (base, state) => ({
                    ...base,
                    color: state.isDisabled ? '#6b7280' : base.color
                  })
                }}
                menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                menuPosition="fixed"
              />
              {loading && (
                <p className="text-xs text-gray-500 mt-1">Loading formulas...</p>
              )}
            </div>

            {/* Upfront Checkbox */}
            <div className="flex items-center">
              <Field
                id="upfront"
                name="upfront"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                disabled={loading}
              />
              <label htmlFor="upfront" className="ml-2 block text-sm text-gray-800 dark:text-gray-200">
                Upfront Fee
                <span className="text-xs text-gray-500 dark:text-gray-400 block">This fee is charged upfront</span>
              </label>
            </div>

            {/* Default Checkbox */}
            <div className="flex items-center">
              <Field
                id="default"
                name="default"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                disabled={loading}
              />
              <label htmlFor="default" className="ml-2 block text-sm text-gray-800 dark:text-gray-200">
                Default Fee Type
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Whether this fee type should be included in each offer or funding</span>
              </label>
            </div>

            {/* Only show Inactive Status checkbox when editing */}
            {(mode === 'update' || feeType) && (
              <div className="flex items-center">
                <Field
                  id="inactive"
                  name="inactive"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  disabled={loading}
                />
                <label htmlFor="inactive" className="ml-2 block text-sm text-gray-800 dark:text-gray-200">
                  Inactive Status
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">Inactive fee types are hidden by default</span>
                </label>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-evenly gap-4 pt-4">
              <button
                type="submit"
                disabled={loading || !values.name?.trim()}
                className="w-1/2 px-6 py-2 rounded-lg bg-blue-600 dark:bg-blue-700 text-white text-base font-medium hover:bg-blue-700 dark:hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (mode === 'update' ? 'Update' : 'Create')}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="w-1/2 px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
} 