'use client';

import { useState, useEffect } from 'react';
import { ExpenseType } from '@/types/expenseType';
import { deleteExpenseType } from '@/lib/api/expenseTypes';
import { PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils/format';
import { SummaryModalLayout } from "@/components/SummaryModalLayout";
import { SUMMARY_MODAL_WIDTH } from "@/config/ui";
import DeleteModal from '@/components/DeleteModal';
import { UpdateModal } from './UpdateModal';
import { toast } from 'react-hot-toast';

interface ExpenseTypeDetailModalProps {
  expenseType: ExpenseType;
  onClose: () => void;
  onEdit: (expenseType: ExpenseType) => void;
  onSuccess: () => void;
}

export default function ExpenseTypeDetailModal({
  expenseType: initialExpenseType,
  onClose,
  onEdit,
  onSuccess
}: ExpenseTypeDetailModalProps) {
  const [expenseType, setExpenseType] = useState(initialExpenseType);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    setExpenseType(initialExpenseType);
  }, [initialExpenseType]);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExpenseType(expenseType._id);
      setShowDeleteModal(false);
      onSuccess();
      onClose();
      toast.success(`Expense type "${expenseType.name}" has been deleted successfully.`);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to delete expense type. Please try again.';
      toast.error(errorMessage);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    setShowUpdateModal(true);
  };

  const handleUpdateSuccess = (updatedExpenseType: ExpenseType) => {
    setShowUpdateModal(false);
    setExpenseType(updatedExpenseType);
    toast.success(`Expense type "${updatedExpenseType.name}" has been updated successfully.`);
    // Optionally call onSuccess to refresh the parent list
    onSuccess();
  };

  const handleUpdateError = (error: string) => {
    toast.error(error);
  };

  // Helper to render boolean indicators
  const renderBooleanIndicator = (value: boolean | undefined, label: string) => (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      {value ? (
        <div className="flex items-center mt-1">
          <CheckIcon className="h-4 w-4 text-green-600 mr-1" />
          <span className="text-sm font-semibold text-green-600">Yes</span>
        </div>
      ) : (
        <span className="text-sm text-gray-400 mt-1 block">No</span>
      )}
    </div>
  );

  const header = (
    <h2 className="text-2xl font-bold text-center text-gray-800">Expense Type Summary</h2>
  );

  // Basic Information Section
  const basicInfoSection = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-4">
      <div>
        <p className="text-xs font-medium text-gray-500">Name</p>
        <h3 className="text-md font-semibold text-gray-800">{expenseType.name}</h3>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">Formula</p>
        <h3 className="text-md font-semibold text-gray-800">
          {expenseType.formula && typeof expenseType.formula === 'object' 
            ? expenseType.formula.name 
            : 'None'}
        </h3>
      </div>
    </div>
  );

  // Properties Section
  const propertiesSection = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-4">
      <div className="space-y-3">
        {renderBooleanIndicator(expenseType.commission, 'Commission')}
        {renderBooleanIndicator(expenseType.syndication, 'Syndication')}
      </div>
      <div className="space-y-3">
        {renderBooleanIndicator(expenseType.default, 'Default')}
        <div>
          <p className="text-xs font-medium text-gray-500">Status</p>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
            expenseType.inactive 
              ? 'bg-red-100 text-red-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {expenseType.inactive ? 'Inactive' : 'Active'}
          </span>
        </div>
      </div>
    </div>
  );

  // Timestamps Section
  const timestampsSection = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-4">
      <div>
        <p className="text-xs font-medium text-gray-500">Created At</p>
        <h3 className="text-md font-semibold text-gray-800">
          {expenseType.createdAt ? formatDate(expenseType.createdAt) : 'N/A'}
        </h3>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">Updated At</p>
        <h3 className="text-md font-semibold text-gray-800">
          {expenseType.updatedAt ? formatDate(expenseType.updatedAt) : 'N/A'}
        </h3>
      </div>
    </div>
  );

  const content = (
    <>
      {basicInfoSection}
      <div className="col-span-2 border-b border-gray-300 mb-2" />
      {propertiesSection}
      <div className="col-span-2 border-b border-gray-300 mb-2" />
      {timestampsSection}
    </>
  );

  const actions = (
    <div className="flex justify-evenly gap-2">
      <button
        onClick={handleEdit}
        className="flex-1 px-2 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
      >
        <div className="flex items-center justify-center">
          <PencilIcon className="h-4 w-4 mr-1" />
          Update
        </div>
      </button>
      <button
        onClick={handleDelete}
        className="flex-1 px-2 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
      >
        <div className="flex items-center justify-center">
          <TrashIcon className="h-4 w-4 mr-1" />
          Delete
        </div>
      </button>
      <button
        onClick={onClose}
        className="flex-1 px-2 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-300 hover:text-gray-800 transition"
      >
        Close
      </button>
    </div>
  );

  return (
    <>
      <SummaryModalLayout
        header={header}
        content={content}
        actions={actions}
        width={SUMMARY_MODAL_WIDTH}
      />

      {/* Update Modal */}
      {showUpdateModal && (
        <UpdateModal
          isOpen={showUpdateModal}
          expenseType={expenseType}
          onSuccess={handleUpdateSuccess}
          onClose={() => setShowUpdateModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
          title="Delete Expense Type"
          message={`Are you sure you want to delete expense type "${expenseType.name}"? It will be marked as inactive and can be reactivated later.`}
        />
      )}
    </>
  );
} 