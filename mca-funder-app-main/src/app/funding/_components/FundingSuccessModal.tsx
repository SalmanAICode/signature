'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FundingSuccessModalProps {
  fundingId: string;
  fundingName: string;
  onContinueToPayback: () => void;
  onClose: () => void;
}

const FundingSuccessModal: React.FC<FundingSuccessModalProps> = ({
  fundingId,
  fundingName,
  onContinueToPayback,
  onClose
}) => {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  const handleViewFunding = () => {
    router.push(`/funding/${fundingId}`);
    onClose();
  };

  const handleClose = () => {
    console.log('Success modal close button clicked');
    setIsClosing(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center w-full">
      <div className="bg-white rounded-2xl shadow-xl w-full relative max-w-md mx-4">
        <div className="p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg 
              className="h-8 w-8 text-green-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Funding Created Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Your funding <span className="font-semibold text-gray-800">"{fundingName}"</span> has been created and is ready for the next steps.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleViewFunding}
              disabled={isClosing}
              className="flex-1 bg-[#1A2341] hover:bg-[#1A2341]/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Funding
            </button>
            
            <button
              onClick={onContinueToPayback}
              disabled={isClosing}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Continue to Payback Plan
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            disabled={isClosing}
            className="mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
          >
            {isClosing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Closing...
              </>
            ) : (
              'Close'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FundingSuccessModal; 