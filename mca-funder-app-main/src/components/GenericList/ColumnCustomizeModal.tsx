import React, { useState, useEffect } from 'react';

interface Column {
  key: string;
  label: string;
}

interface ColumnCustomizeModalProps {
  open: boolean;
  columns: Column[];
  visibleColumns: Set<string>;
  onChange: (key: string, checked: boolean) => void;
  onApply: () => void;
  onCancel: () => void;
  onReset: () => void;
}

export const ColumnCustomizeModal: React.FC<ColumnCustomizeModalProps> = ({
  open,
  columns,
  visibleColumns,
  onChange,
  onApply,
  onCancel,
  onReset,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <h2 className="text-xl font-bold mb-4">Customize Visible Columns</h2>
        <div className="max-h-72 overflow-y-auto mb-4">
          {columns.map((col) => (
            <label key={col.key} className="flex items-center gap-2 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleColumns.has(col.key)}
                onChange={e => onChange(col.key, e.target.checked)}
                style={{ accentColor: '#2980B9' }}
                className="h-4 w-4"
              />
              <span className="text-gray-800">{col.label}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={onReset} className="btn-secondary">Reset to Default</button>
          <button onClick={onApply} className="btn-blue">Apply</button>
        </div>
      </div>
    </div>
  );
}; 