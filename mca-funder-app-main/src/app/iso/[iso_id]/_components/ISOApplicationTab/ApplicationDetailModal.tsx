"use client";

import { Application } from '@/types/application';
import { SummaryModalLayout } from "@/components/SummaryModalLayout";
import { ApplicationSummaryContent } from "@/components/Application/ApplicationSummaryContent";

interface ApplicationDetailModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
}

export default function ApplicationDetailModal({ 
  application, 
  isOpen, 
  onClose 
}: ApplicationDetailModalProps) {
  if (!isOpen) return null;

  const header = (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-gray-800">
        Application Details
      </h2>
      <button
        onClick={onClose}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  const content = <ApplicationSummaryContent data={application} />;

  const actions = (
    <div className="flex justify-end">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-300 hover:text-gray-800 transition"
      >
        Close
      </button>
    </div>
  );

  return (
    <SummaryModalLayout
      header={header}
      content={content}
      actions={actions}
    />
  );
} 