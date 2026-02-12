'use client';

import { useState } from 'react';
import { createExpenseType, updateExpenseType } from '@/lib/api/expenseTypes';
import { ExpenseType, CreateExpenseTypeData, UpdateExpenseTypeData } from '@/types/expenseType';
import { ExpenseTypeFormValues } from './ExpenseTypeDataProvider';
import { ExpenseTypeDataProvider } from './ExpenseTypeDataProvider';
import { toast } from 'react-hot-toast';

interface CreateModalProps {
  expenseType?: ExpenseType | null;
  onSuccess: (updatedExpenseType?: ExpenseType) => void;
  onCancel: () => void;
}

const DEFAULT_INITIAL_VALUES: ExpenseTypeFormValues = {
  funder: '',
  name: '',
  formula: '',
  commission: false,
  syndication: false,
  inactive: false,
  default: false,
};

export default function CreateModal({ expenseType, onSuccess, onCancel }: CreateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const mode = expenseType ? 'update' : 'create';
  
  // Prepare initial values based on whether we're creating or updating
  const initialValues: ExpenseTypeFormValues = expenseType ? {
    funder: typeof expenseType.funder === 'string' ? expenseType.funder : expenseType.funder._id,
    name: expenseType.name,
    formula: (() => {
      if (typeof expenseType.formula === 'string') {
        return expenseType.formula.trim() || '';
      } else if (expenseType.formula && typeof expenseType.formula === 'object') {
        return expenseType.formula._id || '';
      }
      return '';
    })(),
    commission: expenseType.commission || false,
    syndication: expenseType.syndication || false,
    inactive: expenseType.inactive || false,
    default: expenseType.default || false,
  } : DEFAULT_INITIAL_VALUES;

  const handleSubmit = async (values: ExpenseTypeFormValues) => {
    setIsLoading(true);
    try {
      if (expenseType) {
        // Update existing expense type
        const updateData: UpdateExpenseTypeData = {
          name: values.name,
          formula: values.formula && values.formula.trim() ? values.formula : '',
          commission: values.commission,
          syndication: values.syndication,
          inactive: values.inactive,
          default: values.default,
        };
        
        const updatedExpenseType = await updateExpenseType(expenseType._id, updateData);
        toast.success('Expense type updated successfully.');
        onSuccess(updatedExpenseType);
      } else {
        // Create new expense type
        const createData: CreateExpenseTypeData = {
          funder: values.funder,
          name: values.name,
          formula: values.formula && values.formula.trim() ? values.formula : '',
          commission: values.commission,
          syndication: values.syndication,
          default: values.default,
        };
        
        await createExpenseType(createData);
        toast.success('Expense type created successfully.');
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : `Failed to ${mode} expense type. Please try again.`;
      toast.error(errorMessage);
      throw error; // Re-throw to prevent the modal from closing
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ExpenseTypeDataProvider
        onClose={onCancel}
        onSubmit={handleSubmit}
        mode={mode}
        initialValues={initialValues}
        title={expenseType ? 'Edit Expense Type' : 'Create Expense Type'}
        subtitle={expenseType ? 'Update the expense type details below.' : 'Please enter expense type details below.'}
        expenseType={expenseType}
        loading={isLoading}
      />
    </>
  );
} 