'use client';

import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { StipulationType } from '@/types/stipulationType';
import clsx from 'clsx';
import { StipulationTypeFormValues } from './StipulationTypeDataProvider';
import { Funder } from '@/types/funder';

interface StipulationTypeFormProps {
  initialValues: StipulationTypeFormValues;
  onSubmit: (values: StipulationTypeFormValues) => Promise<void>;
  onCancel: () => void;
  error?: string;
  loading?: boolean;
  mode: 'create' | 'update';
  currentFunder: Funder;
  stipulationType?: StipulationType | null;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Stipulation type name is required'),
  required: Yup.boolean().optional(),
  inactive: Yup.boolean().optional(),
});

export default function StipulationTypeForm({
  initialValues,
  onSubmit,
  onCancel,
  error,
  loading,
  mode,
  currentFunder,
  stipulationType
}: StipulationTypeFormProps) {
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
      {({ values, errors, touched }) => (
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

            {/* Stipulation Type Name */}
            <div>
              <label htmlFor="name" className={labelClasses}>
                Stipulation Type Name *
              </label>
              <Field
                type="text"
                id="name"
                name="name"
                className={inputClasses}
                placeholder="Enter stipulation type name"
                disabled={loading}
              />
              {errors.name && touched.name && (
                <ErrorMessage name="name" component="div" className={errorClasses} />
              )}
            </div>

            {/* Required Checkbox */}
            <div className="flex items-center">
              <Field
                id="required"
                name="required"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                disabled={loading}
              />
              <label htmlFor="required" className="ml-2 block text-sm text-gray-800 dark:text-gray-200">
                Required Stipulation Type
                <span className="text-xs text-gray-500 dark:text-gray-400 block">This stipulation type is mandatory for applications</span>
              </label>
            </div>

            {/* Only show Inactive Status checkbox when editing */}
            {(mode === 'update' || stipulationType) && (
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
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">Inactive stipulation types are hidden by default</span>
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