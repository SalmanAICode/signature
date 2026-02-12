'use client';

import { ExpenseType } from '@/types/expenseType';
import CreateModal from './CreateModal';

interface UpdateModalProps {
  isOpen: boolean;
  expenseType: ExpenseType;
  onSuccess: (updatedExpenseType: ExpenseType) => void;
  onClose: () => void;
}

export function UpdateModal({ isOpen, expenseType, onSuccess, onClose }: UpdateModalProps) {
  if (!isOpen) return null;

  return (
    <CreateModal
      expenseType={expenseType}
      onSuccess={(updatedExpenseType) => {
        if (updatedExpenseType) {
          onSuccess(updatedExpenseType);
        }
      }}
      onCancel={onClose}
    />
  );
} 