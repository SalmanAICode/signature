import React, { useState, useEffect } from 'react';
import { createPaybackPlan } from '@/lib/api/paybackPlans';
import { PaybackPlanCreatePayload } from '@/types/paybackPlan';
import { getFundingById } from '@/lib/api/fundings';
import { useFunderAccountsByFunderId } from '@/hooks/useFunderAccountsByFunderId';
import { useMerchantAccountsByMerchantId } from '@/hooks/useMerchantAccountsByMerchantId';
import { Funding } from '@/types/funding';
import Select from 'react-select';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

interface CreatePaybackPlanProps {
  fundingId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  merchant_account: string;
  funder_account: string;
  payment_method: 'ACH' | 'WIRE' | 'CHECK' | 'OTHER';
  ach_processor: 'ACHWorks' | 'Actum' | 'Manual' | 'Other';
  total_amount: number;
  payback_count: number;
  start_date: string;
  end_date?: string;
  next_payback_date?: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  payday_list: number[];
  avoid_holiday: boolean;
  distribution_priority: 'FUND' | 'FEE' | 'BOTH';
  note: string;
  status: string;
}

const paymentMethods = [
  { value: 'ACH' as const, label: 'ACH' },
  { value: 'WIRE' as const, label: 'Wire Transfer' },
  { value: 'CHECK' as const, label: 'Check' },
  { value: 'OTHER' as const, label: 'Other' },
];

const frequencies = [
  { value: 'DAILY' as const, label: 'Daily' },
  { value: 'WEEKLY' as const, label: 'Weekly' },
  { value: 'MONTHLY' as const, label: 'Monthly' },
];

const distributionPriorities = [
  { value: 'FUND' as const, label: 'Fund' },
  { value: 'FEE' as const, label: 'Fee' },
  { value: 'BOTH' as const, label: 'Both' },
];

const statusOptions = [
  { value: 'ACTIVE' as const, label: 'Active' },
  { value: 'INACTIVE' as const, label: 'Inactive' },
  { value: 'PAUSED' as const, label: 'Paused' },
];

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
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

