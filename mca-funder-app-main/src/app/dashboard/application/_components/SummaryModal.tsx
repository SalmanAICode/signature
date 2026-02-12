import { Application } from "@/types/application";
import { formatCurrency, formatTime, getNestedValue } from "@/components/GenericList/utils";
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from "react";
import DeleteModal from '@/components/DeleteModal';
import { UpdateModal } from './UpdateModal';
import { CreateOfferModal } from './CreateOfferModal';
import { StatusBadge } from "@/components/StatusBadge";
import { UserPreviewSummary } from "@/components/UserPreview";
import { EntityPreviewSummary } from "@/components/EntityPreview";
import { SummaryModalLayout } from "@/components/SummaryModalLayout";
import { SUMMARY_MODAL_WIDTH } from "@/config/ui";

type SummaryModalProps = {
    title: string;
    data: Application;
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

export function SummaryModal({ title, data, onClose, onSuccess, onDelete, isDeleting, error }: SummaryModalProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);

    // Set initial error from props if provided
    useEffect(() => {
        if (error) {
            setMessage({ type: 'error', text: error });
        }
    }, [error]);

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
            onClose();
        } catch (err) {
            const errorMessage = err instanceof Error 
                ? err.message 
                : 'Failed to delete application. Please try again.';
            setMessage({ type: 'error', text: errorMessage });
            setShowDeleteModal(false);
        }
    };

    const header = (
        <h2 className="text-2xl font-bold text-center text-gray-800">{title}</h2>
    );

    const content = (
        <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {/* Application Basic Information */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Application Name</p>
                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'name')}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Type</p>
                <h3 className="text-md font-semibold text-gray-800"><StatusBadge status={data.type} size="sm" /></h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Status</p>
                <h3 className="text-md font-semibold text-gray-800"><StatusBadge status={data.status.name} color={data.status.bgcolor} size="sm" /></h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Request Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{formatCurrency(data?.request_amount)}</h3>
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-300" />

            {/* Merchant Information */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Merchant</p>
                <EntityPreviewSummary entity={data?.merchant} />
            </div>

            {data?.contact && (
                <div className="flex flex-col gap-1 break-words whitespace-normal">
                    <p className="text-xs font-medium text-gray-500">Contact</p>
                    <UserPreviewSummary user={data?.contact} />
                </div>
            )}

            {/* Funder Information */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Funder</p>
                <EntityPreviewSummary entity={data?.funder} />
            </div>

            {/* ISO Information */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">ISO </p>
                <EntityPreviewSummary entity={data?.iso} />
            </div>

            {data?.representative && (
                <div className="flex flex-col gap-1 break-words whitespace-normal">
                    <p className="text-xs font-medium text-gray-500">Representative</p>
                    <UserPreviewSummary user={data?.representative} />
                </div>
            )}

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Assigned User */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Assigned Manager</p>
                <UserPreviewSummary user={data?.assigned_manager} />
            </div>

            {/* Assigned User */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Assigned User</p>
                <UserPreviewSummary user={data?.assigned_user} />
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Application Details */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Priority</p>
                <h3 className="text-md font-semibold">
                    <StatusBadge status={data?.priority ? "High" : "Normal"} size="sm" />
                </h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Internal</p>
                <h3 className="text-md font-semibold">
                    <StatusBadge status={data.internal} size="sm" />
                </h3>
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Counts */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Documents</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.document_count || 0}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Offers</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.offer_count || 0}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Stipulations</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.stipulation_count || 0}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Followers</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.follower_list?.length || 0}</h3>
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Dates */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Request Date</p>
                <h3 className="text-md font-semibold text-gray-800">{formatTime(data.request_date)}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Status Date</p>
                <h3 className="text-md font-semibold text-gray-800">{formatTime(data.status_date)}</h3>
            </div>
        </div>
    );

    const actions = (
        <>
            <button
                className="px-2 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition"
                onClick={() => {
                    router.push(`${pathname}/${data._id}`);
                }}
            >
                View
            </button>
            <button
                className="px-2 py-2 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition"
                onClick={() => setShowUpdateModal(true)}
            >
                Update
            </button>
            <button
                onClick={() => setShowCreateOfferModal(true)}
                className="px-2 py-2 rounded-lg bg-yellow-600 text-white text-xs font-medium hover:bg-yellow-700 transition"
            >
                Create Offer
            </button>
            <button
                onClick={handleDelete}
                className="px-2 py-2 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition"
            >
                Delete
            </button>
            <button
                onClick={onClose}
                className="col-span-2 lg:col-span-1 px-2 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-300 hover:text-gray-800 transition"
            >
                Close
            </button>
        </>
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

            {/* Update Modal */}
            {showUpdateModal && (
                <UpdateModal
                    isOpen={showUpdateModal}
                    onClose={() => {
                        setShowUpdateModal(false);
                        setMessage(null);
                    }}
                    onSuccess={(message) => {
                        setShowUpdateModal(false);
                        setMessage({ type: 'success', text: message });
                    }}
                    application={data}
                />
            )}

            {/* Create Offer Modal */}
            {showCreateOfferModal && (
                <CreateOfferModal
                    isOpen={showCreateOfferModal}
                    onClose={() => {
                        setShowCreateOfferModal(false);
                        setMessage(null);
                    }}
                    onSuccess={(message) => {
                        setShowCreateOfferModal(false);
                        setMessage({ type: 'success', text: message });
                    }}
                    application={data}
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
                    title="Delete Application"
                    message={`Are you sure you want to delete Application ${data._id}? This action cannot be undone.`}
                />
            )}
        </>
    );
}