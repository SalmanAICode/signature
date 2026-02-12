import React, { useState, useEffect } from 'react';
import { createPayback } from '@/lib/api/paybacks';
import { getFundingById } from '@/lib/api/fundings';
import { useFunderAccountsByFunderId } from '@/hooks/useFunderAccountsByFunderId';
import { useMerchantAccountsByMerchantId } from '@/hooks/useMerchantAccountsByMerchantId';
import { usePaybackPlansByFundingId } from '@/hooks/usePaybackPlansByFundingId';
import { Funding } from '@/types/funding';
import Select from 'react-select';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

interface CreatePaybackProps {
  fundingId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const paymentMethods = [
  { value: 'ACH', label: 'ACH' },
  { value: 'CHECK', label: 'Check' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'WIRE', label: 'Wire Transfer' },
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
  { value: 'BOUNCED', label: 'Bounced' },
  { value: 'SUCCEED', label: 'Succeed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'DISPUTED', label: 'Disputed' },
];

const validationSchema = Yup.object().shape({
  merchant_account: Yup.string().required('Merchant account is required'),
  funder_account: Yup.string().required('Funder account is required'),
  funded_amount: Yup.number().min(0, 'Funded amount must be 0 or greater').required('Funded amount is required'),
  fee_amount: Yup.number().min(0, 'Fee amount must be 0 or greater').required('Fee amount is required'),
  payment_method: Yup.string().required('Payment method is required'),
  ach_processor: Yup.string().when('payment_method', {
    is: (val: string) => val === 'ACH',
    then: schema => schema.required('ACH processor is required'),
    otherwise: schema => schema.notRequired(),
  }),
  status: Yup.string().required('Status is required'),
  payback_plan: Yup.string(),
  due_date: Yup.string(),
  note: Yup.string(),
  reconciled: Yup.boolean(),
});

export default function CreatePayback({ fundingId, onSuccess, onCancel }: CreatePaybackProps) {
  const [funding, setFunding] = useState<Funding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getFundingById(fundingId)
      .then((res) => {
        setFunding(res.data);
      })
      .catch((err) => {
        setError('Failed to load funding details');
      })
      .finally(() => setLoading(false));
  }, [fundingId]);

