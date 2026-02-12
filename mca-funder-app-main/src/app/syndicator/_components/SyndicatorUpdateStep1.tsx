import React from 'react';
import { Field, ErrorMessage } from 'formik';
import { UpdateSyndicatorData } from '@/types/syndicator';

interface SyndicatorUpdateStep1Props {
  values: UpdateSyndicatorData;
  setFieldValue: (field: string, value: any) => void;
  onNext: () => void;
  onCancel: () => void;
  loading: boolean;
}

const labelClasses = 'block text-xs font-medium text-gray-700 mb-1';
const inputClasses = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
const errorClasses = 'text-red-500 text-xs mt-1';

export default function SyndicatorUpdateStep1({
  values,
  setFieldValue,
  onNext,
  onCancel,
  loading
}: SyndicatorUpdateStep1Props) {

  return (
    <div className="space-y-6">
      {/* Business Name - Required */}
      <div>
        <label className={labelClasses}>
          Business Name *
        </label>
        <Field
          name="name"
          type="text"
          className={inputClasses}
          placeholder="Enter business name"
        />
        <ErrorMessage name="name" component="div" className={errorClasses} />
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>
            First Name
          </label>
          <Field
            name="first_name"
            type="text"
            className={inputClasses}
            placeholder="Enter first name"
          />
          <ErrorMessage name="first_name" component="div" className={errorClasses} />
        </div>

        <div>
          <label className={labelClasses}>
            Last Name
          </label>
          <Field
            name="last_name"
            type="text"
            className={inputClasses}
            placeholder="Enter last name"
          />
          <ErrorMessage name="last_name" component="div" className={errorClasses} />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className={labelClasses}>
          Email Address
        </label>
        <Field
          name="email"
          type="email"
          className={inputClasses}
          placeholder="Enter email address"
        />
        <ErrorMessage name="email" component="div" className={errorClasses} />
      </div>

      {/* Status Toggle */}
      <div>
        <label className="flex items-center">
          <Field
            name="inactive"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            Mark as inactive
          </span>
        </label>
        <div className="text-xs text-gray-500 mt-1">
          Inactive syndicators will not be visible in regular listings
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={loading}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Please wait...' : 'Next'}
        </button>
      </div>
    </div>
  );
} 