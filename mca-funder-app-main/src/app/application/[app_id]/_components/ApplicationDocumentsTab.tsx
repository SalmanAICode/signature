import { useState, useEffect } from 'react';
import { SimpleList } from '@/components/SimpleList';
import { Pagination } from '@/types/pagination';
import { ApplicationDocument } from '@/types/applicationDocument';
import { getApplicationDocuments, deleteApplicationDocument } from '@/lib/api/applicationDocuments';
import { downloadDocument } from '@/components/Document/utils';
import DeleteModal from '@/components/DeleteModal';
import DocumentDetailModal from './documentTab/DocumentDetailModal';
import UploadDocumentModal from './documentTab/uploadDocumentModal';
import AddDocumentModal from './documentTab/addDocumentModal';
import { PreviewDocumentModal } from '@/components/Document/PreviewDocumentModal';
import { Application } from '@/types/application';
import { toast } from 'react-hot-toast';
import type { SortOrder } from '@/components/SimpleList';
import { columns } from './documentTab/columnConfig';
import { ApplicationStipulation } from '@/types/applicationStipulation';
import { getApplicationStipulationList } from '@/lib/api/applicationStipulations';

interface ApplicationDocumentsTabProps {
    data: Application;
}

interface QueryParams {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: SortOrder;
    search?: string;
}

export default function ApplicationDocumentsTab({ data }: ApplicationDocumentsTabProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<ApplicationDocument | null>(null);
    const [queryParams, setQueryParams] = useState<QueryParams>({
        page: 1,
        limit: 10,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
    });
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 0
    });
    const [applicationStipulations, setApplicationStipulations] = useState<ApplicationStipulation[]>([]);
    const [stipLoading, setStipLoading] = useState(false);

    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiParams = {
                ...queryParams,
                sortOrder: queryParams.sortOrder || undefined
            };
            const result = await getApplicationDocuments(data._id, apiParams);
            setDocuments(result.data);
            setPagination(result.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch documents');
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [queryParams.page, queryParams.limit, queryParams.sortBy, queryParams.sortOrder, queryParams.search]);

    useEffect(() => {
        const fetchStipulations = async () => {
            setStipLoading(true);
            try {
                const stips = await getApplicationStipulationList(data._id);
                setApplicationStipulations(stips);
            } catch (error) {
                toast.error('Failed to fetch stipulations');
                setError('Failed to fetch stipulations');
            } finally {
                setStipLoading(false);
            }
        };
        fetchStipulations();
    }, [data._id]);

    const handleDownload = async (document: ApplicationDocument) => {
        setIsDownloading(document._id);
        try {
            await downloadDocument(document?.document);
            toast.success('Document downloaded successfully');
        } catch (error) {
            toast.error('Failed to download document');
        } finally {
            setIsDownloading(null);
        }
    };

    const handleDelete = async () => {
        if (!selectedDocument) return;
        
        setIsDeleting(selectedDocument._id);
        try {
            await deleteApplicationDocument(data._id, selectedDocument._id);

            setDocuments(prev => prev.filter(doc => doc._id !== selectedDocument._id));
            toast.success('Application Document deleted successfully');
            setPagination(prev => ({
                ...prev,
                totalResults: prev.totalResults - 1,
                totalPages: Math.ceil((prev.totalResults - 1) / prev.limit)
            }));

            setShowDeleteModal(false);
            setSelectedDocument(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete document');
        } finally {
            setIsDeleting(null);
        }
    };

    const handleCreate = async (newDocument: ApplicationDocument) => {
        setDocuments(prev => [newDocument, ...prev]);
        setPagination(prev => ({
            ...prev,
            totalResults: prev.totalResults + 1,
            totalPages: Math.ceil((prev.totalResults + 1) / prev.limit)
        }));
    };

    const handlePageChange = (page: number) => {
        setQueryParams(prev => ({ ...prev, page }));
    };

    const handleLimitChange = (limit: number) => {
        setQueryParams(prev => ({ ...prev, limit, page: 1 }));
    };

    const handleSort = (sortBy: string, sortOrder: SortOrder) => {
        setQueryParams(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
    };

    const handleSearch = async (search: string): Promise<void> => {
        setQueryParams(prev => ({ ...prev, search, page: 1 }));
    };

    const handleDocumentUpdate = (updatedDocument: ApplicationDocument) => {
        setDocuments(prevDocuments => 
            prevDocuments.map(doc => 
                doc._id === updatedDocument._id ? updatedDocument : doc
            )
        );
    };

    const renderActions = (item: ApplicationDocument) => (
        <div className="flex space-x-2">
            <button
                onClick={() => handleDownload(item)}
                disabled={isDownloading === item._id || typeof item.document === 'string'}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
                {isDownloading === item._id ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Downloading...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                    </>
                )}
            </button>

            <button
                onClick={() => {
                    setSelectedDocument(item);
                    setShowPreviewModal(true);
                }}
                disabled={typeof item.document === 'string'}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
                Preview
            </button>

            <button
                onClick={() => {
                    setSelectedDocument(item);
                    setShowDetailModal(true);
                }}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-slate-600 border border-transparent rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
                Details
            </button>

            <button
                onClick={() => {
                    setSelectedDocument(item);
                    setShowDeleteModal(true);
                }}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
            </button>
        </div>
    );

    const renderHeaderButtons = () => (
        <div className="flex space-x-2">
            <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
                <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload
                </span>
            </button>
            <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Add Existing
                </span>
            </button>
        </div>
    );

    return (
        <div className="w-full">
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <SimpleList
                    title="Application Documents"
                    data={documents}
                    columns={columns(applicationStipulations)}
                    loading={loading}
                    error={error}
                    emptyMessage="No documents found"
                    renderActions={renderActions}
                    renderHeaderButtons={renderHeaderButtons}
                    onSearch={handleSearch}
                    onSort={handleSort}
                    searchQuery={queryParams.search}
                    initialSortBy={queryParams.sortBy}
                    initialSortOrder={queryParams.sortOrder}
                    pagination={{
                        currentPage: pagination.page,
                        totalPages: pagination.totalPages,
                        totalResults: pagination.totalResults,
                        limit: pagination.limit,
                        onPageChange: handlePageChange,
                        onLimitChange: handleLimitChange
                    }}
                    onUpdate={handleDocumentUpdate}
                />
            </div>

            {selectedDocument && (
                <>
                    <DocumentDetailModal
                        document={selectedDocument}
                        isOpen={showDetailModal}
                        onClose={() => {
                            setShowDetailModal(false);
                            setSelectedDocument(null);
                        }}
                        onRefresh={fetchDocuments}
                    />
                    <PreviewDocumentModal
                        isOpen={showPreviewModal}
                        onClose={() => {
                            setShowPreviewModal(false);
                            setSelectedDocument(null);
                        }}
                        document={selectedDocument.document}
                    />
                </>
            )}

            <DeleteModal
                isOpen={showDeleteModal}
                title="Delete Document"
                message={`Are you sure you want to delete "${selectedDocument?.document && typeof selectedDocument.document !== 'string' ? selectedDocument.document.file_name : 'this document'}"?`}
                onConfirm={handleDelete}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setSelectedDocument(null);
                }}
                isLoading={isDeleting === selectedDocument?._id}
            />

            <UploadDocumentModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={fetchDocuments}
                application={data}
                applicationStipulations={applicationStipulations}
            />

            <AddDocumentModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreate={handleCreate}
                application={data}
                applicationStipulations={applicationStipulations}
            />
        </div>
    );
} 