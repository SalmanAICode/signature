import { useState, useEffect } from "react";
import { GetSyndicationParams } from "@/types/syndication";
import { ColumnConfig } from "@/components/GenericList/types";
import { Syndication } from "@/types/syndication";

export default function Filter({
    value,
    onChange,
    visibleColumns,
    flatColumns,
}: {
    value: GetSyndicationParams;
    onChange: (val: Partial<GetSyndicationParams>) => void;
    visibleColumns: string[];
    flatColumns: ColumnConfig<Syndication>[];
}) {
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
                <label htmlFor="sortBy" className="min-w-[100px]">Sort by:</label>
                <select
                    id="sortBy"
                    value={localFilter.sortBy || ''}
                    onChange={(e) =>
                        setLocalFilter({ ...localFilter, sortBy: e.target.value || null })
                    }
                    className="border rounded px-2 py-1"
                >
                    <option value="">None</option>
                    {sortKeys.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-2">
                <label htmlFor="sortOrder" className="min-w-[100px]">Order:</label>
                <select
                    id="sortOrder"
                    value={localFilter.sortOrder || ''}
                    onChange={(e) =>
                        setLocalFilter({
                            ...localFilter,
                            sortOrder: e.target.value as "asc" | "desc" | null,
                        })
                    }
                    className="border rounded px-2 py-1"
                >
                    <option value="">None</option>
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                </select>
            </div>

            {/* Search - Commented out as it's not supported by the API
            <div className="flex items-center gap-2">
                <label htmlFor="search" className="min-w-[100px]">Search:</label>
                <input
                    id="search"
                    type="text"
                    value={localFilter.search || ''}
                    onChange={(e) =>
                        setLocalFilter({
                            ...localFilter,
                            search: e.target.value || undefined,
                        })
                    }
                    className="border rounded px-2 py-1 flex-1"
                    placeholder="Search syndications..."
                />
            </div>
            */}

            {/* Buttons */}
            <div className="pt-2 flex justify-end gap-2">
                <button
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    // apply no filter / default filter
                    onClick={() =>
                        setLocalFilter({
                            sortBy: null,
                            sortOrder: null,
                            search: undefined,
                            page: 1,
                            limit: 10,
                        })
                    }
                >
                    Clear
                </button>
                <button
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    // undo changes made to the filter
                    onClick={() => setLocalFilter(value)}
                >
                    Reset
                </button>
                <button
                    className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => {
                        const filterToApply = { ...localFilter };
                        
                        // If no sortBy is selected, reset sortOrder
                        if (!filterToApply.sortBy) {
                            filterToApply.sortOrder = null;
                        }
                        
                        onChange(filterToApply);
                    }}
                >
                    Apply
                </button>
            </div>
        </div>
    );
} 