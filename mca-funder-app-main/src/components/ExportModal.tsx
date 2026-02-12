import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ColumnConfig } from './GenericList/types';
import { getNestedValue } from './GenericList/utils';
import { exportCSV, exportExcel } from "@/lib/utils/exportUtils";
import { StatusBadge } from "./StatusBadge";
import {
    DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { Pagination } from '@/types/pagination';

interface ExportModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  data: T[];
  visibleColumns: ColumnConfig<T>[];
  allColumns: ColumnConfig<T>[];
  fileName: string;
  fetchAllData?: () => Promise<T[]>;
  fetchAllDatasPaginated?: (params: { page: number, limit: number }) => Promise<{ data: T[], pagination: Pagination }>;
}

export function ExportModal<T>({
  isOpen,
  onClose,
  data,
  visibleColumns,
  allColumns,
  fileName,
  fetchAllData,
  fetchAllDatasPaginated
}: ExportModalProps<T>) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedFormat, setSelectedFormat] = React.useState<'csv' | 'excel'>('csv');
  const [allColumnsChecked, setAllColumnsChecked] = React.useState(false);
  const [allDataChecked, setAllDataChecked] = React.useState(false);

  // Get the appropriate columns based on selection
  const columns = allColumnsChecked ? allColumns : visibleColumns;
  // console.log('columns', columns);
  const fileSuffix = new Date().toISOString().replace(/[:.]/g, "-");

  const processValue = (value: any, render?: (value: any, row?: any) => any, row?: any): any => {
    // console.log('Processing value:', { value, hasRender: !!render });
    
    // First try to use the render function if provided
    if (render) {
      // console.log('Rendering with function');
      const rendered = render(value, row);
      // console.log('Rendered result:', rendered);
      
      if (React.isValidElement(rendered)) {
        // console.log('Rendered is a React element');
        // Handle React components like StatusBadge
        if (rendered.type === StatusBadge) {
          return value; // Return original value for status badges
        }
        // Check if the element has props and children
        const props = rendered.props as { children?: React.ReactNode };
        return props?.children || value; // Try to get text content
      }
      return rendered;
    }

    // If no render function or after render processing
    if (value === null || value === undefined) return '';

    // Handle dates
    if (value instanceof Date) {
      return value.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    }

    // Handle date strings (ISO format)
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      }
    }

    // Handle numbers (including currency)
    if (typeof value === 'number') {
      // If it's a large number or has decimals, format it
      if (value > 999 || value % 1 !== 0) {
        return value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
      return value;
    }

    // Handle arrays and objects
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.map(v => processValue(v)).join(', ');
      }
      // For objects, try to extract meaningful data or stringify
      return JSON.stringify(value);
    }

    return value;
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      // Get the data to export
      let exportData: T[] = [];

      if(allDataChecked){
        console.log('fetching all data');
        if(fetchAllDatasPaginated){
          console.log('fetching all data with pagination');
          const { data, pagination } = await fetchAllDatasPaginated({ page: 1, limit: 100000 });
          exportData = data;
        } else {
          console.log('fetching all data without pagination');
          if(fetchAllData){
            exportData = await fetchAllData();
          } else {
            console.error('fetchAllData is not defined');
          }
        }
      } else {
        exportData = data;
      }

      // console.log('Processing export data:', { 
      //   dataLength: exportData.length,
      //   firstRow: exportData[0],
      //   columns: columns.map(c => ({ key: c.key, label: c.label, hasRender: !!c.render }))
      // });

      // Process the data for export
      const exportRows = exportData.map((row: T) => {
        const processedRow: Record<string, any> = {};
        columns.forEach(col => {
          const rawValue = getNestedValue(row, col.key);
          processedRow[col.label] = processValue(rawValue, col.render, row);
        });
        return processedRow;
      });

      // console.log('Processed rows:', exportRows[0]); // Log first row as example

      // Prepare column definitions
      const exportColumns = columns.map(col => ({
        key: col.label,
        label: col.label
      }));

      const filename = `${fileName}_${fileSuffix}`;

      // Export based on selected format
      if (selectedFormat === 'csv') {
        exportCSV(exportRows, exportColumns, `${filename}.csv`);
      } else {
        exportExcel(exportRows, exportColumns, `${filename}.xlsx`);
      }

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md relative">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={onClose}
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Export Options</h2>

        <div className="mb-4 space-y-2 text-sm text-gray-600">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={allColumnsChecked}
              onChange={(e) => setAllColumnsChecked(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span>Include all columns</span>
          </label>
          <p className="ml-6 text-xs text-gray-500">
            When unchecked, only visible columns will be exported.
          </p>

          <label className="flex items-center space-x-2 mt-2">
            <input
              type="checkbox"
              checked={allDataChecked}
              onChange={(e) => setAllDataChecked(e.target.checked)}
              disabled={!fetchAllData}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
            />
            <span>Include all pages</span>
          </label>
          <p className="ml-6 text-xs text-gray-500">
            When unchecked, only the current page of data will be exported.
          </p>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          <label className="block font-medium mb-1">File format</label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                value="csv"
                checked={selectedFormat === "csv"}
                onChange={() => setSelectedFormat("csv")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>CSV</span>
            </label>
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                value="excel"
                checked={selectedFormat === "excel"}
                onChange={() => setSelectedFormat("excel")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>Excel (.xlsx)</span>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExport}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="h-5 w-5" />
                <span>Export</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 