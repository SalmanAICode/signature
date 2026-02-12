import React, { useEffect, useState } from 'react';
import { Field, ErrorMessage, FieldArray } from 'formik';
import Select from 'react-select';
import { getUserList } from '@/lib/api/users';
import { User } from '@/types/user';
import { PlusIcon } from '@heroicons/react/24/outline';
import { getExpenseTypeList } from '@/lib/api/expenseTypes';
import { ExpenseType } from '@/types/expenseType';
import { formatCurrency, formatDateShort } from '@/lib/utils/format';
import { FeeType } from '@/types/feeType';
import { FundingStatus } from '@/lib/api/fundingStatuses';

interface Step2Props {
  values: any;
  setFieldValue: (field: string, value: any) => void;
  setFieldTouched: (field: string, touched?: boolean, shouldValidate?: boolean) => void;
  setFieldError: (field: string, message?: string) => void;
  setTouched: (touched: any, shouldValidate?: boolean) => void;
  calculatedFields: {
    upfront_fee_amount: number;
    net_amount: number;
    factor_rate: number;
    buy_rate: number;
  };
  feeTypes: any[];
  error: string;
  labelClasses: string;
  errorClasses: string;
  validateStep?: () => void;
  merchants: any[];
  setError?: (error: string) => void;
  fundingStatuses: FundingStatus[];
  loadingFundingStatuses: boolean;
}

interface Fee {
  name: string;
  fee_type: string;
  amount: number;
  upfront: boolean;
}

interface FeesSectionProps {
  funderId: string;
  fundedAmount: number;
  paybackAmount: number;
  feeList: Fee[];
  onFeeListChange: (fees: Fee[]) => void;
  labelClasses: string;
  errorClasses: string;
}