export default function CreatePaybackPlan({ fundingId, onSuccess, onCancel }: CreatePaybackPlanProps) {
  const [funding, setFunding] = useState<Funding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fundingId) {
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

  return (
    <Formik
      initialValues={{
        merchant_account: '',
        funder_account: '',
        payment_method: 'ACH',
        ach_processor: 'ACHWorks',
        total_amount: 0,
        payback_count: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        next_payback_date: '',
        frequency: 'DAILY',
        payday_list: [1, 2, 3, 4, 5],
        avoid_holiday: false,
        distribution_priority: 'FUND',
        note: '',
        status: 'ACTIVE',
      }}
      validationSchema={validationSchema}
      validateOnMount={false}
      validateOnChange={true}
      validateOnBlur={true}
      onSubmit={async (values, { setSubmitting, setStatus, setErrors }) => {
        try {
          await createPaybackPlan({
            ...values,
            funding: fundingId,
            payment_method: values.payment_method as 'ACH' | 'WIRE' | 'CHECK' | 'Credit Card' | 'Other',
            ach_processor: values.ach_processor as 'ACHWorks' | 'Actum' | 'Manual' | 'Other' | string,
            frequency: values.frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'Daily' | 'Weekly' | 'Monthly',
            distribution_priority: values.distribution_priority as 'FUND' | 'FEE' | 'BOTH',
            status: values.status as 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'COMPLETED',
          });
          onSuccess();
        } catch (err: any) {
          setStatus(err.message || 'Failed to create payback plan');
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

          <div className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100 flex flex-col gap-4 w-full max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-[#1A2341]">Payback Plan #1</h3>
            </div>

            {/* Accounts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Merchant Account</label>
                <Select
                  name="merchant_account"
                  options={merchantAccounts.map((acc: any) => ({ value: acc._id, label: acc.name }))}
                  value={values.merchant_account ? { value: values.merchant_account, label: merchantAccounts.find(acc => acc._id === values.merchant_account)?.name || '' } : null}
                  onChange={option => setFieldValue('merchant_account', (option as { value: string } | null)?.value || '')}
                  className="min-w-[220px] flex-1 text-sm"
                  classNamePrefix="select"
                  placeholder="Select Merchant Account"
                  isSearchable
                  isLoading={merchantAccountsLoading}
                  isDisabled={!funding?.merchant || merchantAccountsLoading}
                  menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                  menuPosition="fixed"
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                />
                {merchantAccountsLoading && <div className="text-xs text-gray-500">Loading accounts...</div>}
                {touched.merchant_account && errors.merchant_account && (
                  <div className="text-xs text-red-600 mt-1">{errors.merchant_account}</div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Funder Account</label>
                <Select
                  name="funder_account"
                  options={funderAccounts.map((acc: any) => ({ value: acc._id, label: acc.name }))}
                  value={values.funder_account ? { value: values.funder_account, label: funderAccounts.find(acc => acc._id === values.funder_account)?.name || '' } : null}
                  onChange={option => setFieldValue('funder_account', (option as { value: string } | null)?.value || '')}
                  className="min-w-[220px] flex-1 text-sm"
                  classNamePrefix="select"
                  placeholder="Select Funder Account"
                  isSearchable
                  isLoading={funderAccountsLoading}
                  isDisabled={funderAccountsLoading}
                  menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                  menuPosition="fixed"
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                />
                {funderAccountsLoading && <div className="text-xs text-gray-500">Loading accounts...</div>}
                {touched.funder_account && errors.funder_account && (
                  <div className="text-xs text-red-600 mt-1">{errors.funder_account}</div>
                )}
              </div>
            </div>

            {/* Payment Details Section */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="block text-sm font-semibold text-gray-700 mb-3">Payment Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method <span className="text-red-500">*</span></label>
                  <Select
                    name="payment_method"
                    options={paymentMethods}
                    value={values.payment_method ? { value: values.payment_method, label: paymentMethods.find(pm => pm.value === values.payment_method)?.label || '' } : null}
                    onChange={option => setFieldValue('payment_method', (option as { value: string } | null)?.value || '')}
                    className="min-w-[220px] flex-1 text-sm"
                    classNamePrefix="select"
                    placeholder="Select Payment Method"
                    isSearchable
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                    menuPosition="fixed"
                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                  />
                  {touched.payment_method && errors.payment_method && (
                    <div className="text-xs text-red-600 mt-1">{errors.payment_method}</div>
                  )}
                </div>
                
                {values.payment_method === 'ACH' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ACH Processor</label>
                    <Select
                      name="ach_processor"
                      options={[
                        { value: 'ACHWorks' as const, label: 'ACHWorks' },
                        { value: 'Actum' as const, label: 'Actum' },
                        { value: 'Manual' as const, label: 'Manual' },
                        { value: 'Other' as const, label: 'Other' },
                      ]}
                      value={values.ach_processor ? { value: values.ach_processor, label: values.ach_processor } : null}
                      onChange={option => setFieldValue('ach_processor', (option as { value: string } | null)?.value || '')}
                      className="min-w-[220px] flex-1 text-sm"
                      classNamePrefix="select"
                      placeholder="Select ACH Processor"
                      isSearchable
                      menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                      menuPosition="fixed"
                      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                    />
                    {touched.ach_processor && errors.ach_processor && (
                      <div className="text-xs text-red-600 mt-1">{errors.ach_processor}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Amount & Schedule Section */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="block text-sm font-semibold text-gray-700 mb-3">Amount & Schedule</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Total Amount <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="total_amount"
                      value={values.total_amount || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        setFieldValue('total_amount', value);
                      }}
                      className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {touched.total_amount && errors.total_amount && (
                    <div className="text-xs text-red-600 mt-1">{errors.total_amount}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payback Count <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="payback_count"
                    value={values.payback_count || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      setFieldValue('payback_count', value);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Enter payback count"
                    min="1"
                  />
                  {touched.payback_count && errors.payback_count && (
                    <div className="text-xs text-red-600 mt-1">{errors.payback_count}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="start_date"
                    value={values.start_date || new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setFieldValue('start_date', e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  {touched.start_date && errors.start_date && (
                    <div className="text-xs text-red-600 mt-1">{errors.start_date}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={values.end_date || ''}
                    onChange={(e) => {
                      setFieldValue('end_date', e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Auto-calculated if not provided"
                  />
                  {touched.end_date && errors.end_date && (
                    <div className="text-xs text-red-600 mt-1">{errors.end_date}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Next Payback Date</label>
                  <input
                    type="date"
                    name="next_payback_date"
                    value={values.next_payback_date || ''}
                    onChange={(e) => {
                      setFieldValue('next_payback_date', e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Auto-calculated if not provided"
                  />
                  {touched.next_payback_date && errors.next_payback_date && (
                    <div className="text-xs text-red-600 mt-1">{errors.next_payback_date}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Frequency</label>
                  <Select
                    name="frequency"
                    options={frequencies}
                    value={values.frequency ? { value: values.frequency, label: frequencies.find(f => f.value === values.frequency)?.label || '' } : null}
                    onChange={option => {
                      const newFrequency = (option as { value: string } | null)?.value || '';
                      setFieldValue('frequency', newFrequency);
                      // Reset payday_list to a sensible default for the new frequency
                      if (newFrequency === 'DAILY') {
                        setFieldValue('payday_list', [1, 2, 3, 4, 5]); // Mon-Fri
                      } else if (newFrequency === 'WEEKLY') {
                        setFieldValue('payday_list', [1]); // Monday
                      } else if (newFrequency === 'MONTHLY') {
                        setFieldValue('payday_list', [1]); // 1st of month
                      }
                    }}
                    className="min-w-[220px] flex-1 text-sm"
                    classNamePrefix="select"
                    placeholder="Select Frequency"
                    isSearchable
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                    menuPosition="fixed"
                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                  />
                  {touched.frequency && errors.frequency && (
                    <div className="text-xs text-red-600 mt-1">{errors.frequency}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Settings & Notes Section */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="block text-sm font-semibold text-gray-700 mb-3">Settings & Notes</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Distribution Priority</label>
                  <Select
                    name="distribution_priority"
                    options={distributionPriorities}
                    value={values.distribution_priority ? { value: values.distribution_priority, label: distributionPriorities.find(dp => dp.value === values.distribution_priority)?.label || '' } : null}
                    onChange={option => setFieldValue('distribution_priority', (option as { value: string } | null)?.value || '')}
                    className="min-w-[220px] flex-1 text-sm"
                    classNamePrefix="select"
                    placeholder="Select Distribution Priority"
                    isSearchable
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                    menuPosition="fixed"
                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                  />
                  {touched.distribution_priority && errors.distribution_priority && (
                    <div className="text-xs text-red-600 mt-1">{errors.distribution_priority}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <Select
                    name="status"
                    options={statusOptions}
                    value={values.status ? { value: values.status, label: statusOptions.find(s => s.value === values.status)?.label || '' } : null}
                    onChange={option => setFieldValue('status', (option as { value: string } | null)?.value || 'ACTIVE')}
                    className="min-w-[220px] flex-1 text-sm"
                    classNamePrefix="select"
                    placeholder="Select Status"
                    isSearchable
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                    menuPosition="fixed"
                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                  />
                  {touched.status && errors.status && (
                    <div className="text-xs text-red-600 mt-1">{errors.status}</div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="note"
                    value={values.note || ''}
                    onChange={(e) => {
                      setFieldValue('note', e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Enter notes..."
                    rows={3}
                  />
                  {touched.note && errors.note && (
                    <div className="text-xs text-red-600 mt-1">{errors.note}</div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="avoid_holiday"
                      checked={values.avoid_holiday || false}
                      onChange={(e) => {
                        setFieldValue('avoid_holiday', e.target.checked);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Avoid Holidays
                  </label>
                  {touched.avoid_holiday && errors.avoid_holiday && (
                    <div className="text-xs text-red-600 mt-1">{errors.avoid_holiday}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Day(s) Section */}
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Day(s)</label>
              {values.frequency === 'DAILY' && (
                <div className="grid grid-cols-2 gap-2">
                  {daysOfWeek.map(day => (
                    <label key={day.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        value={String(day.value)}
                        checked={values.payday_list.includes(day.value)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const val = day.value;
                          if (checked) {
                            setFieldValue('payday_list', [...values.payday_list, val]);
                          } else {
                            setFieldValue('payday_list', values.payday_list.filter((v) => v !== val));
                          }
                        }}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              )}
              {values.frequency === 'WEEKLY' && (
                <div className="flex flex-row flex-wrap gap-x-6 gap-y-2">
                  {daysOfWeek.map(day => (
                    <label key={day.value} className="flex items-center gap-2 text-sm px-2">
                      <input
                        type="radio"
                        value={String(day.value)}
                        checked={values.payday_list[0] === day.value}
                        onChange={() => setFieldValue('payday_list', [day.value])}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              )}
              {values.frequency === 'MONTHLY' && (
                <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                  {daysOfMonth.map(day => (
                    <label key={day.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        value={String(day.value)}
                        checked={values.payday_list[0] === day.value}
                        onChange={() => setFieldValue('payday_list', [day.value])}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              )}
              {touched.payday_list && errors.payday_list && (
                <div className="text-xs text-red-600 mt-1">{errors.payday_list}</div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
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