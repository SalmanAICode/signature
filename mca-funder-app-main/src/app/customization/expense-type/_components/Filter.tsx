'use client';

import { useState, useEffect } from 'react';
import { ColumnConfig } from "@/components/GenericList/types";
import { ExpenseType } from '@/types/expenseType';

export type FilterState = {
  include_inactive: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc' | '';
  search?: string | null;
};

interface FilterProps {
  value: FilterState;
  onChange: (filter: FilterState) => void;
  visibleColumns: string[];
  flatColumns: ColumnConfig<ExpenseType>[];
}

export default function Filter({ value, onChange, visibleColumns, flatColumns }: FilterProps) {
  const [localFilter, setLocalFilter] = useState(value);

  useEffect(() => {
    setLocalFilter(value);
  }, [value]);

  // Derive sort options from visible column keys
  const sortKeys = visibleColumns.filter((key) => !key.includes('.')).map((key) => ({
    key,
    label: flatColumns.find((col) => col.key === key)?.label || key,
  }));

  return (
    <div className="absolute top-full left-0 mt-2 p-4 border rounded-md bg-white shadow-md space-y-4 z-10 text-sm">
      {/* Sort By */}
      <div className="flex items-center gap-2">
        <label htmlFor="sortBy" className="min-w-[100px] text-gray-700">Sort by:</label>
        <select
          id="sortBy"
          value={localFilter.sortBy}
          onChange={(e) => setLocalFilter({ ...localFilter, sortBy: e.target.value })}
          className="border border-gray-300 rounded px-2 py-1 text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">None</option>
          {sortKeys.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Sort Order */}
      <div className="flex items-center gap-2">
        <label htmlFor="sortOrder" className="min-w-[100px] text-gray-700">Order:</label>
        <select
          id="sortOrder"
          value={localFilter.sortOrder}
          onChange={(e) => setLocalFilter({ ...localFilter, sortOrder: e.target.value as "asc" | "desc" | "" })}
          className="border border-gray-300 rounded px-2 py-1 text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">None</option>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {/* Include Inactive */}
      <div className="flex items-center gap-2">
        <label htmlFor="includeInactive" className="min-w-[100px] text-gray-700">Show Inactive:</label>
        <input
          id="includeInactive"
          type="checkbox"
          checked={localFilter.include_inactive}
          onChange={(e) => setLocalFilter({ ...localFilter, include_inactive: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>

      {/* Buttons */}
      <div className="pt-2 flex justify-end gap-2">
        <button
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          onClick={() => {
            const clearedFilter = {
              ...localFilter,
              sortBy: '',
              sortOrder: '' as '' | 'asc' | 'desc',
              search: '',
              include_inactive: false,
            };
            setLocalFilter(clearedFilter);
            onChange(clearedFilter);
          }}
        >
          Clear
        </button>
        <button
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          onClick={() => setLocalFilter(value)}
        >
          Reset
        </button>
        <button
          className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={() => {
            if (!localFilter.sortBy) {
              setLocalFilter({ ...localFilter, sortOrder: "" });
            }
            onChange(localFilter);
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
} 