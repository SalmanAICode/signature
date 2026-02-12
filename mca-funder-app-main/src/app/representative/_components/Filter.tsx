import { useState, useEffect } from "react";
import { FilterState } from "../page";
import { ColumnConfig } from "@/components/GenericList/types";
import { Representative } from "@/types/representative";

export default function Filter({
    value,
    onChange,
    visibleColumns,
    flatColumns,
}: {
    value: FilterState;
    onChange: (val: FilterState) => void;
    visibleColumns: string[];
    flatColumns: ColumnConfig<Representative>[];
}) {
    const [localFilter, setLocalFilter] = useState(value);

    useEffect(() => {
        setLocalFilter(value);
    }, [value]);


    // Derive sort options from visible column keys
    const sortKeys = visibleColumns.filter((key) => !key.includes('.')).map((key) => {
        const columnDef = flatColumns.find((col) => col.key === key);
        return {
            key,
            label: columnDef?.label || key,
        };
    });

    const applyFilter = () => {
        onChange(localFilter);
    };

    const resetFilter = () => {
        const resetState: FilterState = {
            include_inactive: false,
            sortBy: '',
            sortOrder: 'asc',
            search: null,
        };
        setLocalFilter(resetState);
        onChange(resetState);
    };

    return (
        <div className="p-4 bg-white border border-gray-200 rounded-lg mb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                        Search
                    </label>
                    <input
                        type="text"
                        id="search"
                        value={localFilter.search || ''}
                        onChange={(e) => setLocalFilter(prev => ({
                            ...prev,
                            search: e.target.value || null
                        }))}
                        placeholder="Search representatives..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Sort By */}
                <div>
                    <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                        Sort By
                    </label>
                    <select
                        id="sortBy"
                        value={localFilter.sortBy}
                        onChange={(e) => setLocalFilter(prev => ({
                            ...prev,
                            sortBy: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Select...</option>
                        {sortKeys.map((option) => (
                            <option key={option.key} value={option.key}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Sort Order */}
                <div>
                    <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
                        Sort Order
                    </label>
                    <select
                        id="sortOrder"
                        value={localFilter.sortOrder}
                        onChange={(e) => setLocalFilter(prev => ({
                            ...prev,
                            sortOrder: e.target.value as 'asc' | 'desc' | ''
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">None</option>
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>

                {/* Include Inactive */}
                <div className="flex items-center">
                    <div className="flex items-center h-full">
                        <input
                            id="include_inactive"
                            type="checkbox"
                            checked={localFilter.include_inactive}
                            onChange={(e) => setLocalFilter(prev => ({
                                ...prev,
                                include_inactive: e.target.checked
                            }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="include_inactive" className="ml-2 block text-sm text-gray-700">
                            Include Inactive
                        </label>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
                <button
                    onClick={resetFilter}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Reset
                </button>
                <button
                    onClick={applyFilter}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Apply Filter
                </button>
            </div>
        </div>
    );
} 