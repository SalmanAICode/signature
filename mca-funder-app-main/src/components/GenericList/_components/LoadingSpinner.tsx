import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

export const LoadingSpinner = React.memo<LoadingSpinnerProps>(({
  size = 'md',
  className = "",
  color = "text-blue-500",
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg 
        className={`animate-spin ${sizeClasses[size]} ${color}`} 
        viewBox="0 0 24 24"
        role="status"
        aria-label="Loading"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4" 
          fill="none" 
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" 
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner'; 