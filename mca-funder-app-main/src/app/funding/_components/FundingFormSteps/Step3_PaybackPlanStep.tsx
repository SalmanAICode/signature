import React, { useEffect } from 'react';
import { Field, FieldArray, ErrorMessage } from 'formik';
import Select from 'react-select';
import { useFundingFormStore } from '@/lib/store/fundingFormStore';
import { formatCurrency } from '@/lib/utils/format';
import isEqual from 'fast-deep-equal';
import { useFunderAccounts } from '@/hooks/useFunderAccounts';
import { FunderAccount } from '@/types/funder';
import { useMerchantAccountsByMerchantId } from '@/hooks/useMerchantAccountsByMerchantId';
import { MerchantAccount } from '@/types/merchant';

interface PaybackPlanRow {
  merchant_account: string;
  funder_account: string;
  payment_method: 'ACH' | 'WIRE' | 'CHECK' | 'OTHER';
  ach_processor: 'ACHWorks' | 'Actum' | 'Manual' | 'Other',
  total_amount: number;
  payback_count: number;
  start_date: string;
  end_date?: string;
  next_payback_date?: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  payday_list: number[];
  avoid_holiday: boolean;
  distribution_priority: string;
  note: string;
  status: string;
}

interface Step3PaybackPlanProps {
  values: any;
  setFieldValue: (field: string, value: any) => void;
  merchantAccounts?: { id: string; name: string }[];
  funderAccounts?: { id: string; name: string }[];
  achProcessors: { id: string; name: string }[];
  error: string;
  labelClasses: string;
  errorClasses: string;
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

function getNextPaybackDate(startDate: string, frequency: string, paydayList: number[]): string {
  if (!startDate || !frequency || !paydayList.length) {
    return '';
  }

  const start = new Date(startDate);
  const today = new Date();

  if (frequency === 'DAILY') {
    // Find the next business day from start date
    let nextDate = new Date(start);
    while (nextDate < today || !paydayList.includes(nextDate.getDay())) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    return nextDate.toISOString().split('T')[0];
  } else if (frequency === 'WEEKLY') {
    // Find the next occurrence of the selected day
    let nextDate = new Date(start);
    const targetDay = paydayList[0];
    while (nextDate < today || nextDate.getDay() !== targetDay) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    return nextDate.toISOString().split('T')[0];
  } else if (frequency === 'MONTHLY') {
    // Find the next occurrence of the selected day of month
    let nextDate = new Date(start);
    const targetDay = paydayList[0];
    while (nextDate < today || nextDate.getDate() !== targetDay) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    return nextDate.toISOString().split('T')[0];
  }

  return '';
}

function getScheduledEndDate(
  startDate: string,
  frequency: string,
  paydayList: number[],
  paybackCount: number
): string {
  if (!startDate || !frequency || !paydayList.length || !paybackCount) {
    return '';
  }

  const start = new Date(startDate);
  let endDate = new Date(start);

  if (frequency === 'DAILY') {
    // Calculate business days
    let businessDays = 0;
    let currentDate = new Date(start);
    while (businessDays < paybackCount) {
      if (paydayList.includes(currentDate.getDay())) {
        businessDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    endDate = new Date(currentDate);
  } else if (frequency === 'WEEKLY') {
    // Calculate weeks
    const weeks = Math.ceil(paybackCount / paydayList.length);
    endDate.setDate(endDate.getDate() + (weeks * 7));
  } else if (frequency === 'MONTHLY') {
    // Calculate months
    endDate.setMonth(endDate.getMonth() + paybackCount);
  }

  return endDate.toISOString().split('T')[0];
}

function calculatePaybackFields(row: PaybackPlanRow): PaybackPlanRow {
  const calculatedRow = { ...row };

  // Calculate next payback date
  if (row.start_date && row.frequency && row.payday_list.length > 0) {
    calculatedRow.next_payback_date = getNextPaybackDate(row.start_date, row.frequency, row.payday_list);
  }

  // Calculate end date
  if (row.start_date && row.frequency && row.payday_list.length > 0 && row.payback_count > 0) {
    calculatedRow.end_date = getScheduledEndDate(row.start_date, row.frequency, row.payday_list, row.payback_count);
  }

  // Set default status if not provided
  if (!row.status) {
    calculatedRow.status = 'ACTIVE';
  }

  return calculatedRow;
}

const Step3_PaybackPlanStep: React.FC<Step3PaybackPlanProps> = ({
  values,
  setFieldValue,
  merchantAccounts,
  funderAccounts,
  achProcessors,
  error,
  labelClasses,
  errorClasses,
}) => {
  const { payback_plan_list = [] } = values;
  const paybackPlanFromStore = useFundingFormStore((s) => s.paybackPlan);
  const setPaybackPlan = useFundingFormStore((s) => s.setPaybackPlan);

  const { accounts: dynamicFunderAccounts, loading: funderAccountsLoading, error: funderAccountsError } = useFunderAccounts();

  const selectedMerchantId = values.merchant;
  const { accounts: dynamicMerchantAccounts, loading: merchantAccountsLoading, error: merchantAccountsError } = useMerchantAccountsByMerchantId(selectedMerchantId);

  useEffect(() => {
    const calculatedPlan = payback_plan_list.map((row: PaybackPlanRow) => {
      return calculatePaybackFields(row);
    });

    // Only update if the calculated plan is different from the store
    if (!isEqual(paybackPlanFromStore, calculatedPlan)) {
      setPaybackPlan(calculatedPlan);
      setFieldValue('payback_plan_list', calculatedPlan);
    }
  }, [payback_plan_list, paybackPlanFromStore]);

  function getDefaultPaybackPlanRow(): PaybackPlanRow {
    return {
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
    };
  }

  return (
    <div>
      <FieldArray name="payback_plan_list">
        {({ remove, push }) => (
          <>
            {payback_plan_list.map((row: PaybackPlanRow, idx: number) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100 flex flex-col gap-4 w-full max-w-3xl mx-auto"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-[#1A2341]">Payback Plan #{idx + 1}</h3>
                  {payback_plan_list.length > 1 && (
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700 text-xs font-bold"
                      onClick={() => remove(idx)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Merchant Account</label>
                    <Select
                      name={`payback_plan_list.${idx}.merchant_account`}
                      options={dynamicMerchantAccounts.map((acc: MerchantAccount) => ({ value: acc._id, label: acc.name }))}
                      value={row.merchant_account ? { value: row.merchant_account, label: dynamicMerchantAccounts.find(acc => acc._id === row.merchant_account)?.name || '' } : null}
                      onChange={option => setFieldValue(`payback_plan_list.${idx}.merchant_account`, (option as { value: string } | null)?.value || '')}
                      className="min-w-[220px] flex-1 text-sm"
                      classNamePrefix="select"
                      placeholder="Select Merchant Account"
                      isSearchable
                      isLoading={merchantAccountsLoading}
                      isDisabled={!selectedMerchantId || merchantAccountsLoading}
                      menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                      menuPosition="fixed"
                      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                    />
                    {merchantAccountsLoading && <div className="text-xs text-gray-500">Loading accounts...</div>}
                    {merchantAccountsError && <div className={errorClasses}>{merchantAccountsError}</div>}
                    <ErrorMessage name={`payback_plan_list.${idx}.merchant_account`} component="div" className={errorClasses} />
                  </div>
                  
                  <div>
                    <label className={labelClasses}>Funder Account</label>
                    <Select
                      name={`payback_plan_list.${idx}.funder_account`}
                      options={dynamicFunderAccounts.map((acc: FunderAccount) => ({ value: acc._id, label: acc.name }))}
                      value={row.funder_account ? { value: row.funder_account, label: dynamicFunderAccounts.find(acc => acc._id === row.funder_account)?.name || '' } : null}
                      onChange={option => setFieldValue(`payback_plan_list.${idx}.funder_account`, (option as { value: string } | null)?.value || '')}
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
                    {funderAccountsError && <div className={errorClasses}>{funderAccountsError}</div>}
                    <ErrorMessage name={`payback_plan_list.${idx}.funder_account`} component="div" className={errorClasses} />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Payment Method <span className="text-red-500">*</span></label>
                      <Select
                        name={`payback_plan_list.${idx}.payment_method`}
                        options={paymentMethods}
                        value={row.payment_method ? { value: row.payment_method, label: paymentMethods.find(pm => pm.value === row.payment_method)?.label || '' } : null}
                        onChange={option => setFieldValue(`payback_plan_list.${idx}.payment_method`, (option as { value: string } | null)?.value || '')}
                        className="min-w-[220px] flex-1 text-sm"
                        classNamePrefix="select"
                        placeholder="Select Payment Method"
                        isSearchable
                        menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                        menuPosition="fixed"
                        styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                      />
                      <ErrorMessage name={`payback_plan_list.${idx}.payment_method`} component="div" className={errorClasses} />
                    </div>
                    
                    {row.payment_method === 'ACH' && (
                      <div>
                        <label className={labelClasses}>ACH Processor</label>
                        <Select
                          name={`payback_plan_list.${idx}.ach_processor`}
                          options={achProcessors.map((proc) => ({ value: proc.id as 'ACHWorks' | 'Actum' | 'Manual' | 'Other', label: proc.name }))}
                          value={row.ach_processor ? { value: row.ach_processor, label: achProcessors.find(proc => proc.id === row.ach_processor)?.name || '' } : null}
                          onChange={option => setFieldValue(`payback_plan_list.${idx}.ach_processor`, (option as { value: string } | null)?.value || '')}
                          className="min-w-[220px] flex-1 text-sm"
                          classNamePrefix="select"
                          placeholder="Select ACH Processor"
                          isSearchable
                          menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                          menuPosition="fixed"
                          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                        />
                        <ErrorMessage name={`payback_plan_list.${idx}.ach_processor`} component="div" className={errorClasses} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Amount & Schedule</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Total Amount <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          name={`payback_plan_list.${idx}.total_amount`}
                          value={row.total_amount || 0}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            setFieldValue(`payback_plan_list.${idx}.total_amount`, value);
                          }}
                          className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <ErrorMessage name={`payback_plan_list.${idx}.total_amount`} component="div" className={errorClasses} />
                    </div>
                    
                    <div>
                      <label className={labelClasses}>Payback Count <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        name={`payback_plan_list.${idx}.payback_count`}
                        value={row.payback_count || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                          setFieldValue(`payback_plan_list.${idx}.payback_count`, value);
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        placeholder="Enter payback count"
                        min="1"
                      />
                      <ErrorMessage name={`payback_plan_list.${idx}.payback_count`} component="div" className={errorClasses} />
                    </div>
                    
                    <div>
                      <label className={labelClasses}>Start Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        name={`payback_plan_list.${idx}.start_date`}
                        value={row.start_date || new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          setFieldValue(`payback_plan_list.${idx}.start_date`, e.target.value);
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                      <ErrorMessage name={`payback_plan_list.${idx}.start_date`} component="div" className={errorClasses} />
                    </div>
                    
                    <div>
                      <label className={labelClasses}>End Date</label>
                      <input
                        type="date"
                        name={`payback_plan_list.${idx}.end_date`}
                        value={row.end_date || ''}
                        onChange={(e) => {
                          setFieldValue(`payback_plan_list.${idx}.end_date`, e.target.value);
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        placeholder="Auto-calculated if not provided"
                      />
                      <ErrorMessage name={`payback_plan_list.${idx}.end_date`} component="div" className={errorClasses} />
                    </div>
                    
                    <div>
                      <label className={labelClasses}>Next Payback Date</label>
                      <input
                        type="date"
                        name={`payback_plan_list.${idx}.next_payback_date`}
                        value={row.next_payback_date || ''}
                        onChange={(e) => {
                          setFieldValue(`payback_plan_list.${idx}.next_payback_date`, e.target.value);
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        placeholder="Auto-calculated if not provided"
                      />
                      <ErrorMessage name={`payback_plan_list.${idx}.next_payback_date`} component="div" className={errorClasses} />
                    </div>
                    
                    <div>
                      <label className={labelClasses}>Frequency</label>
                      <Select
                        name={`payback_plan_list.${idx}.frequency`}
                        options={frequencies}
                        value={row.frequency ? { value: row.frequency, label: frequencies.find(f => f.value === row.frequency)?.label || '' } : null}
                        onChange={option => {
                          const newFrequency = (option as { value: string } | null)?.value || '';
                          setFieldValue(`payback_plan_list.${idx}.frequency`, newFrequency);
                          // Reset payday_list to a sensible default for the new frequency
                          if (newFrequency === 'DAILY') {
                            setFieldValue(`payback_plan_list.${idx}.payday_list`, [1, 2, 3, 4, 5]); // Mon-Fri
                          } else if (newFrequency === 'WEEKLY') {
                            setFieldValue(`payback_plan_list.${idx}.payday_list`, [1]); // Monday
                          } else if (newFrequency === 'MONTHLY') {
                            setFieldValue(`payback_plan_list.${idx}.payday_list`, [1]); // 1st of month
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
                      <ErrorMessage name={`payback_plan_list.${idx}.frequency`} component="div" className={errorClasses} />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Settings & Notes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Distribution Priority</label>
                      <Select
                        name={`payback_plan_list.${idx}.distribution_priority`}
                        options={distributionPriorities}
                        value={row.distribution_priority ? { value: row.distribution_priority, label: distributionPriorities.find(dp => dp.value === row.distribution_priority)?.label || '' } : null}
                        onChange={option => setFieldValue(`payback_plan_list.${idx}.distribution_priority`, (option as { value: string } | null)?.value || '')}
                        className="min-w-[220px] flex-1 text-sm"
                        classNamePrefix="select"
                        placeholder="Select Distribution Priority"
                        isSearchable
                        menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                        menuPosition="fixed"
                        styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                      />
                      <ErrorMessage name={`payback_plan_list.${idx}.distribution_priority`} component="div" className={errorClasses} />
                    </div>
                    
                    <div>
                      <label className={labelClasses}>Status</label>
                      <Select
                        name={`payback_plan_list.${idx}.status`}
                        options={statusOptions}
                        value={row.status ? { value: row.status, label: statusOptions.find(s => s.value === row.status)?.label || '' } : null}
                        onChange={option => setFieldValue(`payback_plan_list.${idx}.status`, (option as { value: string } | null)?.value || 'ACTIVE')}
                        className="min-w-[220px] flex-1 text-sm"
                        classNamePrefix="select"
                        placeholder="Select Status"
                        isSearchable
                        menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                        menuPosition="fixed"
                        styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                      />
                      <ErrorMessage name={`payback_plan_list.${idx}.status`} component="div" className={errorClasses} />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className={labelClasses}>Notes</label>
                      <textarea
                        name={`payback_plan_list.${idx}.note`}
                        value={row.note || ''}
                        onChange={(e) => {
                          setFieldValue(`payback_plan_list.${idx}.note`, e.target.value);
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        placeholder="Enter notes..."
                        rows={3}
                      />
                      <ErrorMessage name={`payback_plan_list.${idx}.note`} component="div" className={errorClasses} />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          name={`payback_plan_list.${idx}.avoid_holiday`}
                          checked={row.avoid_holiday || false}
                          onChange={(e) => {
                            setFieldValue(`payback_plan_list.${idx}.avoid_holiday`, e.target.checked);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Avoid Holidays
                      </label>
                      <ErrorMessage name={`payback_plan_list.${idx}.avoid_holiday`} component="div" className={errorClasses} />
                    </div>
                  </div>
                </div>

                {/* Payment Day(s) Section */}
                <div className="mt-4">
                  <label className={labelClasses}>Payment Day(s)</label>
                  {row.frequency === 'DAILY' && (
                    <div className="grid grid-cols-2 gap-2">
                      {daysOfWeek.map(day => (
                        <label key={day.value} className="flex items-center gap-2 text-sm">
                          <Field
                            type="checkbox"
                            name={`payback_plan_list.${idx}.payday_list`}
                            value={String(day.value)}
                            checked={row.payday_list.includes(day.value)}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const checked = e.target.checked;
                              const val = day.value;
                              if (checked) {
                                setFieldValue(`payback_plan_list.${idx}.payday_list`, [...row.payday_list, val]);
                              } else {
                                setFieldValue(`payback_plan_list.${idx}.payday_list`, row.payday_list.filter((v) => v !== val));
                              }
                            }}
                          />
                          {day.label}
                        </label>
                      ))}
                    </div>
                  )}
                  {row.frequency === 'WEEKLY' && (
                    <div className="flex flex-row flex-wrap gap-x-6 gap-y-2">
                      {daysOfWeek.map(day => (
                        <label key={day.value} className="flex items-center gap-2 text-sm px-2">
                          <Field
                            type="radio"
                            name={`payback_plan_list.${idx}.payday_list`}
                            value={String(day.value)}
                            checked={row.payday_list[0] === day.value}
                            onChange={() => setFieldValue(`payback_plan_list.${idx}.payday_list`, [day.value])}
                          />
                          {day.label}
                        </label>
                      ))}
                    </div>
                  )}
                  {row.frequency === 'MONTHLY' && (
                    <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                      {daysOfMonth.map(day => (
                        <label key={day.value} className="flex items-center gap-2 text-sm">
                          <Field
                            type="radio"
                            name={`payback_plan_list.${idx}.payday_list`}
                            value={String(day.value)}
                            checked={row.payday_list[0] === day.value}
                            onChange={() => setFieldValue(`payback_plan_list.${idx}.payday_list`, [day.value])}
                          />
                          {day.label}
                        </label>
                      ))}
                    </div>
                  )}
                  <ErrorMessage name={`payback_plan_list.${idx}.payday_list`} component="div" className={errorClasses} />
                </div>
              </div>
            ))}
            
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => push(getDefaultPaybackPlanRow())}
                className="mt-2 text-xs font-medium text-blue-600 hover:underline focus:outline-none"
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                + Add Payback Plan
              </button>
            </div>
          </>
        )}
      </FieldArray>
    </div>
  );
};

export default Step3_PaybackPlanStep;