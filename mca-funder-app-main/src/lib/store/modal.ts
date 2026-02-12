import React from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Modal position interface
export interface ModalPosition {
  x: number;
  y: number;
}

// Generic modal interface
export interface Modal {
  key: string; // Unique key used as identifier
  title: string;
  position: ModalPosition;
  isMinimized: boolean;
  zIndex: number;
  width?: string;
  height?: string;
  className?: string;
  data?: any; // Store any related data
  component?: React.ComponentType<{ modalData: any }>; // Custom component
}

// Modal creation input
export interface OpenModalInput {
  key: string; // Unique key used as identifier
  title: string;
  position?: ModalPosition;
  width?: string;
  height?: string;
  className?: string;
  data?: any;
  component?: React.ComponentType<{ modalData: any }>; // Custom component
}

// Modal store state interface
interface ModalState {
  modals: Modal[];
  modalOrder: string[]; // Array of modal keys ordered by z-index (first = lowest, last = highest)
  lastOperation: {
    type: BringToFrontPriority;
    timestamp: number;
    modalKey: string | null;
  } | null;
  
  // Actions
  openModal: (input: OpenModalInput) => string;
  closeModal: (modalKey: string) => void;
  closeAllModals: () => void;
  updateModal: (modalKey: string, updates: Partial<Modal>) => void;
  minimizeModal: (modalKey: string) => void;
  restoreModal: (modalKey: string) => void;
  updateModalPosition: (modalKey: string, position: ModalPosition) => void;
  bringToFront: (modalKey: string, priority?: BringToFrontPriority) => void;
  getModal: (modalKey: string) => Modal | undefined;
  updateAllModalSizes: () => void;
}

// Base z-index for modals (minimum value)
const BASE_Z_INDEX = 50;

// Priority levels for bringToFront operations
enum BringToFrontPriority {
  CLICK = 1,    // Lowest priority - just clicking on modal
  CREATE = 2,   // Medium priority - creating new modal
  DRAG = 3      // Highest priority - dragging modal
}

// Calculate modal dimensions (1/3 of viewport)


// Simple fallback position (actual positioning is handled by DraggableWindow)
const getDefaultPosition = (existingModals: Modal[]): ModalPosition => {
  // This is just a fallback - real positioning logic is in DraggableWindow.calculateModalPosition
  const offset = existingModals.length * 40;
  return {
    x: 200 + offset,
    y: 100 + offset
  };
};

