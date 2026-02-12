import React, { useState, useEffect } from 'react';

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
};

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalResults,
    limit,
    onPageChange,
    onLimitChange,
}) => {
    const [inputPage, setInputPage] = useState<number | ''>(currentPage);

    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalResults);

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    useEffect(() => {
        setInputPage(currentPage);
    }, [currentPage]);

    return (
        <nav aria-label="Pagination" className="flex flex-col justify-between items-center mt-6 px-4 relative z-0">
            <div className="flex flex-col items-center gap-1 justify-between w-full sm:flex-row">
                <div className="text-sm text-gray-600">
                    Show per Page:
                    <select
                        aria-label="Page size"
                        className="ml-2 border rounded p-1"
                        value={limit}
                        onChange={(e) => {
                            onPageChange(1);
                            onLimitChange(Number(e.target.value));
                        }}
                    >
                        {[5, 10, 20, 50, 100].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        aria-label="Previous page"
                        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-1 border rounded disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                    >
                        &lt;
                    </button>
                    {pages.map((pageNumber) => (
                        <button
                            key={pageNumber}
                            aria-label={`Page ${pageNumber}`}
                            aria-current={currentPage === pageNumber ? 'page' : undefined}
                            onClick={() => onPageChange(pageNumber)}
                            className={`px-3 py-1 border rounded ${currentPage === pageNumber ? 'bg-indigo-100 text-indigo-700 text-sm' : ''}`}
                        >
                            {pageNumber}
                        </button>
                    ))}
                    <button
                        aria-label="Next page"
                        onClick={() =>
                            onPageChange(Math.min(currentPage + 1, totalPages))
                        }
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 border rounded disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                    >
                        &gt;
                    </button>
                </div>
                <div className="flex items-center text-sm text-gray-600 ml-4">
                    Jump to:
                    <input
                        disabled={totalPages <= 1}
                        onFocus={(e) => e.target.select()}
                        type="number"
                        min={1}
                        max={totalPages}
                        value={inputPage}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^[0-9]+$/.test(val)) {
                                setInputPage(val === '' ? '' : Number(val));
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = Number(inputPage);
                                if (val >= 1 && val <= totalPages) {
                                    onPageChange(val);
                                }
                            }
                        }}
                        className="ml-2 w-16 border rounded p-1 text-center"
                        placeholder={`${currentPage}`}
                        aria-label="Jump to page"
                    />
                    <span className="ml-2 text-gray-500">/ {totalPages}</span>
                </div>
            </div>
            <div className="text-sm text-gray-600">
                Showing {start} to {end} of {totalResults} results
            </div>
        </nav>
    );
};

export default Pagination; 