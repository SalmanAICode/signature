'use client';

import { useState, useEffect } from 'react';
import { GenericList } from "@/components/GenericList/GenericList";
import Pagination from "@/components/Pagination";
import { Contact } from '@/types/contact';
import { getContacts, getContactMerchants } from '@/lib/api/contacts';
import { columns } from './_config/columnConfig';
import Filter from './_components/Filter';
import SummaryModal from './_components/SummaryModal';
import { Pagination as PaginationType } from '@/types/pagination';
import { PlusIcon } from '@heroicons/react/24/outline';
import UserForm from './_components/ContactForm';
import DashboardShell from '@/components/DashboardShell';

export type FilterState = {
  include_inactive: boolean;
  user: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc' | '';
  search?: string | null;
};

const ORDERING_KEY = 'contact_list_order';
const VISIBILITY_KEY = 'contact_list_visibility';
const COLUMN_WIDTHS_KEY = 'contact_list_column_widths';

export default function Page() {

    const [data, setData] = useState<Contact[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
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
  
  // fetch the data from the server when the pagination or filter changes
  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getContacts({
        sortBy: query.filter.sortBy,
        sortOrder: query.filter.sortOrder as 'asc' | 'desc' | null,
        page: query.page,
        limit: query.limit,
        include_inactive: query.filter.include_inactive,
        search: query.filter.search || '',
      });

      // TEMPORARY: Fetch merchant count for each contact using apiClient
      const contactsWithCounts = await Promise.all(
        result.data.map(async (contact) => {
          try {
            const res = await getContactMerchants(contact._id);
            return { ...contact, merchant_count: res.data?.docs?.length ?? 0 };
          } catch {
            return { ...contact, merchant_count: 0 };
          }
        })
      );

      setData(contactsWithCounts);
      setPaginatedData(result.pagination);
    } catch (error) {
      setError(
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as any).message)
          : 'Failed to fetch Contacts'
      );
    } finally {
      setLoading(false);
    }
  };

  const [showUserForm, setShowUserForm] = useState(false);
  const [rowModal, setRowModal] = useState<Contact | null>(null);

  return (
    <DashboardShell>
    <div className='w-full border-gray-100 rounded-xl p-8 bg-gray-50'>
      <div className="flex justify-between items-center ">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Contacts</h1>
      </div>
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
        <GenericList
          title="Contacts"
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
            enabled: true, render: (row, onClose) => <SummaryModal
              contact={row}
              onClose={onClose}
              onDeleteSuccess={fetchContacts}
              onUpdateSuccess={fetchContacts}
            />
          }}
          expandable={{ enabled: true, }}
          fetchAllData={async () => {
            const response = await getContacts({
              page: 1,
              limit: 1000,
              include_inactive: false,
              sortBy: '',
              sortOrder: 'asc',
              search: '',
            });
            return response.data;
          }}
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
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-gray-600">Loading...</span>
            </div>
          </div>
        )}
        {/* Show empty state when not loading and no data */}
        {!loading && data && data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No Contacts available.
          </div>
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
        {showUserForm && (
          <UserForm
            initialData={null}
            onCancel={() => setShowUserForm(false)}
            onSuccess={async () => {
              // Fetch the latest pagination info to get the new total count
              const result = await getContacts({
                sortBy: query.filter.sortBy,
                sortOrder: query.filter.sortOrder as 'asc' | 'desc' | null,
                page: 1,
                limit: query.limit,
                include_inactive: query.filter.include_inactive,
                search: query.filter.search || '',
              });
              const totalContacts = result.pagination?.totalResults || 0;
              const lastPage = Math.ceil(totalContacts / query.limit);
              setQuery(prev => ({
                ...prev,
                page: lastPage,
              }));
              setShowUserForm(false);
            }}
          />
        )}
      </div>
    </div>
    </DashboardShell>
  );
} 