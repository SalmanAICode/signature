import { useState, useRef, useCallback } from 'react';
import { createDocument } from '@/lib/api/documents';
import { Document, CreateDocumentData } from '@/types/document';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

type UploadModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

interface FileWithPreview extends File {
    id: string;
    preview?: string;
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle drag events
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    // Handle dropped files
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    }, []);

    // Handle selected files from input
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    // Process files
    const handleFiles = (fileList: FileList) => {
        console.log('Processing files:', fileList.length);

        const newFiles: FileWithPreview[] = Array.from(fileList).map((file, index) => {
            // Ensure we have a valid filename
            let fileName = file.name;

            // Handle edge cases for filename
            if (!fileName || fileName.trim() === '' || fileName === 'undefined') {
                const timestamp = Date.now();
                const extension = file.type ? file.type.split('/')[1] || 'bin' : 'bin';
                fileName = `document_${timestamp}_${index + 1}.${extension}`;
                console.warn(`File had invalid name, assigned: ${fileName}`);
            }

            console.log(`Processing file ${index + 1}:`, {
                originalName: file.name,
                assignedName: fileName,
                size: file.size,
                type: file.type
            });

            // Create a new File object with the corrected name if needed
            const processedFile = fileName !== file.name
                ? new File([file], fileName, { type: file.type })
                : file;

            return Object.assign(processedFile, {
                id: Math.random().toString(36).substr(2, 9),
            }) as FileWithPreview;
        });

        // Validate files
        const validFiles = newFiles.filter((file, index) => {
            const maxSize = 50 * 1024 * 1024; // 50MB

            console.log(`Validating file ${index + 1}:`, {
                name: file.name,
                size: file.size,
                type: file.type
            });

            if (file.size > maxSize) {
                setError(`File "${file.name || 'Unknown file'}" is too large. Maximum size is 50MB.`);
                return false;
            }

            // Validate filename exists and is not empty
            if (!file.name || file.name.trim() === '' || file.name === 'undefined') {
                setError(`Invalid filename detected for file ${index + 1}. Please select a valid file.`);
                return false;
            }

            // Validate file type
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'text/plain'
            ];

            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'txt'];

            if (!allowedExtensions.includes(fileExtension || '')) {
                setError(`File "${file.name}" has an unsupported file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG, GIF, TXT`);
                return false;
            }

            return true;
        });

        console.log(`Successfully processed ${validFiles.length} out of ${newFiles.length} files`);
        setFiles(prev => [...prev, ...validFiles]);
    };

    // Remove file from list
    const removeFile = (fileId: string) => {
        setFiles(prev => prev.filter(file => file.id !== fileId));
    };

    // Upload files
    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setError(null);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Ensure we have a valid filename
                const fileName = file.name || `document_${Date.now()}_${i + 1}.bin`;
                const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'bin';

                setUploadProgress(prev => ({ ...prev, [file.id]: 0 }));

                console.log('Creating document:', fileName, 'Size:', file.size, 'Type:', fileExtension);

                // Create document record with file data
                const createdDocument = await createDocument({ file });

                // Simulate upload progress
                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => {
                        const currentProgress = prev[file.id] || 0;
                        if (currentProgress >= 90) {
                            clearInterval(progressInterval);
                            return prev;
                        }
                        return { ...prev, [file.id]: currentProgress + 10 };
                    });
                }, 100);

                // Complete the progress after a short delay
                setTimeout(() => {
                    clearInterval(progressInterval);
                    setUploadProgress(prev => ({ ...prev, [file.id]: 100 }));
                }, 1000);
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Upload error:', err);
            setError(
                typeof err === 'object' && err !== null && 'message' in err
                    ? String((err as Error).message)
                    : 'Failed to upload documents'
            );
        } finally {
            setUploading(false);
        }
    };

    // Open file browser
    const onButtonClick = () => {
        fileInputRef.current?.click();
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        if (!bytes || isNaN(bytes)) return 'Unknown size';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleClose = () => {
        if (!uploading) {
            setFiles([]);
            setError(null);
            setUploadProgress({});
            onClose();
        }
    };

    // Early return after all hooks have been called
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
                    <button
                        onClick={handleClose}
                        disabled={uploading}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex">
                            <div className="text-red-700 text-sm">{error}</div>
                        </div>
                    </div>
                )}

                {/* Upload Area */}
                <div
                    className={`relative border-2 border-dashed rounded-lg p-6 mb-4 transition-colors ${dragActive
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".doc,.docx"
                    />

                    <div className="text-center">
                        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                    Drop files here or click to browse
                                </span>
                            </label>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Supports:  DOC, DOCX, (Max 50MB each)
                        </p>
                    </div>

                    <div className="mt-4 flex justify-center">
                        <button
                            type="button"
                            onClick={onButtonClick}
                            disabled={uploading}
                            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            Choose Files
                        </button>
                    </div>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files ({files.length})</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {files.map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <DocumentIcon className="h-8 w-8 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                                {file.name || 'Unknown filename'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatFileSize(file.size || 0)} • {file.type || `${file.name.split('.').pop()?.toUpperCase() || 'Unknown'} file`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {uploading && uploadProgress[file.id] !== undefined && (
                                            <div className="w-16">
                                                <div className="bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${uploadProgress[file.id]}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 text-center mt-1">
                                                    {uploadProgress[file.id] === 100 ? 'Uploaded' : `${uploadProgress[file.id]}%`}
                                                </p>
                                            </div>
                                        )}
                                        {!uploading && (
                                            <button
                                                onClick={() => removeFile(file.id)}
                                                className="text-red-400 hover:text-red-600"
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={uploading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={files.length === 0 || uploading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-400"
                    >
                        {uploading ? 'Uploading...' : `Upload ${files.length} ${files.length === 1 ? 'File' : 'Files'}`}
                    </button>
                </div>
            </div>
        </div>
    );
} 