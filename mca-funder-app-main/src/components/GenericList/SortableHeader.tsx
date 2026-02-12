import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon } from '@heroicons/react/24/outline';


export function SortableHeader({
    id,
    label,
    showToggle,
    isVisible,
    onToggle,
    activeId,
}: {
    id: string;
    label: string;
    showToggle?: boolean;
    isVisible?: boolean;
    onToggle?: (id: string, visible: boolean) => void;
    activeId?: string;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'grab' as const,
        userSelect: 'none' as const,
    };

    return (
        <th
            scope="col"
            ref={setNodeRef}
            style={style}
            className={`px-4 py-2 border-b border-gray-300 whitespace-nowrap bg-gray-300 ${!isVisible ? 'opacity-70' : ''} ${activeId === id ? 'bg-indigo-300 text-white' : ''}`}
        >
            <div className="flex items-center gap-2">
                <div
                    className="flex items-center gap-1"
                    {...attributes}
                    {...listeners}
                    title="Drag to reorder"
                >
                    <Bars3Icon className="h-4 w-4" />
                    <span className="align-middle">{label}</span>
                </div>

                {/* Fully functional checkbox */}
                {showToggle && onToggle && (
                    <label className="inline-flex items-center gap-2 cursor-pointer px-2 py-1">
                        <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={(e) => {
                                console.log('Checkbox toggled', id, e.target.checked);
                                onToggle(id, e.target.checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </label>
                )}
            </div>
        </th>
    );
} 