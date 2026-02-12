import React, { useState, useEffect } from 'react';
import { updatePayback } from '@/lib/api/paybacks';
import { Payback } from '@/types/payback';
import { getFundingById } from '@/lib/api/fundings';
import { useFunderAccountsByFunderId } from '@/hooks/useFunderAccountsByFunderId';
import { useMerchantAccountsByMerchantId } from '@/hooks/useMerchantAccountsByMerchantId';
import { Funding } from '@/types/funding';
import Select from 'react-select';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { usePaybackPlansByFundingId } from '@/hooks/usePaybackPlansByFundingId';

interface EditPaybackProps {
  payback: Payback;
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

export default function EditPayback({ payback, onSuccess, onCancel }: EditPaybackProps) {
  const [funding, setFunding] = useState<Funding | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (payback) {
      const fundingId = typeof payback.funding === 'string' ? payback.funding : payback.funding._id;
      getFundingById(fundingId)
        .then((res) => {
          setFunding(res.data);
        })
        .catch((err) => {
          setError('Failed to load funding details');
        });
    }
  }, [payback]);

  // After funding is loaded, extract IDs
  const merchantId = funding?.merchant
    ? typeof funding.merchant === 'string'
      ? funding.merchant
      : (funding.merchant as any)._id || (funding.merchant as any).id
    : undefined;

  const funderId = funding?.funder
    ? typeof funding.funder === 'string'
      ? funding.funder
      : (funding.funder as any)._id || (funding.funder as any).id
    : undefined;

  // Only call hooks when IDs are available
  const { accounts: merchantAccounts, loading: merchantAccountsLoading } = useMerchantAccountsByMerchantId(merchantId);
  const { accounts: funderAccounts, loading: funderAccountsLoading } = useFunderAccountsByFunderId(funderId);
  const fundingId = typeof payback.funding === 'string' ? payback.funding : payback.funding._id;
  const { paybackPlans, loading: paybackPlansLoading } = usePaybackPlansByFundingId(fundingId);

  // Debug logging for accounts
  console.log('Merchant accounts loaded:', merchantAccounts);
  console.log('Funder accounts loaded:', funderAccounts);
  console.log('Funding merchant ID:', funding?.merchant);
  console.log('Funding funder ID:', funding?.funder);

  const initialValues = {
    merchant_account: (() => {
      // Try to find the merchant account by _id first
      if ((payback.merchant_account as any)?._id) {
        return (payback.merchant_account as any)._id;
      }
      // If no _id, try to find by name
      if (payback.merchant_account?.name && merchantAccounts.length > 0) {
        const matchingAccount = merchantAccounts.find(acc => acc.name === payback.merchant_account.name);
        return matchingAccount?._id || '';
      }
      return '';
    })(),
    funder_account: (() => {
      // Try to find the funder account by _id first
      if ((payback.funder_account as any)?._id) {
        return (payback.funder_account as any)._id;
      }
      // If no _id, try to find by name
      if (payback.funder_account?.name && funderAccounts.length > 0) {
        const matchingAccount = funderAccounts.find(acc => acc.name === payback.funder_account.name);
        return matchingAccount?._id || '';
      }
      return '';
    })(),
    funded_amount: payback.funded_amount || 0,
    fee_amount: payback.fee_amount || 0,
    payment_method: payback.payment_method || 'ACH',
    ach_processor: payback.ach_processor || 'ACHWorks',
    status: payback.status || 'SUBMITTED',
    payback_plan: payback.payback_plan ? (typeof payback.payback_plan === 'string' ? payback.payback_plan : (payback.payback_plan as any)._id) : '',
    due_date: payback.due_date ? new Date(payback.due_date).toISOString().split('T')[0] : '',
    note: payback.note || '',
    reconciled: payback.reconciled || false,
  };

  // Debug logging to see the payback structure
  console.log('Payback data:', payback);
  console.log('Merchant account:', payback.merchant_account);
  console.log('Funder account:', payback.funder_account);
  console.log('Initial values:', initialValues);

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
      initialValues={initialValues}
      enableReinitialize={true}
      validationSchema={validationSchema}
      validateOnMount={false}
      validateOnChange={true}
      validateOnBlur={true}
      onSubmit={async (values, { setSubmitting, setStatus, setErrors }) => {
        try {
          const updateData: Record<string, any> = {};

          if (values.due_date) updateData.due_date = values.due_date;
          if ('submitted_date' in values && values.submitted_date) updateData.submitted_date = values.submitted_date;
          if ('processed_date' in values && values.processed_date) updateData.processed_date = values.processed_date;
          if ('responsed_date' in values && values.responsed_date) updateData.responsed_date = values.responsed_date;
          if ('response' in values && values.response) updateData.response = values.response;
          if ('payback_amount' in values && values.payback_amount) updateData.payback_amount = values.payback_amount;
          if (values.funded_amount) updateData.funded_amount = values.funded_amount;
          if (values.fee_amount) updateData.fee_amount = values.fee_amount;
          if (values.payment_method) updateData.payment_method = values.payment_method;
          if (values.ach_processor) updateData.ach_processor = values.ach_processor;
          if (values.status) updateData.status = values.status;
          if (values.note) updateData.note = values.note;
          if (typeof values.reconciled === 'boolean') updateData.reconciled = values.reconciled;

          await updatePayback(payback._id, updateData);
          onSuccess();
        } catch (err: any) {
          setStatus(err.message || 'Failed to update payback');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, setTouched, isSubmitting, status, validateForm }) => (
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
                {merchantAccounts.length > 0 ? (
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
                ) : (
                  <input
                    type="text"
                    value={payback.merchant_account?.name || 'Unknown account'}
                    className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                    disabled
                  />
                )}
                {touched.merchant_account && errors.merchant_account && (
                  <div className="text-xs text-red-600 mt-1">{typeof errors.merchant_account === 'string' ? errors.merchant_account : ''}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Funder Account <span className="text-red-500">*</span>
                </label>
                {funderAccounts.length > 0 ? (
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
                ) : (
                  <input
                    type="text"
                    value={payback.funder_account?.name || 'Unknown account'}
                    className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                    disabled
                  />
                )}
                {touched.funder_account && errors.funder_account && (
                  <div className="text-xs text-red-600 mt-1">{typeof errors.funder_account === 'string' ? errors.funder_account : ''}</div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Details Section */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Payment Details</h3>
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
                <div className="text-xs text-red-600 mt-1">{typeof errors.payback_plan === 'string' ? errors.payback_plan : ''}</div>
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
              onClick={() => {
                console.log('Save button clicked');
                console.log('Form values:', values);
                console.log('Form errors:', errors);
                console.log('Form touched:', touched);
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