'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SyndicationOffer } from '@/types/syndicationOffer';
import { formatCurrency, formatTime } from '@/lib/utils/format';
import { renderStatusBadge } from '@/components/StatusBadge';
import DeleteModal from '@/components/DeleteModal';
import { UpdateModal } from './UpdateModal';

import { SUMMARY_MODAL_WIDTH } from '@/config/ui';

import { renderEntity } from '@/components/EntityPreview';

type Message = {
  type: 'success' | 'error';
  text: string;
};

export function DetailModal({
  title,
  data,
  onClose,
  onSuccess,
  onDelete,
  isDeleting,
  error: externalError,
  informationPath,
}: {
  title: string;
  data: SyndicationOffer;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
  error: string | null;
  informationPath?: string;
}) {
  const router = useRouter();
  const pathname = informationPath || usePathname();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [currentData, setCurrentData] = useState<SyndicationOffer>(data);
  // Set initial error from props if provided
  useEffect(() => {
    if (externalError) {
      setMessage({ type: 'error', text: externalError });
    }
  }, [externalError]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleDelete = () => {
    setMessage(null);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setMessage(null);
    try {
      await onDelete(data._id);
      setShowDeleteModal(false);
      onSuccess('Syndication offer deleted successfully');
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to delete syndication offer. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
      setShowDeleteModal(false);
    }
  };

  const handleUpdateSuccess = (message: string, updatedData: SyndicationOffer) => {
    setShowUpdateModal(false);
    setMessage({ type: 'success', text: message });
    
    // Update the current modal data with the returned data from API
    setCurrentData(updatedData);
    
    // Notify parent component to refresh data
    onSuccess(message);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div
        className="bg-gray-100 p-6 rounded-2xl shadow-xl w-full relative max-h-[95vh] overflow-y-auto"
        style={{ maxWidth: SUMMARY_MODAL_WIDTH }}
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">{title}</h2>

        {message && (
          <div className={`mb-4 p-4 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg flex items-center justify-between`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className={`font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {message.text}
              </span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className={`${message.type === 'success' ? 'text-green-400 hover:text-green-600' : 'text-red-400 hover:text-red-600'}`}
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Scrollable content only */}
        <div className="max-h-[75vh] overflow-y-auto border rounded-lg p-4 border-gray-200 bg-gray-50 mb-6 relative">
          
          <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {/* Section 1: Basic Info */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">ID</p>
              <h3 className="text-md font-semibold text-gray-800">{currentData._id}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Status</p>
              <h3 className="text-md font-semibold text-gray-800">
                {renderStatusBadge(currentData.status)}
              </h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Funder</p>
              <h3 className="text-md font-semibold text-gray-800">{currentData.funder.name}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Lender</p>
              <h3 className="text-md font-semibold text-gray-800">{currentData.lender ? renderEntity(String(currentData.lender)) : 'N/A'}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Syndicator</p>
              <h3 className="text-md font-semibold text-gray-800">{currentData.syndicator?.name || 'N/A'}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Funding</p>
              <h3 className="text-md font-semibold text-gray-800">{currentData.funding.name}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Funding Amount</p>
              <h3 className="text-md font-semibold text-gray-800">{formatCurrency(currentData.funding.funded_amount)}</h3>
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-300" />

            {/* Section 2: Financial Details */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Participate Amount</p>
              <h3 className="text-md font-semibold text-gray-800">{formatCurrency(currentData.participate_amount)}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Payback Amount</p>
              <h3 className="text-md font-semibold text-gray-800">{formatCurrency(currentData.payback_amount)}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Total Fee Amount</p>
              <h3 className="text-md font-semibold text-gray-800">{formatCurrency(currentData.total_commission_amount || 0)}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Total Credit Amount</p>
              <h3 className="text-md font-semibold text-gray-800">{formatCurrency(currentData.total_funded_amount || 0)}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Syndicated Amount</p>
              <h3 className="text-md font-semibold text-gray-800">{formatCurrency(currentData.syndicated_amount)}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Participate Percentage</p>
              <h3 className="text-md font-semibold text-gray-800">{currentData.participate_percent.toFixed(4) || 'N/A'}%</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Factor Rate</p>
              <h3 className="text-md font-semibold text-gray-800">{currentData.factor_rate.toFixed(4) || 'N/A'}%</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Buy Rate</p>
              <h3 className="text-md font-semibold text-gray-800">{currentData.buy_rate.toFixed(4) || 'N/A'}% </h3>
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-300" />

            {/* Section 3: Offer Details */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Created By</p>
              <h3 className="text-md font-semibold text-gray-800">
                {typeof currentData.created_by_user === 'string' ? currentData.created_by_user : `${currentData.created_by_user.first_name} ${currentData.created_by_user.last_name}`}
              </h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Offered Date</p>
              <h3 className="text-md font-semibold text-gray-800">{formatTime(currentData.offered_date)}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal col-span-2">
              <p className="text-xs font-medium text-gray-500">Expire Date</p>
              <h3 className="text-md font-semibold text-gray-800">{formatTime(currentData.expired_date || 'N/A')}</h3>
            </div>
          </div>
        </div>

        {/* Button Row */}
        <div className="flex justify-evenly gap-2">
          <button
            className="flex-1 px-2 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            onClick={() => {
              router.push(`${pathname}/${currentData._id}`);
            }}
          >
            View
          </button>
          <button
            className="flex-1 px-2 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
            onClick={() => setShowUpdateModal(true)}
          >
            Update
          </button>
          <button
            onClick={handleDelete}
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
      </div>

      {/* Update Modal */}
      {showUpdateModal && (
        <UpdateModal
          isOpen={showUpdateModal}
          onClose={() => {
            setShowUpdateModal(false);
            setMessage(null);
          }}
          onSuccess={handleUpdateSuccess}
          syndicationOffer={currentData}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onCancel={() => {
            setShowDeleteModal(false);
            setMessage(null);
          }}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
          title="Delete Syndication Offer"
          message={`Are you sure you want to delete Syndication Offer ${data._id}? This action cannot be undone.`}
        />
      )}
    </div>
  );
} 