'use client';

import React, { useState, useEffect } from 'react';
import { PaybackPlan } from '@/types/paybackPlan';
import { Payback } from '@/types/payback';
import { getPaybackPlans, deletePaybackPlan } from '@/lib/api/paybackPlans';
import { getPaybacksByPlan } from '@/lib/api/paybacks';
import { SimpleList, Column } from '@/components/SimpleList';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Pagination } from '@/types/pagination';
import CreatePaybackPlan from './CreatePaybackPlan';
import EditPaybackPlan from './EditPaybackPlan';
import FormModalLayout from '@/components/FormModalLayout';
import DeleteModal from '@/components/DeleteModal';
import type { SortOrder } from '@/components/SimpleList';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface PaybackPlansProps {
  fundingId: string;
}

interface QueryParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: SortOrder;
  search?: string;
}

const columns: Column<PaybackPlan>[] = [
  {
    key: 'merchant',
    label: 'Merchant',
    render: (value: any) => <span className="block text-left">{typeof value === 'object' && value !== null ? value.name : value || '-'}</span>,
    sortable: true,
  },
  {
    key: 'funder',
    label: 'Funder',
    render: (value: any) => <span className="block text-left">{typeof value === 'object' && value !== null ? value.name : value || '-'}</span>,
    sortable: true,
  },
  {
    key: 'total_amount',
    label: 'Total Amount',
    render: (value: any) => <span className="block text-left">{formatCurrency(value)}</span>,
    sortable: true,
  },
  {
    key: 'next_payback_date',
    label: 'Next Payback Date',
    render: (value: any) => <span className="block text-left">{value ? formatDate(value) : '-'}</span>,
    sortable: true,
  },
  {
    key: 'next_payback_amount',
    label: 'Next Payback Amount',
    render: (value: any) => <span className="block text-left">{value !== undefined ? formatCurrency(value) : '-'}</span>,
    sortable: true,
  },
  {
    key: 'remaining_balance',
    label: 'Remaining Balance',
    render: (value: any) => <span className="block text-left">{value !== undefined ? formatCurrency(value) : '-'}</span>,
    sortable: true,
  },
  {
    key: 'remaining_count',
    label: 'Remaining Count',
    render: (value: any) => <span className="block text-left">{value !== undefined ? value : '-'}</span>,
    sortable: true,
  },
  {
    key: 'frequency',
    label: 'Frequency',
    render: (value: any) => <span className="block text-left">{value || '-'}</span>,
    sortable: true,
  },
  {
    key: 'payment_method',
    label: 'Payment Method',
    render: (value: any) => <span className="block text-left">{value}</span>,
    sortable: true,
  },
  {
    key: 'scheduled_end_date',
    label: 'Scheduled End Date',
    render: (value: any) => <span className="block text-left">{value ? formatDate(value) : '-'}</span>,
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
    render: (value: any) => <span className="block text-left"><StatusBadge status={value} /></span>,
    sortable: true,
  },
  {
    key: 'note',
    label: 'Note',
    render: (value: any) => (
      <span className="block text-left whitespace-pre-line break-words">
        {value || '-'}
      </span>
    ),
    sortable: false,
  },
];

