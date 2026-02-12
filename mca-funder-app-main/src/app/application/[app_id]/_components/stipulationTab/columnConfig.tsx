import { useState } from "react";
import { toast } from "react-hot-toast";
import { ApplicationStipulation } from "@/types/applicationStipulation";
import { updateApplicationStipulation } from "@/lib/api/applicationStipulations";
import { StaticSelector } from "@/components/StatusSelector/StaticSelector";
import { formatTime } from "@/lib/utils/format";
import UpdateModal from "@/components/UpdateModal";

const applicationStipulationStatus = ['REQUESTED', 'RECEIVED', 'VERIFIED', 'WAIVED'] as const;
type ApplicationStipulationStatus = typeof applicationStipulationStatus[number];

// Wrapper component to handle state and confirmation
const StatusSelectorWrapper = ({ item, onUpdate }: { item: ApplicationStipulation; onUpdate: (updatedItem: ApplicationStipulation) => void }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<ApplicationStipulationStatus | null>(null);

    const needsConfirmation = (status: ApplicationStipulationStatus) =>
        status === 'VERIFIED' || status === 'WAIVED';

    const handleStatusUpdate = (newStatus: ApplicationStipulationStatus) => {
        if (needsConfirmation(newStatus)) {
            setPendingStatus(newStatus);
            setShowModal(true);
        } else {
            doUpdate(newStatus);
        }
    };

    const doUpdate = async (newStatus: ApplicationStipulationStatus) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const updatedStipulation = await updateApplicationStipulation(item.application, item._id, {
                status: newStatus
            });
            onUpdate(updatedStipulation);
            toast.success('Status updated successfully');
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        if (pendingStatus) {
            doUpdate(pendingStatus);
        }
        setShowModal(false);
        setPendingStatus(null);
    };

    const handleCancel = () => {
        setShowModal(false);
        setPendingStatus(null);
    };

    return (
        <>
            <StaticSelector<ApplicationStipulationStatus>
            value={item.status}
            options={[...applicationStipulationStatus]}
            onUpdate={handleStatusUpdate}
            width="150px"
            isLoading={isLoading}
            />
            <UpdateModal
                isOpen={showModal}
                title="Confirm Status Change"
                message={`Are you sure you want to change status to "${pendingStatus ?? ''}"?`}
                confirmButtonText="Confirm"
                cancelButtonText="Cancel"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                isLoading={isLoading}
        />
        </>
    );
};

export const columns = [
    {
        key: 'stipulation_type',
        label: 'Name',
        sortable: true,
        render: (value: any) => value?.name || '-'
    },
    {
        key: 'document_count',
        label: 'Document Count',
        sortable: true
    },
    {
        key: 'note',
        label: 'Notes',
        sortable: true,
        render: (value: any) => {
            if (!value) return '-';
            const maxLength = 50;
            if (value.length <= maxLength) return value;
            return (
                <div className="group relative">
                    <span>{value.substring(0, maxLength)}...</span>
                    <div className="hidden group-hover:block absolute z-10 p-2 bg-white border border-gray-200 rounded shadow-lg max-w-md">
                        {value}
                    </div>
                </div>
            );
        }
    },
    { 
        key: 'status_date',
        label: 'Status Date',
        sortable: true,
        render: formatTime
    },
    {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (onUpdate: (updatedItem: ApplicationStipulation) => void, item: ApplicationStipulation) => (
            <StatusSelectorWrapper item={item} onUpdate={onUpdate} />
        )
    },
];