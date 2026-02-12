'use client';

import { ReactNode } from 'react';

interface FormModalLayoutProps {
  title: string;
  subtitle?: string;
  onCancel: () => void;
  children: ReactNode;
  error?: string;
  maxWidth?: number;
  showCloseButton?: boolean;
}

const FormModalLayout = ({ 
  title, 
  subtitle, 
  onCancel, 
  children, 
  error, 
  maxWidth = 500,
  showCloseButton = false
}: FormModalLayoutProps) => {

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center w-full">
      <div className="bg-white rounded-2xl shadow-xl w-full relative max-h-[90vh] overflow-hidden" style={{ maxWidth: `${maxWidth}px` }}>
        {showCloseButton && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">{title}</h2>
          {subtitle && (
            <p className="text-sm text-center text-gray-500 mb-6">{subtitle}</p>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 font-medium">{error}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-200px)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FormModalLayout; 