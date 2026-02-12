// This component is the document detail modal for the application->document tab
// It allows the user to view the details of a document

import { ApplicationDocument } from '@/types/applicationDocument';
import { formatTime } from '@/components/GenericList/utils';
import { formatFileSize  } from '@/lib/api/applicationDocuments';
import { downloadDocument, downloadDocumentById } from '@/components/Document/utils';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getDocumentById } from '@/lib/api/documents';
import { Document } from '@/types/document';
import { PreviewDocumentModal } from '@/components/Document/PreviewDocumentModal';

interface DocDetailModalProps {
    document: ApplicationDocument;
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

export default function DocDetailModal({ document, isOpen, onClose, onRefresh }: DocDetailModalProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [documentHistory, setDocumentHistory] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

    useEffect(() => {
        const fetchDocumentHistory = async () => {
            if (!document.document || typeof document.document === 'string') return;
            setLoading(true);
            try {
                const doc = await getDocumentById(document.document.id);
                setDocumentHistory(doc.upload_history_list || []);
            } catch (error) {
                toast.error('Failed to fetch document history');
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchDocumentHistory();
        }
    }, [document.document, isOpen]);

    if (!isOpen) return null;

    const documentInfo = typeof document.document === 'string'
        ? { id: document.document, file_name: 'Unknown', file_type: 'Unknown', file_size: 0 }
        : document.document;

    const handleDownload = async () => {
        if (typeof document.document === 'string') return;

        setIsDownloading(true);
        try {
            await downloadDocument(document.document);
            toast.success('Document downloaded successfully');
        } catch (error) {
            toast.error('Failed to download document');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleHistoryDownload = async (doc: Document) => {
        try {
            await downloadDocumentById(doc.document || doc._id, doc.file_name);
            toast.success('Document downloaded successfully');
        } catch (error) {
            toast.error('Failed to download document');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900">Document Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-6 overflow-y-auto">
                    {/* Document Information */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                            <span className="text-gray-500">Document ID</span>
                            <p className="mt-1">{document._id}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">File Name</span>
                            <p className="mt-1">{documentInfo.file_name}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">File Type</span>
                            <p className="mt-1">{documentInfo.file_type}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">File Size</span>
                            <p className="mt-1">{formatFileSize(documentInfo.file_size)}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Created At</span>
                            <p className="mt-1">{document.createdAt ? formatTime(document.createdAt) : '-'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Updated At</span>
                            <p className="mt-1">{document.updatedAt ? formatTime(document.updatedAt) : '-'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Stipulation</span>
                            <p className="mt-1">{document.application_stipulation?.stipulation_type?.name || '-'}</p>
                        </div>
                    </div>

                    {/* Document History */}
                    <div className="mt-6">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">Document History</h4>
                        {loading ? (
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                                <span className="text-sm text-gray-500">Loading document history...</span>
                            </div>
                        ) : documentHistory.length === 0 ? (
                            <div className="text-sm text-gray-500">No document history found</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {documentHistory.map((doc) => (
                                            <tr key={doc._id} className="hover:bg-gray-50">
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{doc.file_name}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{doc.file_type}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatFileSize(doc.file_size)}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatTime(doc.createdAt)}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatTime(doc.updatedAt)}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                                    {doc.upload_user?.first_name} {doc.upload_user?.last_name}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm flex gap-2">
                                                    <button 
                                                        onClick={() => handleHistoryDownload(doc)}
                                                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        Download
                                                    </button>
                                                    <button 
                                                        onClick={() => setSelectedDocument(doc)}
                                                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                    >
                                                        Preview
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer with Actions */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end items-center space-x-3 flex-shrink-0">
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading || typeof document.document === 'string'}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 inline-flex items-center shadow-sm transition-colors duration-150"
                    >
                        {isDownloading ? (
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
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center shadow-sm transition-colors duration-150"
                    >
                        <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Close
                    </button>
                </div>
            </div>
            <PreviewDocumentModal
                isOpen={!!selectedDocument}
                onClose={() => setSelectedDocument(null)}
                document={selectedDocument}
                documentId={selectedDocument?.document || selectedDocument?._id}
            />
        </div>
    );
}
