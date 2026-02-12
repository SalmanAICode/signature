import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import DeleteModal from '@/components/DeleteModal';
import FundingUpdateForm, { FundingUpdateFormValues } from './FundingUpdateForm';
import { updateFunding } from '@/lib/api/fundings';
import { SummaryModalLayout } from "@/components/SummaryModalLayout";
import { SUMMARY_MODAL_WIDTH } from "@/config/ui";
import { EntityPreviewSummary } from "@/components/EntityPreview";
import { StatusBadge, renderStatusBadge } from "@/components/StatusBadge";
import type { Funding } from '@/types/funding';
import type { Entity } from '@/types/entity';
import type { User } from '@/types/user';
import { renderUser } from '@/components/UserPreview';

// Helper for formatting currency
const formatCurrency = (value: number | undefined) =>
  typeof value === 'number' ? `$${value.toLocaleString()}` : '-';

// Helper for formatting percent
const formatPercent = (value: number | undefined) =>
  typeof value === 'number' ? `${value}%` : '-';

// Helper to calculate paid percentage for funded amount
const getPaidPercentage = (succeedAmount?: number, netAmount?: number) => {
  if (!succeedAmount || !netAmount || netAmount === 0) return 0;
  return Math.round((succeedAmount / netAmount) * 100);
};

// FundedAmountDisplay component for boss's design
const FundedAmountDisplay = ({ fundedAmount, succeedCount, netAmount }: { fundedAmount?: number, succeedCount?: number, netAmount?: number }) => {
  const paidPercentage =
    !succeedCount || !netAmount || netAmount === 0
      ? 0
      : Math.round((succeedCount / netAmount) * 100);
  const isFull = paidPercentage >= 100;
  return (
    <span>
      <span className={`font-bold ${isFull ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(fundedAmount)}</span>
      <span className="font-normal text-xs text-gray-400 ml-1">
        {isFull ? '(Paid in full)' : `(Paid ${paidPercentage}%)`}
      </span>
    </span>
  );
};

// PaybackAmountDisplay component for payback stats (using API fields)
const PaybackAmountDisplay = ({
  payback_amount,
  paid_payback_funded_amount,
}: {
  payback_amount?: number;
  paid_payback_funded_amount?: number;
}) => {
  const total = payback_amount ?? 0;
  const paid = paid_payback_funded_amount ?? 0;
  const percentage = total === 0 ? 0 : Math.round((paid / total) * 100);
  const isFull = percentage >= 100;
  return (
    <span>
      <span className={`font-bold ${isFull ? "text-green-700" : "text-red-700"}`}>${total.toLocaleString()}</span>
      <span className="font-normal text-xs text-gray-400 ml-1">
        {isFull ? "(Paid in full)" : `(Paid ${percentage}%)`}
      </span>
    </span>
  );
};

// CommissionAmountDisplay component for commission stats
const CommissionAmountDisplay = ({
  commission_amount,
  commission_paid_amount,
}: {
  commission_amount?: number;
  commission_paid_amount?: number;
}) => {
  const total = commission_amount ?? 0;
  const paid = commission_paid_amount ?? 0;
  const percentage = total === 0 ? 0 : Math.round((paid / total) * 100);
  const isFull = percentage >= 100;
  return (
    <span>
      <span className={`font-bold ${isFull ? "text-green-700" : "text-red-700"}`}>${total.toLocaleString()}</span>
      <span className="font-normal text-xs text-gray-400 ml-1">
        {isFull ? "(Paid in full)" : `(Paid ${percentage}%)`}
      </span>
    </span>
  );
};

// FeeAmountDisplay component for fee stats
const FeeAmountDisplay = ({
  fee_amount,
  paid_payback_fee_amount,
}: {
  fee_amount?: number;
  paid_payback_fee_amount?: number;
}) => {
  const total = fee_amount ?? 0;
  const paid = paid_payback_fee_amount ?? 0;
  const percentage = total === 0 ? 0 : Math.round((paid / total) * 100);
  const isFull = percentage >= 100;
  return (
    <span>
      <span className={`font-bold ${isFull ? "text-green-700" : "text-red-700"}`}>${total.toLocaleString()}</span>
      <span className="font-normal text-xs text-gray-400 ml-1">
        {isFull ? "(Paid in full)" : `(Paid ${percentage}%)`}
      </span>
    </span>
  );
};

// Internal/External Badge component
const InternalBadge = ({ internal }: { internal?: boolean }) => {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      internal ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
    }`}>
      {internal ? 'Internal' : 'External'}
    </span>
  );
};

type FundingSummaryModalProps = {
  title: string;
  data: Partial<Funding>;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  error?: string | null;
};

type Message = {
  type: 'success' | 'error';
  text: string;
};

