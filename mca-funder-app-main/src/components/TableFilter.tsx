'use client';

import React, { useState } from 'react';

interface TableFilterProps {
  onFilterChange: (filters: { includeInactive: boolean }) => void;
}

const TableFilter: React.FC<TableFilterProps> = ({ onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);

  const handleFilterChange = (checked: boolean) => {
    setIncludeInactive(checked);
    onFilterChange({ includeInactive: checked });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        title="Table Filters"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50 p-4">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => handleFilterChange(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show inactive records</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableFilter; 