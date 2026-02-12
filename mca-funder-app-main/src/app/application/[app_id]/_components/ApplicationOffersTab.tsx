'use client';

import { useState, useEffect } from 'react';
import { ApplicationOffer } from '@/types/applicationOffer';
import { getApplicationOffers } from '@/lib/api/applicationOffers';
import { Application } from '@/types/application';
import { SimpleList } from '@/components/SimpleList';
import type { SortOrder } from '@/components/SimpleList';
import { Pagination } from '@/types/pagination';
import { CreateModal } from '@/app/application-offer/_components/CreateModal';
import { columns } from './ApplicationOfferTab/columnConfig';
import { ApplicationOfferFormValues } from '@/app/application-offer/_components/ApplicationOfferForm';
import { updateFeeType } from '@/lib/api/feeTypes';
import { createApplicationOffer } from '@/lib/api/applicationOffers';
import { toast } from 'react-hot-toast';

interface ApplicationOffersTabProps {
  data: Application;
}

interface QueryParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: SortOrder;
  search?: string;
}

export default function ApplicationOffersTab({ data }: ApplicationOffersTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationOffers, setApplicationOffers] = useState<ApplicationOffer[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    limit: 10,
    sortBy: 'offered_date',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 0
  });

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getApplicationOffers({
        application: data._id,
        include_inactive: true,
        page: queryParams.page,
        limit: queryParams.limit,
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder,
        search: queryParams.search
      });
      setApplicationOffers(response.data);
      setPagination(prev => ({
        ...prev,
        totalResults: response.pagination.totalResults,
        totalPages: response.pagination.totalPages
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch offers');
      setApplicationOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [queryParams.page, queryParams.limit, queryParams.sortBy, queryParams.sortOrder, queryParams.search]);

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

  const handleOnCreate = async (values: ApplicationOfferFormValues) => {
    try {
      // Update fee types if name has changed
      for (const fee of values.fee_list) {
        if (fee.name && fee.name !== '') {
          await updateFeeType(fee.fee_type, { name: fee.name });
        }
      }

      const apiValues = {
        application: values.application,
        lender: values.lender,
        frequency: values.frequency,
        payday_list: values.payday_list,
        avoid_holiday: values.avoid_holiday,
        offered_amount: Number(values.offered_amount),
        payback_count: Number(values.payback_count),
        payback_amount: Number(values.payback_amount),
        commission_amount: Number(values.commission_amount),
        offered_date: values.offered_date,
        offered_by_user: values.offered_by_user,
        fee_list: values.fee_list.map(fee => ({
          ...(fee.name && fee.name !== '' && { name: fee.name }),
          ...(fee.fee_type && fee.fee_type !== '' && { fee_type: fee.fee_type }),
          amount: Number(fee.amount),
        })),
        expense_list: values.expense_list.map(expense => ({
          ...(expense.name && expense.name !== '' && { name: expense.name }),
          ...(expense.expense_type && expense.expense_type !== '' && { expense_type: expense.expense_type }),
          amount: Number(expense.amount),
        })),
        status: values.status,
      };

      const newApplicationOffer = await createApplicationOffer(apiValues);

      toast.success('Application offer created successfully');
      setIsCreateModalOpen(false);
      setApplicationOffers(prev => [newApplicationOffer, ...(prev || [])]);
    } catch (err: any) {
      toast.error('Failed to create application offer');
      throw new Error(err.message || 'Failed to create application offer');
    }
  };

  const renderHeaderButtons = () => (
    <div className="flex space-x-2">
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Offer
        </span>
      </button>
    </div>
  );

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <SimpleList
          title="Application Offers"
          data={applicationOffers}
          columns={columns}
          loading={loading}
          error={error}
          onRefresh={fetchOffers}
          emptyMessage="No offers found"
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
        />
      </div>

      {isCreateModalOpen && (
        <CreateModal
          onClose={() => setIsCreateModalOpen(false)}
          application={data}
          onCreate={handleOnCreate}
        />
      )}
    </div>
  );
}