// Create the modal store
const useModalStore = create<ModalState>()(
  devtools(
    (set, get) => ({
      modals: [],
      modalOrder: [], // Empty array to start
      lastOperation: null,

      openModal: (input: OpenModalInput) => {
        const state = get();
        
        // Check if modal with same key already exists
        const existingModal = state.modals.find(modal => modal.key === input.key);
        if (existingModal) {
          // Bring existing modal to front instead of creating new one
          // Use CREATE priority since this is part of an "open" operation
          get().bringToFront(input.key, BringToFrontPriority.CREATE);
          get().restoreModal(input.key); // Also restore if minimized
          return input.key;
        }
        
        const position = input.position || getDefaultPosition(state.modals);
        
        // New modal gets the highest z-index (BASE_Z_INDEX + order array length)
        const zIndex = BASE_Z_INDEX + state.modalOrder.length;
        
        const newModal: Modal = {
          key: input.key,
          title: input.title,
          position,
          isMinimized: false,
          zIndex,
          width: input.width,
          height: input.height,
          className: input.className,
          data: input.data,
          component: input.component,
        };

        set((state) => ({
          modals: [...state.modals, newModal],
          modalOrder: [...state.modalOrder, input.key], // Add to end (highest z-index)
          lastOperation: {
            type: BringToFrontPriority.CREATE,
            timestamp: Date.now(),
            modalKey: input.key,
          },
        }));

        return input.key;
      },

      closeModal: (modalKey) => {
        set((state) => {
          // Remove from both modals array and order array
          const newModalOrder = state.modalOrder.filter(key => key !== modalKey);
          
          // Reassign z-indices based on new order (BASE_Z_INDEX + position)
          const updatedModals = state.modals
            .filter(modal => modal.key !== modalKey)
            .map(modal => {
              const orderIndex = newModalOrder.indexOf(modal.key);
              return { ...modal, zIndex: BASE_Z_INDEX + orderIndex };
            });

          return {
            modals: updatedModals,
            modalOrder: newModalOrder,
          };
        });
      },

      closeAllModals: () => {
        set(() => ({
          modals: [],
          modalOrder: [],
        }));
      },

      updateModal: (modalKey, updates) => {
        set((state) => ({
          modals: state.modals.map(modal =>
            modal.key === modalKey ? { ...modal, ...updates } : modal
          ),
        }));
      },

      minimizeModal: (modalKey) => {
        set((state) => ({
          modals: state.modals.map(modal =>
            modal.key === modalKey ? { ...modal, isMinimized: true } : modal
          ),
        }));
      },

      restoreModal: (modalKey) => {
        set((state) => ({
          modals: state.modals.map(modal =>
            modal.key === modalKey ? { ...modal, isMinimized: false } : modal
          ),
        }));
      },

      updateModalPosition: (modalKey, position) => {
        set((state) => ({
          modals: state.modals.map(modal =>
            modal.key === modalKey ? { ...modal, position } : modal
          ),
        }));
      },

      bringToFront: (modalKey, priority = BringToFrontPriority.CLICK) => {
        set((state) => {
          // Check if modal exists
          const modalExists = state.modals.find(modal => modal.key === modalKey);
          if (!modalExists) return state;

          // Check if modal is already at the front (last in order array)
          const lastModalKey = state.modalOrder[state.modalOrder.length - 1];
          if (lastModalKey === modalKey) return state;

          // Priority check: only allow operation if priority is higher or equal, or enough time has passed
          const now = Date.now();
          const timeSinceLastOperation = state.lastOperation ? now - state.lastOperation.timestamp : Infinity;
          const priorityThreshold = 100; // 1 second cooldown for priority conflicts
          
          if (state.lastOperation && 
              priority < state.lastOperation.type && 
              timeSinceLastOperation < priorityThreshold) {
            // Lower priority operation blocked by recent higher priority operation
            return state;
          }

          // Use queue data structure: remove modal from current position and add to end
          const newModalOrder = [
            ...state.modalOrder.filter(key => key !== modalKey), // Remove from current position
            modalKey // Add to end (highest z-index)
          ];
          
          // Reassign z-indices based on new order (BASE_Z_INDEX + position)
          const updatedModals = state.modals.map(modal => {
            const orderIndex = newModalOrder.indexOf(modal.key);
            return { ...modal, zIndex: BASE_Z_INDEX + orderIndex };
          });
          
          return {
            modals: updatedModals,
            modalOrder: newModalOrder,
            lastOperation: {
              type: priority,
              timestamp: now,
              modalKey,
            },
          };
        });
      },

      getModal: (modalKey) => {
        return get().modals.find(modal => modal.key === modalKey);
      },

      updateAllModalSizes: () => {
        // This method is kept for compatibility but sizes are now handled by DraggableWindow
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
        
        set((state) => ({
          modals: state.modals.map(modal => {
            // Only update positions to keep within bounds
            const modalWidth = 400; // fallback width
            const modalHeight = 300; // fallback height
            const maxX = viewportWidth - modalWidth;
            const maxY = viewportHeight - modalHeight;
            
            return {
              ...modal,
              position: {
                x: Math.max(0, Math.min(modal.position.x, maxX)),
                y: Math.max(0, Math.min(modal.position.y, maxY))
              }
            };
          })
        }));
      },
    }),
    {
      name: 'modal-store',
    }
  )
);

export default useModalStore;
export { BringToFrontPriority };
 