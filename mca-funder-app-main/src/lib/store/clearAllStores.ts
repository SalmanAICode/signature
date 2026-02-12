import useAuthStore from '@/lib/store/auth';
import useModalStore from '@/lib/store/modal';
import useSyndicationStore from '@/lib/store/syndication';
import useFormulaStore from '@/lib/store/formula';

/**
 * Central function to clear all application stores data
 * This should be called during logout to ensure clean state
 */
export function clearAllStores() {
    // Clear auth store
    useAuthStore.getState().clearAuth();

    // Clear syndication store
    useSyndicationStore.getState().resetStore();

    // Clear formula store
    useFormulaStore.getState().resetStore();

    // Clear modal store - close all open modals
    useModalStore.getState().closeAllModals();

    // Add other stores here as needed
    // Example:
    // useFunderStore.getState().resetStore();
} 