import React from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface ExportButtonProps {
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export const ExportButton = React.memo<ExportButtonProps>(({
  onClick,
  className = "",
  disabled = false,
}) => {
  return (
    <button
      className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-white 
        bg-gray-500 hover:bg-gray-600
        text-sm font-semibold shadow-sm transition
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-500
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      title="Export table data"
      aria-label="Export table data"
    >
      <DocumentArrowDownIcon className="h-5 w-5" />
      <span>Export</span>
    </button>
  );
});

ExportButton.displayName = 'ExportButton'; 