function ExpandedPaybackPlanContent({ item }: { item: PaybackPlan }) {
  const [paybacks, setPaybacks] = useState<Payback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaybacks = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the endpoint to fetch paybacks for this specific plan
        const result = await getPaybacksByPlan(item._id);
        setPaybacks(result.data.docs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch paybacks');
        setPaybacks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPaybacks();
  }, [item._id]);

  return (
    <div className="p-4 bg-white">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 text-left">
          Related Paybacks
        </h3>
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading paybacks...</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}
      </div>
      {!loading && !error && (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Status</th>
              <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Due Date</th>
              <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Payback Amount</th>
              <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Funded Amount</th>
              <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Fee Amount</th>
              <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Payment Method</th>
              <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Submitted Date</th>
            </tr>
          </thead>
          <tbody>
            {paybacks.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-gray-500">No paybacks found for this plan.</td>
              </tr>
            )}
            {paybacks.map((payback) => (
              <tr key={payback._id} className="border-b border-gray-100">
                <td className="px-3 py-2 text-left">
                  <StatusBadge status={payback.status} size="xs" />
                </td>
                <td className="px-3 py-2 text-left">
                  {payback.due_date ? format(new Date(payback.due_date), 'MMM dd, yyyy') : '-'}
                </td>
                <td className="px-3 py-2 text-left">
                  {formatCurrency(payback.payback_amount ?? 0)}
                </td>
                <td className="px-3 py-2 text-left">
                  {formatCurrency(payback.funded_amount ?? 0)}
                </td>
                <td className="px-3 py-2 text-left">
                  {formatCurrency(payback.fee_amount ?? 0)}
                </td>
                <td className="px-3 py-2 text-left">
                  {payback.payment_method}
                </td>
                <td className="px-3 py-2 text-left">
                  {payback.submitted_date ? format(new Date(payback.submitted_date), 'MMM dd, yyyy') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function PaybackPlans({ fundingId }: PaybackPlansProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paybackPlans, setPaybackPlans] = useState<PaybackPlan[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PaybackPlan | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<PaybackPlan | null>(null);
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    limit: 10,
    sortBy: 'start_date',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 0
  });

  const fetchPaybackPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPaybackPlans({ funding: fundingId });
      setPaybackPlans(result.data);
      setPagination({
        page: 1,
        limit: 10,
        totalPages: Math.ceil(result.data.length / 10),
        totalResults: result.data.length
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch payback plans');
      setPaybackPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaybackPlans();
  }, [fundingId]);

  const handleCreate = async () => {
    setIsModalLoading(true);
    try {
      // Handle create logic here
      await fetchPaybackPlans();
      setShowCreateModal(false);
      toast.success('Payback plan created successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payback plan';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPlan) return;
    
    setIsModalLoading(true);
    try {
      // Handle update logic here
      await fetchPaybackPlans();
      setShowEditModal(false);
      toast.success('Payback plan updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update payback plan');
      throw error;
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleRowUpdate = (updatedItem: PaybackPlan) => {
    setPaybackPlans(prev => 
      prev.map(item => item._id === updatedItem._id ? updatedItem : item)
    );
  };

  const handleDelete = async (plan: PaybackPlan) => {
    setPlanToDelete(plan);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    setError(null);
    try {
      setIsModalLoading(true);
      // Actually delete the payback plan
      await deletePaybackPlan(planToDelete._id);
      await fetchPaybackPlans();
      setShowDeleteModal(false);
      setPlanToDelete(null);
      toast.success('Payback plan deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete payback plan');
      setError('Failed to delete payback plan. Please try again.');
    } finally {
      setIsModalLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedPlan(null);
    setShowCreateModal(true);
  };

  const openUpdateModal = (plan: PaybackPlan) => {
    setSelectedPlan(plan);
    setShowEditModal(true);
  };

  const handlePageChange = (page: number) => {
    setQueryParams(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setQueryParams(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleSort = (sortBy: string, sortOrder: SortOrder) => {
    setQueryParams(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  };

  const handleSearch = async (search: string): Promise<void> => {
    setQueryParams(prev => ({ ...prev, search, page: 1 }));
  };

  const renderActions = (item: PaybackPlan) => (
    <div className="flex space-x-2">
      <button
        onClick={() => openUpdateModal(item)}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </button>
    </div>
  );

  const renderHeaderButtons = () => (
    <div className="flex space-x-2">
      <button
        onClick={openCreateModal}
        className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create
        </span>
      </button>
    </div>
  );

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <SimpleList
          title="Payback Plans"
          data={paybackPlans}
          columns={columns}
          loading={loading}
          error={error}
          emptyMessage="No payback plans found"
          renderActions={renderActions}
          renderHeaderButtons={renderHeaderButtons}
          onSearch={handleSearch}
          onSort={handleSort}
          searchQuery={queryParams.search}
          initialSortBy={queryParams.sortBy}
          initialSortOrder={queryParams.sortOrder}
          pagination={{
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
            totalResults: pagination.totalResults,
            limit: pagination.limit,
            onPageChange: handlePageChange,
            onLimitChange: handleLimitChange
          }}
          renderExpandedContent={(item) => <ExpandedPaybackPlanContent item={item} />}
          onUpdate={handleRowUpdate}
        />
      </div>

      {showCreateModal && (
        <FormModalLayout
          title="Create Payback Plan"
          subtitle="Please fill out the details for the new payback plan."
          onCancel={() => setShowCreateModal(false)}
          maxWidth={700}
        >
          <CreatePaybackPlan
            fundingId={fundingId}
            onSuccess={handleCreate}
            onCancel={() => setShowCreateModal(false)}
          />
        </FormModalLayout>
      )}

      {showEditModal && selectedPlan && (
        <FormModalLayout
          title="Edit Payback Plan"
          subtitle="Update the details for the payback plan."
          onCancel={() => setShowEditModal(false)}
          maxWidth={700}
        >
          <EditPaybackPlan
            paybackPlan={selectedPlan}
            onSuccess={handleUpdate}
            onCancel={() => setShowEditModal(false)}
          />
        </FormModalLayout>
      )}

      <DeleteModal
        isOpen={showDeleteModal}
        isLoading={isModalLoading}
        title="Delete Payback Plan"
        message={`Are you sure you want to delete this payback plan?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setPlanToDelete(null);
        }}
      />
    </div>
  );
} 
