import React from 'react';
import { createDisbursement } from '@/lib/api/disbursements';
import type { CreateDisbursementParams } from '@/lib/api/disbursements';
import { DisbursementIntent } from '@/lib/api/disbursementIntents';
import { useFunderAccountsByFunderId } from '@/hooks/useFunderAccountsByFunderId';
import { useMerchantAccountsByMerchantId } from '@/hooks/useMerchantAccountsByMerchantId';
import Select from 'react-select';
import { format } from 'date-fns';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

interface CreateDisbursementProps {
  disbursementIntent: DisbursementIntent;
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

const statuses = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SUCCEED', label: 'Succeed' },
  { value: 'FAILED', label: 'Failed' },
];

const validationSchema = Yup.object().shape({
  funder_account: Yup.string().required('Funder account is required'),
  merchant_account: Yup.string().required('Merchant account is required'),
  payment_method: Yup.string().required('Payment method is required'),
  ach_processor: Yup.string().when('payment_method', (val, schema) =>
    typeof val === 'string' && val === 'ACH'
      ? schema.required('ACH processor is required')
      : schema.notRequired()
  ),
  amount: Yup.number().min(1, 'Amount must be greater than 0').required('Amount is required'),
  submitted_date: Yup.string().required('Submitted date is required'),
  responsed_date: Yup.string().notRequired(),
  status: Yup.string().required('Status is required'),
  reconciled: Yup.boolean(),
});

export default function CreateDisbursement({ disbursementIntent, onSuccess, onCancel }: CreateDisbursementProps) {
  const { accounts: merchantAccounts, loading: merchantAccountsLoading } = useMerchantAccountsByMerchantId(
    disbursementIntent.merchant.id
  );
  const { accounts: funderAccounts, loading: funderAccountsLoading } = useFunderAccountsByFunderId(
    disbursementIntent.funder.id
  );

  return (
    <Formik
      initialValues={{
        funder_account: disbursementIntent.funder_account._id,
        merchant_account: disbursementIntent.merchant_account._id,
        payment_method: 'ACH',
        ach_processor: 'ACHWorks',
        amount: 0,
        submitted_date: format(new Date(), 'yyyy-MM-dd'),
        responsed_date: '',
        status: 'SUBMITTED',
        reconciled: false,
      }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting, setStatus }) => {
        try {
          const disbursementData: CreateDisbursementParams = {
            funder_account: values.funder_account,
            merchant_account: values.merchant_account,
            payment_method: values.payment_method as any,
            ach_processor: values.ach_processor as any,
            amount: values.amount,
            submitted_date: values.submitted_date,
            status: values.status as any,
            reconciled: values.reconciled,
            ...(values.responsed_date && { responsed_date: values.responsed_date }),
          };
          await createDisbursement(disbursementIntent._id, disbursementData);
          onSuccess();
        } catch (err: any) {
          setStatus(err.message || 'Failed to create disbursement');
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
            {/* Account Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Accounts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                    Funder Account <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={funderAccounts.map(a => ({ value: a._id, label: a.name }))}
                    value={funderAccounts.find(a => a._id === values.funder_account) ? { value: values.funder_account, label: funderAccounts.find(a => a._id === values.funder_account)?.name || '' } : null}
                    onChange={opt => setFieldValue('funder_account', opt?.value || '')}
                    isLoading={funderAccountsLoading}
                    placeholder="Select funder account"
                    className="text-sm text-left"
                    classNamePrefix="select"
                  />
                  <ErrorMessage name="funder_account" component="div" className="text-red-600 text-xs mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                    Merchant Account <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={merchantAccounts.map(a => ({ value: a._id, label: a.name }))}
                    value={merchantAccounts.find(a => a._id === values.merchant_account) ? { value: values.merchant_account, label: merchantAccounts.find(a => a._id === values.merchant_account)?.name || '' } : null}
                    onChange={opt => setFieldValue('merchant_account', opt?.value || '')}
                    isLoading={merchantAccountsLoading}
                    placeholder="Select merchant account"
                    className="text-sm text-left"
                    classNamePrefix="select"
                  />
                  <ErrorMessage name="merchant_account" component="div" className="text-red-600 text-xs mt-1" />
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <Field
                    name="amount"
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
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
                    placeholder="Optional"
                  />
                  <ErrorMessage name="responsed_date" component="div" className="text-red-600 text-xs mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                    Reconciled
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={values.reconciled}
                      onChange={e => setFieldValue('reconciled', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Mark as reconciled</span>
                  </div>
                  <ErrorMessage name="reconciled" component="div" className="text-red-600 text-xs mt-1" />
                </div>
              </div>
            </div>

            {/* Payment and Status Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Payment & Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={paymentMethods}
                    value={paymentMethods.find(m => m.value === values.payment_method)}
                    onChange={opt => setFieldValue('payment_method', opt?.value)}
                    placeholder="Select payment method"
                    className="text-sm text-left"
                    classNamePrefix="select"
                  />
                  <ErrorMessage name="payment_method" component="div" className="text-red-600 text-xs mt-1" />
                </div>
                {values.payment_method === 'ACH' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                      ACH Processor <span className="text-red-500">*</span>
                    </label>
                    <Select
                      options={achProcessors}
                      value={achProcessors.find(p => p.value === values.ach_processor)}
                      onChange={opt => setFieldValue('ach_processor', opt?.value)}
                      placeholder="Select ACH processor"
                      className="text-sm text-left"
                      classNamePrefix="select"
                    />
                    <ErrorMessage name="ach_processor" component="div" className="text-red-600 text-xs mt-1" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={statuses}
                    value={statuses.find(s => s.value === values.status)}
                    onChange={opt => setFieldValue('status', opt?.value)}
                  />
                  <ErrorMessage name="status" component="div" className="text-red-600 text-xs mt-1" />
                </div>
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
              {isSubmitting ? 'Creating...' : 'Create Disbursement'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
} 