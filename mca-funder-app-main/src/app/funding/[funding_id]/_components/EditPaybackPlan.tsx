import React, { useState, useEffect } from 'react';
import { updatePaybackPlan } from '@/lib/api/paybackPlans';
import { PaybackPlan, PaybackPlanCreatePayload } from '@/types/paybackPlan';
import { getFundingById } from '@/lib/api/fundings';
import { useFunderAccountsByFunderId } from '@/hooks/useFunderAccountsByFunderId';
import { useMerchantAccountsByMerchantId } from '@/hooks/useMerchantAccountsByMerchantId';
import { Funding } from '@/types/funding';
import Select from 'react-select';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

interface EditPaybackPlanProps {
  paybackPlan: PaybackPlan;
  onSuccess: () => void;
  onCancel: () => void;
}

const paymentMethods = [
  { value: 'ACH', label: 'ACH' },
  { value: 'WIRE', label: 'Wire Transfer' },
  { value: 'CHECK', label: 'Check' },
  { value: 'Credit Card', label: 'Credit Card' },
  { value: 'Other', label: 'Other' },
];

const achProcessors = [
  { value: 'ACHWorks', label: 'ACHWorks' },
  { value: 'Actum', label: 'Actum' },
  { value: 'Manual', label: 'Manual' },
  { value: 'Other', label: 'Other' },
];

const frequencies = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

const statuses = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'STOPPED', label: 'Stopped' },
  { value: 'COMPLETED', label: 'Completed' },
];

const daysOfWeek = [
  { value: 1, label: 'Sunday' },
  { value: 2, label: 'Monday' },
  { value: 3, label: 'Tuesday' },
  { value: 4, label: 'Wednesday' },
  { value: 5, label: 'Thursday' },
  { value: 6, label: 'Friday' },
  { value: 7, label: 'Saturday' },
];

const daysOfMonth = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `${i + 1}` }));

const validationSchema = Yup.object().shape({
  merchant_account: Yup.string().required('Merchant account is required'),
  funder_account: Yup.string().required('Funder account is required'),
  payment_method: Yup.string().required('Payment method is required'),
  ach_processor: Yup.string().when('payment_method', {
    is: (val: string) => val === 'ACH',
    then: schema => schema.required('ACH processor is required'),
    otherwise: schema => schema.notRequired(),
  }),
  total_amount: Yup.number().min(1, 'Total amount must be greater than 0').required('Total amount is required'),
  payback_count: Yup.number().min(1, 'Payback count must be at least 1').required('Payback count is required'),
  start_date: Yup.string().required('Start date is required'),
  frequency: Yup.string().required('Frequency is required'),
  payday_list: Yup.array().min(1, 'Select at least one payday').required('Payday list is required'),
  status: Yup.string().required('Status is required'),
});

export default function EditPaybackPlan({ paybackPlan, onSuccess, onCancel }: EditPaybackPlanProps) {
  const [funding, setFunding] = useState<Funding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paybackPlan) {
      const fundingId = typeof paybackPlan.funding === 'string' ? paybackPlan.funding : paybackPlan.funding._id;
      setLoading(true);
      getFundingById(fundingId)
        .then((res) => {
          setFunding(res.data);
        })
        .catch((err) => {
          setError('Failed to load funding details');
        })
        .finally(() => setLoading(false));
    }
  }, [paybackPlan]);

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

  const initialValues = {
    merchant_account: typeof paybackPlan.merchant_account === 'string' ? paybackPlan.merchant_account : paybackPlan.merchant_account._id,
    funder_account: typeof paybackPlan.funder_account === 'string' ? paybackPlan.funder_account : paybackPlan.funder_account._id,
    payment_method: paybackPlan.payment_method,
    ach_processor: paybackPlan.ach_processor || 'ACHWorks',
    total_amount: paybackPlan.total_amount,
    payback_count: paybackPlan.payback_count,
    start_date: new Date(paybackPlan.start_date).toISOString().split('T')[0],
    frequency: paybackPlan.frequency.toUpperCase() as 'DAILY' | 'WEEKLY' | 'MONTHLY',
    payday_list: (paybackPlan.payday_list || []) as number[],
    note: paybackPlan.note || '',
    status: paybackPlan.status,
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      validateOnMount={false}
      validateOnChange={true}
      validateOnBlur={true}
      onSubmit={async (values, { setSubmitting, setStatus, setErrors }) => {
        try {
          await updatePaybackPlan(paybackPlan._id, {
            ...values,
            payment_method: values.payment_method as 'ACH' | 'WIRE' | 'CHECK' | 'Credit Card' | 'Other',
            ach_processor: values.ach_processor as 'ACHWorks' | 'Actum' | 'Manual' | 'Other' | string,
            frequency: values.frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'Daily' | 'Weekly' | 'Monthly',
            status: values.status as 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'COMPLETED',
          });
          onSuccess();
        } catch (err: any) {
          setStatus(err.message || 'Failed to update payback plan');
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

          {/* Accounts Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Accounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
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

          {/* Payment Info Section */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Payment Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
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
              {values.payment_method === 'ACH' && (
                <div>
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
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Total Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Field
                    type="number"
                    name="total_amount"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                {touched.total_amount && errors.total_amount && (
                  <div className="text-xs text-red-600 mt-1">{errors.total_amount}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Payback Count <span className="text-red-500">*</span>
                </label>
                <Field
                  type="number"
                  name="payback_count"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                  placeholder="Enter number of paybacks"
                  min="1"
                />
                {touched.payback_count && errors.payback_count && (
                  <div className="text-xs text-red-600 mt-1">{errors.payback_count}</div>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <Field
                  type="date"
                  name="start_date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                />
                {touched.start_date && errors.start_date && (
                  <div className="text-xs text-red-600 mt-1">{errors.start_date}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <Select
                  options={frequencies}
                  value={frequencies.find(freq => freq.value === values.frequency)}
                  onChange={option => setFieldValue('frequency', option?.value)}
                  onBlur={() => setFieldValue('frequency', values.frequency)}
                  placeholder="Select frequency"
                  className="text-sm text-left"
                  classNamePrefix="select"
                />
                {touched.frequency && errors.frequency && (
                  <div className="text-xs text-red-600 mt-1">{errors.frequency}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Payday List <span className="text-red-500">*</span>
                </label>
                <Select
                  isMulti={values.frequency !== 'WEEKLY'}
                  options={values.frequency === 'MONTHLY' ? daysOfMonth : daysOfWeek}
                  value={(values.frequency === 'MONTHLY' ? daysOfMonth : daysOfWeek).filter(opt => values.payday_list.includes(opt.value))}
                  onChange={option => {
                    if (!option) {
                      setFieldValue('payday_list', []);
                    } else if (values.frequency === 'WEEKLY') {
                      if (!Array.isArray(option) && typeof option === 'object' && option !== null && 'value' in option) {
                        setFieldValue('payday_list', [option.value]);
                      }
                    } else {
                      setFieldValue('payday_list', Array.isArray(option) ? option.map(o => (typeof o === 'object' && o !== null && 'value' in o ? o.value : null)).filter(v => v !== null) : []);
                    }
                  }}
                  onBlur={() => setFieldValue('payday_list', values.payday_list)}
                  placeholder="Select days"
                  className="text-sm text-left"
                  classNamePrefix="select"
                />
                {touched.payday_list && errors.payday_list && (
                  <div className="text-xs text-red-600 mt-1">{errors.payday_list}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">Select days of the week</div>
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
          </div>

          {/* Note Section */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Note</label>
            <Field
              as="textarea"
              name="note"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
              placeholder="Enter any notes (optional)"
              rows={2}
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
} 