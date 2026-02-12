import React from 'react';

const FormErrorAlert = ({ error, onClose }: { error: string; onClose: () => void }) => {
  if (!error) return null;
  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center relative">
      <button
        type="button"
        className="mr-2 flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
        onClick={onClose}
        aria-label="Close error alert"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <span className="text-sm text-red-700 font-medium">{error}</span>
    </div>
  );
};

export default FormErrorAlert; 