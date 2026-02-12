'use client';

import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Application } from '@/types/application';
import { FeeType } from '@/types/feeType';
import { User } from '@/types/user';
import { Lender } from '@/types/lender';
import clsx from 'clsx';
import {
  calculateFactorRate,
  calculateBuyRate,
  calculateDisbursementAmount,
  calculatePaymentAmount,
  calculateTermLength,
  calculateTotalFees
} from '@/lib/utils/calculations';
import { calculateFormula } from '@/lib/api/formulas';
import { DAY_MAPPING, DayNumber, ALL_DAY_NUMBERS } from '@/types/day';
import { ApplicationOfferStatus, FrequencyType, FrequencyTypeList, ApplicationOfferStatusList } from '@/types/applicationOffer';
import { getDefaultPaydayList, getAvailableDays } from '@/lib/utils/paydayUtils';
import Select from 'react-select';
import { ExpenseType } from '@/types/expenseType';

export interface ApplicationOfferFormValues {
  application: string;
  lender: string;
  offered_amount: number | string;
  payback_amount: number | string;
  fee_list: { name: string; fee_type: string; amount: number | string }[];
  frequency: FrequencyType;
  payday_list: DayNumber[];
  commission_amount: number | string;
  payback_count: number | string;
  offered_date: string;
  offered_by_user: string;
  disbursement_amount: number | string;
  payment_amount: number | string;
  term_length: number | string;
  factor_rate: number | string;
  buy_rate: number | string;
  total_fees: number;
  status: ApplicationOfferStatus | '';
  avoid_holiday: boolean;
  expense_list: { name: string; expense_type: string; amount: number | string; syndication: true }[];
  loading: boolean;
}

interface ApplicationOfferFormProps {
  initialValues: ApplicationOfferFormValues;
  onSubmit: (values: ApplicationOfferFormValues) => Promise<void>;
  onCancel: () => void;
  error?: string;
  loading?: boolean;
  mode: 'create' | 'update';
  applications: Application[];
  feeTypes: FeeType[];
  expenseTypes: ExpenseType[];
  users: User[];
  lenders: Lender[];
  setSelectedApplication: (application: Application | null) => void;
  lockApplication?: boolean;
  selectedApplication: Application | null;
  currentUser: User;
  currentLender?: Lender;
}

const validationSchema = Yup.object().shape({
  application: Yup.string().required('Application is required'),
  lender: Yup.string().required('Lender is required'),
  offered_amount: Yup.number().moreThan(0, 'Must be greater than 0').required('Offered amount is required'),
  payback_amount: Yup.number()
    .min(0, 'Must be at least 0')
    .required('Payback amount is required')
    .test('is-greater', 'Payback amount must be greater than offered amount', function (value) {
      const { offered_amount } = this.parent;
      const payback = Number(value);
      const offered = Number(offered_amount);
      if (isNaN(payback) || isNaN(offered)) return true;
      return payback > offered;
    }),
  fee_list: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('Fee name is required'),
      fee_type: Yup.string().optional(),
      amount: Yup.number().required('Fee amount is required'),
    })
  ),
  expense_list: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('Expense name is required'),
      expense_type: Yup.string().optional(),
      amount: Yup.number().required('Expense amount is required'),
    })
  ),
  frequency: Yup.string().oneOf(FrequencyTypeList, 'Invalid frequency').required('Frequency is required'),
  payday_list: Yup.array()
    .of(Yup.number().min(1, 'Must be at least 1').max(31, 'Must be at most 31'))
    .min(1, 'At least one payment day must be selected')
    .required('Payment days are required'),
  commission_amount: Yup.number()
    .min(0, 'Must be at least 0')
    .required('Commission amount is required')
    .test('is-less', 'Commission amount must be less than offered amount', function (value) {
      const { offered_amount } = this.parent;
      const commission = Number(value);
      const offered = Number(offered_amount);
      if (isNaN(commission) || isNaN(offered)) return true;
      return commission < offered;
    }),
  payback_count: Yup.number().moreThan(0, 'Must be at least 1').required('Payback count is required'),
  offered_date: Yup.string().required('Offered date is required'),
  offered_by_user: Yup.string().required('Offer by is required'),
  status: Yup.string().required('Status is required'),
  total_fees: Yup.number()
    .test('is-less', 'Total fees must be less than offered amount', function (value) {
      const { offered_amount } = this.parent;
      const total = Number(value);
      const offered = Number(offered_amount);
      if (isNaN(total) || isNaN(offered)) return true;
      return total < offered;
    }),
  // Calculated fields don't need validation since they're computed automatically
});

// Helper function to initialize fee list with fee types that are marked as default
const initializeFeeList = async (
  feeTypesData: FeeType[],
  offeredAmount: number,
  setFieldValue: (field: string, value: any) => void
) => {
  // Filter to only include fee types that are marked as default
  const defaultFeeTypes = feeTypesData.filter(feeType => feeType.default);
  return Promise.all(
    defaultFeeTypes.map(async feeType => {
      let amount = 0;
      if (feeType.formula) {
        try {
          amount = await calculateFormula({
            formulaId: typeof feeType.formula === 'string' ? feeType.formula : feeType.formula._id,
            fund: offeredAmount,
            payback: offeredAmount
          });
        } catch (err) {
          console.error(`Error calculating formula for fee type ${feeType.name}:`, err);
        }
      }
      return {
        fee_type: feeType._id,
        amount,
        name: feeType.name || ''
      };
    })
  );
};

// Helper function to calculate and update total fees
const updateTotalFees = (feeList: { fee_type: string; amount: number | string }[], setFieldValue: (field: string, value: any) => void) => {
  const total = feeList.reduce((sum, fee) => {
    const amount = typeof fee.amount === 'string' ? parseFloat(fee.amount) || 0 : fee.amount || 0;
    return sum + amount;
  }, 0);
  setFieldValue('total_fees', Number(total.toFixed(2)));
};

// Helper function to calculate and update commission amount from total expenses
const updateCommissionAmount = (expenseList: { amount: number | string }[], setFieldValue: (field: string, value: any) => void) => {
  const total = expenseList.reduce((sum, expense) => {
    const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0;
    return sum + amount;
  }, 0);
  setFieldValue('commission_amount', Number(total.toFixed(2)));
};

// Helper function to recalculate fee amounts using formulas
const recalculateFeeAmounts = async (
  offeredAmount: number,
  paybackAmount: number,
  currentFeeList: { fee_type: string; amount: number | string }[],
  feeTypes: FeeType[],
  setFieldValue: (field: string, value: any) => void
) => {
  if (!feeTypes.length || !offeredAmount || !paybackAmount) {
    return;
  }

  try {
    const updatedFeeList = await Promise.all(
      currentFeeList.map(async (fee) => {
        // Only recalculate if there's a fee type selected
        if (!fee.fee_type) {
          return fee;
        }

        const feeType = feeTypes.find(ft => ft._id === fee.fee_type);

        if (feeType?.formula) {
          try {
            const calculatedAmount = await calculateFormula({
              formulaId: typeof feeType.formula === 'string' ? feeType.formula : feeType.formula._id,
              fund: offeredAmount,
              payback: paybackAmount
            });
            return { ...fee, amount: calculatedAmount };
          } catch (err) {
            console.error(`Error calculating formula for fee type ${feeType.name}:`, err);
            return fee; // Keep original amount if calculation fails
          }
        }

        return fee; // Keep original amount if no formula
      })
    );

    setFieldValue('fee_list', updatedFeeList);
    updateTotalFees(updatedFeeList, setFieldValue);
  } catch (error) {
    console.error('Failed to recalculate fee amounts:', error);
  }
};

