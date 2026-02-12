// This component is the add document modal for the application->document tab
// It allows the user to upload new documents to the application

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createDocument } from '@/lib/api/documents';
import { DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Application } from '@/types/application';
import { ApplicationStipulation } from '@/types/applicationStipulation';
import Select from 'react-select';
import { createApplicationDocument } from '@/lib/api/applicationDocuments';

interface UploadDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    application: Application;
    applicationStipulations: ApplicationStipulation[];
}

interface FileWithPreview {
    id: string;
    file: File;      // real File instance (with current name)
    preview?: string;
    stipulation?: string;
}

export default function UploadDocumentModal({ 
    isOpen, 
    onClose, 
    onSuccess, 
    application,
    applicationStipulations,
}: UploadDocumentModalProps) {

    // console.log(merchantId, funderId, isoId, syndicatorId);

    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const { files } = e.dataTransfer;
        if (files && files.length > 0) {
            handleFiles(files);
        }
    }, []);

    const validateFile = (file: File): string | null => {
        const allowedTypes = [
            // Documents 
            'application/pdf',  //.pdf
            'application/msword', //.doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', //.docx
            'application/vnd.ms-excel', //.xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', //.xlsx

              // Images
            'image/jpeg',
            'image/png',
            'image/jpg',
            'image/bmp',
        ];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
            return 'Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, JPEG, PNG, JPG, BMP files are allowed.';
        }

        if (file.size > maxSize) {
            return 'File is too large. Maximum size is 10MB.';
        }

        return null;
    };

    // Convert native File to FileWithPreview with a new unique id
    const createFileWithPreview = (file: File): FileWithPreview => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
    });

    const handleFiles = (fileList: FileList) => {
        const validFiles: FileWithPreview[] = [];
        const errors: string[] = [];

        Array.from(fileList).forEach((file) => {
            const error = validateFile(file);
            if (error) {
                errors.push(`${file.name}: ${error}`);
            } else {
                validFiles.push(createFileWithPreview(file));
            }
        });

        if (errors.length > 0) {
            setError(errors.join('\n'));
            return;
        }

        setError(null);
        setFiles((prev) => [...prev, ...validFiles]);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const removeFile = (fileId: string) => {
        setFiles((prev) => prev.filter((file) => file.id !== fileId));
    };

    // Rename a file by creating a new File instance with new name
    // const renameFile = (fileId: string, newName: string) => {
    //     setFiles((prev) =>
    //         prev.map((fwp) => {
    //             if (fwp.id === fileId) {
    //                 // Create new File instance with newName
    //                 const renamedFile = new File([fwp.file], newName, {
    //                     type: fwp.file.type,
    //                     lastModified: fwp.file.lastModified,
    //                 });
    //                 return { ...fwp, file: renamedFile };
    //             }
    //             return fwp;
    //         })
    //     );
    // };

    const updateFileStipulation = (fileId: string, stipulationId: string) => {
        setFiles((prev) => prev.map((file) => 
            file.id === fileId ? { ...file, stipulation: stipulationId } : file
        ));
    };

    const resetStates = () => {
        setFiles([]);
        setError(null);
        setSuccess(null);
        setUploadProgress({});
        setDragActive(false);
        setUploading(false);
    };

    const handleClose = () => {
        resetStates();
        onClose();
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setError(null);
        setSuccess(null);

        try {
            for (const fwp of files) {
                const file = fwp.file;

                setUploadProgress((prev) => ({ ...prev, [fwp.id]: 0 }));

                // Create the document first
                const document = await createDocument({
                    file: file,
                    file_name: file.name,
                    merchant: application?.merchant?.id,
                    funder: application?.funder?.id,
                    iso: application?.iso?.id,
                    syndicator: application?.syndicator?.id
                });

                // Then create the application document with stipulation if provided
                if (application._id) {
                    await createApplicationDocument(
                        application._id,
                        document._id,
                        fwp.stipulation
                    );
                }

                setUploadProgress((prev) => ({ ...prev, [fwp.id]: 100 }));
            }

            setSuccess(`Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}!`);
            setFiles([]);
            setUploadProgress({});
            onSuccess();
        } catch (error) {
            console.error('Upload failed:', error);
            setError('Failed to upload files. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    {success && (
                        <div className="rounded-md bg-green-50 p-4 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">
                                        {success}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-md bg-red-50 p-4 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Drag & Drop Area */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg transition-colors ${
                            dragActive 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        {uploading ? (
                            <div className="text-center py-12">
                                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="mt-2 text-sm text-gray-500">
                                    Uploading documents...
                                </p>
                            </div>
                        ) : files.length === 0 ? (
                            <div className="text-center py-12">
                                <input
                                    ref={inputRef}
                                    type="file"
                                    onChange={handleChange}
                                    className="hidden"
                                    multiple
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.bmp"
                                />
                                <svg 
                                    className="mx-auto h-12 w-12 text-gray-400" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" 
                                    />
                                </svg>
                                <p className="mt-2 text-sm text-gray-500">
                                    Drag and drop files here, or{' '}
                                    <button
                                        type="button"
                                        onClick={() => inputRef.current?.click()}
                                        className="text-blue-600 hover:text-blue-500"
                                    >
                                        browse
                                    </button>
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG, BMP (max 10MB)
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Header Row */}
                                <div className="grid grid-cols-12 gap-2 items-center bg-gray-50 px-3 py-2">
                                    <div className="col-span-5">
                                        <label className="block text-xs font-medium text-gray-700">Document</label>
                                    </div>
                                    <div className="col-span-6">
                                        <label className="block text-xs font-medium text-gray-700">Stipulation</label>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-medium text-gray-700">Action</label>
                                    </div>
                                </div>

                                {/* File List */}
                                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                    {files.map(({ id, file, stipulation }) => (
                                        <div key={id} className="grid grid-cols-12 gap-2 items-center px-3 py-3">
                                            <div className="col-span-5">
                                                <div className="flex items-center space-x-2">
                                                    <DocumentIcon className="h-5 w-5 text-gray-400" />
                                                    <span className="text-sm text-gray-900">{file.name}</span>
                                                    {uploadProgress[id] > 0 && (
                                                        <div className="w-24 h-1 bg-gray-200 rounded-full">
                                                            <div
                                                                className="h-1 bg-blue-600 rounded-full"
                                                                style={{ width: `${uploadProgress[id]}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-span-6">
                                                <Select
                                                    options={applicationStipulations.map(s => ({
                                                        value: s._id,
                                                        label: s.stipulation_type?.name || '',
                                                    }))}
                                                    onChange={(selected) => {
                                                        updateFileStipulation(id, selected?.value || '');
                                                    }}
                                                    value={stipulation ? {
                                                        value: stipulation,
                                                        label: applicationStipulations.find(s => s._id === stipulation)?.stipulation_type?.name || '',
                                                    } : null}
                                                    className="text-sm"
                                                    classNamePrefix="select"
                                                    placeholder="Select stipulation..."
                                                    isClearable
                                                    styles={{
                                                        menuPortal: (base) => ({
                                                            ...base,
                                                            zIndex: 99999
                                                        }),
                                                        menu: (base) => ({
                                                            ...base,
                                                            zIndex: 99999
                                                        })
                                                    }}
                                                    menuPortalTarget={document.body}
                                                    menuPosition="fixed"
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <button
                                                    onClick={() => removeFile(id)}
                                                    className="w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    title="Remove document"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Upload hint at bottom */}
                        <div className="border-t border-gray-200">
                            <input
                                type="file"
                                ref={inputRef}
                                onChange={handleChange}
                                className="hidden"
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.bmp"
                            />
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset transition-colors duration-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                                Drag file here to upload or click to browse
                            </button>
                        </div>
                    </div>
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
                        onClick={handleUpload}
                        disabled={files.length === 0 || uploading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
}