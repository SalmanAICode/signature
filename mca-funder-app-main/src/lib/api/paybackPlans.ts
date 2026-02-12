import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { PaybackPlan, PaybackPlanCreatePayload } from '@/types/paybackPlan';
import { Pagination } from '@/types/pagination';
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';
import useAuthStore from '@/lib/store/auth';

interface PaybackPlanFilters {
    funding?: string;
    merchant?: string;
    funder?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
}

export const getPaybackPlanById = async (id: string): Promise<PaybackPlan> => {
    const endpoint = `/payback-plans/${id}`;
    const result = await apiClient.get<ApiResponse<PaybackPlan>>(endpoint);
    return result.data;
};

export const getPaybackPlanList = async (): Promise<PaybackPlan[]> => { 
    const endpoint = '/payback-plans';
    const result = await apiClient.get<ApiListResponse<PaybackPlan>>(endpoint);
    return result.data;
};

type GetPaybackPlansParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    funding?: string;
    merchant?: string;
    funder?: string;
    status?: string;
    search?: string;
};

export const getPaybackPlans = async ({
    sortBy,
    sortOrder,
    page,
    limit,
    funding,
    merchant,
    funder,
    status,
    search,
}: GetPaybackPlansParams): Promise<{ data: PaybackPlan[], pagination: Pagination }> => {
    const params: Record<string, string> = {};

    if (page) params.page = String(page);
    if (limit) params.limit = String(limit);
    if (search) params.search = search;
    if (funding) params.funding = funding;
    if (merchant) params.merchant = merchant;
    if (funder) params.funder = funder;
    if (status) params.status = status;

    if (sortBy && sortOrder) {
        params.sort = `${sortOrder === 'desc' ? '-' : ''}${sortBy}`;
    }

    const query = new URLSearchParams(params);
    const endpoint = `/payback-plans?${query.toString()}`;
    const result = await apiClient.get<ApiPaginatedResponse<PaybackPlan>>(endpoint);
    return {
        data: result.data.docs,
        pagination: result.data.pagination,
    };
};

// Legacy getPaybackPlans function to maintain compatibility
export async function getPaybackPlansLegacy(fundingId: string, page: number = 1, limit: number = 10, filters?: PaybackPlanFilters): Promise<{ success: boolean; data: { docs: PaybackPlan[]; pagination: any } }> {
    try {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        
        if (fundingId) {
            queryParams.append('funding', fundingId);
        }
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
            docs: PaybackPlan[],
            pagination: {
                page: number;
                limit: number;
                totalPages: number;
                totalResults: number;
            }
        }>>(`/payback-plans?${queryParams.toString()}`, true, accessToken);
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to fetch payback plans');
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

export async function createPaybackPlan(paybackPlanData: PaybackPlanCreatePayload): Promise<ApiResponse<PaybackPlan>> {
    try {
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
            throw new Error('No authentication token available');
        }

        const response = await apiClient.post<ApiResponse<PaybackPlan>>('/payback-plans', paybackPlanData, true, accessToken);
        return response;
    } catch (error) {
        throw error;
    }
}

export async function updatePaybackPlan(paybackPlanId: string, paybackPlanData: Partial<PaybackPlanCreatePayload>): Promise<ApiResponse<PaybackPlan>> {
    try {
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
            throw new Error('No authentication token available');
        }

        const response = await apiClient.put<ApiResponse<PaybackPlan>>(`/payback-plans/${paybackPlanId}`, paybackPlanData, true, accessToken);
        return response;
    } catch (error) {
        throw error;
    }
}

export async function deletePaybackPlan(paybackPlanId: string): Promise<ApiResponse<any>> {
    try {
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
            throw new Error('No authentication token available');
        }

        const response = await apiClient.delete<ApiResponse<any>>(`/payback-plans/${paybackPlanId}`, true, accessToken);
        return response;
    } catch (error) {
        throw error;
    }
}

export async function getPaybackPlan(paybackPlanId: string): Promise<ApiResponse<PaybackPlan>> {
    try {
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
            throw new Error('No authentication token available');
        }

        const response = await apiClient.get<ApiResponse<PaybackPlan>>(`/payback-plans/${paybackPlanId}`, true, accessToken);

        if (!response.success) {
            throw new Error(response.message || 'Failed to fetch payback plan');
        }

        return response;
    } catch (error) {
        throw error;
    }
}

export async function generatePaybacks(paybackPlanId: string): Promise<ApiResponse<any>> {
    try {
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
            throw new Error('No authentication token available');
        }

        const response = await apiClient.post<ApiResponse<any>>(`/payback-plans/${paybackPlanId}/generate-paybacks`, {}, true, accessToken);
        return response;
    } catch (error) {
        throw error;
    }
}