// Helper function to initialize expense list with expense types that are marked as default
const initializeExpenseList = async (
  expenseTypesData: ExpenseType[],
  offeredAmount: number,
  setFieldValue: (field: string, value: any) => void
) => {
  // Filter to only include expense types that are marked as default
  const defaultExpenseTypes = expenseTypesData.filter(expenseType => expenseType.default);
  
  return Promise.all(
    defaultExpenseTypes.map(async expenseType => {
      let amount = 0;
      if (expenseType.formula) {
        try {
          amount = await calculateFormula({
            formulaId: typeof expenseType.formula === 'string' ? expenseType.formula : expenseType.formula._id,
            fund: offeredAmount,
            payback: offeredAmount
          });
        } catch (err) {
          console.error(`Error calculating formula for expense type ${expenseType.name}:`, err);
        }
      }
      return {
        expense_type: expenseType._id,
        amount,
        name: expenseType.name || '',
        syndication: true
      };
    })
  );
};

export default function ApplicationOfferForm({
  initialValues,
  onSubmit,
  onCancel,
  error,
  loading,
  mode,
  applications,
  feeTypes,
  expenseTypes,
  users,
  lenders,
  setSelectedApplication,
  lockApplication,
  selectedApplication,
  currentUser,
  currentLender
}: ApplicationOfferFormProps) {
  const [loadingLists, setLoadingLists] = useState({
    applications: false,
    feeTypes: false,
    users: false
  });

  const calculatedFieldClasses = clsx(
    'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50',
    loading && 'animate-pulse'
  );

  const inputClasses = clsx(
    'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
    loading && 'animate-pulse'
  );

  const labelClasses = 'block text-sm font-medium text-gray-700';
  const errorClasses = 'mt-1 text-sm text-red-600';

  return (
    <Formik
      key={selectedApplication?._id || 'no-application'}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {({ values, setFieldValue, errors, touched }) => {
        // Initialize values when application changes
        useEffect(() => {
          if (!selectedApplication?.request_amount || !currentUser?._id || mode !== 'create') return;

          const initializeValues = async () => {
            setFieldValue('loading', true);
            const offeredAmount = Number(selectedApplication.request_amount);
            const initialFeeList = await initializeFeeList(feeTypes, offeredAmount, setFieldValue);
            const initialExpenseList = await initializeExpenseList(expenseTypes, offeredAmount, setFieldValue);

            // Set initial values
            setFieldValue('application', selectedApplication._id);
            setFieldValue('offered_amount', offeredAmount);
            setFieldValue('payback_amount', offeredAmount * 1.5);
            setFieldValue('fee_list', initialFeeList);
            setFieldValue('offered_by_user', currentUser._id);
            setFieldValue('payback_count', 10);
            setFieldValue('frequency', FrequencyTypeList[0]);
            setFieldValue('payday_list', [2, 3, 4, 5, 6]);
            setFieldValue('status', ApplicationOfferStatusList[0]);
            setFieldValue('avoid_holiday', false);

            // Initialize expense list with default expense types and set commission to total
            setFieldValue('expense_list', initialExpenseList);
            const totalExpenses = initialExpenseList.reduce((sum, expense) => sum + (typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0), 0);
            setFieldValue('commission_amount', totalExpenses);

            // Calculate all derived values
            const factorRate = calculateFactorRate(offeredAmount, offeredAmount * 1.5) || 0;
            const buyRate = calculateBuyRate(offeredAmount * 1.5, offeredAmount * 0.1, offeredAmount) || 0;
            const termLength = calculateTermLength(10, [2, 3, 4, 5, 6], FrequencyTypeList[0]) || 0;
            const paymentAmount = calculatePaymentAmount(offeredAmount * 1.5, 10) || 0;
            const totalFees = calculateTotalFees(initialFeeList.map(fee => ({ amount: Number(fee.amount) })));
            const disbursementAmount = calculateDisbursementAmount(offeredAmount, totalFees) || 0;

            setFieldValue('factor_rate', factorRate);
            setFieldValue('buy_rate', buyRate);
            setFieldValue('term_length', termLength);
            setFieldValue('payment_amount', paymentAmount);
            setFieldValue('disbursement_amount', disbursementAmount);
            setFieldValue('total_fees', totalFees);
            setFieldValue('loading', false);
          };

          initializeValues();
        }, [selectedApplication, currentUser, mode, feeTypes, setFieldValue]);

        // Match fee types with their amounts when form initializes
        useEffect(() => {
          const matchFeeTypes = async () => {
            if (!feeTypes.length || !initialValues.fee_list.length) return;

            const offeredAmount = parseFloat(String(initialValues.offered_amount)) || 0;
            const paybackAmount = parseFloat(String(initialValues.payback_amount)) || 0;

            if (!offeredAmount || !paybackAmount) return;

            const matchedFeeList = await Promise.all(
              initialValues.fee_list.map(async (fee) => {
                // If fee already has a fee type, keep it and ensure name field is set
                if (fee.fee_type) {
                  const feeType = feeTypes.find(ft => ft._id === fee.fee_type);
                  return {
                    ...fee,
                    name: fee.name || feeType?.name || ''
                  };
                }

                // Try to match by formula calculation only for fees without a fee type
                for (const feeType of feeTypes) {
                  if (feeType.formula) {
                    try {
                      const formulaId = typeof feeType.formula === 'string' ? feeType.formula : feeType.formula._id;
                      const calculatedAmount = await calculateFormula({
                        formulaId,
                        fund: offeredAmount,
                        payback: paybackAmount
                      });

                      // Use a small tolerance for floating point comparison
                      const feeAmount = typeof fee.amount === 'string' ? parseFloat(fee.amount) : fee.amount;
                      const diff = Math.abs(calculatedAmount - feeAmount);
                      if (diff < 0.01) {
                        return {
                          ...fee,
                          fee_type: feeType._id,
                          name: feeType.name || ''
                        };
                      }
                    } catch (err) {
                      console.error(`Error calculating formula for fee type ${feeType.name}:`, err);
                    }
                  }
                }
                return fee;
              })
            );

            setFieldValue('fee_list', matchedFeeList);
          };

          matchFeeTypes();
        }, [feeTypes, initialValues.fee_list, initialValues.offered_amount, initialValues.payback_amount]);

        // Individual calculation helper functions
        const updateFactorAndBuyRates = (offeredAmount: number, paybackAmount: number, commissionAmount: number, setFieldValue: (field: string, value: any) => void) => {
          if (offeredAmount && paybackAmount) {
            setFieldValue('factor_rate', calculateFactorRate(offeredAmount, paybackAmount) || '');
            setFieldValue('buy_rate', calculateBuyRate(paybackAmount, commissionAmount, offeredAmount) || '');
          }
        };

        const updateDisbursementAmount = (offeredAmount: number, feeList: any[], commissionAmount: number, setFieldValue: (field: string, value: any) => void) => {
          if (offeredAmount) {
            const totalFees = calculateTotalFees(feeList.map(fee => ({
              amount: parseFloat(String(fee.amount)) || 0
            })));
            setFieldValue('disbursement_amount', calculateDisbursementAmount(offeredAmount, totalFees) || '');
          }
        };

        // Helper function to update term and payment length
        const updateTermAndPaymentLength = (paybackCount: number, paybackAmount: number, frequency: FrequencyType, paydayList: number[], setFieldValue: (field: string, value: any) => void) => {
          if (frequency && paybackCount) {
            const termLength = calculateTermLength(paybackCount, paydayList, frequency);
            setFieldValue('term_length', termLength || '');

            if (paybackCount && paybackAmount) {
              setFieldValue('payment_amount', calculatePaymentAmount(paybackAmount, paybackCount) || '');
            }
          }
        };

        const updatePaymentAmount = (paybackAmount: number, paybackCount: number, setFieldValue: (field: string, value: any) => void) => {
          if (paybackCount && paybackAmount) {
            setFieldValue('payment_amount', calculatePaymentAmount(paybackAmount, paybackCount) || '');
          }
        };

        // Fee list management functions
        const addFee = async (setFieldValue: (field: string, value: any) => void, currentFeeList: { name: string; fee_type: string; amount: number | string }[], currentValues: ApplicationOfferFormValues) => {
          // Get the first available fee type that isn't already in the list
          const usedFeeTypeIds = new Set(currentFeeList.map(fee => fee.fee_type));
          const availableFeeType = feeTypes.find(ft => !usedFeeTypeIds.has(ft._id));

          const newFee = {
            fee_type: availableFeeType?._id || '',
            amount: 0,
            name: availableFeeType?.name || ''
          };
          const updatedList = [...currentFeeList, newFee];
          setFieldValue('fee_list', updatedList);

          // If we have a fee type selected and it has a formula, calculate it
          if (availableFeeType?.formula) {
            const offeredAmount = parseFloat(String(currentValues.offered_amount)) || 0;
            const paybackAmount = parseFloat(String(currentValues.payback_amount)) || 0;

            if (offeredAmount && paybackAmount) {
              await recalculateFeeAmounts(offeredAmount, paybackAmount, updatedList, feeTypes, setFieldValue);
            }
          } else {
            updateTotalFees(updatedList, setFieldValue);
          }
        };

        const removeFee = (index: number, setFieldValue: (field: string, value: any) => void, currentFeeList: { name: string; fee_type: string; amount: number | string }[], currentValues: ApplicationOfferFormValues) => {
          const updatedFeeList = currentFeeList.filter((_, i) => i !== index);
          setFieldValue('fee_list', updatedFeeList);
          updateTotalFees(updatedFeeList, setFieldValue);

          // Recalculate disbursement amount
          const offeredAmount = parseFloat(String(currentValues.offered_amount)) || 0;
          const commissionAmount = parseFloat(String(currentValues.commission_amount)) || 0;
          if (offeredAmount) {
            const totalFees = calculateTotalFees(updatedFeeList.map(fee => ({
              amount: parseFloat(String(fee.amount)) || 0
            })));
            setFieldValue('disbursement_amount', calculateDisbursementAmount(offeredAmount, totalFees) || '');
          }
        };

        const updateFee = async (
          index: number,
          field: 'fee_type' | 'amount',
          value: string | number,
          setFieldValue: (field: string, value: any) => void,
          currentFeeList: { name: string; fee_type: string; amount: number | string }[],
          currentValues: ApplicationOfferFormValues
        ) => {
          const updatedFeeList = [...currentFeeList];
          if (field === 'fee_type') {
            const selectedFeeType = feeTypes.find(ft => ft._id === String(value));
            updatedFeeList[index] = {
              ...updatedFeeList[index],
              fee_type: String(value),
              name: selectedFeeType && selectedFeeType.name ? selectedFeeType.name : ''
            };
            setFieldValue('fee_list', updatedFeeList);
          } else {
            updatedFeeList[index] = { ...updatedFeeList[index], [field]: value };
            setFieldValue('fee_list', updatedFeeList);
          }

          // If fee type changed, check if it has a formula and calculate
          if (field === 'fee_type') {
            const selectedFeeType = feeTypes.find(ft => ft._id === String(value));
            if (selectedFeeType?.formula) {
              const offeredAmount = parseFloat(String(currentValues.offered_amount)) || 0;
              const paybackAmount = parseFloat(String(currentValues.payback_amount)) || 0;

              if (offeredAmount && paybackAmount) {
                try {
                  const calculatedAmount = await calculateFormula({
                    formulaId: typeof selectedFeeType.formula === 'string' ? selectedFeeType.formula : selectedFeeType.formula._id,
                    fund: offeredAmount,
                    payback: paybackAmount
                  });

                  // Update just this fee's amount
                  const newFeeList = [...updatedFeeList];
                  newFeeList[index] = { ...newFeeList[index], amount: calculatedAmount };
                  setFieldValue('fee_list', newFeeList);
                  updateTotalFees(newFeeList, setFieldValue);

                  // Update disbursement amount
                  const commissionAmount = parseFloat(String(currentValues.commission_amount)) || 0;
                  const totalFees = calculateTotalFees(newFeeList.map(fee => ({
                    amount: parseFloat(String(fee.amount)) || 0
                  })));
                  setFieldValue('disbursement_amount', calculateDisbursementAmount(offeredAmount, totalFees) || '');
                  return;
                } catch (err) {
                  console.error(`Error calculating formula for fee type ${selectedFeeType.name}:`, err);
                }
              }
            }
          }

          // For amount changes or if formula calculation failed
          updateTotalFees(updatedFeeList, setFieldValue);

          // Update disbursement amount
          const offeredAmount = parseFloat(String(currentValues.offered_amount)) || 0;
          const commissionAmount = parseFloat(String(currentValues.commission_amount)) || 0;
          if (offeredAmount) {
            const totalFees = calculateTotalFees(updatedFeeList.map(fee => ({
              amount: parseFloat(String(fee.amount)) || 0
            })));
            setFieldValue('disbursement_amount', calculateDisbursementAmount(offeredAmount, totalFees) || '');
          }
        };

        const setDefaultPaydayList = (frequency: FrequencyType, setFieldValue: (field: string, value: any) => void) => {
          setFieldValue('payday_list', getDefaultPaydayList(frequency));
        };

        // Expense list management functions
        const addExpense = async (setFieldValue: (field: string, value: any) => void, currentExpenseList: { name: string; expense_type: string; amount: number | string; syndication: true }[], currentValues: ApplicationOfferFormValues) => {
          // Get the first available expense type that isn't already in the list
          const usedExpenseTypeIds = new Set(currentExpenseList.map(expense => expense.expense_type));
          const availableExpenseType = expenseTypes.find(et => !usedExpenseTypeIds.has(et._id));

          const newExpense = {
            expense_type: availableExpenseType?._id || '',
            amount: 0,
            name: availableExpenseType?.name || '',
            syndication: true
          };
          const updatedList = [...currentExpenseList, newExpense];
          setFieldValue('expense_list', updatedList);

          // Update commission amount
          updateCommissionAmount(updatedList, setFieldValue);

          // If we have an expense type selected and it has a formula, calculate it
          if (availableExpenseType?.formula) {
            const offeredAmount = parseFloat(String(currentValues.offered_amount)) || 0;
            const paybackAmount = parseFloat(String(currentValues.payback_amount)) || 0;

            if (offeredAmount && paybackAmount) {
              await recalculateExpenseAmounts(offeredAmount, paybackAmount, updatedList, setFieldValue);
            }
          }
        };

        const removeExpense = (index: number, setFieldValue: (field: string, value: any) => void, currentExpenseList: { name: string; expense_type: string; amount: number | string; syndication: true }[], currentValues: ApplicationOfferFormValues) => {
          const updatedExpenseList = currentExpenseList.filter((_, i) => i !== index);
          setFieldValue('expense_list', updatedExpenseList);
          
          // Update commission amount
          updateCommissionAmount(updatedExpenseList, setFieldValue);
        };

        const updateExpense = async (
          index: number,
          field: 'expense_type' | 'amount',
          value: string | number,
          setFieldValue: (field: string, value: any) => void,
          currentExpenseList: { name: string; expense_type: string; amount: number | string; syndication: true }[],
          currentValues: ApplicationOfferFormValues
        ) => {
          const updatedExpenseList = [...currentExpenseList];
          if (field === 'expense_type') {
            const selectedExpenseType = expenseTypes.find(et => et._id === String(value));
            updatedExpenseList[index] = {
              ...updatedExpenseList[index],
              expense_type: String(value),
              name: selectedExpenseType && selectedExpenseType.name ? selectedExpenseType.name : ''
            };
            setFieldValue('expense_list', updatedExpenseList);
          } else {
            updatedExpenseList[index] = { ...updatedExpenseList[index], [field]: value };
            setFieldValue('expense_list', updatedExpenseList);
          }

          // Update commission amount
          updateCommissionAmount(updatedExpenseList, setFieldValue);

          // If expense type changed, check if it has a formula and calculate
          if (field === 'expense_type') {
            const selectedExpenseType = expenseTypes.find(et => et._id === String(value));
            if (selectedExpenseType?.formula) {
              const offeredAmount = parseFloat(String(currentValues.offered_amount)) || 0;
              const paybackAmount = parseFloat(String(currentValues.payback_amount)) || 0;

              if (offeredAmount && paybackAmount) {
                try {
                  const calculatedAmount = await calculateFormula({
                    formulaId: typeof selectedExpenseType.formula === 'string' ? selectedExpenseType.formula : selectedExpenseType.formula._id,
                    fund: offeredAmount,
                    payback: paybackAmount
                  });

                  // Update just this expense's amount
                  const newExpenseList = [...updatedExpenseList];
                  newExpenseList[index] = { ...newExpenseList[index], amount: calculatedAmount };
                  setFieldValue('expense_list', newExpenseList);
                  
                  // Update commission amount again after formula calculation
                  updateCommissionAmount(newExpenseList, setFieldValue);
                  return;
                } catch (err) {
                  console.error(`Error calculating formula for expense type ${selectedExpenseType.name}:`, err);
                }
              }
            }
          }
        };

        // Helper function to recalculate expense amounts using formulas
        const recalculateExpenseAmounts = async (
          offeredAmount: number,
          paybackAmount: number,
          currentExpenseList: { expense_type: string; amount: number | string }[],
          setFieldValue: (field: string, value: any) => void
        ) => {
          if (!expenseTypes.length || !offeredAmount || !paybackAmount) {
            return;
          }

          try {
            const updatedExpenseList = await Promise.all(
              currentExpenseList.map(async (expense) => {
                // Only recalculate if there's an expense type selected
                if (!expense.expense_type) {
                  return expense;
                }

                const expenseType = expenseTypes.find(et => et._id === expense.expense_type);

                if (expenseType?.formula) {
                  try {
                    const calculatedAmount = await calculateFormula({
                      formulaId: typeof expenseType.formula === 'string' ? expenseType.formula : expenseType.formula._id,
                      fund: offeredAmount,
                      payback: paybackAmount
                    });
                    return { ...expense, amount: calculatedAmount };
                  } catch (err) {
                    console.error(`Error calculating formula for expense type ${expenseType.name}:`, err);
                    return expense; // Keep original amount if calculation fails
                  }
                }

                return expense; // Keep original amount if no formula
              })
            );

            setFieldValue('expense_list', updatedExpenseList);
            
            // Update commission amount after recalculating all expenses
            updateCommissionAmount(updatedExpenseList, setFieldValue);
          } catch (error) {
            console.error('Failed to recalculate expense amounts:', error);
          }
        };

        return (
          <Form className="relative w-full">
            {/* Loading Overlay */}
            {(loading || values.loading) && (
              <div className="absolute inset-0 bg-white bg-opacity-50 z-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            {/* Helper variable for locking fields in create mode when no application is selected */}
            {(() => {
              const shouldLockFields = mode === 'create' && !values.application;
              return (
                <div className="space-y-6">
                  {/* Show error message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-red-700">{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Input Fields Section */}
                  {/* Row 1 - Application */}
                  <div>
                    <label htmlFor="application" className={labelClasses}>
                      Application
                    </label>
                    <Select
                      name="application"
                      options={applications.map(app => ({ value: app._id, label: app.name }))}
                      value={values.application ? {
                        value: values.application,
                        label: applications.find(app => app._id === values.application)?.name || ''
                      } : null}
                      onChange={async (selected) => {
                        const value = selected?.value || '';
                        setFieldValue('application', value);
                        if (value) {
                          const application = applications.find(app => app._id === value);
                          setSelectedApplication(application || null);
                        } else {
                          setSelectedApplication(null);
                          setFieldValue('offered_amount', '');
                          setFieldValue('payback_amount', '');
                          setFieldValue('commission_amount', '');
                          setFieldValue('fee_list', []);
                          setFieldValue('lender', '');
                          setFieldValue('disbursement_amount', '');
                          setFieldValue('factor_rate', '');
                          setFieldValue('buy_rate', '');
                          setFieldValue('payback_count', '');
                          setFieldValue('term_length', '');
                          setFieldValue('payment_amount', '');
                          setFieldValue('total_fees', 0);
                          setFieldValue('status', ApplicationOfferStatusList[0]);
                        }
                      }}
                      className="text-sm"
                      classNamePrefix="select"
                      placeholder="Please select application first..."
                      isClearable
                      isSearchable
                      isDisabled={lockApplication}
                      isLoading={loadingLists.applications}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                        menu: (base) => ({ ...base, zIndex: 99999 }),
                        control: (base, state) => ({
                          ...base,
                          backgroundColor: state.isDisabled ? '#f9fafb' : 'white',
                          borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                          '&:hover': {
                            borderColor: state.isFocused ? '#3b82f6' : '#9ca3af'
                          }
                        }),
                        singleValue: (base, state) => ({
                          ...base,
                          color: state.isDisabled ? '#111827' : base.color
                        }),
                        placeholder: (base, state) => ({
                          ...base,
                          color: state.isDisabled ? '#6b7280' : base.color
                        })
                      }}
                      menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                      menuPosition="fixed"
                    />
                    {errors.application && (
                      <div className="mt-1">
                        <ErrorMessage name="application" component="div" className={errorClasses} />
                      </div>
                    )}
                  </div>

                  {/* Row 2 - Funder and Lender */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="funder" className={labelClasses}>
                        Funder
                      </label>
                      <input
                        type="text"
                        name="funder"
                        value={selectedApplication?.funder?.name || ''}
                        className={inputClasses}
                        placeholder=""
                        disabled
                      />
                    </div>

                    <div>
                      <label htmlFor="lender" className={labelClasses}>
                        Lender
                      </label>
                      <Select
                        name="lender"
                        options={lenders.map(lender => ({ value: lender._id, label: lender.name }))}
                        value={values.lender ? {
                          value: values.lender,
                          label: currentLender ? currentLender.name : lenders.find(lender => lender._id === values.lender)?.name || ''
                        } : null}
                        onChange={(selected) => {
                          setFieldValue('lender', selected?.value || '');
                        }}
                        className="text-sm"
                        classNamePrefix="select"
                        placeholder="Select lender..."
                        isClearable
                        isSearchable
                        isDisabled={shouldLockFields || mode === 'update' || loading}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                          menu: (base) => ({ ...base, zIndex: 99999 }),
                          control: (base, state) => ({
                            ...base,
                            backgroundColor: state.isDisabled ? '#f9fafb' : 'white',
                            borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                            '&:hover': {
                              borderColor: state.isFocused ? '#3b82f6' : '#9ca3af'
                            }
                          }),
                          singleValue: (base, state) => ({
                            ...base,
                            color: state.isDisabled ? '#111827' : base.color
                          }),
                          placeholder: (base, state) => ({
                            ...base,
                            color: state.isDisabled ? '#6b7280' : base.color
                          })
                        }}
                        menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                        menuPosition="fixed"
                      />
                      {errors.lender && (
                        <div className="mt-1">
                          <ErrorMessage name="lender" component="div" className={errorClasses} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 3 - Merchant and ISO */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="merchant" className={labelClasses}>
                        Merchant
                      </label>
                      <input
                        type="text"
                        name="merchant"
                        value={selectedApplication?.merchant?.name || ''}
                        className={inputClasses}
                        placeholder=""
                        disabled
                      />
                    </div>

                    <div>
                      <label htmlFor="iso" className={labelClasses}>
                        ISO
                      </label>
                      <input
                        type="text"
                        name="iso"
                        value={selectedApplication?.iso?.name || ''}
                        className={inputClasses}
                        placeholder=""
                        disabled
                      />
                    </div>
                  </div>

                  {/* Row 4 - Offered Amount, Payback Amount, Commission Amount */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="offered_amount" className={labelClasses}>
                        Offered Amount
                      </label>
                      <Field
                        type="number"
                        id="offered_amount"
                        name="offered_amount"
                        className={inputClasses}
                        placeholder="0.00"
                        disabled={shouldLockFields}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value === '' ? '' : parseFloat(e.target.value) || '';
                          setFieldValue('offered_amount', value);

                          // Recalculate fee amounts if both offered and payback amounts are available
                          if (value && values.payback_amount) {
                            recalculateFeeAmounts(
                              typeof value === 'number' ? value : parseFloat(value),
                              typeof values.payback_amount === 'number' ? values.payback_amount : parseFloat(values.payback_amount),
                              values.fee_list,
                              feeTypes,
                              setFieldValue
                            );
                          }

                          // Calculate related fields
                          const offeredAmount = parseFloat(String(value)) || 0;
                          const paybackAmount = parseFloat(String(values.payback_amount)) || 0;
                          const commissionAmount = parseFloat(String(values.commission_amount)) || 0;

                          updateFactorAndBuyRates(offeredAmount, paybackAmount, commissionAmount, setFieldValue);
                          updateDisbursementAmount(offeredAmount, values.fee_list, commissionAmount, setFieldValue);
                        }}
                      />
                      {errors.offered_amount && (
                        <div className="mt-1">
                          <ErrorMessage name="offered_amount" component="div" className={errorClasses} />
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="payback_amount" className={labelClasses}>
                        Payback Amount
                      </label>
                      <Field
                        type="number"
                        id="payback_amount"
                        name="payback_amount"
                        className={inputClasses}
                        placeholder="0.00"
                        disabled={shouldLockFields}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value === '' ? '' : parseFloat(e.target.value) || '';
                          setFieldValue('payback_amount', value);

                          // Recalculate fee amounts if both offered and payback amounts are available
                          if (value && values.offered_amount) {
                            recalculateFeeAmounts(
                              typeof values.offered_amount === 'number' ? values.offered_amount : parseFloat(values.offered_amount),
                              typeof value === 'number' ? value : parseFloat(value),
                              values.fee_list,
                              feeTypes,
                              setFieldValue
                            );
                          }

                          // Calculate related fields  
                          const offeredAmount = parseFloat(String(values.offered_amount)) || 0;
                          const paybackAmount = parseFloat(String(value)) || 0;
                          const commissionAmount = parseFloat(String(values.commission_amount)) || 0;

                          updateFactorAndBuyRates(offeredAmount, paybackAmount, commissionAmount, setFieldValue);
                          updatePaymentAmount(paybackAmount, parseFloat(String(values.payback_count)) || 0, setFieldValue);
                        }}
                      />
                      {errors.payback_amount && (
                        <div className="mt-1">
                          <ErrorMessage name="payback_amount" component="div" className={errorClasses} />
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="commission_amount" className={labelClasses}>
                        Commission Amount <span className="text-gray-500">(calculated)</span>
                      </label>
                      <Field
                        type="number"
                        id="commission_amount"
                        name="commission_amount"
                        className={calculatedFieldClasses}
                        placeholder="0.00"
                        readOnly
                      />
                      {errors.commission_amount && (
                        <div className="mt-1">
                          <ErrorMessage name="commission_amount" component="div" className={errorClasses} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expense List Section */}
                  <div>
                    <label className={labelClasses}>Expense List </label>
                    {values.expense_list.length === 0 ? (
                      <div className="border border-gray-200 rounded mt-1">
                        <div className="text-sm text-gray-500 italic text-center py-8">
                          No expenses added. Click below to add expenses.
                        </div>
                        <button
                          type="button"
                          onClick={() => addExpense(setFieldValue, values.expense_list, values)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-green-600 bg-green-50 border-t border-gray-200 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset transition-colors duration-200"
                          disabled={shouldLockFields}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Expense
                        </button>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded mt-1">
                        {/* Header Row */}
                        <div className="flex items-center bg-gray-50 border-b border-gray-200 px-3 py-2 w-full">
                          <div className="flex-1">
                            <span className="block text-xs font-medium text-gray-700">Expense Name *</span>
                          </div>
                          <div className="flex-1">
                            <span className="block text-xs font-medium text-gray-700">Expense Type</span>
                          </div>
                          <div className="flex-1">
                            <span className="block text-xs font-medium text-gray-700">Amount</span>
                          </div>
                          <div className="w-10 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => addExpense(setFieldValue, values.expense_list, values)}
                              className="w-8 h-8 flex items-center justify-center text-green-600 hover:text-green-800 hover:bg-green-100 bg-green-50 rounded border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                              title="Add Expense"
                              disabled={shouldLockFields}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Expense Entries */}
                        <div className="divide-y divide-gray-200">
                          {values.expense_list.map((expense, index) => (
                            <div key={index}>
                              <div className="flex items-center gap-3 px-3 py-2 w-full">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    name={`expense_list[${index}].name`}
                                    value={expense.name || ''}
                                    onChange={e => {
                                      const updatedExpenseList = [...values.expense_list];
                                      updatedExpenseList[index] = { ...updatedExpenseList[index], name: e.target.value };
                                      setFieldValue('expense_list', updatedExpenseList);
                                    }}
                                    className={clsx(inputClasses, 'w-full')}
                                    placeholder="Expense name"
                                    disabled={shouldLockFields}
                                  />
                                </div>
                                <div className="flex-1">
                                  <Select
                                    name={`expense_list[${index}].expense_type`}
                                    options={expenseTypes.map(expenseType => ({ value: expenseType._id, label: expenseType.name }))}
                                    value={expense.expense_type ? { value: expense.expense_type, label: expenseTypes.find(et => et._id === expense.expense_type)?.name || '' } : null}
                                    onChange={async (selected) => {
                                      await updateExpense(index, 'expense_type', selected?.value || '', setFieldValue, values.expense_list, values);
                                    }}
                                    className="text-sm w-full"
                                    classNamePrefix="select"
                                    placeholder="Select expense type..."
                                    isSearchable
                                    isClearable
                                    isDisabled={shouldLockFields || loading}
                                    styles={{
                                      menuPortal: (base: any) => ({ ...base, zIndex: 99999 }),
                                      menu: (base: any) => ({ ...base, zIndex: 99999 })
                                    }}
                                    menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                                    menuPosition="fixed"
                                  />
                                </div>
                                <div className="flex-1">
                                  <input
                                    type="number"
                                    value={expense.amount}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? '' : parseFloat(e.target.value) || '';
                                      if (!expense.expense_type) {
                                        const updatedExpenseList = [...values.expense_list];
                                        updatedExpenseList[index] = { ...updatedExpenseList[index], amount: value };
                                        setFieldValue('expense_list', updatedExpenseList);
                                        updateCommissionAmount(updatedExpenseList, setFieldValue);
                                      }
                                    }}
                                    className={clsx(expense.expense_type ? calculatedFieldClasses : inputClasses, 'w-full')}
                                    placeholder="0.00"
                                    step="0.01"
                                    disabled={shouldLockFields || !!expense.expense_type}
                                  />
                                </div>
                                <div className="w-10 flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => removeExpense(index, setFieldValue, values.expense_list, values)}
                                    className="w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    title="Remove expense"
                                    disabled={shouldLockFields}
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                              {(errors.expense_list && errors.expense_list[index] && typeof errors.expense_list[index] === 'object' && (
                                (errors.expense_list[index] as any).name || 
                                (errors.expense_list[index] as any).expense_type || 
                                (errors.expense_list[index] as any).amount
                              )) && (
                                <div className="flex gap-3 px-3 mt-1">
                                  <div className="flex-2">
                                    <ErrorMessage name={`expense_list[${index}].name`} component="div" className={errorClasses} />
                                  </div>
                                  <div className="flex-1">
                                    {(errors.expense_list[index] as any).amount && (
                                      <ErrorMessage name={`expense_list[${index}].amount`} component="div" className={errorClasses} />
                                    )}
                                  </div>
                                  <div className="w-10"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Total Expenses Row */}
                        <div className="border-t-2 border-gray-300 bg-gray-50">
                          <div className="grid grid-cols-12 gap-2 items-center px-3 py-3">
                            <div className="col-span-6">
                              <span className="text-sm font-semibold text-gray-700">Total Expenses</span>
                            </div>
                            <div className="col-span-5">
                              <span className="text-sm font-semibold text-gray-900">
                                ${values.expense_list.reduce((sum, expense) => sum + (typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0), 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="col-span-1">
                              {/* Empty space for alignment */}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fee List Section */}
                  <div>
                    <label className={labelClasses}>Fee List </label>
                    {values.fee_list.length === 0 ? (
                      <div className="border border-gray-200 rounded mt-1">
                        <div className="text-sm text-gray-500 italic text-center py-8">
                          No fees added. Click below to add fees.
                        </div>
                        <button
                          type="button"
                          onClick={() => addFee(setFieldValue, values.fee_list, values)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border-t border-gray-200 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors duration-200"
                          disabled={shouldLockFields}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Fee
                        </button>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded mt-1">
                        {/* Header Row */}
                        <div className="flex items-center bg-gray-50 border-b border-gray-200 px-3 py-2 w-full">
                          <div className="flex-1">
                            <span className="block text-xs font-medium text-gray-700">Fee Name *</span>
                          </div>
                          <div className="flex-1">
                            <span className="block text-xs font-medium text-gray-700">Fee Type</span>
                          </div>
                          <div className="flex-1">
                            <span className="block text-xs font-medium text-gray-700">Amount</span>
                          </div>
                          <div className="w-10 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => addFee(setFieldValue, values.fee_list, values)}
                              className="w-8 h-8 flex items-center justify-center text-green-600 hover:text-green-800 hover:bg-green-100 bg-green-50 rounded border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                              title="Add Fee"
                              disabled={shouldLockFields}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Fee Entries */}
                        <div className="divide-y divide-gray-200">
                          {values.fee_list.map((fee, index) => (
                            <div key={index}>
                              <div className="flex items-center gap-3 px-3 py-2 w-full">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    name={`fee_list[${index}].name`}
                                    value={fee.name || ''}
                                    onChange={e => {
                                      const updatedFeeList = [...values.fee_list];
                                      updatedFeeList[index] = { ...updatedFeeList[index], name: e.target.value };
                                      setFieldValue('fee_list', updatedFeeList);
                                    }}
                                    className={clsx(inputClasses, 'w-full')}
                                    placeholder="Fee name"
                                    disabled={shouldLockFields}
                                  />
                                </div>
                                <div className="flex-1">
                                  <Select
                                    name={`fee_list[${index}].fee_type`}
                                    options={feeTypes.map(feeType => ({ value: feeType._id, label: feeType.name }))}
                                    value={fee.fee_type ? { value: fee.fee_type, label: feeTypes.find(ft => ft._id === fee.fee_type)?.name || '' } : null}
                                    onChange={async (selected) => {
                                      await updateFee(index, 'fee_type', selected?.value || '', setFieldValue, values.fee_list, values);
                                    }}
                                    className="text-sm w-full"
                                    classNamePrefix="select"
                                    placeholder="Select fee type..."
                                    isSearchable
                                    isClearable
                                    isDisabled={shouldLockFields || loading}
                                    styles={{
                                      menuPortal: (base: any) => ({ ...base, zIndex: 99999 }),
                                      menu: (base: any) => ({ ...base, zIndex: 99999 }),
                                      control: (base: any, state: any) => ({
                                        ...base,
                                        backgroundColor: state.isDisabled ? '#f9fafb' : 'white',
                                        borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                                        '&:hover': {
                                          borderColor: state.isFocused ? '#3b82f6' : '#9ca3af'
                                        }
                                      }),
                                      singleValue: (base: any, state: any) => ({
                                        ...base,
                                        color: state.isDisabled ? '#111827' : base.color
                                      }),
                                      placeholder: (base: any, state: any) => ({
                                        ...base,
                                        color: state.isDisabled ? '#6b7280' : base.color
                                      })
                                    }}
                                    menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                                    menuPosition="fixed"
                                  />
                                </div>
                                <div className="flex-1">
                                  <input
                                    type="number"
                                    value={fee.amount}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? '' : parseFloat(e.target.value) || '';
                                      if (!fee.fee_type) {
                                        const updatedFeeList = [...values.fee_list];
                                        updatedFeeList[index] = { ...updatedFeeList[index], amount: value };
                                        setFieldValue('fee_list', updatedFeeList);
                                        updateTotalFees(updatedFeeList, setFieldValue);
                                      }
                                    }}
                                    className={clsx(fee.fee_type ? calculatedFieldClasses : inputClasses, 'w-full')}
                                    placeholder="0.00"
                                    step="0.01"
                                    disabled={shouldLockFields || !!fee.fee_type}
                                  />
                                </div>
                                <div className="w-10 flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => removeFee(index, setFieldValue, values.fee_list, values)}
                                    className="w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    title="Remove fee"
                                    disabled={shouldLockFields}
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                              {(errors.fee_list && errors.fee_list[index] && typeof errors.fee_list[index] === 'object' && (
                                (errors.fee_list[index] as any).name || 
                                (errors.fee_list[index] as any).fee_type || 
                                (errors.fee_list[index] as any).amount
                              )) && (
                                <div className="flex gap-3 px-3 mt-1">
                                  <div className="flex-2">
                                    <ErrorMessage name={`fee_list[${index}].name`} component="div" className={errorClasses} />
                                  </div>
                                  <div className="flex-1">
                                    {(errors.fee_list[index] as any).amount && (
                                      <ErrorMessage name={`fee_list[${index}].amount`} component="div" className={errorClasses} />
                                    )}
                                  </div>
                                  <div className="w-10"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Total Fees Row */}
                        <div className="border-t-2 border-gray-300 bg-gray-50">
                          <div className="grid grid-cols-12 gap-2 items-center px-3 py-3">
                            <div className="col-span-6">
                              <span className="text-sm font-semibold text-gray-700">Total Fees</span>
                            </div>
                            <div className="col-span-5">
                              <span className="text-sm font-semibold text-gray-900">
                                ${values.total_fees.toFixed(2)}
                              </span>
                            </div>
                            <div className="col-span-1">
                              {/* Empty space for alignment */}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {errors.total_fees && (
                      <div className="mt-1">
                        <ErrorMessage name="total_fees" component="div" className={errorClasses} />
                      </div>
                    )}
                  </div>

                  {/* Row 5 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="disbursement_amount" className={labelClasses}>
                        Disbursement Amount <span className="text-gray-500">(calculated)</span>
                      </label>
                      <Field
                        type="number"
                        id="disbursement_amount"
                        name="disbursement_amount"
                        className={calculatedFieldClasses}
                        placeholder="0.00"
                        readOnly
                      />
                      {errors.disbursement_amount && (
                        <div className="mt-1">
                          <ErrorMessage name="disbursement_amount" component="div" className={errorClasses} />
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="factor_rate" className={labelClasses}>
                        Factor Rate <span className="text-gray-500">(calculated)</span>
                      </label>
                      <Field
                        type="number"
                        id="factor_rate"
                        name="factor_rate"
                        step="0.01"
                        className={calculatedFieldClasses}
                        placeholder={loading ? "Calculating..." : "0.00"}
                        readOnly
                      />
                      {errors.factor_rate && (
                        <div className="mt-1">
                          <ErrorMessage name="factor_rate" component="div" className={errorClasses} />
                        </div>
                      )}
                    </div>


                    <div>
                      <label htmlFor="buy_rate" className={labelClasses}>
                        Buy Rate <span className="text-gray-500">(calculated)</span>
                      </label>
                      <Field
                        type="number"
                        id="buy_rate"
                        name="buy_rate"
                        step="0.01"
                        className={calculatedFieldClasses}
                        placeholder="0.00"
                        readOnly
                      />
                      {errors.buy_rate && (
                        <div className="mt-1">
                          <ErrorMessage name="buy_rate" component="div" className={errorClasses} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 6 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="payback_count" className={labelClasses}>
                        Payback Count
                      </label>
                      <Field
                        type="number"
                        id="payback_count"
                        name="payback_count"
                        className={inputClasses}
                        placeholder="0"
                        disabled={shouldLockFields}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value === '' ? '' : parseFloat(e.target.value) || '';
                          setFieldValue('payback_count', value);
                          // Calculate related fields
                          const paybackCount = parseFloat(String(value)) || 0;
                          const paybackAmount = parseFloat(String(values.payback_amount)) || 0;

                          updateTermAndPaymentLength(paybackCount, paybackAmount, values.frequency, values.payday_list, setFieldValue);
                        }}
                      />
                      {errors.payback_count && (
                        <div className="mt-1">
                          <ErrorMessage name="payback_count" component="div" className={errorClasses} />
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="term_length" className={labelClasses}>
                        Term Length <span className="text-gray-500">(calculated)</span>
                      </label>
                      <Field
                        type="number"
                        id="term_length"
                        name="term_length"
                        className={calculatedFieldClasses}
                        placeholder="0"
                        readOnly
                      />
                      {errors.term_length && (
                        <div className="mt-1">
                          <ErrorMessage name="term_length" component="div" className={errorClasses} />
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="payment_amount" className={labelClasses}>
                        Payment Amount <span className="text-gray-500">(calculated)</span>
                      </label>
                      <Field
                        type="number"
                        id="payment_amount"
                        name="payment_amount"
                        className={calculatedFieldClasses}
                        placeholder={loading ? "Calculating..." : "0.00"}
                        readOnly
                      />
                      {errors.payment_amount && (
                        <div className="mt-1">
                          <ErrorMessage name="payment_amount" component="div" className={errorClasses} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 7 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid grid-cols-3 gap-4 items-start">
                      {/* Frequency Selector (2 columns) */}
                      <div className="col-span-2">
                        <label htmlFor="frequency" className={labelClasses}>
                          Frequency
                        </label>
                        <Select
                          name="frequency"
                          options={['DAILY', 'WEEKLY', 'MONTHLY'].map(f => ({ value: f as FrequencyType, label: f.charAt(0) + f.slice(1).toLowerCase() }))}
                          value={values.frequency ? { value: values.frequency as FrequencyType, label: values.frequency.charAt(0) + values.frequency.slice(1).toLowerCase() } : null}
                          onChange={(selected) => {
                            if (selected && selected.value) {
                              setFieldValue('frequency', selected.value);
                              setDefaultPaydayList(selected.value, setFieldValue);
                            }
                          }}
                          className="text-sm"
                          classNamePrefix="select"
                          placeholder="Select frequency..."
                          isClearable={false}
                          isSearchable={false}
                          isDisabled={shouldLockFields || loading}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                            menu: (base) => ({ ...base, zIndex: 99999 })
                          }}
                          menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                          menuPosition="fixed"
                        />
                        {errors.frequency && (
                          <div className="mt-1">
                            <ErrorMessage name="frequency" component="div" className={errorClasses} />
                          </div>
                        )}
                      </div>
                      {/* Avoid Holiday Checkbox */}
                      <div className="col-span-1 flex flex-col items-start">
                        <label htmlFor="avoid_holiday" className="text-sm font-medium text-gray-700">
                          Avoid Holiday
                        </label>
                        <input
                          type="checkbox"
                          id="avoid_holiday"
                          name="avoid_holiday"
                          checked={values.avoid_holiday}
                          disabled={shouldLockFields}
                          onChange={(e) => {
                            setFieldValue('avoid_holiday', e.target.checked);
                          }}
                          className="mt-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    {/* Payday Selection based on frequency */}
                    <div>
                      <label className={labelClasses}>
                        {values.frequency === FrequencyTypeList[0] && 'Payment Days'}  {/* Daily */}
                        {values.frequency === FrequencyTypeList[1] && 'Payment Day'}  {/* Weekly */}
                        {values.frequency === FrequencyTypeList[2] && 'Payment Day'}  {/* Monthly */}
                      </label>

                      {/* Daily: Multi-select days of week */}
                      {values.frequency === FrequencyTypeList[0] && ( // Daily
                        <div className="grid grid-cols-7 gap-1 mt-1">
                          {getAvailableDays(FrequencyTypeList[0]).map(({ value, label }) => (
                            <label key={value} className="flex flex-col items-center space-y-1">
                              <input
                                type="checkbox"
                                checked={values.payday_list.includes(value)}
                                disabled={shouldLockFields}
                                onChange={(e) => {
                                  const currentList = values.payday_list || [];
                                  let newList: DayNumber[];
                                  if (e.target.checked) {
                                    newList = [...currentList, value];
                                  } else {
                                    newList = currentList.filter(day => day !== value);
                                  }
                                  setFieldValue('payday_list', newList);

                                  // Recalculate term length with updated payday list
                                  const paybackCount = parseFloat(String(values.payback_count)) || 0;
                                  const paybackAmount = parseFloat(String(values.payback_amount)) || 0;
                                  updateTermAndPaymentLength(paybackCount, paybackAmount, values.frequency, newList, setFieldValue);
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs">{label.slice(0, 2)}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Weekly: Single select day of week */}
                      {values.frequency === FrequencyTypeList[1] && ( // Weekly
                        <Select
                          name="payday_list_weekly"
                          options={getAvailableDays(FrequencyTypeList[1]).map(({ value, label }) => ({ value, label }))}
                          value={values.payday_list[0] ? { value: values.payday_list[0], label: getAvailableDays('WEEKLY').find(d => d.value === values.payday_list[0])?.label || '' } : null}
                          onChange={(selected) => {
                            const value = selected?.value ? [selected.value] : [];
                            setFieldValue('payday_list', value);
                          }}
                          className="text-sm"
                          classNamePrefix="select"
                          placeholder="Select day of the week..."
                          isClearable
                          isSearchable={false}
                          isDisabled={shouldLockFields || loading}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                            menu: (base) => ({ ...base, zIndex: 99999 })
                          }}
                          menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                          menuPosition="fixed"
                        />
                      )}

                      {/* Monthly: Single select day of month */}
                      {values.frequency === FrequencyTypeList[2] && ( // Monthly
                        <Select
                          name="payday_list_monthly"
                          options={getAvailableDays(FrequencyTypeList[2]).map(({ value, label }) => ({ value, label }))}
                          value={values.payday_list[0] ? { value: values.payday_list[0], label: getAvailableDays(FrequencyTypeList[2]).find(d => d.value === values.payday_list[0])?.label || '' } : null}
                          onChange={(selected) => {
                            const value = selected?.value ? [selected.value] : [];
                            setFieldValue('payday_list', value);
                          }}
                          className="text-sm"
                          classNamePrefix="select"
                          placeholder="Select day of the month..."
                          isClearable
                          isSearchable={false}
                          isDisabled={shouldLockFields || loading}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                            menu: (base) => ({ ...base, zIndex: 99999 })
                          }}
                          menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                          menuPosition="fixed"
                        />
                      )}

                      {errors.payday_list && (
                        <div className="mt-1">
                          <ErrorMessage name="payday_list" component="div" className={errorClasses} />
                        </div>
                      )}

                      {/* Display selected paydays */}
                      {values.payday_list && values.payday_list.length > 0 && (
                        <div className="mt-1 text-xs text-gray-600">
                          Selected: {values.payday_list.map(day => {
                            if (values.frequency === FrequencyTypeList[2]) {
                              return `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}`;
                            } else {
                              return DAY_MAPPING[day as DayNumber]?.slice(0, 3) || day;
                            }
                          }).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Offered By */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="offered_date" className={labelClasses}>
                        Offered Date
                      </label>
                      <Field
                        type="date"
                        id="offered_date"
                        name="offered_date"
                        className={inputClasses}
                        disabled={shouldLockFields || mode === 'update'}
                      />
                      {errors.offered_date && (
                        <div className="mt-1">
                          <ErrorMessage name="offered_date" component="div" className={errorClasses} />
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="offered_by_user" className={labelClasses}>
                        Offered By
                      </label>
                      <Select
                        name="offered_by_user"
                        options={users.map(user => ({ value: user._id, label: user.first_name + ' ' + user.last_name }))}
                        value={values.offered_by_user ? {
                          value: values.offered_by_user,
                          label: users.find(u => u._id === values.offered_by_user)?.first_name + ' ' + users.find(u => u._id === values.offered_by_user)?.last_name || ''
                        } : null}
                        onChange={(selected) => {
                          setFieldValue('offered_by_user', selected?.value || '');
                        }}
                        className="text-sm"
                        classNamePrefix="select"
                        placeholder="Select user..."
                        isClearable
                        isSearchable
                        isDisabled={shouldLockFields || mode === 'update' || loading}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                          menu: (base) => ({ ...base, zIndex: 99999 }),
                          control: (base, state) => ({
                            ...base,
                            backgroundColor: state.isDisabled ? '#f9fafb' : 'white',
                            borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                            '&:hover': {
                              borderColor: state.isFocused ? '#3b82f6' : '#9ca3af'
                            }
                          }),
                          singleValue: (base, state) => ({
                            ...base,
                            color: state.isDisabled ? '#111827' : base.color
                          }),
                          placeholder: (base, state) => ({
                            ...base,
                            color: state.isDisabled ? '#6b7280' : base.color
                          })
                        }}
                        menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                        menuPosition="fixed"
                      />
                      {errors.offered_by_user && (
                        <div className="mt-1">
                          <ErrorMessage name="offered_by_user" component="div" className={errorClasses} />
                        </div>
                      )}
                    </div>


                    {/* Status display-only field */}
                    <div>
                      <label htmlFor="status" className={labelClasses}>
                        Status
                      </label>
                      <Select
                        name="status"
                        options={ApplicationOfferStatusList.map((status: ApplicationOfferStatus) => ({ value: status, label: status.charAt(0) + status.slice(1).toLowerCase() }))}
                        value={
                          values.status
                            ? { value: values.status as ApplicationOfferStatus, label: values.status.charAt(0) + values.status.slice(1).toLowerCase() }
                            : { value: ApplicationOfferStatusList[0] as ApplicationOfferStatus, label: ApplicationOfferStatusList[0].charAt(0) + ApplicationOfferStatusList[0].slice(1).toLowerCase() }
                        }
                        onChange={(newValue: { value: string; label: string } | null) => {
                          if (newValue && ApplicationOfferStatusList.includes(newValue.value as ApplicationOfferStatus)) {
                            setFieldValue('status', newValue.value);
                          }
                        }}
                        className="text-sm"
                        classNamePrefix="select"
                        placeholder="Select status..."
                        isClearable={false}
                        isSearchable={false}
                        isDisabled={loading}
                        styles={{
                          menuPortal: (base: any) => ({ ...base, zIndex: 99999 }),
                          menu: (base: any) => ({ ...base, zIndex: 99999 }),
                          control: (base: any, state: any) => ({
                            ...base,
                            backgroundColor: state.isDisabled ? '#f9fafb' : 'white',
                            borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                            '&:hover': {
                              borderColor: state.isFocused ? '#3b82f6' : '#9ca3af'
                            }
                          }),
                          singleValue: (base: any, state: any) => ({
                            ...base,
                            color: state.isDisabled ? '#111827' : base.color
                          }),
                          placeholder: (base: any, state: any) => ({
                            ...base,
                            color: state.isDisabled ? '#6b7280' : base.color
                          })
                        }}
                        menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                        menuPosition="fixed"
                      />
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-1 sm:text-sm"
                      disabled={loading}
                    >
                      {mode === 'create' ? 'Create' : 'Update'}
                    </button>
                    <button
                      type="button"
                      onClick={onCancel}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-2 sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })()}
          </Form>
        );
      }}
    </Formik>
  );
} 