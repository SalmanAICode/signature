import React, { useState, useEffect } from 'react';
import { updateDisbursementIntent } from '@/lib/api/disbursementIntents';
import type { UpdateDisbursementIntent, DisbursementIntent } from '@/lib/api/disbursementIntents';
import { getFundingById } from '@/lib/api/fundings';
import { useFunderAccountsByFunderId } from '@/hooks/useFunderAccountsByFunderId';
import { useMerchantAccountsByMerchantId } from '@/hooks/useMerchantAccountsByMerchantId';
import { Funding } from '@/types/funding';
import Select from 'react-select';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';

interface UpdateDisbursementIntentProps {
  disbursementIntent: DisbursementIntent;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  disbursement_date: string;
  amount: number;
  payment_method?: 'WIRE' | 'ACH' | 'CHECK' | 'OTHER';
  ach_processor?: 'ACHWorks' | 'Actum' | 'Manual' | 'Other';
  funder_account: string;
  merchant_account: string;
  note?: string;
  status: 'SCHEDULED' | 'SUBMITTED' | 'SUCCEED' | 'FAILED' | 'CANCELLED';
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
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'SUCCEED', label: 'Succeed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const validationSchema = Yup.object().shape({
  funder_account: Yup.string().required('Funder account is required'),
  merchant_account: Yup.string().required('Merchant account is required'),
  payment_method: Yup.string().notRequired(),
  ach_processor: Yup.string().when('payment_method', {
    is: (val: string) => val === 'ACH',
    then: schema => schema.required('ACH processor is required'),
    otherwise: schema => schema.notRequired(),
  }),
  amount: Yup.number().min(0.01, 'Amount must be greater than 0').required('Amount is required'),
  disbursement_date: Yup.string().required('Disbursement date is required'),
  status: Yup.string().required('Status is required'),
});

