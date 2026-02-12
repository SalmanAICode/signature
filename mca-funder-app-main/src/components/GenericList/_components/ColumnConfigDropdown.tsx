import React, { useState, useRef, useEffect } from 'react';
import { ColumnConfig } from '../types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColumnConfigDropdownProps<T> {
  flatColumns: ColumnConfig<T>[];
  columnOrder: string[];
  visibleColumns: Set<string>;
  onColumnOrderChange: (newOrder: string[]) => void;
  onColumnToggle: (key: string, visible: boolean) => void;
  onShowAllColumns: () => void;
  onHideAllColumns: () => void;
  className?: string;
}

// Sortable item component for each column
interface SortableColumnItemProps {
  column: { key: string; label: string };
  isVisible: boolean;
  onToggle: (key: string, visible: boolean) => void;
}

function SortableColumnItem({ column, isVisible, onToggle }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 border-b border-gray-100 hover:bg-gray-50 ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        title="Drag to reorder"
      >
        ⋮⋮
      </div>
      
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isVisible}
        onChange={(e) => onToggle(column.key, e.target.checked)}
        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
      />
      
      {/* Label */}
      <label className="text-sm text-gray-700 cursor-pointer flex-1 select-none">
        {column.label}
      </label>
    </div>
  );
}

export function ColumnConfigDropdown<T>({
  flatColumns,
  columnOrder,
  visibleColumns,
  onColumnOrderChange,
  onColumnToggle,
  onShowAllColumns,
  onHideAllColumns,
  className = "",
}: ColumnConfigDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Setup drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over?.id as string);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
        onColumnOrderChange(newOrder);
      }
    }
  }

  // Get ordered columns for display
  const orderedColumns = columnOrder
    .map(key => flatColumns.find(col => col.key === key))
    .filter(Boolean)
    .map(col => ({ key: col!.key, label: col!.label }));

  return (
    <div className={`relative ${className}`}>
      {/* Dropdown button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="text-gray-700">Column Config</span>
        <svg
          className={`w-4 h-4 text-gray-500 transform transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          <div className="p-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900">Configure Columns</h3>
            <p className="text-xs text-gray-500 mt-1">
              Check to show columns, drag to reorder
            </p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={columnOrder} strategy={verticalListSortingStrategy}>
              <div className="py-1">
                {orderedColumns.map((column) => (
                  <SortableColumnItem
                    key={column.key}
                    column={column}
                    isVisible={visibleColumns.has(column.key)}
                    onToggle={onColumnToggle}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Quick actions */}
          <div className="border-t border-gray-100 p-2 flex gap-2">
            <button
              onClick={onShowAllColumns}
              className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded border border-indigo-200"
            >
              Show All
            </button>
            <button
              onClick={onHideAllColumns}
              className="text-xs px-2 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded border border-gray-200"
            >
              Hide All
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 