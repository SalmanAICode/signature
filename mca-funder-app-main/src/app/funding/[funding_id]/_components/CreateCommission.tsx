import React from 'react';
import { createCommission } from '@/lib/api/commissions';
import type { CreateCommissionParams } from '@/types/commission';
import { CommissionIntent } from '@/types/commissionIntent';
import { useFunderAccounts } from '@/hooks/useFunderAccounts';
import { useISOAccounts } from '@/hooks/useISOAccounts';
import Select from 'react-select';
import { format } from 'date-fns';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

interface CreateCommissionProps {
  commissionIntent: CommissionIntent;
  onSuccess: () => void;
  onCancel: () => void;
}

type CreateCommissionRequestBody = Omit<CreateCommissionParams, 'commission_intent'>;

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
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SUCCEED', label: 'Succeeded' },
  { value: 'FAILED', label: 'Failed' },
];

const validationSchema = Yup.object().shape({
  funder_account: Yup.string().required('Funder account is required'),
  iso_account: Yup.string().required('ISO account is required'),
  amount: Yup.number().min(1, 'Amount must be greater than 0').required('Amount is required'),
  submitted_date: Yup.string().required('Submitted date is required'),
  responsed_date: Yup.string().nullable(),
  payment_method: Yup.string().nullable(),
  ach_processor: Yup.string().when('payment_method', (val, schema) =>
    typeof val === 'string' && val === 'ACH'
      ? schema.nullable()
      : schema.nullable()
  ),
  status: Yup.string().required('Status is required'),
  reconciled: Yup.boolean().nullable(),
});

export default function CreateCommission({ commissionIntent, onSuccess, onCancel }: CreateCommissionProps) {
  const { accounts: isoAccounts, loading: isoAccountsLoading } = useISOAccounts();
  const { accounts: funderAccounts, loading: funderAccountsLoading } = useFunderAccounts();

  return (
    <Formik
      initialValues={{
        funder_account: (commissionIntent.funder_account as any)?._id || '',
        iso_account: (commissionIntent.iso_account as any)?._id || '',
        amount: 0,
        submitted_date: format(new Date(), 'yyyy-MM-dd'),
        responsed_date: '',
        payment_method: 'ACH' as 'ACH' | 'WIRE' | 'CHECK' | 'OTHER',
        ach_processor: 'ACHWorks' as 'ACHWorks' | 'Actum' | 'Manual' | 'Other',
        status: 'SUBMITTED',
        reconciled: false,
      }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting, setStatus }) => {
        try {
          const commissionData: CreateCommissionRequestBody = {
            funder_account: values.funder_account,
            iso_account: values.iso_account,
            amount: values.amount,
            submitted_date: values.submitted_date,
            responsed_date: values.responsed_date || undefined,
            payment_method: values.payment_method || 'ACH',
            ach_processor: values.payment_method === 'ACH' ? values.ach_processor : 'ACHWorks',
            status: values.status as 'SUBMITTED' | 'PROCESSING' | 'SUCCEED' | 'FAILED',
            reconciled: values.reconciled,
          };
          await createCommission(commissionIntent._id, commissionData);
          onSuccess();
        } catch (err: any) {
          setStatus(err.message || 'Failed to create commission');
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

          <div className="space-y-6">
            {/* Commission Details Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Commission Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                    Submitted Date <span className="text-red-500">*</span>
                  </label>
                  <Field
                    name="submitted_date"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <ErrorMessage name="submitted_date" component="div" className="text-red-600 text-xs mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                    Response Date
                  </label>
                  <Field
                    name="responsed_date"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <ErrorMessage name="responsed_date" component="div" className="text-red-600 text-xs mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                    Status <span className="text-red-500">*</span>
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

            {/* Payment Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Payment Information</h3>
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
              </div>
            </div>

            {/* Additional Information Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Additional Information</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Reconciled
                </label>
                <div className="flex items-center">
                  <Field
                    name="reconciled"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Mark as reconciled</label>
                </div>
                <ErrorMessage name="reconciled" component="div" className="text-red-600 text-xs mt-1" />
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
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
} 