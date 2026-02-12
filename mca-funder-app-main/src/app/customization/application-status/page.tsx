'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ApplicationStatus } from '@/types/applicationStatus';
import { getApplicationStatusList, updateApplicationStatusOrder } from '@/lib/api/applicationStatuses';
import ApplicationStatusForm from './_components/ApplicationStatusForm';
import ApplicationStatusDetailModal from './_components/ApplicationStatusDetailModal';
import { 
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '@/lib/store/auth';
import FunderGuard from '../_components/FunderGuard';

// Function to calculate if text should be black or white based on background color
const getTextColor = (backgroundColor: string): string => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

interface SortableStatusItemProps {
  id: string;
  status: ApplicationStatus;
  index: number;
  onView: (status: ApplicationStatus) => void;
}

function SortableStatusItem({ id, status, index, onView }: SortableStatusItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onView(status)}
      className={`flex items-center justify-between p-4 border border-theme-border rounded-lg shadow-theme-sm hover:shadow-theme-md transition-shadow cursor-pointer ${
        isDragging ? 'opacity-50' : ''
      } ${status.inactive ? 'bg-theme-background/50 opacity-60' : 'bg-theme-background'}`}
    >
      <div className="flex items-center space-x-4">
        {/* Drag Handle - visual indicator only */}
        <div className="p-1 text-theme-muted hover:text-theme-foreground transition">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </div>
        
        {/* Order Index */}
        <div className="text-sm font-medium text-theme-muted bg-theme-secondary px-2 py-1 rounded">
          #{status.idx + 1}
        </div>
        
        {/* Status Name with Color */}
        <span 
          className="text-sm font-medium px-3 py-1.5 rounded-full"
          style={{ 
            backgroundColor: status.bgcolor || '#9CA3AF',
            color: getTextColor(status.bgcolor || '#9CA3AF')
          }}
        >
          {status.name}
        </span>
      </div>

      {/* Status Badges - moved to the right, removed Inactive */}
      <div className="flex items-center space-x-2 text-xs">
        {status.initial && (
          <div className="px-2 py-1 rounded-full border inline-block" style={{ backgroundColor: 'rgba(34, 197, 94, 0.4)', color: '#059669', borderColor: 'rgba(34, 197, 94, 0.3)' }}>Initial</div>
        )}
        {status.approved && (
          <div className="px-2 py-1 rounded-full border inline-block" style={{ backgroundColor: 'rgba(233, 236, 239, 0.4)', color: '#15803d', borderColor: 'rgba(52, 31, 54, 0.3)' }}>Approved</div>
        )}
        {status.closed && (
          <div className="px-2 py-1 rounded-full border inline-block" style={{ backgroundColor: 'rgba(239, 68, 68, 0.4)', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.3)' }}>Closed</div>
        )}
        {status.system && (
          <div className="px-2 py-1 rounded-full border inline-block" style={{ backgroundColor: 'rgba(59, 130, 246, 0.4)', color: '#2563eb', borderColor: 'rgba(59, 130, 246, 0.3)' }}>System</div>
        )}
      </div>
    </div>
  );
}

