import { env } from "@/config/env";
import apiClient from "@/lib/api/client";
import { Funder, FunderResponse, CreateFunderData, UpdateFunderData, FunderAccountsResponse, FunderAccount } from '@/types/funder';
import { Pagination } from "@/types/pagination";
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';
import useAuthStore from '@/lib/store/auth';

interface FunderFilters {
    includeInactive?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
}

export const getFunderById = async (id: string): Promise<Funder> => {
    const endpoint = env.api.endpoints.funder.getFunderById.replace(':funderId', id);
    const result = await apiClient.get<ApiResponse<Funder>>(endpoint);
    return result.data;
};

export const getFunderList = async (): Promise<Funder[]> => { 
    const endpoint = env.api.endpoints.funder.getFunderList;
    const result = await apiClient.get<ApiListResponse<Funder>>(endpoint);
    return result.data;
};

type GetFunderParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    include_inactive?: boolean;
    search?: string;
};

export const getFunders = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    include_inactive = true,
    search = "",
}: GetFunderParams): Promise<{ data: Funder[], pagination: Pagination }> => {
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        include_inactive: String(include_inactive),
        search: search,
    });

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }

    const endpoint = `${env.api.endpoints.funder.getFunders}?${query.toString()}`;
    const result = await apiClient.get<ApiPaginatedResponse<Funder>>(endpoint);
    return {
        data: result.data.docs,
        pagination: result.data.pagination,
    };
};

// Legacy getFunders function to maintain compatibility
export async function getFundersLegacy(page: number = 1, limit: number = 10, filters?: FunderFilters): Promise<FunderResponse> {
    try {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            include_inactive: (filters?.includeInactive ?? false).toString()
        });
        
        if (filters?.search) {
            queryParams.append('search', filters.search);
        }
        if (filters?.sortBy && filters?.sortOrder) {
            queryParams.append('sort', `${filters.sortOrder === 'desc' ? '-' : ''}${filters.sortBy}`);
        }
        
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
            throw new Error('No authentication token available');
        }
        
        const response = await apiClient.get<ApiResponse<{ 
            docs: Funder[],
            pagination: {
                page: number;
                limit: number;
                totalPages: number;
                totalResults: number;
            }
        }>>(`/funders?${queryParams.toString()}`, true, accessToken);
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to fetch funders');
        }
        
        return {
            success: true,
            data: {
                docs: response.data.docs,
                pagination: response.data.pagination
            }
        };
    } catch (error) {
        throw error;
    }
}

export async function createFunder(funderData: CreateFunderData): Promise<ApiResponse<Funder>> {
    try {
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
            throw new Error('No authentication token available');
        }

        const response = await apiClient.post<ApiResponse<Funder>>('/funders', funderData, true, accessToken);
        return response;
    } catch (error) {
        throw error;
    }
}

export async function updateFunder(funderId: string, funderData: UpdateFunderData): Promise<ApiResponse<Funder>> {
    try {
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
            throw new Error('No authentication token available');
        }

        const response = await apiClient.put<ApiResponse<Funder>>(`/funders/${funderId}`, funderData, true, accessToken);
        return response;
    } catch (error) {
        throw error;
    }
}

export async function deleteFunder(funderId: string): Promise<ApiResponse<any>> {
    try {
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
            throw new Error('No authentication token available');
        }

        const response = await apiClient.delete<ApiResponse<any>>(`/funders/${funderId}`, true, accessToken);
        return response;
    } catch (error) {
        throw error;
    }
}

export async function getFunder(funderId: string): Promise<ApiResponse<Funder>> {
    try {
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
            throw new Error('No authentication token available');
        }

        const response = await apiClient.get<ApiResponse<Funder>>(`/funders/${funderId}`, true, accessToken);

        if (!response.success) {
            throw new Error(response.message || 'Failed to fetch funder');
        }

        return response;
    } catch (error) {
        throw error;
    }
}

export async function getFunderAccounts(funderId?: string, page: number = 1, limit: number = 10): Promise<FunderAccountsResponse> {
    try {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });
        
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
            throw new Error('No authentication token available');
        }
        
        const response = await apiClient.get<ApiResponse<{ 
            docs: FunderAccount[],
            pagination: {
                page: number;
                limit: number;
                totalPages: number;
                totalResults: number;
            }
        }>>(`/funder-accounts?${queryParams.toString()}`, true, accessToken);
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to fetch funder accounts');
        }
        
        return {
            success: true,
            data: {
                docs: response.data.docs,
                pagination: response.data.pagination
            }
        };
    } catch (error) {
        throw error;
    }
}