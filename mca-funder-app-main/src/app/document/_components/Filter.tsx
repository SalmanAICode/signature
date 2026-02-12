import { useState, useEffect } from "react";
import { ColumnConfig } from "@/components/GenericList/types";
import { Document } from "@/types/document";

export type FilterState = {
  include_archived: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc' | '';
  search?: string | null;
  file_type?: string | null;
};

export default function Filter({
    value,
    onChange,
    visibleColumns,
    flatColumns,
}: {
    value: FilterState;
    onChange: (val: FilterState) => void;
    visibleColumns: string[];
    flatColumns: ColumnConfig<Document>[];
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
                    value={localFilter.sortBy}
                    onChange={(e) =>
                        setLocalFilter({ ...localFilter, sortBy: e.target.value })
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
                    value={localFilter.sortOrder}
                    onChange={(e) =>
                        setLocalFilter({
                            ...localFilter,
                            sortOrder: e.target.value as "asc" | "desc",
                        })
                    }
                    className="border rounded px-2 py-1"
                >
                    <option value="">None</option>
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                </select>
            </div>

            {/* Include Archived */}
            <div className="flex items-center gap-2">
                <label htmlFor="includeArchived" className="min-w-[100px]">Show Archived:</label>
                <input
                    id="includeArchived"
                    type="checkbox"
                    checked={localFilter.include_archived}
                    onChange={(e) =>
                        setLocalFilter({
                            ...localFilter,
                            include_archived: e.target.checked,
                        })
                    }
                />
            </div>

            {/* File Type Filter */}
            <div className="flex items-center gap-2">
                <label htmlFor="fileType" className="min-w-[100px]">File Type:</label>
                <select
                    id="fileType"
                    value={localFilter.file_type || ""}
                    onChange={(e) =>
                        setLocalFilter({
                            ...localFilter,
                            file_type: e.target.value || null,
                        })
                    }
                    className="border rounded px-2 py-1"
                >
                    <option value="">All Types</option>
                    <option value="pdf">PDF</option>
                    <option value="doc">DOC</option>
                    <option value="docx">DOCX</option>
                    <option value="xls">XLS</option>
                    <option value="xlsx">XLSX</option>
                    <option value="jpg">JPG</option>
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="gif">GIF</option>
                    <option value="txt">TXT</option>
                </select>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex justify-end gap-2">
                <button
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    // apply no filter / default filter
                    onClick={() =>
                        setLocalFilter({
                            sortBy: '',
                            sortOrder: 'asc',
                            include_archived: false,
                            search: null,
                            file_type: null,
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
                        if (!localFilter.sortBy) {
                            // If no sortBy is selected, ignore or reset sortOrder
                            setLocalFilter({
                              ...localFilter,
                              sortOrder: "", 
                            });
                          } 
                        onChange(localFilter)
                        }
                    }
                >
                    Apply
                </button>
            </div>
        </div>
    );
} 