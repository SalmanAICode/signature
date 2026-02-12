import { create } from 'zustand';
import { Syndication } from '@/types/syndication';
import { Pagination } from '@/types/pagination';
import {
  getSyndications,
  createSyndication,
  updateSyndication
} from '@/lib/api/syndications';

import { CreateSyndicationData, UpdateSyndicationData, GetSyndicationParams } from '@/types/syndication';

// Default parameters
const DEFAULT_PARAMS: GetSyndicationParams = {
  sortBy: 'start_date',
  sortOrder: 'desc',
  page: 1,
  limit: 10,
  include_inactive: true,
  search: undefined,
};

// Helper function to compare two GetSyndicationParams objects
const areParamsEqual = (params1: GetSyndicationParams | null, params2: GetSyndicationParams | null): boolean => {
  if (!params1 || !params2) return false;

  return (
    params1.sortBy === params2.sortBy &&
    params1.sortOrder === params2.sortOrder &&
    params1.page === params2.page &&
    params1.limit === params2.limit &&
    params1.include_inactive === params2.include_inactive &&
    (params1.search || undefined) === (params2.search || undefined) &&
    (params1.funding || undefined) === (params2.funding || undefined) &&
    (params1.funder || undefined) === (params2.funder || undefined) &&
    (params1.lender || undefined) === (params2.lender || undefined) &&
    (params1.syndicator || undefined) === (params2.syndicator || undefined)
  );
};

// Define the shape of our store state
type SyndicationStore = {
  // Data state - null means not fetched yet, [] means fetched but empty
  syndications: Syndication[] | null;
  pagination: Pagination | null;
  params: GetSyndicationParams;

  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;

  // Error state
  error: string | null;

  // Asynchronous actions (fire-and-forget)
  setParams: (params: GetSyndicationParams) => void;
  fetchSyndications: (forceRefresh?: boolean) => void;
  createNewSyndication: (data: CreateSyndicationData) => void;
  updateExistingSyndication: (id: string, data: UpdateSyndicationData) => void;
  clearError: () => void;
  resetStore: () => void;
};

// Create the store
const useSyndicationStore = create<SyndicationStore>()((set, get) => ({
  // Initial state
  syndications: null, // null means not fetched yet
  pagination: null,
  params: { ...DEFAULT_PARAMS }, // Initialize with defaults directly
  loading: false,
  creating: false,
  updating: false,
  error: null,

  // Set pagination parameters and auto-fetch data
  setParams: (newParams: GetSyndicationParams) => {
    const { params } = get();

    // Skip if params are the same
    if (areParamsEqual(params, newParams)) {
      return;
    }

    set({ params: newParams, error: null });
    // Auto fetch when params are set
    get().fetchSyndications(true);
  },

  // Fetch syndications (fire-and-forget action)
  fetchSyndications: (forceRefresh = false) => {
    const { loading, params, syndications } = get();

    // Prevent multiple simultaneous calls
    if (loading) {
      return;
    }

    // Check if params are set
    if (!params) {
      set({ error: 'Pagination parameters must be set before fetching syndications' });
      return;
    }

    // Skip fetch if data already exists (unless forced)
    if (!forceRefresh && syndications !== null) {
      return;
    }

    set({ loading: true, error: null });

    getSyndications(params)
      .then(result => {
        set({
          syndications: result.data,
          pagination: result.pagination,
          loading: false
        });
      })
      .catch(error => {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch syndications',
          loading: false
        });
      });
  },

  // Create new syndication (fire-and-forget action)
  createNewSyndication: (data: CreateSyndicationData) => {
    const { creating, params } = get();

    // Prevent multiple simultaneous calls
    if (creating) {
      set({ error: 'Already creating a syndication, please wait' });
      return;
    }

    // Check if params are set
    if (!params) {
      set({ error: 'Pagination parameters must be set before creating syndications' });
      return;
    }

    set({ creating: true, error: null });

    createSyndication(data)
      .then(() => {
        set({ creating: false });
        // Auto-refresh data after successful creation (force refresh)
        get().fetchSyndications(true);
      })
      .catch(error => {
        set({
          error: error instanceof Error ? error.message : 'Failed to create syndication',
          creating: false
        });
      });
  },

  // Update existing syndication (fire-and-forget action)
  updateExistingSyndication: (id: string, data: UpdateSyndicationData) => {
    const { updating, params } = get();

    // Prevent multiple simultaneous calls
    if (updating) {
      set({ error: 'Already updating a syndication, please wait' });
      return;
    }

    // Check if params are set
    if (!params) {
      set({ error: 'Pagination parameters must be set before updating syndications' });
      return;
    }

    set({ updating: true, error: null });

    updateSyndication(id, data)
      .then(() => {
        set({ updating: false });
        // Auto-refresh data after successful update (force refresh)
        get().fetchSyndications(true);
      })
      .catch(error => {
        set({
          error: error instanceof Error ? error.message : 'Failed to update syndication',
          updating: false
        });
      });
  },

  // Clear error state
  clearError: () => set({ error: null }),

  // Reset entire store to initial state
  resetStore: () => set({
    syndications: null,
    pagination: null,
    params: { ...DEFAULT_PARAMS },
    loading: false,
    creating: false,
    updating: false,
    error: null,
  }),
}));

export default useSyndicationStore;
