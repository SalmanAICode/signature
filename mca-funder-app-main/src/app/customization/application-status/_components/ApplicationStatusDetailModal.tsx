'use client';

import { useState, useEffect } from 'react';
import { ApplicationStatus } from '@/types/applicationStatus';
import { deleteApplicationStatus } from '@/lib/api/applicationStatuses';
import DeleteModal from '@/components/DeleteModal';
import { SummaryModalLayout } from '@/components/SummaryModalLayout';
import { formatDate } from '@/lib/utils/format';

interface ApplicationStatusDetailModalProps {
  status: ApplicationStatus;
  onClose: () => void;
  onEdit: (status: ApplicationStatus) => void;
  onSuccess: () => void;
}

type Message = {
  type: 'success' | 'error';
  text: string;
};

export default function ApplicationStatusDetailModal({ 
  status, 
  onClose, 
  onEdit, 
  onSuccess 
}: ApplicationStatusDetailModalProps) {
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
      await deleteApplicationStatus(status._id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete application status' });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const header = (
    <h2 className="text-2xl font-bold text-center text-gray-800">Application Status Summary</h2>
  );

  const content = (
    <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {/* Status Name */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Status Name</p>
        <h3 className="text-md font-semibold text-gray-800">{status.name}</h3>
      </div>

      {/* Order */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Order</p>
        <h3 className="text-md font-semibold text-gray-800">
          {status.idx !== null && status.idx !== undefined ? status.idx + 1 : '-'}
        </h3>
      </div>

      {/* Color */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Background Color</p>
        <div className="flex items-center space-x-2">
          <div 
            className="w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: status.bgcolor || '#9CA3AF' }}
          />
          <h3 className="text-md font-semibold text-gray-800">{status.bgcolor || '#9CA3AF'}</h3>
        </div>
      </div>

      {/* Initial Status */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Initial Status</p>
        <h3 className="text-md font-semibold text-gray-800">
          {status.initial ? (
            <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">Yes</span>
          ) : (
            <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-bold">No</span>
          )}
        </h3>
      </div>

      {/* Approved Status */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Approved Status</p>
        <h3 className="text-md font-semibold text-gray-800">
          {status.approved ? (
            <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">Yes</span>
          ) : (
            <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-bold">No</span>
          )}
        </h3>
      </div>

      {/* Closed Status */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Closed Status</p>
        <h3 className="text-md font-semibold text-gray-800">
          {status.closed ? (
            <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">Yes</span>
          ) : (
            <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-bold">No</span>
          )}
        </h3>
      </div>

      {/* System Status */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">System Status</p>
        <h3 className="text-md font-semibold text-gray-800">
          {status.system ? (
            <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">Yes</span>
          ) : (
            <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-bold">No</span>
          )}
        </h3>
      </div>

      {/* Active Status */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Active Status</p>
        <h3 className="text-md font-semibold text-gray-800">
          {status.inactive ? (
            <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">Inactive</span>
          ) : (
            <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">Active</span>
          )}
        </h3>
      </div>

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-200" />

      {/* Created Date */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Created Date</p>
        <h3 className="text-md font-semibold text-gray-800">
          {formatDate(status.createdAt)}
        </h3>
      </div>

      {/* Updated Date */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Updated Date</p>
        <h3 className="text-md font-semibold text-gray-800">
          {formatDate(status.updatedAt)}
        </h3>
      </div>
    </div>
  );

  const actions = (
    <div className="flex justify-evenly gap-2">
      <button
        onClick={() => onEdit(status)}
        className="flex-1 px-2 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
      >
        Update
      </button>
      
      {!status.system && (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex-1 px-2 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
        >
          Delete
        </button>
      )}

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
          title="Deactivate Application Status"
          message="Are you sure you want to deactivate this application status? It will be marked as inactive and can be reactivated later."
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
          isLoading={loading}
        />
      )}
    </>
  );
} 