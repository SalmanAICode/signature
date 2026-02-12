import React, { useState, useEffect } from 'react';
import { createCommissionIntent } from '@/lib/api/commissionIntents';
import type { CreateCommissionIntent } from '@/types/commissionIntent';
import { getFundingById } from '@/lib/api/fundings';
import { useFunderAccounts } from '@/hooks/useFunderAccounts';
import { useISOAccounts } from '@/hooks/useISOAccounts';
import { Funding } from '@/types/funding';
import Select from 'react-select';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

interface CreateCommissionIntentProps {
  fundingId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const paymentMethods = [
  { value: 'ACH', label: 'ACH' },
  { value: 'WIRE', label: 'Wire Transfer' },
  { value: 'CHECK', label: 'Check' },
  { value: 'OTHER', label: 'Other' },
];

const achProcessors = [
  { value: 'ACHWorks', label: 'ACHWorks' },
  { value: 'Actum', label: 'Actum' },
  { value: 'Manual', label: 'Manual' },
  { value: 'Other', label: 'Other' },
];

const statusOptions = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'SUCCEED', label: 'Succeeded' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const validationSchema = Yup.object().shape({
  funder_account: Yup.string().required('Funder account is required'),
  iso_account: Yup.string().required('ISO account is required'),
  commission_date: Yup.string().required('Commission date is required'),
  amount: Yup.number().min(1, 'Amount must be greater than 0').required('Amount is required'),
  payment_method: Yup.string().nullable(),
  ach_processor: Yup.string().when('payment_method', (val, schema) =>
    typeof val === 'string' && val === 'ACH'
      ? schema.nullable()
      : schema.nullable()
  ),
  status: Yup.string().nullable(),
  note: Yup.string().nullable(),
});

export default function CreateCommissionIntent({ fundingId, onSuccess, onCancel }: CreateCommissionIntentProps) {
  const [funding, setFunding] = useState<Funding | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fundingId) {
      setLoading(true);
      getFundingById(fundingId)
        .then((res) => {
          setFunding(res.data);
        })
        .catch((err) => {
          console.error('Failed to load funding details:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [fundingId]);

  const { accounts: isoAccounts, loading: isoAccountsLoading } = useISOAccounts();
  const { accounts: funderAccounts, loading: funderAccountsLoading } = useFunderAccounts();

  return (
    <Formik
      initialValues={{
        funder_account: '',
        iso_account: '',
        commission_date: new Date().toISOString().split('T')[0],
        amount: 0,
        payment_method: null,
        ach_processor: 'ACHWorks' as 'ACHWorks' | 'Actum' | 'Manual' | 'Other' | null,
        status: 'SCHEDULED',
        note: '',
      }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting, setStatus }) => {
        try {
          // Check if funding has an ISO
          if (!funding?.iso) {
            setStatus('Cannot create commission intent: This funding does not have an associated ISO.');
            return;
          }

          const commissionIntentData: CreateCommissionIntent = {
            funding: fundingId,
            commission_date: values.commission_date,
            amount: values.amount,
            funder_account: values.funder_account,
            iso_account: values.iso_account,
            payment_method: values.payment_method,
            ach_processor: values.ach_processor,
            note: values.note,
            status: values.status as 'SCHEDULED' | 'SUBMITTED' | 'SUCCEED' | 'FAILED' | 'CANCELLED' | undefined,
          };
          await createCommissionIntent(commissionIntentData);
          onSuccess();
        } catch (err: any) {
          setStatus(err.message || 'Failed to create commission intent');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, setFieldValue, isSubmitting, status }) => (
        <Form className="p-6">
          {status && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-red-800 font-medium">Error</h3>
                  <p className="text-red-700 mt-1">{status}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && funding && !funding.iso && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-yellow-800 font-medium">Warning</h3>
                  <p className="text-yellow-700 mt-1">This funding does not have an associated ISO. Commission intents cannot be created until the funding is linked to an ISO.</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Commission Details Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Commission Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                    Commission Date <span className="text-red-500">*</span>
                  </label>
                  <Field
                    name="commission_date"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <ErrorMessage name="commission_date" component="div" className="text-red-600 text-xs mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Field
                      name="amount"
                      type="number"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <ErrorMessage name="amount" component="div" className="text-red-600 text-xs mt-1" />
                </div>
              </div>
            </div>

            {/* Accounts Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Transaction Accounts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                    Funder Account <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={funderAccounts.map(account => ({ value: account._id, label: account.name }))}
                    value={funderAccounts.find(account => account._id === values.funder_account) ? {
                      value: values.funder_account,
                      label: funderAccounts.find(account => account._id === values.funder_account)?.name || ''
                    } : null}
                    onChange={(option) => setFieldValue('funder_account', option?.value || '')}
                    isLoading={funderAccountsLoading}
                    placeholder="Select funder account"
                    className="text-sm text-left"
                    classNamePrefix="select"
                  />
                  <ErrorMessage name="funder_account" component="div" className="text-red-600 text-xs mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                    ISO Account <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={isoAccounts.map(account => ({ value: account._id, label: account.name }))}
                    value={isoAccounts.find(account => account._id === values.iso_account) ? {
                      value: values.iso_account,
                      label: isoAccounts.find(account => account._id === values.iso_account)?.name || ''
                    } : null}
                    onChange={(option) => setFieldValue('iso_account', option?.value || '')}
                    isLoading={isoAccountsLoading}
                    placeholder="Select ISO account"
                    className="text-sm text-left"
                    classNamePrefix="select"
                  />
                  <ErrorMessage name="iso_account" component="div" className="text-red-600 text-xs mt-1" />
                </div>
              </div>
            </div>

            {/* Payment & Status Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Payment & Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                    Payment Method
                  </label>
                  <Select
                    options={paymentMethods}
                    value={paymentMethods.find(method => method.value === values.payment_method)}
                    onChange={(option) => setFieldValue('payment_method', option?.value || null)}
                    placeholder="Select payment method"
                    className="text-sm text-left"
                    classNamePrefix="select"
                    isClearable
                  />
                  <ErrorMessage name="payment_method" component="div" className="text-red-600 text-xs mt-1" />
                </div>
                {values.payment_method === 'ACH' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                      ACH Processor
                    </label>
                    <Select
                      options={achProcessors}
                      value={achProcessors.find(processor => processor.value === values.ach_processor)}
                      onChange={(option) => setFieldValue('ach_processor', option?.value || null)}
                      placeholder="Select ACH processor"
                      className="text-sm text-left"
                      classNamePrefix="select"
                      isClearable
                    />
                    <ErrorMessage name="ach_processor" component="div" className="text-red-600 text-xs mt-1" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                    Status
                  </label>
                  <Select
                    options={statusOptions}
                    value={statusOptions.find(status => status.value === values.status)}
                    onChange={(option) => setFieldValue('status', option?.value)}
                    placeholder="Select status"
                    className="text-sm text-left"
                    classNamePrefix="select"
                  />
                  <ErrorMessage name="status" component="div" className="text-red-600 text-xs mt-1" />
                </div>
              </div>
            </div>

            {/* Note Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Additional Information</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Note
                </label>
                <Field
                  name="note"
                  as="textarea"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Optional notes about this commission intent"
                />
                <ErrorMessage name="note" component="div" className="text-red-600 text-xs mt-1" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting || !funding?.iso}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
} 