import React from 'react';
import { Field, ErrorMessage } from 'formik';
import { CreateSyndicatorData } from '@/types/syndicator';

interface SyndicatorCreateStep2Props {
  values: CreateSyndicatorData;
  setFieldValue: (field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

const labelClasses = 'block text-xs font-medium text-gray-700 mb-1';
const inputClasses = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
const errorClasses = 'text-red-500 text-xs mt-1';

export default function SyndicatorCreateStep2({
  values,
  setFieldValue,
  onNext,
  onBack,
  loading
}: SyndicatorCreateStep2Props) {

  return (
    <div className="space-y-6">
      {/* Phone Numbers */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClasses}>
              Mobile Phone
            </label>
            <Field
              name="phone_mobile"
              type="tel"
              className={inputClasses}
              placeholder="(123) 456-7890"
            />
            <ErrorMessage name="phone_mobile" component="div" className={errorClasses} />
          </div>

          <div>
            <label className={labelClasses}>
              Work Phone
            </label>
            <Field
              name="phone_work"
              type="tel"
              className={inputClasses}
              placeholder="(123) 456-7890"
            />
            <ErrorMessage name="phone_work" component="div" className={errorClasses} />
          </div>

          <div>
            <label className={labelClasses}>
              Home Phone
            </label>
            <Field
              name="phone_home"
              type="tel"
              className={inputClasses}
              placeholder="(123) 456-7890"
            />
            <ErrorMessage name="phone_home" component="div" className={errorClasses} />
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>
              Birthday
            </label>
            <Field
              name="birthday"
              type="date"
              className={inputClasses}
            />
            <ErrorMessage name="birthday" component="div" className={errorClasses} />
          </div>

          <div>
            <label className={labelClasses}>
              Social Security Number
            </label>
            <Field
              name="ssn"
              type="text"
              className={inputClasses}
              placeholder="XXX-XX-XXXX"
            />
            <ErrorMessage name="ssn" component="div" className={errorClasses} />
          </div>


          <div>
            <label className={labelClasses}>
              Password
            </label>
            <Field
              name="password"
              type="password"
              className={inputClasses}
              placeholder="Enter password"
            />
            <ErrorMessage name="password" component="div" className={errorClasses} />
          </div>
        </div>
      </div>

      {/* Additional Driver's License Information */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">Driver's License Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>
              Driver's License Number
            </label>
            <Field
              name="drivers_license_number"
              type="text"
              className={inputClasses}
              placeholder="License number"
            />
            <ErrorMessage name="drivers_license_number" component="div" className={errorClasses} />
          </div>
          <div>
            <label className={labelClasses}>
              Issue Date
            </label>
            <Field
              name="dln_issue_date"
              type="date"
              className={inputClasses}
            />
            <ErrorMessage name="dln_issue_date" component="div" className={errorClasses} />
          </div>

          <div>
            <label className={labelClasses}>
              Issue State
            </label>
            <Field
              name="dln_issue_state"
              type="text"
              className={inputClasses}
              placeholder="State abbreviation (e.g., CA)"
            />
            <ErrorMessage name="dln_issue_state" component="div" className={errorClasses} />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
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