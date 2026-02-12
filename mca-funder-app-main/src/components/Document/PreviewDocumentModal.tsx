"use client";

import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, EyeIcon, DocumentTextIcon, PhotoIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { downloadDocument } from '@/lib/api/documents';
import { Document } from '@/types/document';
import { formatDate } from '@/lib/utils/format';
import { downloadDocument as downloadDocumentUtil } from '@/components/Document/utils';
import { toast } from 'react-hot-toast';

interface PreviewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  documentId?: string;
}

export function PreviewDocumentModal({
  isOpen,
  onClose,
  document,
  documentId,
}: PreviewDocumentModalProps) {
  const [previewError, setPreviewError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch and create blob URL for file preview
  useEffect(() => {
    const docId = documentId || document?._id || document?.id;
    if (!isOpen || !docId) {
      // Clean up previous blob URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setLoading(false);
      return;
    }

    const fetchPreviewFile = async () => {
      // If we already have a preview URL for this document, don't reload
      if (previewUrl) {
        return;
      }

      setLoading(true);
      setPreviewError(false);

      try {
        const blob = await downloadDocument(docId);
        if (!blob) {
          throw new Error('Failed to fetch document');
        }
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (error) {
        console.error('Preview fetch error:', error);
        toast.error(
          error instanceof Error ? error.message : "Failed to preview document",
        );
        setPreviewError(true);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch for supported preview types
    const supportedTypes = ['image/', 'application/pdf'];
    const canPreview = document && supportedTypes.some(type => 
      document.file_type.startsWith(type) || document.file_type === type
    );

    if (canPreview) {
      fetchPreviewFile();
    } else {
      setLoading(false);
      setPreviewError(true);
    }

    // Cleanup function
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, document, documentId]); // Only depend on isOpen and document ID

  if (!isOpen || !document) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <PhotoIcon className="w-5 h-5" />;
    } else if (fileType === "application/pdf") {
      return <DocumentTextIcon className="w-5 h-5" />;
    } else {
      return <DocumentIcon className="w-5 h-5" />;
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-500 text-center">Loading preview...</p>
        </div>
      );
    }

    if (previewError || !previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <DocumentIcon className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">
            Preview not available for this file type
            <br />
            <span className="text-sm">Use download to view the file</span>
          </p>
        </div>
      );
    }

    if (document.file_type.startsWith("image/")) {
      return (
        <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-lg overflow-auto">
          <img
            src={previewUrl}
            alt={document.file_name}
            className="max-w-full max-h-[calc(90vh-300px)] object-contain rounded shadow-lg p-4"
            onError={() => setPreviewError(true)}
          />
        </div>
      );
    } else if (document.file_type === "application/pdf") {
      return (
        <div className="bg-gray-50 rounded-lg overflow-hidden" style={{ height: 'calc(90vh - 300px)', minHeight: '400px' }}>
          <iframe
            src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full rounded-lg"
            title={`Preview of ${document.file_name}`}
            onError={() => setPreviewError(true)}
          />
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          {getFileTypeIcon(document.file_type)}
          <p className="text-gray-500 text-center mt-4">
            Preview not available for this file type
            <br />
            <span className="text-sm">Use download to view the file</span>
          </p>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-none flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {getFileTypeIcon(document.file_type)}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 truncate max-w-md">
                {document.file_name}
              </h2>
              <p className="text-sm text-gray-500">
                {formatFileSize(document.file_size)} • {document.file_type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto min-h-0 p-6">
          {renderPreview()}
        </div>

        {/* Actions */}
        <div className="flex-none flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="text-sm text-gray-500">
            Last Modified At: {formatDate(document.last_modified)}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  await downloadDocumentUtil(document);
                  toast.success("Document downloaded successfully");
                } catch (error) {
                  toast.error("Failed to download document");
                }
              }}
              className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
