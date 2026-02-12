import React from 'react';
import { Field, ErrorMessage } from 'formik';
import { UpdateSyndicatorData } from '@/types/syndicator';

interface SyndicatorUpdateStep3Props {
  values: UpdateSyndicatorData;
  setFieldValue: (field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

const labelClasses = 'block text-xs font-medium text-gray-700 mb-1';
const inputClasses = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
const errorClasses = 'text-red-500 text-xs mt-1';

export default function SyndicatorUpdateStep3({
  values,
  setFieldValue,
  onNext,
  onBack,
  loading
}: SyndicatorUpdateStep3Props) {

  return (
    <div className="space-y-6">
      {/* Address Information */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">Address Information</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClasses}>
              Address Line 1
            </label>
            <Field
              name="address_detail.address_1"
              type="text"
              className={inputClasses}
              placeholder="Street address"
            />
            <ErrorMessage name="address_detail.address_1" component="div" className={errorClasses} />
          </div>

          <div>
            <label className={labelClasses}>
              Address Line 2
            </label>
            <Field
              name="address_detail.address_2"
              type="text"
              className={inputClasses}
              placeholder="Apartment, suite, etc. (optional)"
            />
            <ErrorMessage name="address_detail.address_2" component="div" className={errorClasses} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClasses}>
                City
              </label>
              <Field
                name="address_detail.city"
                type="text"
                className={inputClasses}
                placeholder="City"
              />
              <ErrorMessage name="address_detail.city" component="div" className={errorClasses} />
            </div>

            <div>
              <label className={labelClasses}>
                State
              </label>
              <Field
                name="address_detail.state"
                type="text"
                className={inputClasses}
                placeholder="State"
              />
              <ErrorMessage name="address_detail.state" component="div" className={errorClasses} />
            </div>

            <div>
              <label className={labelClasses}>
                ZIP Code
              </label>
              <Field
                name="address_detail.zip"
                type="text"
                className={inputClasses}
                placeholder="ZIP code"
              />
              <ErrorMessage name="address_detail.zip" component="div" className={errorClasses} />
            </div>
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">Business Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>
                EIN (Tax ID)
              </label>
              <Field
                name="business_detail.ein"
                type="text"
                className={inputClasses}
                placeholder="XX-XXXXXXX"
              />
              <ErrorMessage name="business_detail.ein" component="div" className={errorClasses} />
            </div>

            <div>
              <label className={labelClasses}>
                Entity Type
              </label>
              <Field
                name="business_detail.entity_type"
                type="text"
                className={inputClasses}
                placeholder="LLC, Corporation, etc."
              />
              <ErrorMessage name="business_detail.entity_type" component="div" className={errorClasses} />
            </div>

            <div>
              <label className={labelClasses}>
                Incorporation Date
              </label>
              <Field
                name="business_detail.incorporation_date"
                type="date"
                className={inputClasses}
              />
              <ErrorMessage name="business_detail.incorporation_date" component="div" className={errorClasses} />
            </div>

            <div>
              <label className={labelClasses}>
                State of Incorporation
              </label>
              <Field
                name="business_detail.state_of_incorporation"
                type="text"
                className={inputClasses}
                placeholder="State abbreviation (e.g., DE)"
              />
              <ErrorMessage name="business_detail.state_of_incorporation" component="div" className={errorClasses} />
            </div>
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
          {loading ? 'Updating...' : 'Update Syndicator'}
        </button>
      </div>
    </div>
  );
} 