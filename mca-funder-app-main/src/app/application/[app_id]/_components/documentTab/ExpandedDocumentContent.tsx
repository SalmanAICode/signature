import { useState, useEffect } from 'react';
import { ApplicationDocument } from '@/types/applicationDocument';
import { Document } from '@/types/document';
import { getApplicationDocumentList, formatFileSize } from '@/lib/api/applicationDocuments';
import { getDocumentById } from '@/lib/api/documents';
import { formatDate } from '@/lib/utils/format';
import { StatusBadge } from '@/components/StatusBadge';
import { downloadDocumentById } from '@/components/Document/utils';
import { toast } from 'react-hot-toast';
import { PreviewDocumentModal } from '@/components/Document/PreviewDocumentModal';

interface ExpandedDocumentContentProps {
    item: ApplicationDocument;
}

const handleDownload = async (document: Document) => {
    try {
        await downloadDocumentById(document.document || document._id, document.file_name);
        toast.success('Document downloaded successfully');
    } catch (error) {
        toast.error('Failed to download document');
    }
}

export default function ExpandedDocumentContent({ item }: ExpandedDocumentContentProps) {
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [documentHistory, setDocumentHistory] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDocumentHistory = async () => {
            if (!item.document) return;
            setLoading(true);
            try {
                const document = await getDocumentById(item.document.id);
                setDocumentHistory(document.upload_history_list || []);
            } catch (error) {
                toast.error('Failed to fetch document history');
            } finally {
                setLoading(false);
            }
        };

        fetchDocumentHistory();
    }, [item.document]);

    if (loading) {
        return (
            <div className="p-4 bg-white">
                <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    <span className="text-sm text-gray-500">Loading document history...</span>
                </div>
            </div>
        );
    }

    if (!item.document) {
        return (
            <div className="p-4 bg-white rounded-lg">
                <h2 className="text-md font-bold text-gray-800 mb-4">Document History</h2>
                <div className="text-gray-500">No document found</div>
            </div>
        );
    }

    return (
        <>
            <div className="p-4 bg-white rounded-lg">
                <h2 className="text-md font-bold text-gray-800 mb-4">Document History</h2>
                <table className="w-auto divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">File Name</th>
                            <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Type</th>
                            <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Size</th>
                            <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Created At</th>
                            <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Updated At</th>
                            <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Uploaded By</th>
                            <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {documentHistory.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500">
                                    No document history found
                                </td>
                            </tr>
                        ) : (
                            documentHistory.map((document, index) => (
                                <tr key={document._id || document.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">
                                        {document.file_name}
                                    </td>
                                    <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">
                                        {document.file_type}
                                    </td>
                                    <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">
                                        {formatFileSize(document.file_size)}
                                    </td>
                                    <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(document.createdAt)}
                                    </td>
                                    <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(document.updatedAt)}
                                    </td>
                                    <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">
                                        {document.upload_user?.first_name} {document.upload_user?.last_name}
                                    </td>
                                    <td className="px-3 py-1 whitespace-nowrap text-sm flex gap-2 text-gray-900">
                                        <button 
                                            onClick={() => handleDownload(document)}
                                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Download
                                        </button>
                                        <button 
                                            onClick={() => setSelectedDocument(document)}
                                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                        >
                                            Preview
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <PreviewDocumentModal
                isOpen={!!selectedDocument}
                onClose={() => setSelectedDocument(null)}
                document={selectedDocument}
            />
        </>
    );
} 