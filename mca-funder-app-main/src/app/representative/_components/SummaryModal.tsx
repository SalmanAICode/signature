import { Representative } from '@/types/representative';
import { formatTime, getNestedValue, formatPhone } from "@/components/GenericList/utils";
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import DeleteModal from '@/components/DeleteModal';
import { SummaryModalLayout } from "@/components/SummaryModalLayout";
import { UpdateModal } from './UpdateModal';

type SummaryModalProps = {
    title: string;
    data: Representative;
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
                : 'Failed to delete representative. Please try again.';
            setMessage({ type: 'error', text: errorMessage });
            setShowDeleteModal(false);
        }
    };

    const handleUpdateSuccess = (message: string) => {
        setShowUpdateModal(false);
        setMessage({ type: 'success', text: message });
        // if (onSuccess) onSuccess(message);
    };

    const header = (
        <h2 className="text-2xl font-bold text-center text-gray-800">{title}</h2>
    );

    const content = (
        <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {/* Representative Basic Information */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Representative ID</p>
                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, '_id')}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Name</p>
                <h3 className="text-md font-semibold text-gray-800">
                    {`${getNestedValue(data, 'first_name') || ''} ${getNestedValue(data, 'last_name') || ''}`.trim() || 'N/A'}
                </h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Email</p>
                <h3 className="text-md font-semibold text-gray-800">
                    {data?.email ? (
                        <a 
                            href={`mailto:${data.email}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            {data.email}
                        </a>
                    ) : getNestedValue(data, 'email')}
                </h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Title</p>
                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'title') || 'N/A'}</h3>
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-300" />

            {/* Contact Information */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Mobile Phone</p>
                <h3 className="text-md font-semibold text-gray-800">
                    {data?.phone_mobile ? (
                        <a 
                            href={`tel:${data.phone_mobile}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            {formatPhone(data.phone_mobile)}
                        </a>
                    ) : 'N/A'}
                </h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Work Phone</p>
                <h3 className="text-md font-semibold text-gray-800">
                    {data?.phone_work ? (
                        <a 
                            href={`tel:${data.phone_work}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            {formatPhone(data.phone_work)}
                        </a>
                    ) : 'N/A'}
                </h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Type</p>
                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'type') || 'N/A'}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Birthday</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.birthday ? formatTime(data.birthday) : 'N/A'}</h3>
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Address Information */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Address</p>
                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'address_detail.address_1') || 'N/A'}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Address 2</p>
                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'address_detail.address_2') || 'N/A'}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">City</p>
                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'address_detail.city') || 'N/A'}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">State</p>
                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'address_detail.state') || 'N/A'}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">ZIP Code</p>
                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'address_detail.zip') || 'N/A'}</h3>
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Status Information */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Online</p>
                <h3 className="text-md font-semibold">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        data?.online 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                    }`}>
                        {data?.online ? "Yes" : "No"}
                    </span>
                </h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Inactive</p>
                <h3 className="text-md font-semibold">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        data?.inactive 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                    }`}>
                        {data?.inactive ? "Yes" : "No"}
                    </span>
                </h3>
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Counts */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">ISO Count</p>
                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'iso_count') || 0}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Access Logs</p>
                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'access_log_count') || 0}</h3>
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Dates */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Last Login</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.last_login ? formatTime(data.last_login) : 'N/A'}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Created Date</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.createdAt ? formatTime(data.createdAt) : 'N/A'}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Updated Date</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.updatedAt ? formatTime(data.updatedAt) : 'N/A'}</h3>
            </div>
        </div>
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
                    representative={data}
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
                    title="Delete Representative"
                    message={`Are you sure you want to delete Representative ${data.first_name} ${data.last_name}? This action cannot be undone.`}
                />
            )}
        </>
    );
} 