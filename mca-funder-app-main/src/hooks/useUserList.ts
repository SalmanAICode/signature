import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, UsersResponse } from '@/types/user';
import { getUsers } from '@/lib/api/users';
import useAuthStore from '@/lib/store/auth';

export type FilterState = {
  include_inactive: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc' | '';
  search?: string | null;
};

type UseUserListProps = {
  initialUsers: User[];
  initialPagination: {
    page: number;
    totalPages: number;
    totalResults: number;
  };
};

export const useUserList = ({ initialUsers, initialPagination }: UseUserListProps) => {
  const router = useRouter();
  const { accessToken, loading: authLoading } = useAuthStore();
  const initialLoadDone = useRef(false);
  
  // State management
  const [users, setUsers] = useState<User[]>(initialUsers);
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

  // Fetch users function
  const fetchUsers = async (page: number = 1, limit: number = 10, filters?: Partial<FilterState>) => {
    try {
      const currentFilters = filters || query.filter;
      
      setLoading(true);
      setError('');

      const response = await getUsers(page, limit, { 
        includeInactive: currentFilters.include_inactive,
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder,
        search: currentFilters.search
      }) as unknown as UsersResponse;

      if (response.success && response.data) {
        const fetchedUsers = response.data.docs;
        setPagination({
          page: response.data.pagination.page,
          totalPages: response.data.pagination.totalPages,
          totalResults: response.data.pagination.totalResults
        });
        setUsers(fetchedUsers);
      } else {
        setError('Failed to load users data');
        console.error('Failed to load users:', response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      console.error('Error fetching users:', err);
      
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
    if (!authLoading && accessToken && users.length === 0 && !loading) {
      fetchUsers(1, 10);
    } else if (!authLoading && !accessToken) {
      router.push('/login');
    }
  }, [authLoading, accessToken, users.length, loading]);

  // Handle query changes (search, filters, pagination)
  useEffect(() => {
    if (!authLoading && accessToken) {
      fetchUsers(query.page, query.limit, query.filter);
    }
  }, [query, authLoading, accessToken]);

  return {
    // State
    users,
    loading,
    error,
    pagination,
    query,
    
    // Setters
    setUsers,
    setLoading,
    setError,
    setPagination,
    setQuery,
    
    // Functions
    fetchUsers,
  };
}; 