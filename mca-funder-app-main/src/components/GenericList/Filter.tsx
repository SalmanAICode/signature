import { useState, useEffect, useRef } from "react";

export interface MultiSelectConfig {
    label: string;
    id: string;
    value: string[];
    options: { value: string; label: string }[];
    onChange: (val: string[]) => void;
}

export interface FilterProps<TFilter extends Record<string, any>> {
    value: TFilter;
    onChange: (val: TFilter) => void;
    visibleColumns: string[];
    flatColumns: { key: string; label: string }[];
    multiSelects?: MultiSelectConfig[];
    extraFilters?: React.ReactNode;
    onClose?: () => void;
}

export function Filter<TFilter extends Record<string, any>>({
    value,
    onChange,
    visibleColumns,
    flatColumns,
    multiSelects = [],
    extraFilters,
    onClose,
}: FilterProps<TFilter>) {
    const [localFilter, setLocalFilter] = useState(value);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLocalFilter(value);
    }, [value]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!onClose) return;
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    // Derive sort options from visible column keys
    const sortKeys = visibleColumns.filter((key) => !key.includes('.')).map((key) => ({
        key,
        label: flatColumns.find((col) => col.key === key)?.label || key,
    }));

    return (
        <div ref={filterRef} className="absolute top-full left-0 mt-2 p-4 border rounded-md bg-white shadow-md space-y-4 z-10 text-sm">
            {/* Sort By */}
            <div className="flex items-center gap-2">
                <label htmlFor="sortBy" className="min-w-[100px]">Sort by:</label>
                <select
                    id="sortBy"
                    value={localFilter.sortBy || ''}
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
                    value={localFilter.sortOrder || ''}
                    onChange={(e) =>
                        setLocalFilter({
                            ...localFilter,
                            sortOrder: e.target.value,
                        })
                    }
                    className="border rounded px-2 py-1"
                >
                    <option value="">None</option>
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                </select>
            </div>

            {/* Extra Filters (e.g., checkboxes) */}
            {extraFilters}

            {/* Multi-Selects */}
            {multiSelects.map((ms) => (
                <div className="flex items-start gap-2" key={ms.id}>
                    <label htmlFor={ms.id} className="min-w-[100px] pt-1">{ms.label}:</label>
                    <select
                        id={ms.id}
                        multiple
                        value={ms.value}
                        onChange={(e) =>
                            ms.onChange(Array.from(e.target.selectedOptions).map((o) => o.value))
                        }
                        className="border rounded px-2 py-1 w-full"
                    >
                        {ms.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            ))}

            {/* Buttons */}
            <div className="pt-2 flex justify-end gap-2">
                <button
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    onClick={() => {
                        const clearedFilter = {
                            ...localFilter,
                            sortBy: '',
                            sortOrder: '',
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
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    onClick={() => {
                        setLocalFilter(value);
                        onChange(value);
                    }}
                >
                    Reset
                </button>
                <button
                    className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => {
                        const updatedFilter = !localFilter.sortBy
                            ? { ...localFilter, sortOrder: "" }
                            : localFilter;
                        onChange(updatedFilter);
                    }}
                >
                    Apply
                </button>
            </div>
        </div>
    );
} 