import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ColumnConfig } from '../types';

interface TableContainerProps<T> {
  showControls: boolean;
  children: React.ReactNode;
  orderedColumns: ColumnConfig<T>[];
  visibleColumns: Set<string>;
  activeId: string | null;
  sensors: ReturnType<typeof useSensors>;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  className?: string;
}

export function TableContainer<T>({
  showControls,
  children,
  orderedColumns,
  visibleColumns,
  activeId,
  sensors,
  onDragStart,
  onDragEnd,
  className = "",
}: TableContainerProps<T>) {
  if (!showControls) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  return (
    <div className={className}>
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={orderedColumns.map(col => col.key).filter((k): k is string => typeof k === 'string')}
          strategy={horizontalListSortingStrategy}
        >
          {children}
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            <div className="flex px-2 py-2 border-b border-gray-300 dark:border-gray-600 whitespace-nowrap bg-gray-400 dark:bg-gray-600 gap-1 items-center rounded-md text-gray-700 dark:text-gray-200 text-sm uppercase font-semibold shadow-lg">
              <Bars3Icon className="h-4 w-4 inline" />
              <span className="align-middle">
                {orderedColumns.find((col) => col.key === activeId)?.label ?? activeId}
              </span>
              <input
                type="checkbox"
                checked={typeof activeId === 'string' && visibleColumns.has(activeId)}
                readOnly
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
} 