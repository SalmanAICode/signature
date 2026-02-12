'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GenericList } from "@/components/GenericList/GenericList";
import Pagination from "@/components/Pagination";
import { User } from '@/types/user';
import { getUsers, deleteUser, updateUser, createUser } from '@/lib/api/users';
import { addUserFunder, removeUserFunder, getUserFunderList } from '@/lib/api/userFunders';
import { columns } from './_config/columnConfig';
import Filter from './_components/Filter';
import { Pagination as PaginationType } from '@/types/pagination';
import { PlusIcon } from '@heroicons/react/24/outline';
import UserForm from './_components/userForm';
import DashboardShell from '@/components/DashboardShell';
import { toast } from 'react-hot-toast';
import UserSummaryModal from './_components/UserSummaryModal';
import useAuthStore from '@/lib/store/auth';

export type FilterState = {
  include_inactive: boolean;
  user: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc' | '';
  search?: string | null;
};

const ORDERING_KEY = 'user_list_order';
const VISIBILITY_KEY = 'user_list_visibility';
const COLUMN_WIDTHS_KEY = 'user_list_column_widths';

export default function Page() {
  const [data, setData] = useState<User[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const router = useRouter();
  const prevFunderIdRef = useRef<string | undefined>(undefined);

  // Get current user's funder from auth store
  const { funder } = useAuthStore();
  const currentFunderId = funder?._id;

  // pagination state, Data result from the server
  const [paginatedData, setPaginatedData] = useState<PaginationType | null>(null);

  const [query, setQuery] = useState<{
    filter: FilterState;
    page: number;
    limit: number;
  }>({
    filter: {
      include_inactive: false,
      user: [],
      sortBy: '',
      sortOrder: 'asc',
      search: '',
    },
    page: 1,
    limit: 10,
  });

  // Watch for funder changes and refresh the list
  useEffect(() => {
    const prevFunderId = prevFunderIdRef.current;
    
    // If funder changed, refresh the list
    if (prevFunderId !== currentFunderId) {
      console.log('Funder changed, refreshing user list');
      fetchUsers();
    }
    
    // Update the ref for next comparison
    prevFunderIdRef.current = currentFunderId;
  }, [currentFunderId]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getUsers({
        sortBy: query.filter.sortBy,
        sortOrder: query.filter.sortOrder as 'asc' | 'desc' | null,
        page: query.page,
        limit: query.limit,
        include_inactive: query.filter.include_inactive,
        search: query.filter.search || '',
      });

      setData(result.data);
      setPaginatedData(result.pagination);
    } catch (error) {
      setError(
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as Error).message)
          : 'Failed to fetch Users'
      );
    } finally {
      setLoading(false);
    }
  }, [query, currentFunderId]);

  // Clear messages when query changes
  useEffect(() => {
    setError(null);
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteUser(userId);
      toast.success('User deleted successfully');
      
      // Update local state first
      setData(prevData => {
        if (!prevData) return [];
        const newData = prevData.filter(item => item._id !== userId);
        
        // If page becomes empty and not on first page, go to previous page
        if (newData.length === 0 && query.page > 1) {
          setQuery(prev => ({ ...prev, page: prev.page - 1 }));
          return null; // Will trigger refetch
        }
        
        return newData;
      });

      // Update pagination info
      setPaginatedData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          totalResults: prev.totalResults - 1,
          totalPages: Math.ceil((prev.totalResults - 1) / query.limit)
        };
      });
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to delete user. Please check your connection and try again.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateUser = async (values: any) => {
    try {
      // Extract funder_list from values for separate handling
      const { funder_list, ...createData } = values;
      
      const response = await createUser(createData);
      if (response.success) {
        // Handle funder list updates if provided
        if (funder_list && Array.isArray(funder_list) && response.data?._id) {
          try {
            const funderIds = funder_list.map((f: any) => f.funder?._id || f.value || f);
            const addPromises = funderIds.map((funderId: string) => addUserFunder(response.data._id, funderId));
            await Promise.all(addPromises);
          } catch (funderError) {
            console.error('Error adding funders to new user:', funderError);
            // Continue with the create even if funder list update fails
          }
        }
        
        toast.success('User created successfully');
        setShowUserForm(false);
        
        // Add new user to the top of the list
        setData(prev => [response.data, ...(prev || [])]);
        
        // Update pagination info
        setPaginatedData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            totalResults: prev.totalResults + 1,
            totalPages: Math.ceil((prev.totalResults + 1) / query.limit)
          };
        });
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to create user');
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to create user. Please try again.';
      toast.error(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const handleUpdateUser = async (userId: string, values: any) => {
    try {
      // Extract funder_list from values for separate handling
      const { funder_list, ...updateData } = values;
      
      const response = await updateUser(userId, updateData);
      if (response.success) {
        // Handle funder list updates if provided
        if (funder_list && Array.isArray(funder_list)) {
          try {
            // Extract new funder IDs from the form data
            const newFunderIds = funder_list.map((f: any) => f.funder?._id || f.value || f);
            
            // Get current user funders to compare
            const currentUserFunders = await getUserFunderList(userId);
            const currentFunderIds = currentUserFunders.map((f: any) => f._id);
            
            // Find funders to add and remove (only the differences)
            const toAdd = newFunderIds.filter((id: string) => !currentFunderIds.includes(id));
            const toRemove = currentFunderIds.filter((id: string) => !newFunderIds.includes(id));
            
            // Perform add/remove operations only for changed funders
            const addPromises = toAdd.map((funderId: string) => addUserFunder(userId, funderId));
            const removePromises = toRemove.map((funderId: string) => removeUserFunder(userId, funderId));
            
            await Promise.all([...addPromises, ...removePromises]);
          } catch (funderError) {
            console.error('Error updating funder list:', funderError);
            // Continue with the update even if funder list update fails
          }
        }
        
        toast.success('User updated successfully');
        
        // Update the user in the local state with the returned data
        setData(prev => {
          if (!prev) return [];
          
          return prev.map(user => {
            if (user._id === userId) {
              // Merge the existing user data with the updated data
              // This ensures we don't lose any fields that might not be returned by the API
              return {
                ...user,
                ...response.data,
                // Ensure we preserve the _id field
                _id: userId
              };
            }
            return user;
          });
        });
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to update user');
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to update user. Please try again.';
      toast.error(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  return (
    <DashboardShell>
    <div className='w-full border-gray-100 rounded-xl p-8 bg-gray-50'>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
      </div>

      {/* Error Message Banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 font-medium">Error: {error}</span>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <div className="relative">
        {/* Loading Overlay for when we have data */}
        {loading && data && data.length > 0 && (
          <div className="absolute inset-0 bg-white bg-opacity-30 flex items-center justify-center z-10 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-75" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-gray-600">Loading...</span>
            </div>
          </div>
        )}

        {/* Always show GenericList structure */}
        <GenericList
          title="Users"
          data={data || []}
          columns={columns}
          storage={{
            orderingKey: ORDERING_KEY,
            visibilityKey: VISIBILITY_KEY,
            columnWidthsKey: COLUMN_WIDTHS_KEY,
          }}
          currentQuery={query}
          rowClassName={(row) =>
            row?.inactive
              ? 'bg-gray-50 opacity-50'
              : ''
          }
          filter={{
            enabled: true,
            render: ({ visibleColumns, flatColumns }) => <Filter value={query.filter} onChange={(nextFilter) => setQuery(prev => ({
              ...prev,
              filter: nextFilter,
              page: 1, // Optional: reset page on filter change
            }
            ))}
              visibleColumns={visibleColumns}
              flatColumns={flatColumns}
            />,
            onFilterChange: (nextFilter) => {
              setQuery((prev) => ({
                ...prev,
                page: 1,
                filter: {
                  ...prev.filter,
                  ...nextFilter,
                },
              }));
            },
          }}
          rowModal={{
            enabled: true, 
            render: (row, onClose) => (
              <UserSummaryModal
                user={row}
                onClose={onClose}
                onDelete={handleDeleteUser}
                onCreate={handleCreateUser}
                onUpdate={handleUpdateUser}
                isDeleting={isDeleting}
                error={error}
              />
            )
          }}
          expandable={{ enabled: true }}
          fetchAllDatasPaginated={async (params) => getUsers({ 
            include_inactive: true, 
            page: params.page, 
            limit: params.limit 
          })}
          renderRightButtons={() => (
            <div className="flex gap-2">
              <button
                onClick={() => setShowUserForm(true)}
                className="px-3 py-1.5 rounded-md flex items-center gap-2 text-white bg-[#2196F3] hover:bg-[#1769AA] text-sm font-semibold shadow-sm transition"
              >
                <PlusIcon className="h-5 w-5" />
                Create
              </button>
            </div>
          )}
        />

        {/* Show loading state for initial load */}
        {loading && (!data || data.length === 0) && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-gray-600">Loading...</span>
            </div>
          </div>
        )}

        {/* Show empty state when not loading and no data */}
        {!loading && data && data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No Users available.
          </div>
        )}

        {/* User Form Modal */}
        {showUserForm && (
          <UserForm
            initialData={null}
            onCancel={() => setShowUserForm(false)}
            onCreate={handleCreateUser}
          />
        )}

        {/* Pagination - only show when we have data */}
        {data && data.length > 0 && (
          <Pagination
            currentPage={query.page}
            totalPages={paginatedData?.totalPages || 0}
            totalResults={paginatedData?.totalResults || 0}
            limit={query.limit}
            onPageChange={(newPage) => setQuery((prev) => ({ ...prev, page: newPage }))}
            onLimitChange={(newLimit) => setQuery((prev) => ({ ...prev, limit: newLimit }))}
          />
        )}
      </div>
    </div>
    </DashboardShell>
  );
} 