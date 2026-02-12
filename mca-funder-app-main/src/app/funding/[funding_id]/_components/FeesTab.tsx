import React, { useState, useEffect } from 'react';
import { Funding } from '@/types/funding';
import { SimpleList } from '@/components/SimpleList';
import type { Column, SortOrder } from '@/components/SimpleList';
import { Pagination } from '@/types/pagination';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { renderStatusBadge } from '@/components/StatusBadge';
import { FundingFee, GetFundingFeeListQuery, CreateFundingFeeParams, UpdateFundingFeeParams } from '@/types/fundingFee';
import { getFundingFees, createFundingFee, updateFundingFee, deleteFundingFee } from '@/lib/api/fundingFee';
import { getFeeTypeList } from '@/lib/api/feeTypes';
import { FeeType } from '@/types/feeType';
import CreateFeeModal from './feeTab/CreateFeeModal';
import DeleteModal from '@/components/DeleteModal';
import { columns } from './feeTab/config';
import { toast } from 'react-hot-toast';

interface QueryParams {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: SortOrder;
    search?: string;
    include_inactive?: boolean;
}

export default function FeesTab({ data }: { data: Funding }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fees, setFees] = useState<FundingFee[]>([]);
    const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
    const [queryParams, setQueryParams] = useState<QueryParams>({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        include_inactive: true
    });
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 0
    });
    const [showModal, setShowModal] = useState(false);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
    const [selectedFee, setSelectedFee] = useState<FundingFee | undefined>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [feeToDelete, setFeeToDelete] = useState<FundingFee | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const fetchFees = async () => {
        setLoading(true);
        setError(null);
        try {
            const query: GetFundingFeeListQuery = {
                page: queryParams.page,
                limit: queryParams.limit,
                funding: data._id,
                search: queryParams.search,
                include_inactive: queryParams.include_inactive,
                sortBy: queryParams.sortBy,
                sortOrder: queryParams.sortOrder
            };
            const { data: feeData, pagination: paginationData } = await getFundingFees(query);
            setFees(feeData);
            setPagination(paginationData);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to fetch fees');
            setFees([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch available fee types for the create modal
    const fetchFeeTypes = async () => {
        try {
            const result = await getFeeTypeList({ funder: data.lender.id, upfront: false });
            setFeeTypes(result || []);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to fetch available fee types');
        }
    };

    useEffect(() => {
        fetchFeeTypes();
    }, []);

    useEffect(() => {
        fetchFees();
    }, [data._id, queryParams.page, queryParams.limit, queryParams.search, queryParams.sortBy, queryParams.sortOrder]);

    const handleCreate = async (formData: CreateFundingFeeParams) => {
        setIsModalLoading(true);
        try {
            const newFee = await createFundingFee({
                ...formData,
                funding: data._id,
            });
            setFees(prev => [newFee, ...prev]);
            setPagination(prev => ({
                ...prev,
                totalResults: prev.totalResults + 1,
                totalPages: Math.ceil((prev.totalResults + 1) / prev.limit)
            }));
            setShowModal(false);
            toast.success('Fee created successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create fee';
            toast.error(errorMessage);
            throw error; // Re-throw to let the modal handle the error
        } finally {
            setIsModalLoading(false);
        }
    };

    const handleUpdate = async (formData: UpdateFundingFeeParams) => {
        if (!selectedFee) return;
        
        setIsModalLoading(true);
        try {
            const updateData: UpdateFundingFeeParams = {
                fee_type: formData.fee_type,
                amount: formData.amount,
                note: formData.note,
                inactive: selectedFee.inactive
            };
            const updatedFee = await updateFundingFee(selectedFee._id, updateData);
            setFees(prev => prev.map(item => item._id === selectedFee._id ? updatedFee : item));
            setSelectedFee(updatedFee);
            setShowModal(false);
            toast.success('Fee updated successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update fee');
            throw error;
        } finally {
            setIsModalLoading(false);
        }
    };

    const handleDelete = async (fee: FundingFee) => {
        setFeeToDelete(fee);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!feeToDelete) return;
        
        setError(null);
        try {
            setIsModalLoading(true);
            await deleteFundingFee(feeToDelete._id);
            setFees(prev => prev.filter(item => item._id !== feeToDelete._id));
            setPagination(prev => ({
                ...prev,
                totalResults: prev.totalResults - 1,
                totalPages: Math.ceil((prev.totalResults - 1) / prev.limit)
            }));
            setShowDeleteModal(false);
            setFeeToDelete(null);
            toast.success('Fee deleted successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete fee');
            setError('Failed to delete fee. Please try again.');
        } finally {
            setIsModalLoading(false);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setFeeToDelete(null);
        setIsDeleting(null);
    };

    const openCreateModal = () => {
        setModalMode('create');
        setSelectedFee(undefined);
        setShowModal(true);
    };

    const openUpdateModal = (fee: FundingFee) => {
        setModalMode('update');
        setSelectedFee(fee);
        setShowModal(true);
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

    const renderActions = (item: FundingFee) => (
        <div className="flex space-x-2">
            <button
                onClick={() => openUpdateModal(item)}
                disabled={isModalLoading}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
            </button>
            <button
                onClick={() => handleDelete(item)}
                disabled={isDeleting === item._id}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
                {isDeleting === item._id ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Deleting...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </>
                )}
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
                    title="Funding Fees"
                    data={fees}
                    columns={columns}
                    loading={loading}
                    error={error}
                    emptyMessage="No fees found"
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
                />
            </div>

            <CreateFeeModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onCreate={handleCreate}
                onUpdate={handleUpdate}
                isLoading={isModalLoading}
                mode={modalMode}
                initialData={selectedFee}
                feeTypes={feeTypes}
            />

            <DeleteModal
                isOpen={showDeleteModal}
                title="Delete Fee"
                message={`Are you sure you want to delete the fee "${feeToDelete?.fee_type?.name}"?`}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                isLoading={isDeleting === feeToDelete?._id}
            />
    </div>
  );
} 