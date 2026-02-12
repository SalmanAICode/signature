import { create } from 'zustand';
import { Formula } from '@/types/formula';
import { Pagination } from '@/types/pagination';
import {
  getFormulas,
  createFormula,
  updateFormula,
  deleteFormula
} from '@/lib/api/formulas';

import { 
  CreateFormulaData, 
  UpdateFormulaData, 
  GetFormulaParams
} from '@/types/formula';

// Default parameters
const DEFAULT_PARAMS: GetFormulaParams = {
  sortBy: '',
  sortOrder: 'asc',
  page: 1,
  limit: 10,
  include_inactive: true,
  search: undefined,
  funder: undefined,
};

// Helper function to compare two GetFormulaParams objects
const areParamsEqual = (params1: GetFormulaParams | null, params2: GetFormulaParams | null): boolean => {
  if (!params1 || !params2) return false;

  return (
    params1.sortBy === params2.sortBy &&
    params1.sortOrder === params2.sortOrder &&
    params1.page === params2.page &&
    params1.limit === params2.limit &&
    params1.include_inactive === params2.include_inactive &&
    params1.include_private === params2.include_private &&
    (params1.search || undefined) === (params2.search || undefined) &&
    (params1.funder || undefined) === (params2.funder || undefined)
  );
};

// Define the shape of our store state
type FormulaStore = {
  // Data state - null means not fetched yet, [] means fetched but empty
  formulas: Formula[] | null;
  pagination: Pagination | null;
  params: GetFormulaParams;

  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;

  // Error state
  error: string | null;

  // Asynchronous actions (fire-and-forget)
  setParams: (params: GetFormulaParams) => void;
  fetchFormulas: (forceRefresh?: boolean) => void;
  createNewFormula: (data: CreateFormulaData) => void;
  updateFormula: (id: string, data: UpdateFormulaData) => void;
  deleteFormulaById: (id: string) => void;
  clearError: () => void;
  resetStore: () => void;
};

// Create the store
const useFormulaStore = create<FormulaStore>()((set, get) => ({
  // Initial state
  formulas: null, // null means not fetched yet
  pagination: null,
  params: { ...DEFAULT_PARAMS }, // Initialize with defaults directly
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,

  // Set pagination parameters and auto-fetch data
  setParams: (newParams: GetFormulaParams) => {
    const { params } = get();

    // Skip if params are the same
    if (areParamsEqual(params, newParams)) {
      return;
    }

    set({ params: newParams, error: null });
    // Auto fetch when params are set
    get().fetchFormulas(true);
  },

  // Fetch formulas with pagination (fire-and-forget action)
  fetchFormulas: (forceRefresh = false) => {
    const { loading, params, formulas } = get();

    // Prevent multiple simultaneous calls
    if (loading) {
      return;
    }

    // Check if params are set
    if (!params) {
      set({ error: 'Pagination parameters must be set before fetching formulas' });
      return;
    }

    // Skip fetch if data already exists (unless forced)
    if (!forceRefresh && formulas !== null) {
      return;
    }

    set({ loading: true, error: null });

    getFormulas(params)
      .then(result => {
        set({
          formulas: result.data,
          pagination: result.pagination,
          loading: false
        });
      })
      .catch(error => {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch formulas',
          loading: false
        });
      });
  },

  // Create new formula (fire-and-forget action)
  createNewFormula: (data: CreateFormulaData) => {
    const { creating, params } = get();

    // Prevent multiple simultaneous calls
    if (creating) {
      set({ error: 'Already creating a formula, please wait' });
      return;
    }

    set({ creating: true, error: null });

    // Process data according to business rules
    const processedData: CreateFormulaData = {
      ...data,
      // If calculate type is AMOUNT, set base_item to NONE
      ...(data.calculate_type === 'AMOUNT' && {
        base_item: 'NONE'
      }),
      // Always include tier_type in the request body
      // If tier_type is null/undefined, set it to 'NONE'
      tier_type: data.tier_type === null || data.tier_type === undefined 
        ? 'NONE' 
        : data.tier_type
    };

    createFormula(processedData)
      .then(() => {
        set({ creating: false });
        // Auto-refresh data after successful creation (force refresh)
        if (params) {
          get().fetchFormulas(true);
        }
      })
      .catch(error => {
        set({
          error: error instanceof Error ? error.message : 'Failed to create formula',
          creating: false
        });
      });
  },

  // Update formula (fire-and-forget action)
  updateFormula: (id: string, data: UpdateFormulaData) => {
    const { updating, params } = get();

    // Prevent multiple simultaneous calls
    if (updating) {
      set({ error: 'Already updating a formula, please wait' });
      return;
    }

    set({ updating: true, error: null });

    // Process data according to business rules
    const processedData: UpdateFormulaData = {
      ...data,
      // If calculate type is AMOUNT, set base_item to NONE
      ...(data.calculate_type === 'AMOUNT' && {
        base_item: 'NONE'
      }),
      // Always include tier_type in the request body
      // If tier_type is null/undefined, set it to 'NONE'
      tier_type: data.tier_type === null || data.tier_type === undefined 
        ? 'NONE' 
        : data.tier_type
    };

    updateFormula(id, processedData)
      .then(() => {
        set({ updating: false });
        // Auto-refresh data after successful update (force refresh)
        if (params) {
          get().fetchFormulas(true);
        }
      })
      .catch(error => {
        set({
          error: error instanceof Error ? error.message : 'Failed to update formula',
          updating: false
        });
      });
  },

  // Delete formula (fire-and-forget action)
  deleteFormulaById: (id: string) => {
    const { deleting, params } = get();

    // Prevent multiple simultaneous calls
    if (deleting) {
      set({ error: 'Already deleting a formula, please wait' });
      return;
    }

    set({ deleting: true, error: null });

    deleteFormula(id)
      .then(() => {
        set({ deleting: false });
        // Auto-refresh data after successful deletion (force refresh)
        if (params) {
          get().fetchFormulas(true);
        }
      })
      .catch(error => {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete formula',
          deleting: false
        });
      });
  },

  // Clear error state
  clearError: () => set({ error: null }),

  // Reset entire store to initial state
  resetStore: () => set({
    formulas: null,
    pagination: null,
    params: { ...DEFAULT_PARAMS },
    loading: false,
    creating: false,
    updating: false,
    deleting: false,
    error: null,
  }),
}));

export default useFormulaStore;
