import { env } from "@/config/env";
import apiClient from "@/lib/api/client";
import { Merchant } from "@/types/merchant";
import { Pagination } from "@/types/pagination";
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';

export const getMerchantById = async (id: string): Promise<Merchant> => {
    const endpoint = env.api.endpoints.merchant.getMerchantById.replace(':MerchantId', id);
    const result = await apiClient.get<ApiResponse<Merchant>>(endpoint);
    return result.data;
};

export const getMerchantList = async (): Promise<Merchant[]> => {
    const endpoint = env.api.endpoints.merchant.getMerchantList;
    const result = await apiClient.get<ApiListResponse<Merchant>>(endpoint);
    return result.data;
};

type GetMerchantsParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    include_inactive?: boolean;
    search?: string;
};

export const getMerchants = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    include_inactive = true,
    search = "",
}: GetMerchantsParams): Promise<{ data: Merchant[], pagination: Pagination }> => {
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        include_inactive: String(include_inactive),
        search: search,
    });

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }

    const endpoint = `${env.api.endpoints.merchant.getMerchants}?${query.toString()}`;
    const result = await apiClient.get<ApiPaginatedResponse<Merchant>>(endpoint);
    return {
        data: result.data.docs,
        pagination: result.data.pagination,
    };
};

export const createMerchant = async (merchant: Partial<Merchant>): Promise<Merchant> => {
    const endpoint = env.api.endpoints.merchant.getMerchants;
    const result = await apiClient.post<ApiResponse<Merchant>>(endpoint, merchant);
    return result.data;
}; 