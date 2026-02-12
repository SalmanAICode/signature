import { useState, useEffect } from "react";
import { ColumnConfig } from "@/components/GenericList/types";
import { SyndicationOffer, syndicationOfferStatusList } from "@/types/syndicationOffer";

export interface FilterState {
  sortBy: string;
  sortOrder: "asc" | "desc" | "";
  include_inactive: boolean;
  syndicator?: string | null;
  funder?: string | null;
  funding?: string | null;
  status?: string | null;
}

interface FilterProps {
  value: FilterState;
  onChange: (val: FilterState) => void;
  visibleColumns: string[];
  flatColumns: ColumnConfig<SyndicationOffer>[];
}

export default function Filter({ value, onChange, visibleColumns, flatColumns }: FilterProps) {
  const [localFilter, setLocalFilter] = useState(value);

  useEffect(() => {
    setLocalFilter(value);
  }, [value]);

  // Define non-sortable columns
  const nonSortableKeys = ['status', 'inactive'];
  
  const sortKeys = visibleColumns
    .filter((key) => !key.includes('.') && !nonSortableKeys.includes(key))
    .map((key) => ({
      key,
      label: flatColumns.find((col) => col.key === key)?.label || key,
    }));

  const statusOptions = syndicationOfferStatusList.map((status) => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
  }));

  return (
    <div className="absolute top-full left-0 mt-2 p-4 border rounded-md bg-white shadow-md space-y-4 z-10 text-sm">
      {/* Sort By */}
      <div className="flex items-center gap-2">
        <label htmlFor="sortBy" className="min-w-[100px]">Sort by:</label>
        <select
          id="sortBy"
          value={localFilter.sortBy}
          onChange={(e) => setLocalFilter({ ...localFilter, sortBy: e.target.value })}
          className="border rounded px-2 py-1"
        >
          <option value="">None</option>
          {sortKeys.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Sort Order */}
      <div className="flex items-center gap-2">
        <label htmlFor="sortOrder" className="min-w-[100px]">Order:</label>
        <select
          id="sortOrder"
          value={localFilter.sortOrder}
          onChange={(e) => setLocalFilter({ ...localFilter, sortOrder: e.target.value as "asc" | "desc" | "" })}
          className="border rounded px-2 py-1"
        >
          <option value="">None</option>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="status" className="min-w-[100px]">Status:</label>
        <select
          id="status"
          value={localFilter.status || ""}
          onChange={(e) => setLocalFilter({ ...localFilter, status: e.target.value || null })}
          className="border rounded px-2 py-1"
        >
          <option value="">All</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Include Inactive */}
      <div className="flex items-center gap-2">
        <label htmlFor="includeInactive" className="min-w-[100px]">Show Inactive:</label>
        <input
          id="includeInactive"
          type="checkbox"
          checked={localFilter.include_inactive}
          onChange={(e) => setLocalFilter({ ...localFilter, include_inactive: e.target.checked })}
        />
      </div>

      {/* Buttons */}
      <div className="pt-2 flex justify-end gap-2">
        <button
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          onClick={() => setLocalFilter({ 
            sortBy: '', 
            sortOrder: 'asc', 
            include_inactive: false, 
            syndicator: null,
            funder: null,
            funding: null,
            status: null,
          })}
        >
          Clear
        </button>
        <button
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          onClick={() => setLocalFilter(value)}
        >
          Reset
        </button>
        <button
          className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
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