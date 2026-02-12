import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Funder, FunderResponse } from '@/types/funder';
import { getFunders } from '@/lib/api/funders';
import useAuthStore from '@/lib/store/auth';

export type FilterState = {
  include_inactive: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc' | '';
  search?: string | null;
};

type UseFunderListProps = {
  initialFunders: Funder[];
  initialPagination: {
    page: number;
    totalPages: number;
    totalResults: number;
  };
};

export const useFunderList = ({ initialFunders, initialPagination }: UseFunderListProps) => {
  const router = useRouter();
  const { accessToken, loading: authLoading } = useAuthStore();
  const initialLoadDone = useRef(false);
  
  // State management
  const [funders, setFunders] = useState<Funder[]>(initialFunders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(initialPagination);
  const [query, setQuery] = useState<{
    filter: FilterState;
    page: number;
    limit: number;
  }>({
    filter: {
      include_inactive: false,
      sortBy: '',
      sortOrder: 'asc',
      search: '',
    },
    page: 1,
    limit: 10,
  });

  // Fetch funders function
  const fetchFunders = async (page: number = 1, limit: number = 10, filters?: Partial<FilterState>) => {
    try {
      const currentFilters = filters || query.filter;

      setLoading(true);
      setError('');

      const response = await getFunders(page, limit, {
        includeInactive: currentFilters.include_inactive,
        search: currentFilters.search || undefined,
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder,
      }) as unknown as FunderResponse;

      if (response.success && response.data) {
        const fetchedFunders = response.data.docs;
        setPagination({
          page: response.data.pagination.page,
          totalPages: response.data.pagination.totalPages,
          totalResults: response.data.pagination.totalResults
        });
        setFunders(fetchedFunders);
      } else {
        setError('Failed to load funders data');
        console.error('Failed to load funders:', response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch funders');
      console.error('Error fetching funders:', err);
      
      // If authentication failed, redirect to login
      if (err instanceof Error && err.message.includes('Authentication failed')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch data when auth is ready and we have no initial data
  useEffect(() => {

    if (!authLoading && accessToken && funders.length === 0 && !loading) {
      fetchFunders(1, 10);
    } else if (!authLoading && !accessToken) {
      router.push('/login');
    }
  }, [authLoading, accessToken, funders.length, loading]);

  // Handle query changes (search, filters, pagination)
  useEffect(() => {
    if (!authLoading && accessToken) {
      fetchFunders(query.page, query.limit, query.filter);
    }
  }, [query, authLoading, accessToken]);

  return {
    // State
    funders,
    loading,
    error,
    pagination,
    query,
    
    // Setters
    setFunders,
    setLoading,
    setError,
    setPagination,
    setQuery,
    
    // Functions
    fetchFunders,
  };
}; 