export function FundingSummaryModal({ title, data, onClose, onSuccess, onDelete, isDeleting, error }: FundingSummaryModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (error) {
      setMessage({ type: 'error', text: error });
    }
  }, [error]);

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
      await onDelete(data._id || '');
      setShowDeleteModal(false);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to delete funding. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
      setShowDeleteModal(false);
    }
  };

  const handleUpdateSuccess = (message: string) => {
    setShowUpdateModal(false);
    setMessage({ type: 'success', text: message });
    if (onSuccess) onSuccess(message);
  };

  // Helper function to convert entity-like objects to proper Entity format
  const convertToEntity = (entityData: any): Entity | null => {
    if (!entityData) return null;
    return {
      _id: entityData._id || entityData.id || '',
      name: entityData.name || '',
      email: entityData.email,
      phone: entityData.phone
    };
  };

  // Helper function to convert user-like objects to Entity format for consistent display
  const userToEntity = (userData: any): Entity | null => {
    if (!userData) return null;
    return {
      _id: userData._id || userData.id || '',
      name: (userData.first_name || '') + (userData.last_name ? ' ' + userData.last_name : '') || userData.name || '',
      email: userData.email,
      phone: userData.phone_mobile || userData.phone
    };
  };

  const header = (
    <h2 className="text-2xl font-bold text-center text-gray-800">{title}</h2>
  );

  // --- Basic Funding Details ---
  const basicFundingDetails = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-4">
      {/* Funding Name & Type */}
      <div>
        <p className="text-xs font-medium text-gray-500">Funding Name</p>
        <h3 className="text-md font-semibold text-gray-800">{data.name ?? '-'}</h3>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">Type</p>
        <h3 className="text-md font-semibold text-gray-800">{renderStatusBadge(data.type ?? '-')}</h3>
      </div>
      {/* Status & Internal/External */}
      <div>
        <p className="text-xs font-medium text-gray-500">Status</p>
        <StatusBadge 
          status={typeof data.status === 'object' && data.status !== null ? data.status.name : (typeof data.status === 'string' ? data.status : '-')} 
          color={typeof data.status === 'object' && data.status !== null ? data.status.bgcolor : undefined}
          size="xs" 
        />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">Internal</p>
        <h3 className="text-md font-semibold">
          <StatusBadge status={(data as any).internal ? 'YES' : 'NO'} size="xs" />
        </h3>
      </div>
    </div>
  );

  // --- Financial Summary ---
  const financialSummary = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-4">
      {/* Funded Amount & Payback Amount */}
      <div>
        <p className="text-xs font-medium text-gray-500">Funded Amount</p>
        <FundedAmountDisplay
          fundedAmount={data.funded_amount}
          succeedCount={data.disbursement_succeed_count}
          netAmount={data.net_amount}
        />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">Payback Amount</p>
        <PaybackAmountDisplay
          payback_amount={data.payback_amount}
          paid_payback_funded_amount={data.paid_payback_funded_amount}
        />
      </div>
      {/* Factor Rate & Net Amount */}
      <div>
        <p className="text-xs font-medium text-gray-500">Factor Rate</p>
        <h3 className="text-md font-semibold text-gray-800">{data.factor_rate ?? (data.finalized_offer?.factor_rate ?? '-')}</h3>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">Net Amount</p>
        <h3 className="text-md font-semibold text-gray-800">{formatCurrency(data.net_amount)}</h3>
      </div>
      {/* Upfront Fee Amount & Residual Fee Amount */}
      <div>
        <p className="text-xs font-medium text-gray-500">Upfront Fee Amount</p>
        <h3 className="text-md font-semibold text-gray-800">{formatCurrency((data as any).upfront_fee_amount)}</h3>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">Residual Fee Amount</p>
        <h3 className="text-md font-semibold text-gray-800">{formatCurrency((data as any).residual_fee_amount)}</h3>
      </div>
      {/* Commission Amount & Fee Amount */}
      <div>
        <p className="text-xs font-medium text-gray-500">Commission Amount</p>
        <CommissionAmountDisplay
          commission_amount={data.commission_amount}
          commission_paid_amount={data.commission_paid_amount}
        />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">Fee Amount</p>
        <FeeAmountDisplay
          fee_amount={data.fee_amount}
          paid_payback_fee_amount={data.paid_payback_fee_amount}
        />
      </div>
    </div>
  );

  // --- Key Parties ---
  const keyParties = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-4">
      {/* Funder & Lender */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Funder</p>
        <EntityPreviewSummary entity={convertToEntity(data.funder)} />
      </div>
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Lender</p>
        <EntityPreviewSummary entity={convertToEntity(data.lender)} />
      </div>
      {/* Merchant & ISO */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Merchant</p>
        <EntityPreviewSummary entity={convertToEntity(data.merchant)} />
      </div>
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">ISO</p>
        <EntityPreviewSummary entity={convertToEntity(data.iso)} />
      </div>
      {/* Assigned Manager & Assigned User */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Assigned Manager</p>
        <EntityPreviewSummary entity={userToEntity((data as any).assigned_manager)} />
      </div>
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Assigned User</p>
        <EntityPreviewSummary entity={userToEntity((data as any).assigned_user)} />
      </div>
      {/* Syndicators */}
      <div className="sm:col-span-2 flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Syndicators</p>
        {data.syndicator_list && data.syndicator_list.length > 0 ? (
          <div className="flex flex-col gap-2">
            {data.syndicator_list.map((syndicator, idx) => (
              <EntityPreviewSummary key={idx} entity={convertToEntity(syndicator)} />
            ))}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </div>
    </div>
  );

  // --- Quick Stats ---
  const quickStats = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-4">
      {/* Total Payback Count & Succeed Payback Count */}
      <div>
        <p className="text-xs font-medium text-gray-500">Total Payback Count</p>
        <h3 className="text-md font-semibold text-gray-800">{(data as any).payback_count ?? 0}</h3>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">Succeed Payback Count</p>
        <h3 className="text-md font-semibold text-gray-800">{data.payback_succeed_count ?? 0}</h3>
      </div>
      {/* Success Rate & Remaining Balance */}
      <div>
        <p className="text-xs font-medium text-gray-500">Success Rate</p>
        <h3 className="text-md font-semibold text-gray-800">
          {typeof data.succeed_rate === 'number'
            ? `${Math.round(data.succeed_rate * 100)}%`
            : '-'}
        </h3>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">Remaining Balance</p>
        <h3 className="text-md font-semibold text-gray-800">{formatCurrency(data.remaining_balance)}</h3>
      </div>
      {/* Next Payback Date & Next Payback Amount */}
      <div>
        <p className="text-xs font-medium text-gray-500">Next Payback Date</p>
        <h3 className="text-md font-semibold text-gray-800">{(data as any).next_payback_date ?? '-'}</h3>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">Next Payback Amount</p>
        <h3 className="text-md font-semibold text-gray-800">{formatCurrency((data as any).next_payback_amount)}</h3>
      </div>
      {/* Syndication Count & Amount (with percent) */}
      <div>
        <p className="text-xs font-medium text-gray-500">Syndication Count</p>
        <h3 className="text-md font-semibold text-gray-800">{data.syndication_count ?? 0}</h3>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">Syndication Amount</p>
        <h3 className="text-md font-semibold text-gray-800">
          {formatCurrency(data.syndication_amount)}
          {typeof data.syndication_percent === 'number' && (
            <span className="text-xs text-gray-400 ml-2">({Math.round(data.syndication_percent * 100)}%)</span>
          )}
        </h3>
      </div>
    </div>
  );

  const content = (
    <>
      {basicFundingDetails}
      <div className="col-span-2 border-b border-gray-300 mb-2" />
      {financialSummary}
      <div className="col-span-2 border-b border-gray-300 mb-2" />
      {keyParties}
      <div className="col-span-2 border-b border-gray-300 mb-2" />
      {quickStats}
    </>
  );

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
  );

  return (
    <>
      <SummaryModalLayout
        header={header}
        content={content}
        actions={actions}
        error={message?.text}
        width={SUMMARY_MODAL_WIDTH}
      />

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
          title="Delete Funding"
          message={`Are you sure you want to delete Funding ${data._id}? This action cannot be undone.`}
        />
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto flex flex-col items-center">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Update Funding</h2>
            <p className="text-center text-gray-500 mb-6">Update funding details below.</p>
            <div className="w-full">
              <FundingUpdateForm
                initialValues={{
                  name: data.name ?? '',
                  type: data.type ?? '',
                  status: typeof data.status === 'object' && data.status !== null ? data.status.name : (typeof data.status === 'string' ? data.status : 'CREATED'),
                  internal: (data as any).internal ?? false,
                  position: (data as any).position ?? undefined,
                  inactive: (data as any).inactive ?? false,
                }}
                onSubmit={async (values) => {
                  // Transform the form values to match the API expected format
                  const { assigned_manager, assigned_user, ...formValues } = values;
                  const apiData = {
                    ...formValues,
                    status: {
                      name: values.status,
                      bgcolor: typeof data.status === 'object' && data.status !== null ? data.status.bgcolor : undefined
                    }
                  };
                  await updateFunding(data._id || '', apiData);
                  handleUpdateSuccess('Funding updated successfully.');
                }}
                onCancel={() => setShowUpdateModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 