const FeesSection: React.FC<FeesSectionProps> = ({
  funderId,
  fundedAmount,
  paybackAmount,
  feeList,
  onFeeListChange,
  labelClasses,
  errorClasses
}) => {
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loadingFeeTypes, setLoadingFeeTypes] = useState(false);

  // Helper function to extract formula ID
  const getFormulaId = (feeType: FeeType): string | null => {
    if (!feeType.formula) return null;
    if (typeof feeType.formula === 'string') {
      return feeType.formula;
    }
    if (typeof feeType.formula === 'object' && feeType.formula._id) {
      return feeType.formula._id;
    }
    return null;
  };

  // Helper function to calculate fee amount
  const calculateFeeAmount = async (formulaId: string): Promise<number> => {
    try {
      const { calculateFormula } = await import('@/lib/api/formulas');
      const amount = await calculateFormula({
        formulaId,
        fund: fundedAmount,
        payback: paybackAmount,
      });
      return amount || 0;
    } catch (error) {
      console.error('Error calculating fee amount:', error);
      return 0;
    }
  };

  // Fetch fee types when component loads
  useEffect(() => {
    const fetchFeeTypes = async () => {
      setLoadingFeeTypes(true);
      try {
        const { getFeeTypes } = await import('@/lib/api/feeTypes');
        const allFeeTypes = (await getFeeTypes()).data;
        setFeeTypes(allFeeTypes);
      } catch (error) {
        console.error('Failed to load fee types:', error);
      } finally {
        setLoadingFeeTypes(false);
      }
    };
    fetchFeeTypes();
  }, []);

  // Auto-populate fee list with default fees if empty
  useEffect(() => {
    const safeFeeList = feeList || [];
    if (feeTypes.length > 0 && safeFeeList.length === 0 && fundedAmount > 0 && paybackAmount > 0) {
      const initializeDefaultFees = async () => {
        const defaultFeeTypes = feeTypes.filter(ft => ft.default);
        const defaultFees: Fee[] = [];
        for (const feeType of defaultFeeTypes) {
          const formulaId = getFormulaId(feeType);
          let calculatedAmount = 0;
          if (formulaId) {
            calculatedAmount = await calculateFeeAmount(formulaId);
          }
          defaultFees.push({
            name: feeType.name,
            fee_type: feeType._id,
            amount: calculatedAmount,
            upfront: !!feeType.upfront,
          });
        }
        onFeeListChange(defaultFees);
      };
      initializeDefaultFees();
    }
  }, [feeTypes, fundedAmount, paybackAmount, feeList]);

  // Recalculate all fee amounts when fundedAmount or paybackAmount changes
  useEffect(() => {
    if (feeList && feeList.length > 0 && fundedAmount > 0 && paybackAmount > 0) {
      const recalculateFees = async () => {
        const updatedFees = await Promise.all(
          feeList.map(async (fee) => {
            const selectedFeeType = feeTypes.find(ft => ft._id === fee.fee_type);
            if (selectedFeeType) {
              const formulaId = getFormulaId(selectedFeeType);
              let calculatedAmount = fee.amount; // fallback
              if (formulaId) {
                calculatedAmount = await calculateFeeAmount(formulaId);
              }
              return {
                ...fee,
                amount: calculatedAmount,
              };
            }
            return fee;
          })
        );
        onFeeListChange(updatedFees);
      };
      recalculateFees();
    }
  }, [fundedAmount, paybackAmount]);

  // Handle fee type change with immediate calculation
  const handleFeeTypeChange = async (index: number, feeTypeId: string) => {
    const selectedFeeType = feeTypes.find(ft => ft._id === feeTypeId);
    if (selectedFeeType) {
      const formulaId = getFormulaId(selectedFeeType);
      let calculatedAmount = 0;
      if (formulaId) {
        calculatedAmount = await calculateFeeAmount(formulaId);
      }
      const newList = [...feeList];
      newList[index] = {
        name: selectedFeeType.name,
        fee_type: feeTypeId,
        amount: calculatedAmount,
        upfront: !!selectedFeeType.upfront,
      };
      onFeeListChange(newList);
    }
  };

  const handleRemoveFee = (index: number) => {
    const newFeeList = feeList.filter((_, i) => i !== index);
    onFeeListChange(newFeeList);
  };

  const calculateTotalPayback = () => {
    const upfrontFeesTotal = feeList
      .filter(fee => fee.upfront)
      .reduce((sum, fee) => sum + fee.amount, 0);
    return paybackAmount + upfrontFeesTotal;
  };

  // Add Fee logic: add a new empty row for the user to fill
  const handleAddFee = () => {
    const newFeeList = [
      ...feeList,
      {
        name: '',
        fee_type: '',
        amount: 0,
        upfront: false,
      },
    ];
    onFeeListChange(newFeeList);
  };

  return (
    <>
      {/* Fees List */}
      <div className="space-y-0">
        {/* Header Row (no plus button) */}
        {feeList && feeList.length > 0 && (
          <>
            <div className="grid grid-cols-[2fr_2fr_1.2fr_1fr_0.5fr_auto] gap-4 items-center px-2 py-2 bg-gray-50 rounded-t-lg border-b border-gray-200">
              <div className="text-xs text-gray-400">Name</div>
              <div className="text-xs text-gray-400">Type</div>
              <div className="text-xs text-gray-400 flex items-center">Amount</div>
              <div className="text-xs text-gray-400">Upfront</div>
              <div className="text-xs text-gray-400 text-right">Action</div>
              <div></div>
            </div>
            {feeList.map((fee, index) => (
              <div key={index} className={`grid grid-cols-[2fr_2fr_1.2fr_1fr_0.5fr_auto] gap-4 items-end bg-gray-50 px-2 ${index === feeList.length - 1 ? 'rounded-b-lg' : ''}`} style={{ borderBottom: index !== feeList.length - 1 ? '1px solid #e5e7eb' : 'none', paddingTop: 8, paddingBottom: 8 }}>
                {/* Name (editable input) */}
                <div>
                  <input
                    type="text"
                    value={fee.name}
                    onChange={e => {
                      const newList = [...feeList];
                      newList[index].name = e.target.value;
                      onFeeListChange(newList);
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none text-sm bg-white"
                    placeholder="Fee name"
                    aria-label="Fee name"
                  />
                </div>
                {/* Type (editable react-select) */}
                <div>
                  <Select
                    value={feeTypes.find(ft => ft._id === fee.fee_type) ? {
                      value: fee.fee_type,
                      label: feeTypes.find(ft => ft._id === fee.fee_type)?.name
                    } : { value: fee.fee_type, label: fee.fee_type }}
                    options={feeTypes.map(ft => ({ value: ft._id, label: ft.name }))}
                    onChange={async selected => {
                      if (selected?.value) {
                        await handleFeeTypeChange(index, selected.value);
                      }
                    }}
                    isClearable
                    isSearchable
                    classNamePrefix="select"
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                    inputId={`fee-type-list-${index}`}
                    aria-label="Fee type"
                  />
                </div>
                {/* Amount (editable input) */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={fee.amount}
                    onChange={e => {
                      const newList = [...feeList];
                      newList[index].amount = Number(e.target.value);
                      onFeeListChange(newList);
                    }}
                    className="w-full pl-7 pr-3 py-2 border rounded-lg focus:outline-none text-sm bg-gray-100"
                    placeholder="Calculated amount"
                    aria-label="Fee amount"
                  />
                </div>
                {/* Upfront (editable checkbox) */}
                <div className="flex items-center h-full">
                  <input
                    type="checkbox"
                    checked={fee.upfront}
                    onChange={e => {
                      const newList = [...feeList];
                      newList[index].upfront = e.target.checked;
                      onFeeListChange(newList);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-white"
                    aria-label="Upfront"
                  />
                </div>
                {/* Remove (X) button */}
                <div className="flex justify-end items-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveFee(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors duration-150 p-1 rounded-full"
                    title="Remove Fee"
                    aria-label="Remove Fee"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Empty cell for alignment with header plus button */}
                <div></div>
              </div>
            ))}
          </>
        )}
      </div>
      {/* Total Payback Calculation */}
      {feeList && feeList.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg mt-4">
          <div className="flex flex-row justify-between w-full">
            <div>
              <div className="text-xs text-gray-500">Base Payback Amount</div>
              <div className="text-base font-medium text-gray-900">${paybackAmount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Upfront Fees</div>
              <div className="text-base font-medium text-gray-900">${feeList.filter(f => f.upfront).reduce((sum, f) => sum + f.amount, 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Total Payback</div>
              <div className="text-base font-semibold text-blue-700">${calculateTotalPayback().toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
      {/* Add Fee link below the list */}
      <div className="mt-2 flex justify-start">
        <button
          type="button"
          onClick={handleAddFee}
          className="text-[#2196F3] hover:underline font-medium text-sm px-0 py-0 bg-transparent border-none shadow-none cursor-pointer"
          aria-label="Add Fee"
          title="Add Fee"
        >
          + Add Fee
        </button>
      </div>
    </>
  );
};

// Common select styles
const selectStyles = {
  control: (base: any) => ({
    ...base,
    minHeight: '34px',
    backgroundColor: 'white',
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999
  })
};

// Define type options
const typeOptions = [
  { value: 'NEW', label: 'NEW' },
  { value: 'RENEWAL', label: 'RENEWAL' },
  { value: 'REFINANCE', label: 'REFINANCE' },
  { value: 'OTHER', label: 'OTHER' }
];

const Step2_BasicInfo: React.FC<Step2Props> = ({
  values,
  setFieldValue,
  setFieldTouched,
  setFieldError,
  setTouched,
  calculatedFields,
  feeTypes,
  error,
  labelClasses,
  errorClasses,
  validateStep,
  merchants,
  setError,
  fundingStatuses,
  loadingFundingStatuses
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [loadingExpenseTypes, setLoadingExpenseTypes] = useState(false);

  // Set default status to the initial status if no status is selected
  useEffect(() => {
    if (!values.status && fundingStatuses.length > 0) {
      const initialStatus = fundingStatuses.find((s: FundingStatus) => s.initial);
      if (initialStatus) {
        setFieldValue('status', initialStatus._id);
      }
    }
  }, [fundingStatuses, values.status, setFieldValue]);

  const generateDefaultFundingName = () => {
    const merchant = merchants.find(m => m._id === values.merchant);
    const merchantName = merchant?.name?.trim() || 'Unknown Merchant';
    const dateStr = formatDateShort(new Date().toISOString());
    const amount = Number(values.funded_amount) || 0; // Always show 0 if empty
    const formattedAmount = formatCurrency(amount);
    return `${merchantName} | ${dateStr} | ${formattedAmount}`;
  };

  // Fetch users for assignment dropdowns
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const userList = await getUserList({ include_inactive: false });
        setUsers(userList);
      } catch (error) {
        console.error('Error fetching users:', error);
        if (setError) setError('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [setError]);

  useEffect(() => {
    setLoadingExpenseTypes(true);
    getExpenseTypeList({ include_inactive: false })
      .then(setExpenseTypes)
      .catch(() => setExpenseTypes([]))
      .finally(() => setLoadingExpenseTypes(false));
  }, []);

  // Update name when funded amount or merchant changes
  useEffect(() => {
    const defaultName = generateDefaultFundingName();
    setFieldValue('name', defaultName);
  }, [values.funded_amount, values.merchant]);

  return (
    <div className="space-y-6">
      {/* Basic Information Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        
        {/* Row 1: Funding Name and Type */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2">
            <label className={labelClasses}>Funding Name <span className="text-red-500">*</span></label>
            <Field 
              name="name" 
              className={"w-full px-3 py-2 border rounded-lg focus:outline-none text-sm bg-white shadow-sm"}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFieldValue('name', e.target.value);
                if (setError) setError('');
                setFieldError('name', undefined);
                setFieldTouched('name', true, false);
              }}
            />
            <ErrorMessage name="name" component="div" className={errorClasses} />
          </div>
          <div>
            <label className={labelClasses}>Type <span className="text-red-500">*</span></label>
            <Select
              name="type"
              options={typeOptions}
              value={typeOptions.find(option => option.value === values.type)}
              onChange={(selected) => {
                setFieldValue('type', selected?.value || '');
                if (setError) setError('');
                setFieldError('type', undefined);
                setFieldTouched('type', true, false);
              }}
              className="text-sm"
              classNamePrefix="select"
              placeholder="Select type..."
              styles={selectStyles}
              menuPortalTarget={document.body}
            />
            <ErrorMessage name="type" component="div" className={errorClasses} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Funded Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Field
                name="funded_amount"
                type="number"
                className="w-full pl-7 pr-3 py-2 border rounded-lg focus:outline-none text-sm bg-white shadow-sm"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFieldValue('funded_amount', e.target.value);
                  if (setError) setError('');
                  setFieldError('funded_amount', undefined);
                  setFieldTouched('funded_amount', true, false);
                }}
              />
            </div>
            <ErrorMessage name="funded_amount" component="div" className={errorClasses} />
          </div>
          <div>
            <label className={labelClasses}>Payback Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Field
                name="payback_amount"
                type="number"
                className="w-full pl-7 pr-3 py-2 border rounded-lg focus:outline-none text-sm bg-white shadow-sm"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFieldValue('payback_amount', e.target.value);
                  if (setError) setError('');
                  setFieldError('payback_amount', undefined);
                  setFieldTouched('payback_amount', true, false);
                }}
              />
            </div>
            <ErrorMessage name="payback_amount" component="div" className={errorClasses} />
            {values.payback_amount && values.funded_amount && Number(values.payback_amount) <= Number(values.funded_amount) && (
              <div className={errorClasses}>Payback amount must be larger than funded amount</div>
            )}
          </div>
        </div>
      </div>

      {/* Fee List Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fees</h3>
        <FeesSection
          funderId={values.funder}
          fundedAmount={parseFloat(values.funded_amount) || 0}
          paybackAmount={parseFloat(values.payback_amount) || 0}
          feeList={values.fee_list || []}
          onFeeListChange={(newFeeList: Fee[]) => setFieldValue('fee_list', newFeeList)}
          labelClasses={labelClasses}
          errorClasses={errorClasses}
        />
      </div>

      {/* Commission and Expenses Section */}
      <div className="bg-gray-50 p-4 rounded-lg w-full max-w-3xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Expense</h3>
        <FieldArray name="expense_list">
          {({ push, remove }) => (
            <div className="space-y-0">
              {/* Header Row */}
              <div className="grid grid-cols-[2fr_2fr_1.2fr_1fr_0.5fr_0.5fr] gap-4 items-center px-2 py-2 bg-gray-50 rounded-t-lg border-b border-gray-200">
                <div className="text-xs text-gray-400">Name</div>
                <div className="text-xs text-gray-400">Expense Type</div>
                <div className="text-xs text-gray-400">Amount</div>
                <div className="text-xs text-gray-400 ">Commission</div>
                <div className="text-xs text-gray-400">Syndication</div>
                <div className="text-xs text-gray-400">Action</div>
              </div>
              {/* Added Expenses */}
              {values.expense_list.slice(0, -1).map((expense: any, index: number) => (
                <div key={index} className={`grid grid-cols-[2fr_2fr_1.2fr_1fr_0.5fr_0.5fr] gap-4 items-start bg-gray-50 px-2 ${index === values.expense_list.length - 2 ? 'rounded-b-lg' : ''}`} style={{ borderBottom: index !== values.expense_list.length - 2 ? '1px solid #e5e7eb' : 'none', paddingTop: 8, paddingBottom: 8 }}>
                  {/* Name (editable input) */}
                  <div>
                    <input
                      type="text"
                      value={expense.name}
                      onChange={e => {
                        const newList = [...values.expense_list];
                        newList[index].name = e.target.value;
                        setFieldValue('expense_list', newList);
                      }}
                      className="w-full px-3 h-10 border rounded-lg focus:outline-none text-sm bg-white"
                      placeholder="Expense name"
                      aria-label="Expense name"
                    />
                  </div>
                  {/* Expense Type (editable react-select) */}
                  <div>
                    <Select
                      value={expenseTypes.find(et => et._id === expense.expense_type) ? {
                        value: expense.expense_type,
                        label: expenseTypes.find(et => et._id === expense.expense_type)?.name
                      } : { value: expense.expense_type, label: expense.expense_type }}
                      options={expenseTypes.map(et => ({ value: et._id, label: et.name }))}
                      onChange={async selected => {
                        const newList = [...values.expense_list];
                        newList[index].expense_type = selected?.value || '';
                        // Auto-fill name if empty
                        if (!newList[index].name) {
                          const selectedType = expenseTypes.find(et => et._id === selected?.value);
                          if (selectedType) {
                            newList[index].name = selectedType.name;
                          }
                        }
                        // Auto-calculate amount using formula
                        const selectedExpenseType = expenseTypes.find(et => et._id === selected?.value);
                        if (selectedExpenseType && selectedExpenseType.formula) {
                          const formulaId =
                            typeof selectedExpenseType.formula === 'string'
                              ? selectedExpenseType.formula
                              : (selectedExpenseType.formula as { _id: string })?._id;
                          if (formulaId) {
                            try {
                              const { calculateFormula } = await import('@/lib/api/formulas');
                              const amount = await calculateFormula({
                                formulaId,
                                fund: parseFloat(values.funded_amount) || 0,
                                payback: parseFloat(values.payback_amount) || 0,
                              });
                              newList[index].amount = amount;
                            } catch {
                              newList[index].amount = 0;
                            }
                          }
                        }
                        setFieldValue('expense_list', newList);
                      }}
                      isClearable
                      isSearchable
                      classNamePrefix="select"
                      styles={selectStyles}
                      menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                      inputId={`expense-type-list-${index}`}
                      aria-label="Expense type"
                    />
                  </div>
                  {/* Amount (editable input) */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={expense.amount}
                      onChange={e => {
                        const newList = [...values.expense_list];
                        newList[index].amount = Number(e.target.value);
                        setFieldValue('expense_list', newList);
                      }}
                      className="w-full pl-7 pr-3 h-10 border rounded-lg focus:outline-none text-sm bg-gray-100"
                      placeholder="Amount"
                      aria-label="Amount"
                    />
                  </div>
                  {/* Commission (editable checkbox) */}
                  <div className="flex items-center h-full">
                    <input
                      type="checkbox"
                      checked={expense.commission}
                      onChange={e => {
                        const newList = [...values.expense_list];
                        newList[index].commission = e.target.checked;
                        setFieldValue('expense_list', newList);
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-white"
                      aria-label="Commission"
                    />
                  </div>
                  {/* Syndication (editable checkbox) */}
                  <div className="flex items-center h-full">
                    <input
                      type="checkbox"
                      checked={expense.syndication}
                      onChange={e => {
                        const newList = [...values.expense_list];
                        newList[index].syndication = e.target.checked;
                        setFieldValue('expense_list', newList);
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-white"
                      aria-label="Syndication"
                    />
                  </div>
                  {/* Remove (X) button */}
                  <div className="flex justify-end items-center">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors duration-150 p-1 rounded-full"
                      title="Remove Expense"
                      aria-label="Remove Expense"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {/* Add Row (Form) */}
              <div className={`grid grid-cols-[2fr_2fr_1.2fr_1fr_0.5fr_0.5fr] gap-4 items-end bg-gray-50 px-2${values.expense_list.length === 1 ? ' rounded-b-lg' : ''}`} style={{ borderBottom: 'none', paddingTop: 8, paddingBottom: 8 }}>
                <div>
                  <input
                    type="text"
                    value={values.expense_list[values.expense_list.length - 1].name}
                    onChange={e => {
                      const newList = [...values.expense_list];
                      newList[values.expense_list.length - 1].name = e.target.value;
                      setFieldValue('expense_list', newList);
                    }}
                    className="w-full px-3 h-10 border rounded-lg focus:outline-none text-sm bg-white"
                    placeholder="Expense name"
                    aria-label="Expense name"
                  />
                </div>
                <div>
                  <Select
                    value={expenseTypes.find(et => et._id === values.expense_list[values.expense_list.length - 1]?.expense_type) ? {
                      value: values.expense_list[values.expense_list.length - 1]?.expense_type,
                      label: expenseTypes.find(et => et._id === values.expense_list[values.expense_list.length - 1]?.expense_type)?.name
                    } : { value: '', label: 'Select type' }}
                    options={expenseTypes.map(et => ({ value: et._id, label: et.name }))}
                    onChange={selected => {
                      const newList = [...values.expense_list];
                      newList[values.expense_list.length - 1].expense_type = selected?.value || '';
                      if (!newList[values.expense_list.length - 1].name) {
                        const selectedType = expenseTypes.find(et => et._id === selected?.value);
                        if (selectedType) {
                          newList[values.expense_list.length - 1].name = selectedType.name;
                        }
                      }
                      setFieldValue('expense_list', newList);
                    }}
                    isClearable
                    isSearchable
                    classNamePrefix="select"
                    styles={selectStyles}
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                    inputId={`expense-type-list-add`}
                    aria-label="Expense type"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={values.expense_list[values.expense_list.length - 1].amount}
                    onChange={e => {
                      const newList = [...values.expense_list];
                      newList[values.expense_list.length - 1].amount = Number(e.target.value);
                      setFieldValue('expense_list', newList);
                    }}
                    className="w-full pl-7 pr-3 h-10 border rounded-lg focus:outline-none text-sm bg-gray-100"
                    placeholder="Amount"
                    aria-label="Amount"
                  />
                </div>
                <div className="flex items-center h-full">
                  <input
                    type="checkbox"
                    checked={values.expense_list[values.expense_list.length - 1].commission}
                    onChange={e => {
                      const newList = [...values.expense_list];
                      newList[values.expense_list.length - 1].commission = e.target.checked;
                      setFieldValue('expense_list', newList);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-white"
                    aria-label="Commission"
                  />
                </div>
                <div className="flex items-center h-full">
                  <input
                    type="checkbox"
                    checked={values.expense_list[values.expense_list.length - 1].syndication}
                    onChange={e => {
                      const newList = [...values.expense_list];
                      newList[values.expense_list.length - 1].syndication = e.target.checked;
                      setFieldValue('expense_list', newList);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-white"
                    aria-label="Syndication"
                  />
                </div>
              </div>
              {/* Add Expense Button */}
              <div className="mt-2 flex justify-start">
                <button
                  type="button"
                  onClick={() => {
                    const lastIdx = values.expense_list.length - 1;
                    const expense = values.expense_list[lastIdx];
                    if (!expense.name || !expense.expense_type) return;
                    push({ name: '', expense_type: '', amount: 0, commission: false, syndication: false });
                  }}
                  className="text-[#2196F3] hover:underline font-medium text-sm px-0 py-0 bg-transparent border-none shadow-none cursor-pointer"
                >
                  + Add Expense
                </button>
              </div>
              {/* Total Commission Amount */}
              <div className="mt-2 text-sm font-semibold text-blue-700">
                Total Commission: ${values.expense_list.filter((exp: any) => exp.commission).reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0)}
              </div>
            </div>
          )}
        </FieldArray>
      </div>

      {/* User Assignment Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Assignment</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Assigned Manager</label>
            <Select
              options={users.map(user => ({ 
                value: user._id, 
                label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown'
              }))}
              value={users.find(user => user._id === values.assigned_manager) ? 
                { 
                  value: values.assigned_manager, 
                  label: (() => {
                    const user = users.find(u => u._id === values.assigned_manager);
                    return user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown' : '';
                  })()
                } : null}
              onChange={(selected) => {
                setFieldValue('assigned_manager', selected?.value || '');
                // Auto-add to followers if not already present
                if (selected?.value && !values.follower_list?.includes(selected.value)) {
                  const newFollowers = [...(values.follower_list || []), selected.value];
                  setFieldValue('follower_list', newFollowers);
                }
              }}
              className="text-sm"
              classNamePrefix="select"
              placeholder="Select manager..."
              styles={selectStyles}
              menuPortalTarget={document.body}
              isLoading={loadingUsers}
            />
          </div>
          <div>
            <label className={labelClasses}>Assigned User</label>
            <Select
              options={users.map(user => ({ 
                value: user._id, 
                label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown'
              }))}
              value={users.find(user => user._id === values.assigned_user) ? 
                { 
                  value: values.assigned_user, 
                  label: (() => {
                    const user = users.find(u => u._id === values.assigned_user);
                    return user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown' : '';
                  })()
                } : null}
              onChange={(selected) => {
                setFieldValue('assigned_user', selected?.value || '');
                // Auto-add to followers if not already present
                if (selected?.value && !values.follower_list?.includes(selected.value)) {
                  const newFollowers = [...(values.follower_list || []), selected.value];
                  setFieldValue('follower_list', newFollowers);
                }
              }}
              className="text-sm"
              classNamePrefix="select"
              placeholder="Select user..."
              styles={selectStyles}
              menuPortalTarget={document.body}
              isLoading={loadingUsers}
            />
          </div>
        </div>
      </div>

      {/* Follower Selection Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Followers</h3>
        <div className="space-y-4">
          {/* Follower Multi-Select Dropdown */}
          <div>
            <label className={labelClasses}>Add Followers</label>
            <Select
              isMulti
              options={users
                .filter(user => !values.follower_list?.includes(user._id)) // Exclude already selected followers
                .map(user => ({ 
                  value: user._id, 
                  label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown',
                  email: user.email
                }))}
              onChange={(selected) => {
                if (selected) {
                  const newFollowerIds = selected.map(option => option.value);
                  const currentFollowers = values.follower_list || [];
                  const updatedFollowers = [...currentFollowers, ...newFollowerIds];
                  setFieldValue('follower_list', updatedFollowers);
                }
              }}
              className="text-sm"
              classNamePrefix="select"
              placeholder="Search and select followers..."
              styles={selectStyles}
              menuPortalTarget={document.body}
              isLoading={loadingUsers}
              isClearable
              isSearchable
              noOptionsMessage={() => "No users available"}
              loadingMessage={() => "Loading users..."}
            />
            <p className="text-xs text-gray-500 mt-1">
              Selected users will be automatically notified about this funding
            </p>
          </div>

          {/* Selected Followers List */}
          {values.follower_list && values.follower_list.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">
                  Selected Followers ({values.follower_list.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setFieldValue('follower_list', [])}
                  className="text-xs text-red-600 hover:text-red-800 hover:underline"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {values.follower_list.map((followerId: string) => {
                  const follower = users.find(user => user._id === followerId);
                  if (!follower) return null;
                  
                  const isAutoAdded = followerId === values.assigned_manager || followerId === values.assigned_user;
                  
                  return (
                    <div 
                      key={followerId} 
                      className={`flex items-center justify-between p-2 rounded-lg border ${
                        isAutoAdded ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {/* User Avatar */}
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700">
                            {follower.first_name?.[0]?.toUpperCase() || follower.email?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                        
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {`${follower.first_name || ''} ${follower.last_name || ''}`.trim() || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {follower.email}
                          </div>
                        </div>
                        
                        {/* Auto-added badge */}
                        {isAutoAdded && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Auto
                          </span>
                        )}
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const newFollowers = values.follower_list.filter((id: string) => id !== followerId);
                          setFieldValue('follower_list', newFollowers);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors duration-150 p-1 rounded-full"
                        title="Remove follower"
                        aria-label="Remove follower"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!values.follower_list || values.follower_list.length === 0) && (
            <div className="text-center py-6 text-gray-500">
              {/* Use Heroicons UserGroupIcon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-7.13a4 4 0 11-8 0 4 4 0 018 0zm6 10v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a6 6 0 0112 0z" />
              </svg>
              <p className="mt-2 text-sm">No followers selected</p>
              <p className="text-xs">Add followers to keep them updated about this funding</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
        <div className="flex items-center h-10 gap-4">
          <div className="flex-1">
            <Select
              name="status"
              options={fundingStatuses.map(status => ({
                value: status._id,
                label: status.name
              }))}
              value={fundingStatuses.find(status => status._id === values.status) ? {
                value: values.status,
                label: fundingStatuses.find(status => status._id === values.status)?.name || ''
              } : null}
              onChange={selected => setFieldValue('status', selected?.value || '')}
              className="text-sm"
              classNamePrefix="select"
              placeholder="Select status..."
              styles={selectStyles}
              menuPortalTarget={document.body}
              isLoading={loadingFundingStatuses}
            />
          </div>
          <label className="flex items-center text-sm font-normal ml-2">
            <Field type="checkbox" name="internal" className="mr-2" />
            Internal
          </label>
        </div>
      </div>
    </div>
  );
};

export default Step2_BasicInfo; 