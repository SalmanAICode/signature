// This component is the add document modal for the application->document tab
// It allows the user to add existing documents to the application


'use client';

import { useState, useEffect } from 'react';
import { getDocumentList } from '@/lib/api/documents';
import { Document } from '@/types/document';
import { XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { createApplicationDocument } from '@/lib/api/applicationDocuments';
import { Application } from '@/types/application';
import { ApplicationStipulation } from '@/types/applicationStipulation';
import { toast } from 'react-hot-toast';
import { ApplicationDocument } from '@/types/applicationDocument';

interface AddDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (newDocument: ApplicationDocument) => void;
    application: Application;
    applicationStipulations: ApplicationStipulation[];
}

export default function AddDocumentModal({ isOpen, onClose, onCreate, application, applicationStipulations }: AddDocumentModalProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
    const [documentStipulations, setDocumentStipulations] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [documentErrors, setDocumentErrors] = useState<Map<string, string>>(new Map());
    const [loadingDocuments, setLoadingDocuments] = useState<Set<string>>(new Set());
    const [successDocuments, setSuccessDocuments] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchDocuments();
        }
    }, [isOpen]);

    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);
        try {
            const docs = await getDocumentList({ funder: application.funder?.id, merchant: application.merchant?.id });
            setDocuments(docs);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch documents. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedDocuments(new Set());
        setSearchTerm('');
        setError(null);
        setDocumentErrors(new Map());
        setLoadingDocuments(new Set());
        setSuccessDocuments(new Set());
        onClose();
    };

    const toggleDocument = (documentId: string) => {
        setSelectedDocuments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(documentId)) {
                newSet.delete(documentId);
                // Clear stipulation when document is unselected
                setDocumentStipulations(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(documentId);
                    return newMap;
                });
            } else {
                newSet.add(documentId);
            }
            return newSet;
        });
    };

    const handleStipulationChange = (documentId: string, stipulationId: string) => {

        setDocumentStipulations(prev => {
            const newMap = new Map(prev);
            newMap.set(documentId, stipulationId);
            return newMap;
        });
    };

    const handleSubmit = async () => {
        setError(null);
        setDocumentErrors(new Map());
        setSuccessDocuments(new Set());
        setLoadingDocuments(new Set(selectedDocuments));

        const selectedDocs = documents.filter(doc => selectedDocuments.has(doc._id));
        let hasErrors = false;

        // add the selected documents to the application with their stipulations
        for (const doc of selectedDocs) {
            try {
                const stipulationId = documentStipulations.get(doc._id) || undefined;
                const newDoc = await createApplicationDocument(application._id, doc._id, stipulationId);
                setLoadingDocuments(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(doc._id);
                    return newSet;
                });
                setSuccessDocuments(prev => new Set(prev).add(doc._id));
                onCreate(newDoc);
            } catch (err) {
                setDocumentErrors(prev => new Map(prev).set(doc._id, err instanceof Error ? err.message : 'Failed to add document'));
                setLoadingDocuments(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(doc._id);
                    return newSet;
                });
                hasErrors = true;
            }
        }

        // Only close and call onSuccess if there were no errors
        if (!hasErrors) {
            toast.success('All documents added successfully');
            handleClose();
        }
        else {
            toast.error('Duplicate documents were not added.');
        }

    };

    const filteredDocuments = documents.filter(doc =>
        doc.file_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Add Existing Documents</h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : error ? (
                        <div className="text-red-600 text-center py-4">{error}</div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="text-gray-500 text-center py-4">
                            {searchTerm ? 'No documents found matching your search.' : 'No documents available.'}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredDocuments.map((doc) => (
                                <div
                                    key={doc._id}
                                    className={`flex items-center p-3 rounded-lg ${selectedDocuments.has(doc._id)
                                        ? 'bg-blue-50 border border-blue-200'
                                        : 'hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center flex-1" onClick={() => toggleDocument(doc._id)}>
                                        <input
                                            type="checkbox"
                                            checked={selectedDocuments.has(doc._id)}
                                            onChange={() => { }}
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                        />
                                        <div className="items-center justify-left ml-3 flex-1">
                                            <div className="flex items-center">
                                                <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {doc.file_name || 'Unnamed Document'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {doc.file_type || 'Unknown'}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedDocuments.has(doc._id) && (
                                                <div
                                                    className="mt-2"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <label htmlFor="stipulation" className="text-xs text-gray-500 block mb-1">Document Stipulation Type</label>
                                                    <select
                                                        value={documentStipulations.get(doc._id) || ''}
                                                        onChange={(e) => handleStipulationChange(doc._id, e.target.value)}
                                                        className="px-2 py-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    >
                                                        <option value="">Select Stipulation</option>
                                                        {applicationStipulations.map((stip) => (
                                                            <option key={stip._id} value={stip._id}>
                                                                {stip.stipulation_type?.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                        {loadingDocuments.has(doc._id) ? (
                                            <div className="ml-4 flex items-start">
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mt-1"></div>
                                            </div>
                                        ) : successDocuments.has(doc._id) ? (
                                            <div className="ml-4 text-sm text-green-600 flex items-start">
                                                <svg className="h-4 w-4 mr-1 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>Added successfully</span>
                                            </div>
                                        ) : documentErrors.has(doc._id) && (
                                            <div className="ml-4 text-sm text-red-600 flex items-start">
                                                <svg className="h-4 w-4 mr-1 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>{documentErrors.get(doc._id)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={selectedDocuments.size === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add Selected ({selectedDocuments.size})
                    </button>
                </div>
            </div>
        </div>
    );
}
