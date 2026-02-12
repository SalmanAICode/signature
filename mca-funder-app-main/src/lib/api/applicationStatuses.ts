import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Pagination } from '@/types/pagination';
import { ApplicationStatus, CreateApplicationStatus, UpdateApplicationStatusData, UpdateApplicationStatus } from '@/types/applicationStatus';
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';

// Get application statuses with pagination and filtering
type GetApplicationStatusesParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    search?: string | null;
    funder?: string | null;
    include_inactive?: boolean;
};

export const getApplicationStatuses = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    search,
    funder,
    include_inactive = false,
}: GetApplicationStatusesParams = {}): Promise<{ data: ApplicationStatus[], pagination: Pagination }> => {
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        include_inactive: String(include_inactive),
    });

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }

    if (search && search.trim() !== '') {
        query.append('search', search);
    }

    if (funder && funder.trim() !== '') {
        query.append('funder', funder);
    }

    const endpoint = `${env.api.endpoints.applicationStatus.getApplicationStatuses}?${query.toString()}`;
    const result = await apiClient.get<ApiPaginatedResponse<ApplicationStatus>>(endpoint);
    return {
        data: result.data.docs,
        pagination: result.data.pagination,
    };
};

// Get application status list (all statuses without pagination)
export const getApplicationStatusList = async (funder?: string, include_inactive?: boolean): Promise<ApplicationStatus[]> => {
    const query = new URLSearchParams();
    
    if (funder && funder.trim() !== '') {
        query.append('funder', funder);
    }

    if (include_inactive !== undefined) {
        query.append('include_inactive', String(include_inactive));
    }

    const endpoint = `${env.api.endpoints.applicationStatus.getApplicationStatusList}${query.toString() ? `?${query.toString()}` : ''}`;
    const result = await apiClient.get<ApiListResponse<ApplicationStatus>>(endpoint);
    return result.data;
};

// Get application status by ID
export const getApplicationStatusById = async (statusId: string): Promise<ApplicationStatus> => {
    const endpoint = env.api.endpoints.applicationStatus.getApplicationStatusById.replace(':statusId', statusId);
    const result = await apiClient.get<ApiResponse<ApplicationStatus>>(endpoint);
    return result.data;
};

// Create application status
export const createApplicationStatus = async (statusData: CreateApplicationStatus): Promise<ApplicationStatus> => {
    const endpoint = env.api.endpoints.applicationStatus.createApplicationStatus;
    const result = await apiClient.post<ApiResponse<ApplicationStatus>>(endpoint, statusData);
    return result.data;
};

// Update application status
export const updateApplicationStatus = async (statusId: string, statusData: UpdateApplicationStatusData): Promise<ApplicationStatus> => {
    const endpoint = env.api.endpoints.applicationStatus.updateApplicationStatus.replace(':statusId', statusId);
    const result = await apiClient.put<ApiResponse<ApplicationStatus>>(endpoint, statusData);
    return result.data;
};

// Delete application status
export const deleteApplicationStatus = async (statusId: string): Promise<void> => {
    const endpoint = env.api.endpoints.applicationStatus.deleteApplicationStatus.replace(':statusId', statusId);
    await apiClient.delete<ApiResponse<void>>(endpoint);
};

// Utility function to get status by name
export const getApplicationStatusByName = async (name: string, funder?: string): Promise<ApplicationStatus | null> => {
    try {
        const statuses = await getApplicationStatusList(funder);
        return statuses.find(status => status.name.toLowerCase() === name.toLowerCase()) || null;
    } catch (error) {
        console.error('Error fetching status by name:', error);
        return null;
    }
};

// Utility function to get initial status for a funder
export const getInitialApplicationStatus = async (funder: string): Promise<ApplicationStatus | null> => {
    try {
        const statuses = await getApplicationStatusList(funder);
        return statuses.find(status => status.initial === true) || null;
    } catch (error) {
        console.error('Error fetching initial status:', error);
        return null;
    }
};

// Update application status order
export const updateApplicationStatusOrder = async (orderData: UpdateApplicationStatus): Promise<ApplicationStatus[]> => {
    const endpoint = env.api.endpoints.applicationStatus.getApplicationStatuses;
    const result = await apiClient.put<ApiResponse<ApplicationStatus[]>>(endpoint, orderData);
    return result.data;
}; 