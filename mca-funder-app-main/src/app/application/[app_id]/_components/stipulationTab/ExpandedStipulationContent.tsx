import { useState, useEffect } from 'react';
import { ApplicationStipulation } from '@/types/applicationStipulation';
import { Document } from '@/types/document';
import { getApplicationDocumentList, formatFileSize } from '@/lib/api/applicationDocuments';
import { formatDate } from '@/lib/utils/format';
import { StatusBadge } from '@/components/StatusBadge';
import { downloadDocument } from '@/components/Document/utils';
import { toast } from 'react-hot-toast';
import { PreviewDocumentModal } from '@/components/Document/PreviewDocumentModal';

interface ExpandedStipulationContentProps {
    item: ApplicationStipulation;
}

const handleDownload = async (document: Document) => {
    try {
        await downloadDocument(document);
        toast.success('Document downloaded successfully');
    } catch (error) {
        toast.error('Failed to download document');
    }
}

export default function ExpandedStipulationContent({ item }: ExpandedStipulationContentProps) {
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

    if (item.document_count === 0) {
        return (
            <div className="p-4 bg-white rounded-lg ">
                <h2 className="text-md font-bold text-gray-800 mb-4">Documents for {item.stipulation_type?.name}</h2>
                <div className="text-gray-500">No documents found for this stipulation</div>
            </div>
        );
    }

    return (
        <>
            <div className="p-4 bg-white rounded-lg ">
                <h2 className="text-md font-bold text-gray-800 mb-4">Documents for {item.stipulation_type?.name}</h2>
                <table className="w-auto divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Document Name</th>
                            <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Type</th>
                            <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Size</th>
                            <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Last Modified At</th>
                            <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {item.document_list.map((document) => {
                            return (
                                <tr key={document.id} className="hover:bg-gray-50">
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
                                        {formatDate(document.last_modified)}
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
                            );
                        })}
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