import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from './LoadingSpinner';

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  isLoading: boolean;
  placeholder?: string;
  className?: string;
}

export const SearchInput = React.memo<SearchInputProps>(({
  value,
  onChange,
  onClear,
  isLoading,
  placeholder = "Search...",
  className = "",
}) => {
  return (
    <div className={`relative rounded-md shadow-sm ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 text-gray-400 -translate-y-1/2 pointer-events-none" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 placeholder-gray-500"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
          onClick={onClear}
          tabIndex={-1}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
      {isLoading && (
        <div className="absolute right-7 top-1/2 -translate-y-1/2">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
});

SearchInput.displayName = 'SearchInput'; 