import React from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

interface ControlsButtonProps {
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export const ControlsButton = React.memo<ControlsButtonProps>(({
  isActive,
  onClick,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded-md flex items-center gap-1
        text-gray-600 hover:text-gray-900
        transition-all duration-300 ease-in-out border-transparent 
        hover:shadow-[0_0_0_3px_rgba(99,102,241,0.3)] hover:border-indigo-400
        ${isActive ? 'border-indigo-400 shadow-[0_0_0_3px_rgba(99,102,241,0.3)] bg-indigo-50' : ''}
        ${className}
      `}
      title={isActive ? 'Hide Column Controls' : 'Show Column Controls'}
      aria-label={isActive ? 'Hide Column Controls' : 'Show Column Controls'}
      aria-pressed={isActive}
    >
      <span className="mr-1">Customize</span>
      <Cog6ToothIcon
        className={`h-5 w-5 transition-transform duration-300 ${
          isActive ? 'rotate-90 text-indigo-500' : 'rotate-0'
        }`}
      />
    </button>
  );
});

ControlsButton.displayName = 'ControlsButton'; 