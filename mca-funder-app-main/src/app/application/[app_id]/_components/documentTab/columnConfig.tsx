import { formatTime } from '@/lib/utils/format';
import type { Column } from '@/components/SimpleList';
import { ApplicationDocument } from "@/types/applicationDocument";
import { formatFileSize, updateApplicationDocument } from "@/lib/api/applicationDocuments";
import { StaticSelector } from '@/components/StatusSelector/StaticSelector';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { StatusBadge } from '@/components/StatusBadge';
import { ApplicationStipulation } from '@/types/applicationStipulation';
import UpdateModal from '@/components/UpdateModal';



// File type icons mapping
export const FileIcon = ({ type }: { type: string }) => {
    const getIconByType = (fileType: string) => {
        const type = fileType.toLowerCase();
        if (type.includes('pdf')) {
            return (
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.363 2c4.155 0 2.637 6 2.637 6s6-1.65 6 2.457v11.543h-16v-20h7.363zm.826-2h-10.189v24h20v-14.386c0-2.391-6.648-9.614-9.811-9.614zm4.811 13h-2.628v3.686h.907v-1.472h1.49v-.732h-1.49v-.698h1.721v-.784zm-4.9 0h-1.599v3.686h1.599c.537 0 .961-.181 1.262-.535.555-.658.587-2.034-.062-2.692-.298-.3-.712-.459-1.2-.459zm-.692.783h.496c.473 0 .802.173.915.644.064.267.077.679-.021.948-.128.351-.381.528-.754.528h-.637v-2.12zm-2.74-.783h-1.668v3.686h.907v-1.277h.761c.619 0 1.064-.277 1.224-.763.095-.291.095-.597 0-.885-.16-.484-.606-.761-1.224-.761zm-.761.732h.546c.235 0 .467.028.576.228.067.123.067.366 0 .489-.109.199-.341.227-.576.227h-.546v-.944z" />
                </svg>
            );
        }
        if (type.includes('excel') || type.includes('spreadsheet') || type.includes('csv')) {
            return (
                <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.17 3.25q.33 0 .59.25.24.24.24.58v15.84q0 .34-.24.58-.26.25-.59.25H7.83q-.33 0-.59-.25-.24-.24-.24-.58V13h1.66v5.25h11.25v-10.5h-11.25v5.25H7V4.08q0-.34.24-.58.26-.25.59-.25h13.34M5.33 7.75l2.51 3.25-2.51 3.25h2.09l1.67-2.17 1.67 2.17h2.09l-2.51-3.25 2.51-3.25h-2.09l-1.67 2.17-1.67-2.17h-2.09Z" />
                </svg>
            );
        }
        if (type.includes('word') || type.includes('document')) {
            return (
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.5 12c-2.483 0-4.5 2.015-4.5 4.5s2.017 4.5 4.5 4.5 4.5-2.015 4.5-4.5-2.017-4.5-4.5-4.5zm2.5 5h-5v-1h5v1zm-18 0l4-5.96 2.48 1.96 2.52-4 1.853 2.964c-1.271 1.303-1.977 3.089-1.827 5.036h-9.026zm10.82 4h-14.82v-18h22v7.501c-.623-.261-1.297-.422-2-.476v-5.025h-18v14h11.502c.312.749.765 1.424 1.318 2zm-9.32-11c-.828 0-1.5-.671-1.5-1.5 0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5c0 .829-.672 1.5-1.5 1.5z" />
                </svg>
            );
        }
        // Default file icon
        return (
            <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2M18 20H6V4H13V9H18V20Z" />
            </svg>
        );
    };

    return getIconByType(type);
};

const TypeSelectorWrapper = ({ item, onUpdate, stipulations }: { item: ApplicationDocument; onUpdate: (updatedItem: ApplicationDocument) => void; stipulations: ApplicationStipulation[] }) => {
    const initialStipulation = item.application_stipulation?.stipulation_type?.name || '';
    const [isLoading, setIsLoading] = useState(false);
    const [selectedStipulation, setSelectedStipulation] = useState<string>(initialStipulation);
    const [showModal, setShowModal] = useState(false);
    const [pendingStipulation, setPendingStipulation] = useState<string | null>(null);

    // Get static array of stipulation names
    const stipulationNames = stipulations.map((stipulation: any) => stipulation.stipulation_type?.name || '');

    const handleUpdate = (newStipulationName: string) => {
        setPendingStipulation(newStipulationName);
        setShowModal(true);
    };

    const handleConfirm = async () => {
        if (!pendingStipulation) return;
                    setIsLoading(true);
                    try {
            const newStipulation = stipulations.find((s: any) => s.stipulation_type?.name === pendingStipulation);
                        if (!newStipulation) {
                            throw new Error('Stipulation not found');
                        }
                        const updatedDocument = await updateApplicationDocument({
                            applicationId: item.application,
                            documentId: item._id,
                            applicationStipulationId: newStipulation._id
                        });
            setSelectedStipulation(pendingStipulation);
                        onUpdate(updatedDocument);
                        toast.success('Document stipulation updated successfully');
                    } catch (error) {
                        toast.error('Failed to update document stipulation');
                    } finally {
                        setIsLoading(false);
            setShowModal(false);
            setPendingStipulation(null);
                    }
    };

    const handleCancel = () => {
        setShowModal(false);
        setPendingStipulation(null);
    };

    return (
        <div className="min-w-[300px]">
            <StaticSelector<string>
                value={selectedStipulation}
                options={stipulationNames}
                onUpdate={handleUpdate}
                isLoading={isLoading}
                width="300px"
            />
            <UpdateModal
                isOpen={showModal}
                title="Confirm Stipulation Change"
                message={`Are you sure you want to change the stipulation to "${pendingStipulation ?? ''}"?`}
                confirmButtonText="Confirm"
                cancelButtonText="Cancel"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                isLoading={isLoading}
            />
        </div>
    );
};

export const columns = (stipulations: ApplicationStipulation[]): Column<ApplicationDocument>[] => [
    {
        key: 'document',
        label: 'Document',
        render: (onUpdate, item: ApplicationDocument) => {
            const documentInfo = typeof item.document === 'string'
                ? { id: item.document, file_name: 'Unknown', file_type: 'Unknown', file_size: 0 }
                : item.document;

            return (
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <FileIcon type={documentInfo.file_type} />
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                            {documentInfo.file_name}
                        </div>
                    </div>
                </div>
            );
        },
        sortable: true
    },
    {
        key: 'document.file_type',
        label: 'Type',
        sortable: true
    },
    {
        key: 'document.file_size',
        label: 'Size',
        render: formatFileSize,
        sortable: true
    },
    {
        key: 'createdAt',
        label: 'Created At',
        render: formatTime,
        sortable: true
    },
    {
        key: 'updatedAt',
        label: 'Updated At',
        render: formatTime,
        sortable: true
    },
    { 
        key: 'application_stipulation',
        label: 'Stipulation',
        render: (onUpdate: (updatedItem: ApplicationDocument) => void, item: ApplicationDocument) => {
            return <TypeSelectorWrapper 
                item={item} 
                onUpdate={onUpdate} 
                stipulations={stipulations}
            />;
        },
        sortable: true
    },
    {
        key: 'application_stipulation.status',
        label: 'Status',
        render: (value: string) => value ? <StatusBadge status={value} /> : '-',
        sortable: true
    }
];