export default function ApplicationStatusPage() {
  const [statuses, setStatuses] = useState<ApplicationStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ApplicationStatus | null>(null);
  const [viewingStatus, setViewingStatus] = useState<ApplicationStatus | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalOrder, setOriginalOrder] = useState<ApplicationStatus[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);

  const { accessToken, funder } = useAuthStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // need to drag 8 pixels to start dragging
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load all statuses
  const fetchStatuses = async () => {
    if (!funder) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await getApplicationStatusList(funder._id, includeInactive);
      const sortedData = data.sort((a: ApplicationStatus, b: ApplicationStatus) => a.idx - b.idx);
      setStatuses(sortedData);
      setOriginalOrder([...sortedData]);
      setHasUnsavedChanges(false);
    } catch (error) {
      setError(
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as any).message)
          : 'Failed to fetch statuses'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (funder) {
      fetchStatuses();
    }
  }, [funder, includeInactive]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setStatuses((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === (over?.id || ''));
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Check if order changed
        const orderChanged = newOrder.some((status, index) => status._id !== originalOrder[index]?._id);
        setHasUnsavedChanges(orderChanged);
        
        return newOrder;
      });
    }
  };

  const handleSaveOrder = async () => {
    if (!funder) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const orderData = {
        funder: funder._id,
        ids: statuses.map(status => status._id),
      };

      await updateApplicationStatusOrder(orderData);
      await fetchStatuses(); // Refresh data
    } catch (error) {
      setError(
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as any).message)
          : 'Failed to update order'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = async (updatedStatus?: ApplicationStatus) => {
    setShowCreateForm(false);
    await fetchStatuses();
  };

  const handleUpdateSuccess = (updatedStatus?: ApplicationStatus) => {
    setShowUpdateForm(false);
    setEditingStatus(null);
    
    if (updatedStatus) {
      // Update the specific status in the array instead of refetching all data
      setStatuses(prev => prev.map(status => 
        status._id === updatedStatus._id ? updatedStatus : status
      ));
      
      // Also update viewing status if it's currently being viewed
      if (viewingStatus && viewingStatus._id === updatedStatus._id) {
        setViewingStatus(updatedStatus);
      }
    } else {
      // Fallback to refetching if no updated status provided
      fetchStatuses();
    }
  };

  const handleDetailModalSuccess = async () => {
    await fetchStatuses();
  };

  const handleView = (status: ApplicationStatus) => {
    setViewingStatus(status);
  };

  const handleEdit = (status: ApplicationStatus) => {
    setEditingStatus(status);
    setShowUpdateForm(true);
  };

  if (!accessToken) {
    return <div className="p-4 text-theme-foreground">Please log in to view application statuses.</div>;
  }

  return (
    <FunderGuard>
      <div className='w-full border-theme-border rounded-xl p-8 bg-theme-accent'>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-theme-primary">Application Status</h1>
            {funder && (
              <p className="text-sm text-theme-muted mt-1">
                Managing statuses for: <span className="font-medium text-theme-foreground">{funder.name}</span>
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            {hasUnsavedChanges && (
              <button
                onClick={handleSaveOrder}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-success border border-transparent rounded-md hover:bg-success/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                <span>{loading ? 'Saving...' : 'Save Order'}</span>
              </button>
            )}
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 rounded-md flex items-center gap-2 text-white bg-success hover:bg-success/80 text-sm font-semibold shadow-sm transition"
              disabled={loading}
            >
              <PlusIcon className="h-5 w-5" />
              Add Status
            </button>
          </div>
        </div>

        {/* Status & Filter Bar */}
        <div className="mb-6 bg-theme-background/50 border border-theme-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            {/* Left side - Status indicator */}
            <div className="flex items-center space-x-3">
              {loading ? (
                <div className="flex items-center space-x-2 text-theme-primary">
                  <svg className="animate-spin h-4 w-4 text-theme-primary" fill="none" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  <span className="font-medium">Loading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${hasUnsavedChanges ? 'bg-warning animate-pulse' : 'bg-success'}`}></div>
                  <span className={`font-medium text-sm ${hasUnsavedChanges ? 'text-warning' : 'text-success'}`}>
                    {hasUnsavedChanges ? 'Unsaved changes' : 'No changes'}
                  </span>
                  {hasUnsavedChanges ? (
                    <span className="text-xs text-theme-muted">• Drag to reorder, then save</span>
                  ) : (
                    <span className="text-xs text-theme-muted">• Click rows to edit • Drag to reorder</span>
                  )}
                </div>
              )}
            </div>

            {/* Right side - Filter controls and count */}
            <div className="flex items-center space-x-6">
              {/* Status count */}
              <div className="text-sm text-theme-muted">
                <span className="font-medium text-theme-foreground">{statuses.length}</span> 
                <span className="ml-1">status{statuses.length !== 1 ? 'es' : ''}</span>
              </div>

              {/* Toggle switch for inactive */}
              <label className="flex items-center space-x-3 cursor-pointer group">
                <span className="text-sm font-medium text-theme-foreground group-hover:text-theme-primary transition">
                  Show inactive
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={includeInactive}
                    onChange={(e) => setIncludeInactive(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`block w-10 h-6 rounded-full transition ${
                    includeInactive ? 'bg-theme-primary' : 'bg-theme-muted'
                  }`}>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${
                      includeInactive ? 'translate-x-4' : 'translate-x-0'
                    }`}></div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-error/10 border border-error/20 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-error mr-2" />
              <span className="text-error font-medium">Error: {error}</span>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-error hover:text-error/80"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Status List */}
        <div className="relative">
          {/* Loading Overlay */}
          {loading && statuses.length > 0 && (
            <div className="absolute inset-0 bg-white bg-opacity-30 flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-6 w-6 text-theme-primary" fill="none" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  ></circle>
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                <span className="text-theme-foreground font-medium">Processing...</span>
              </div>
            </div>
          )}

          {statuses.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={statuses.map(status => status._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className={`space-y-3 ${loading ? 'pointer-events-none opacity-50' : ''}`}>
                  {statuses.map((status, index) => (
                    <SortableStatusItem
                      key={status._id}
                      id={status._id}
                      status={status}
                      index={index}
                      onView={handleView}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : !loading ? (
            <div className="text-center py-12 text-theme-muted">
              {funder 
                ? `No application statuses found for ${funder.name}. Create your first status to get started.`
                : "Please assign a funder to view application statuses."
              }
              {funder && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-success hover:bg-success/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Status
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span className="text-gray-600">Loading statuses...</span>
              </div>
            </div>
          )}
        </div>

        {/* View Detail Modal */}
        {viewingStatus && (
          <ApplicationStatusDetailModal
            status={viewingStatus}
            onClose={() => setViewingStatus(null)}
            onEdit={handleEdit}
            onSuccess={handleDetailModalSuccess}
          />
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <ApplicationStatusForm
            status={null}
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Update Form Modal */}
        {showUpdateForm && editingStatus && (
          <ApplicationStatusForm
            status={editingStatus}
            onSuccess={handleUpdateSuccess}
            onCancel={() => {
              setShowUpdateForm(false);
              setEditingStatus(null);
            }}
          />
        )}
      </div>
    </FunderGuard>
  );
} 