import { Application } from "@/types/application";
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from "react";
import DeleteModal from '@/components/DeleteModal';
import { UpdateModal } from './UpdateModal';
import { CreateOfferModal } from './CreateOfferModal';
import { SummaryModalLayout } from "@/components/SummaryModalLayout";
import { ApplicationSummaryContent } from "@/components/Application/ApplicationSummaryContent";
import { ApplicationUpdateFormValues } from './ApplicationUpdateForm';

type SummaryModalProps = {
    title: string;
    data: Application;
    onClose: () => void;
    onUpdate: (values: ApplicationUpdateFormValues) => Promise<{ success: boolean; error?: string }>;
    onDelete: (id: string) => void;
    onOfferCreate: (message: string) => void;
    error?: string | null;
};

type Message = {
    type: 'success' | 'error';
    text: string;
};

export function SummaryModal({ 
    title, 
    data, 
    onClose, 
    onUpdate, 
    onDelete, 
    onOfferCreate,
    error 
}: SummaryModalProps) {
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
        onDelete(data._id);
        setShowDeleteModal(true);
    };

    const header = (
        <h2 className="text-2xl font-bold text-center text-gray-800">{title}</h2>
    );

    const content = <ApplicationSummaryContent data={data} />;

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
                onClick={() => setShowCreateOfferModal(true)}
                className="flex-1 px-2 py-2 rounded-lg bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-700 transition"
            >
                Create Offer
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
                    onUpdate={onUpdate}
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
                        onOfferCreate(message);
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
                    onConfirm={handleDelete}
                    title="Delete Application"
                    message={`Are you sure you want to delete Application ${data._id}? This action cannot be undone.`}
                />
            )}
        </>
    );
}