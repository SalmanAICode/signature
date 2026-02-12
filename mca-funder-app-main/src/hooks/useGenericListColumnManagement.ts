import { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnConfig } from '@/components/GenericList/types';
import { flattenColumnConfig } from '@/components/GenericList/utils';

interface UseGenericListColumnManagementProps<T> {
  columns: ColumnConfig<T>[];
  storage: {
    orderingKey: string;
    visibilityKey: string;
    columnWidthsKey: string;
  };
}

// Ensure "actions" column is always last when present (e.g. View column in document list)
function moveActionsColumnLast(order: string[]) {
  const actionsKey = 'actions';
  if (!order.includes(actionsKey)) return order;
  return [...order.filter(k => k !== actionsKey), actionsKey];
}

export function useGenericListColumnManagement<T>({ columns, storage }: UseGenericListColumnManagementProps<T>) {
  // Flattened columns memoized to avoid recomputation
  const flatColumns = useMemo(() => flattenColumnConfig(columns), [columns]);

  // Set initial visible columns from `visible` flags in ColumnConfig
  const initialVisibleColumns = useMemo(() => {
    return new Set(
      flatColumns
        .filter((c) => c.visible !== false)
        .map((c) => c.key)
    );
  }, [flatColumns]);

  // Column ordering state
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(initialVisibleColumns);

  // Column widths state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem(storage.columnWidthsKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.warn('Failed to load column widths from localStorage:', err);
    }
    return {};
  });

  // Initialize column order
  useEffect(() => {
    if (flatColumns.length === 0) return;

    const storedOrder = localStorage.getItem(storage.orderingKey);
    if (storedOrder) {
      try {
        const parsed = JSON.parse(storedOrder) as string[];
        const validKeys = flatColumns.map(c => c.key);
        const filtered = parsed.filter(key => validKeys.includes(key));
        const completeOrder = [...filtered, ...validKeys.filter(k => !filtered.includes(k))];
        setColumnOrder(moveActionsColumnLast(completeOrder));
        return;
      } catch (err) {
        console.warn('Failed to parse column order from localStorage:', err);
      }
    }

    const initialOrder = flatColumns.map(c => c.key);
    setColumnOrder(moveActionsColumnLast(initialOrder));
  }, [flatColumns, storage.orderingKey]);

  // Persist column order
  useEffect(() => {
    if (columnOrder.length > 0) {
      localStorage.setItem(storage.orderingKey, JSON.stringify(columnOrder));
    }
  }, [columnOrder, storage.orderingKey]);

  // Persist column visibility
  useEffect(() => {
    localStorage.setItem(storage.visibilityKey, JSON.stringify(Array.from(visibleColumns)));
  }, [visibleColumns, storage.visibilityKey]);

  // Persist column widths
  useEffect(() => {
    localStorage.setItem(storage.columnWidthsKey, JSON.stringify(columnWidths));
  }, [columnWidths, storage.columnWidthsKey]);

  // Update visible columns when configuration changes or on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storage.visibilityKey);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        const storedSet = new Set(parsed);
        
        // Merge stored preferences with current column configuration
        // Always include columns that are explicitly set to visible in config
        const mergedVisible = new Set<string>();
        
        // Add all columns that are visible in the current configuration
        initialVisibleColumns.forEach(key => mergedVisible.add(key));
        
        // Add stored preferences for columns that still exist and aren't explicitly hidden
        flatColumns.forEach(col => {
          if (storedSet.has(col.key) && col.visible !== false) {
            mergedVisible.add(col.key);
          } else if (storedSet.has(col.key) && col.visible === false) {
            mergedVisible.delete(col.key);
          }
        });
        
        setVisibleColumns(mergedVisible);
      } else {
        setVisibleColumns(initialVisibleColumns);
      }
    } catch (err) {
      console.warn('Failed to parse visible columns from localStorage:', err);
      setVisibleColumns(initialVisibleColumns);
    }
  }, [flatColumns, initialVisibleColumns, storage.visibilityKey]);

  // Toggle column visibility
  const toggleColumn = (key: string, visible: boolean) => {
    const updated = new Set(visibleColumns);
    if (visible) {
      updated.add(key);
    } else {
      updated.delete(key);
    }
    setVisibleColumns(updated);
  };

  // Show all columns
  const showAllColumns = () => {
    const allColumnKeys = new Set(flatColumns.map(col => col.key));
    setVisibleColumns(allColumnKeys);
  };

  // Hide all columns
  const hideAllColumns = () => {
    setVisibleColumns(new Set());
  };

  // Get ordered columns based on current state
  const getOrderedColumns = (showControls: boolean, showUnselectedColumns: boolean) => {
    return columnOrder
      .filter((col) => {
        if (showControls) {
          return showUnselectedColumns || visibleColumns.has(col);
        }
        return visibleColumns.has(col);
      })
      .map((key) => flatColumns.find((col) => col.key === key)!)
      .filter(Boolean);
  };

  // Wrap setColumnOrder so "actions" column is always kept last (e.g. View column)
  const setColumnOrderWithActionsLast = useCallback((newOrder: string[] | ((prev: string[]) => string[])) => {
    setColumnOrder((prev) => {
      const order = typeof newOrder === 'function' ? newOrder(prev) : newOrder;
      return moveActionsColumnLast(order);
    });
  }, []);

  return {
    flatColumns,
    columnOrder,
    setColumnOrder: setColumnOrderWithActionsLast,
    visibleColumns,
    setVisibleColumns,
    columnWidths,
    setColumnWidths,
    toggleColumn,
    showAllColumns,
    hideAllColumns,
    getOrderedColumns,
  };
} 