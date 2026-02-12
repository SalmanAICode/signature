'use client';

import { useState, useEffect } from 'react';
import { ApplicationStipulation, CreateApplicationStipulationData, UpdateApplicationStipulationData } from '@/types/applicationStipulation';
import { getApplicationStipulations, updateApplicationStipulation, deleteApplicationStipulation, createApplicationStipulation } from '@/lib/api/applicationStipulations';
import { SimpleList } from '@/components/SimpleList';
import { Pagination } from '@/types/pagination';
import { getStipulationList } from '@/lib/api/stipulations';
import { StipulationType } from '@/types/stipulationType';
import CreateStipulationModal from './stipulationTab/CreateStipulationModal';
import DeleteModal from '@/components/DeleteModal';
import { Application } from '@/types/application';
import { columns } from './stipulationTab/columnConfig';
import type { SortOrder } from '@/components/SimpleList';
import ExpandedStipulationContent from './stipulationTab/ExpandedStipulationContent';
import { toast } from 'react-hot-toast';

interface ApplicationStipulationsTabProps {
    data: Application;
}

interface QueryParams {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: SortOrder;
    search?: string;
}

export default function ApplicationStipulationsTab({ data }: ApplicationStipulationsTabProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [applicationStipulations, setApplicationStipulations] = useState<ApplicationStipulation[]>([]);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [stipulations, setStipulations] = useState<StipulationType[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
    const [selectedStipulation, setSelectedStipulation] = useState<ApplicationStipulation | undefined>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [stipulationToDelete, setStipulationToDelete] = useState<ApplicationStipulation | null>(null);
    const [queryParams, setQueryParams] = useState<QueryParams>({
        page: 1,
        limit: 10,
        sortBy: 'status_date',
        sortOrder: 'desc'
    });
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 0
    });

    const fetchApplicationStipulations = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiParams = {
                ...queryParams,
                sortOrder: queryParams.sortOrder || undefined
            };
            const result = await getApplicationStipulations(data._id, apiParams);
            setApplicationStipulations(result.data);
            setPagination({
                page: result.pagination.page,
                limit: result.pagination.limit,
                totalPages: result.pagination.totalPages,
                totalResults: result.pagination.totalResults
            });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to fetch stipulations');
            setApplicationStipulations([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch available stipulations for the create modal
    const fetchStipulations = async () => {
        try {
            const result = await getStipulationList({funder: data.funder?.id});
            setStipulations(result);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to fetch available stipulations');
        }
    };

    // Fetch available stipulations for the create modal
    useEffect(() => {
        fetchStipulations();
    }, []);

    useEffect(() => {
        fetchApplicationStipulations();
    }, [queryParams.page, queryParams.limit, queryParams.sortBy, queryParams.sortOrder, queryParams.search]);

    const handleCreate = async (newData: CreateApplicationStipulationData) => {
        setIsModalLoading(true);
        try {
            newData.note = newData.note?.trim();
            const newStipulation = await createApplicationStipulation(data._id, newData);
            setApplicationStipulations(prev => [newStipulation, ...prev ]);
            setPagination(prev => ({
                ...prev,
                totalResults: prev.totalResults + 1,
                totalPages: Math.ceil((prev.totalResults + 1) / prev.limit)
            }));

            setShowModal(false);
            toast.success('Stipulation created successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create stipulation';
            toast.error(errorMessage);
            throw error; // Re-throw to let the modal handle the error
        } finally {
            setIsModalLoading(false);
        }
    };

    const handleUpdate = async (newData: UpdateApplicationStipulationData) => {
        if (!selectedStipulation) return;
        
        setIsModalLoading(true);
        try {
            newData.note = newData.note?.trim();
            const newStipulation = await updateApplicationStipulation(data._id, selectedStipulation._id, newData);

            setApplicationStipulations(prev => prev.map(item => item._id === selectedStipulation._id ? newStipulation : item));
            setSelectedStipulation(newStipulation);
            setShowModal(false);
            toast.success('Stipulation updated successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update stipulation');
            throw error;
        } finally {
            setIsModalLoading(false);
        }
    };

    const handleRowUpdate = (updatedItem: ApplicationStipulation) => {
        setApplicationStipulations(prev => 
            prev.map(item => item._id === updatedItem._id ? updatedItem : item)
        );
    };

    const handleDelete = async (stipulation: ApplicationStipulation) => {
        if (stipulation.document_count > 0) {
            toast.error('Cannot delete stipulation with documents');
            return;
        }
        setStipulationToDelete(stipulation);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!stipulationToDelete) return;
        
        setError(null);
        try {
            setIsModalLoading(true);
            await deleteApplicationStipulation(data._id, stipulationToDelete._id);

            setApplicationStipulations(prev => prev.filter(item => item._id !== stipulationToDelete._id));
            setPagination(prev => ({
                ...prev,
                totalResults: prev.totalResults - 1,
                totalPages: Math.ceil((prev.totalResults - 1) / prev.limit)
                
            }));
            setShowDeleteModal(false);
            setStipulationToDelete(null);
            toast.success('Stipulation deleted successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete stipulation');
            setError('Failed to delete stipulation. Please try again.');
        } finally {
            setIsModalLoading(false);
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setSelectedStipulation(undefined);
        setShowModal(true);
    };

    const openUpdateModal = (stipulation: ApplicationStipulation) => {
        setModalMode('update');
        setSelectedStipulation(stipulation);
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

    const renderActions = (item: ApplicationStipulation) => (
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
            <button
                onClick={() => handleDelete(item)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
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
                    title="Application Stipulations"
                    data={applicationStipulations}
                    columns={columns}
                    loading={loading}
                    error={error}
                    emptyMessage="No stipulations found"
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
                    renderExpandedContent={(item) => <ExpandedStipulationContent item={item} />}
                    onUpdate={handleRowUpdate}
                />
            </div>

            <CreateStipulationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onCreate={handleCreate}
                onUpdate={handleUpdate}
                stipulations={stipulations}
                isLoading={isModalLoading}
                mode={modalMode}
                initialData={selectedStipulation}
            />

            <DeleteModal
                isOpen={showDeleteModal}
                isLoading={isModalLoading}
                title="Delete Stipulation"
                message={`Are you sure you want to delete the stipulation "${stipulationToDelete?.stipulation_type?.name}"?`}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setStipulationToDelete(null);
                }}
            />
        </div>
    );
}
