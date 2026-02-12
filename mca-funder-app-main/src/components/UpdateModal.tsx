import React from 'react';

type UpdateModalProps = {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
};

const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  title = 'Update Item',
  message = 'Are you sure you want to update this item?',
  confirmButtonText = 'Update',
  cancelButtonText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4 pointer-events-auto">
        <div className="text-center mb-6">
          <div className="mb-4">
            <svg 
              className="mx-auto h-12 w-12 text-blue-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 break-words">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 break-words whitespace-pre-wrap">
            {message}
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={e => { e.stopPropagation(); onCancel(); }}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {cancelButtonText}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onConfirm(); }}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateModal; 