  const { accounts: merchantAccounts, loading: merchantAccountsLoading } = useMerchantAccountsByMerchantId(
    funding?.merchant
      ? typeof funding.merchant === 'string'
        ? funding.merchant
        : (funding.merchant as any)._id || (funding.merchant as any).id
      : undefined
  );
  const { accounts: funderAccounts, loading: funderAccountsLoading } = useFunderAccountsByFunderId(
    funding?.funder
      ? typeof funding.funder === 'string'
        ? funding.funder
        : (funding.funder as any)._id || (funding.funder as any).id
      : undefined
  );
  const { paybackPlans, loading: paybackPlansLoading } = usePaybackPlansByFundingId(fundingId);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Formik
      initialValues={{
        merchant_account: '',
        funder_account: '',
        funded_amount: 0,
        fee_amount: 0,
        payment_method: 'ACH',
        ach_processor: 'ACHWorks',
        status: 'SUBMITTED',
        payback_plan: '',
        due_date: '',
        note: '',
        reconciled: false,
      }}
      validationSchema={validationSchema}
      validateOnMount={false}
      validateOnChange={true}
      validateOnBlur={true}
      onSubmit={async (values, { setSubmitting, setStatus, setErrors }) => {
        try {
          await createPayback({
            ...values,
            funding: fundingId,
            payback_amount: values.funded_amount + values.fee_amount,
            payment_method: values.payment_method as 'ACH' | 'CHECK' | 'CREDIT_CARD' | 'WIRE' | 'OTHER',
            ach_processor: values.ach_processor as 'ACHWorks' | 'Actum' | 'Manual' | 'Other' | string,
            status: values.status as 'SUBMITTED' | 'PROCESSING' | 'BOUNCED' | 'SUCCEED' | 'FAILED' | 'DISPUTED',
          });
          onSuccess();
        } catch (err: any) {
          setStatus(err.message || 'Failed to create payback');
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

          {/* Basic Information Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Basic Information</h3>
            
            {/* Amount Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 items-start mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Funded Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <Field
                    type="number"
                    name="funded_amount"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                {touched.funded_amount && errors.funded_amount && (
                  <div className="text-xs text-red-600 mt-1">{errors.funded_amount}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Fee Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <Field
                    type="number"
                    name="fee_amount"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                {touched.fee_amount && errors.fee_amount && (
                  <div className="text-xs text-red-600 mt-1">{errors.fee_amount}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Payback Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <Field
                    type="number"
                    name="payback_amount"
                    value={values.funded_amount + values.fee_amount}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Accounts Section */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Accounts</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start mb-6">
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
            </div>
          </div>

          {/* Payment Details Section */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Payment Details</h3>
            
            {/* Payment Method and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <Select
                  options={paymentMethods}
                  value={paymentMethods.find(method => method.value === values.payment_method)}
                  onChange={option => setFieldValue('payment_method', option?.value)}
                  onBlur={() => setFieldValue('payment_method', values.payment_method)}
                  placeholder="Select payment method"
                  className="text-sm text-left"
                  classNamePrefix="select"
                />
                {touched.payment_method && errors.payment_method && (
                  <div className="text-xs text-red-600 mt-1">{errors.payment_method}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Status <span className="text-red-500">*</span>
                </label>
                <Select
                  options={statuses}
                  value={statuses.find(status => status.value === values.status)}
                  onChange={option => setFieldValue('status', option?.value)}
                  onBlur={() => setFieldValue('status', values.status)}
                  placeholder="Select status"
                  className="text-sm text-left"
                  classNamePrefix="select"
                />
                {touched.status && errors.status && (
                  <div className="text-xs text-red-600 mt-1">{errors.status}</div>
                )}
              </div>
            </div>

            {/* ACH Processor (conditional) */}
            {values.payment_method === 'ACH' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  ACH Processor <span className="text-red-500">*</span>
                </label>
                <Select
                  options={achProcessors}
                  value={achProcessors.find(processor => processor.value === values.ach_processor)}
                  onChange={option => setFieldValue('ach_processor', option?.value)}
                  onBlur={() => setFieldValue('ach_processor', values.ach_processor)}
                  placeholder="Select ACH processor"
                  className="text-sm text-left"
                  classNamePrefix="select"
                />
                {touched.ach_processor && errors.ach_processor && (
                  <div className="text-xs text-red-600 mt-1">{errors.ach_processor}</div>
                )}
              </div>
            )}
          </div>

          {/* Additional Information Section */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Additional Information</h3>
            
            {/* Payback Plan */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                Payback Plan
              </label>
              <Select
                options={[
                  { value: '', label: 'No payback plan' },
                  ...paybackPlans.map((plan: any) => ({
                    value: plan._id,
                    label: `${plan.frequency} - $${plan.total_amount} - ${plan.start_date} to ${plan.end_date || 'Ongoing'}`
                  }))
                ]}
                value={values.payback_plan ? {
                  value: values.payback_plan,
                  label: (() => {
                    const plan = paybackPlans.find((p: any) => p._id === values.payback_plan);
                    return plan ? `${plan.frequency} - $${plan.total_amount} - ${plan.start_date} to ${plan.end_date || 'Ongoing'}` : 'Plan';
                  })()
                } : { value: '', label: 'No payback plan' }}
                onChange={option => setFieldValue('payback_plan', option?.value || '')}
                onBlur={() => setFieldValue('payback_plan', values.payback_plan)}
                isLoading={paybackPlansLoading}
                placeholder="Select payback plan (optional)"
                className="text-sm text-left"
                classNamePrefix="select"
                isClearable={true}
              />
              {touched.payback_plan && errors.payback_plan && (
                <div className="text-xs text-red-600 mt-1">{errors.payback_plan}</div>
              )}
            </div>

            {/* Due Date */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                Due Date
              </label>
              <Field
                type="date"
                name="due_date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
              />
              {touched.due_date && errors.due_date && (
                <div className="text-xs text-red-600 mt-1">{errors.due_date}</div>
              )}
            </div>

            {/* Note and Reconciled */}
            <div className="grid grid-cols-1 gap-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Note
                </label>
                <Field
                  as="textarea"
                  name="note"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                  placeholder="Enter any additional notes"
                />
                {touched.note && errors.note && (
                  <div className="text-xs text-red-600 mt-1">{errors.note}</div>
                )}
              </div>
              <div className="flex items-center">
                <Field
                  type="checkbox"
                  name="reconciled"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Reconciled
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
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
                // Validate all fields when save button is clicked
                const validationErrors = await validateForm();
                if (Object.keys(validationErrors).length > 0) {
                  // Mark all fields as touched to show errors
                  Object.keys(validationErrors).forEach(fieldName => {
                    setFieldValue(fieldName, values[fieldName as keyof typeof values], true);
                  });
                }
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
} 