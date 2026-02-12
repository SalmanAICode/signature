import { useState } from 'react';
import { useSensor, useSensors, PointerSensor, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

interface UseGenericListDragAndDropProps {
  columnOrder: string[];
  setColumnOrder: (order: string[]) => void;
}

export function useGenericListDragAndDrop({ columnOrder, setColumnOrder }: UseGenericListDragAndDropProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const oldIndex = columnOrder.findIndex(k => String(k) === active.id);
    const newIndex = columnOrder.findIndex(k => String(k) === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
      setColumnOrder(newOrder);
    }
    
    setActiveId(null);
  };

  return {
    activeId,
    sensors,
    handleDragStart,
    handleDragEnd,
  };
} 