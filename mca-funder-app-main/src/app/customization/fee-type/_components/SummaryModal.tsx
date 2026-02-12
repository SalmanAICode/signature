'use client';

import { useState, useEffect } from 'react';
import { FeeType } from '@/types/feeType';
import { deleteFeeType } from '@/lib/api/feeTypes';
import DeleteModal from '@/components/DeleteModal';
import { SummaryModalLayout } from '@/components/SummaryModalLayout';
import { formatDate } from '@/lib/utils/format';

interface FeeTypeDetailModalProps {
  feeType: FeeType;
  onClose: () => void;
  onEdit: (feeType: FeeType) => void;
  onSuccess: () => void;
}

type Message = {
  type: 'success' | 'error';
  text: string;
};

export default function FeeTypeDetailModal({ feeType, onClose, onEdit, onSuccess }: FeeTypeDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteFeeType(feeType._id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete fee type' });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const header = (
    <h2 className="text-2xl font-bold text-center text-gray-800">Fee Type Summary</h2>
  );

  const content = (
    <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {/* Fee Type Name */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Fee Type Name</p>
        <h3 className="text-md font-semibold text-gray-800">{feeType.name}</h3>
      </div>

      {/* Formula */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Formula</p>
        <h3 className="text-md font-semibold text-gray-800">
          <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
            feeType.formula 
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200' 
              : 'bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200'
          }`}>
            {feeType.formula ? (typeof feeType.formula === 'string' ? feeType.formula : feeType.formula.name) : 'None'}
          </span>
        </h3>
      </div>

      {/* Upfront */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Upfront</p>
        <h3 className="text-md font-semibold text-gray-800">
          {feeType.upfront ? (
            <span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200 text-xs font-bold">Yes</span>
          ) : (
            <span className="inline-block px-2 py-1 rounded bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 text-xs font-bold">No</span>
          )}
        </h3>
      </div>

      {/* Default */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Default</p>
        <h3 className="text-md font-semibold text-gray-800">
          {feeType.default ? (
            <span className="inline-block px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 text-xs font-bold">Yes</span>
          ) : (
            <span className="inline-block px-2 py-1 rounded bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 text-xs font-bold">No</span>
          )}
        </h3>
        <p className="text-xs text-gray-500 mt-1">Whether this fee type should be included in each offer or funding</p>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Status</p>
        <h3 className="text-md font-semibold text-gray-800">
          {feeType.inactive ? (
            <span className="inline-block px-2 py-1 rounded bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 text-xs font-bold">Inactive</span>
          ) : (
            <span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200 text-xs font-bold">Active</span>
          )}
        </h3>
      </div>

      {/* Funder */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Funder</p>
        <h3 className="text-md font-semibold text-gray-800">
          {typeof feeType.funder === 'string' ? feeType.funder : feeType.funder.name}
        </h3>
      </div>

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-200" />

      {/* Created Date */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Created Date</p>
        <h3 className="text-md font-semibold text-gray-800">
          {formatDate(feeType.createdAt)}
        </h3>
      </div>

      {/* Updated Date */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Updated Date</p>
        <h3 className="text-md font-semibold text-gray-800">
          {formatDate(feeType.updatedAt)}
        </h3>
      </div>
    </div>
  );

  const actions = (
    <div className="flex justify-evenly gap-2">
      <button
        onClick={() => onEdit(feeType)}
        className="flex-1 px-2 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
      >
        Update
      </button>
      
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="flex-1 px-2 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
      >
        Delete
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
        error={message?.text}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteModal
          isOpen={showDeleteConfirm}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setMessage(null);
          }}
          onConfirm={handleDelete}
          title="Deactivate Fee Type"
          message="Are you sure you want to deactivate this fee type? It will be marked as inactive and can be reactivated later."
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
          isLoading={loading}
        />
      )}
    </>
  );
} 