export default function UpdateDisbursementIntent({ disbursementIntent, onSuccess, onCancel }: UpdateDisbursementIntentProps) {
  const [funding, setFunding] = useState<Funding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (disbursementIntent.funding) {
      setLoading(true);
      getFundingById(disbursementIntent.funding._id)
        .then((res) => {
          setFunding(res.data);
        })
        .catch((err) => {
          setError('Failed to load funding details');
        })
        .finally(() => setLoading(false));
    }
  }, [disbursementIntent.funding]);

  const { accounts: merchantAccounts, loading: merchantAccountsLoading } = useMerchantAccountsByMerchantId(
    disbursementIntent.merchant.id
  );
  const { accounts: funderAccounts, loading: funderAccountsLoading } = useFunderAccountsByFunderId(
    disbursementIntent.funder.id
  );

  return (
    <Formik
      initialValues={{
        disbursement_date: format(new Date(disbursementIntent.disbursement_date), 'yyyy-MM-dd'),
        amount: disbursementIntent.amount / 100, // Convert from cents to dollars
        payment_method: disbursementIntent.payment_method || undefined,
        ach_processor: disbursementIntent.ach_processor || 'ACHWorks',
        funder_account: disbursementIntent.funder_account._id,
        merchant_account: disbursementIntent.merchant_account._id,
        note: disbursementIntent.note || '',
        status: disbursementIntent.status || 'SCHEDULED',
      }}
      validationSchema={validationSchema}
      validateOnMount={false}
      validateOnChange={true}
      validateOnBlur={true}
      onSubmit={async (values, { setSubmitting, setStatus }) => {
        try {
          const disbursementIntentData: UpdateDisbursementIntent = {
            disbursement_date: new Date(values.disbursement_date).toISOString(),
            amount: Math.round(values.amount * 100), // Convert to cents
            payment_method: values.payment_method || undefined,
            ach_processor: values.ach_processor as 'ACHWorks' | 'Actum' | 'Manual' | 'Other' | undefined,
            funder_account: values.funder_account,
            merchant_account: values.merchant_account,
            note: values.note,
            status: values.status as 'SCHEDULED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
          };
          await updateDisbursementIntent(disbursementIntent._id, disbursementIntentData);
          onSuccess();
        } catch (err: any) {
          setStatus(err.message || 'Failed to update disbursement intent');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, status, validateForm }) => (
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

          {/* FUNDING INFORMATION Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">FUNDING INFORMATION</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Funding Name</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-700 text-left">
                  {funding?.name || 'Loading...'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Lender (Auto-populated)</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-700 text-left">
                  {funding?.funder 
                    ? typeof funding.funder === 'string' 
                      ? funding.funder 
                      : (funding.funder as any)?.name || 'Unknown Lender'
                    : 'Loading...'}
                </div>
              </div>
            </div>
          </div>

          {/* ACCOUNTS Section */}
          <div>
            <h3 className="mt-8 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">ACCOUNTS</h3>
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
                  onChange={option => setFieldValue('funder_account', option?.value || '')}
                  onBlur={() => setFieldValue('funder_account', values.funder_account)}
                  isLoading={funderAccountsLoading}
                  placeholder="Select funder account"
                  className="text-sm text-left"
                  classNamePrefix="select"
                />
                {touched.funder_account && errors.funder_account && (
                  <div className="text-xs text-red-600 mt-1">{errors.funder_account}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Merchant Account <span className="text-red-500">*</span>
                </label>
                <Select
                  options={merchantAccounts.map(account => ({ value: account._id, label: account.name }))}
                  value={merchantAccounts.find(account => account._id === values.merchant_account) ? {
                    value: values.merchant_account,
                    label: merchantAccounts.find(account => account._id === values.merchant_account)?.name || ''
                  } : null}
                  onChange={option => setFieldValue('merchant_account', option?.value || '')}
                  onBlur={() => setFieldValue('merchant_account', values.merchant_account)}
                  isLoading={merchantAccountsLoading}
                  placeholder="Select merchant account"
                  className="text-sm text-left"
                  classNamePrefix="select"
                />
                {touched.merchant_account && errors.merchant_account && (
                  <div className="text-xs text-red-600 mt-1">{errors.merchant_account}</div>
                )}
              </div>
            </div>
          </div>

          {/* PAYMENT INFO Section */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">PAYMENT INFO</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Payment Method</label>
                <Select
                  options={paymentMethods}
                  value={paymentMethods.find(method => method.value === values.payment_method)}
                  onChange={option => setFieldValue('payment_method', option?.value as 'WIRE' | 'ACH' | 'CHECK' | 'OTHER')}
                  onBlur={() => setFieldValue('payment_method', values.payment_method || undefined)}
                  placeholder="Select payment method"
                  className="text-sm text-left"
                  classNamePrefix="select"
                />
                {touched.payment_method && errors.payment_method && (
                  <div className="text-xs text-red-600 mt-1">{errors.payment_method}</div>
                )}
              </div>
              {values.payment_method === 'ACH' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">ACH Processor <span className="text-red-500">*</span></label>
                  <Select
                    options={achProcessors}
                    value={achProcessors.find(processor => processor.value === values.ach_processor)}
                    onChange={option => setFieldValue('ach_processor', option?.value as 'ACHWorks' | 'Actum' | 'Manual' | 'Other')}
                    onBlur={() => setFieldValue('ach_processor', values.ach_processor as 'ACHWorks' | 'Actum' | 'Manual' | 'Other' | undefined)}
                    placeholder="Select ACH processor"
                    className="text-sm text-left"
                    classNamePrefix="select"
                  />
                  {touched.ach_processor && errors.ach_processor && (
                    <div className="text-xs text-red-600 mt-1">{errors.ach_processor}</div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Amount <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Field
                    type="number"
                    name="amount"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                {touched.amount && errors.amount && (
                  <div className="text-xs text-red-600 mt-1">{errors.amount}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Disbursement Date <span className="text-red-500">*</span></label>
                <Field
                  type="date"
                  name="disbursement_date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                />
                {touched.disbursement_date && errors.disbursement_date && (
                  <div className="text-xs text-red-600 mt-1">{errors.disbursement_date}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Status <span className="text-red-500">*</span></label>
                <Select
                  options={statuses}
                  value={statuses.find(status => status.value === values.status)}
                  onChange={option => setFieldValue('status', option?.value)}
                  onBlur={() => setFieldValue('status', values.status as 'SCHEDULED' | 'SUBMITTED' | 'SUCCEED' | 'FAILED' | 'CANCELLED')}
                  placeholder="Select status"
                  className="text-sm text-left"
                  classNamePrefix="select"
                />
                {touched.status && errors.status && (
                  <div className="text-xs text-red-600 mt-1">{errors.status}</div>
                )}
              </div>
            </div>
          </div>

          {/* Note Section */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Note</label>
            <Field
              as="textarea"
              name="note"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
              placeholder="Enter any notes (optional)"
              rows={4}
            />
            {touched.note && errors.note && (
              <div className="text-xs text-red-600 mt-1">{errors.note}</div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
              disabled={isSubmitting}
              onClick={async (e) => {
                const validationErrors = await validateForm();
                if (Object.keys(validationErrors).length > 0) {
                  Object.keys(validationErrors).forEach(fieldName => {
                    setFieldValue(fieldName, values[fieldName as keyof typeof values], true);
                  });
                }
              }}
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
} 