'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ApplicationOffer } from '@/types/applicationOffer';
import { formatCurrency, formatTime } from "@/lib/utils/format";
import { UpdateModal } from './UpdateModal';
import { StatusBadge } from '@/components/StatusBadge';
import { DAY_MAPPING_SHORT, DayNumber } from '@/types/day';
import DeleteModal from '@/components/DeleteModal';
import { formatPaydayList } from '@/lib/utils/paydayUtils';
import { ApplicationOfferFormValues } from './ApplicationOfferForm';
import { SummaryModalLayout } from "@/components/SummaryModalLayout";
import { EntityPreviewSummary } from '@/components/EntityPreview';
import ApplicationOfferSummaryContent from '@/components/ApplicationOffer/ApplicationOfferSummaryContent';

interface SummaryModalProps {
  title: string;
  data: ApplicationOffer;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (values: ApplicationOfferFormValues) => Promise<void>;
  isDeleting: boolean;
  error?: string | null;
}

type Message = {
  type: 'success' | 'error';
  text: string;
};

export function SummaryModal({
  title,
  data,
  onClose,
  onSuccess,
  onDelete,
  onUpdate,
  isDeleting,
  error: externalError,
}: SummaryModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

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

  const handleDelete = async () => {
    setMessage(null);
    try {
      await onDelete(data._id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to delete application offer. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
      setShowDeleteConfirm(false);
    }
  };

  const handleUpdateSuccess = async (values: ApplicationOfferFormValues) => {
    setShowUpdateModal(false);
    try {
      await onUpdate(values);
      setMessage({ type: 'success', text: 'Application offer updated successfully' });
      if (onSuccess) onSuccess('Application offer updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update application offer';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const header = (
    <h2 className="text-2xl font-bold text-center text-gray-800">{title}</h2>
  );

  const content = <ApplicationOfferSummaryContent data={data} />;

  const actions = (
    <div className="flex justify-evenly gap-2">
      <button
        className="flex-1 px-2 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        onClick={() => {
          router.push(`${pathname}/${data._id}`);
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

      {/* Update Modal */}
      {showUpdateModal && (
        <UpdateModal
          isOpen={showUpdateModal}
          onClose={() => {
            setShowUpdateModal(false);
            setMessage(null);
          }}
          onSuccess={handleUpdateSuccess}
          applicationOffer={data}
        />
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Application Offer"
        message={`Are you sure you want to delete this application offer? This action cannot be undone.`}
      />
    </>
  );
} 