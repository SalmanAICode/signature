import { MerchantAccount } from '@/types/merchant';
import apiClient from './client';
import useAuthStore from '@/lib/store/auth';
import { env } from '@/config/env';
import { ApiResponse, ApiListResponse } from '@/types/api';

// Legacy function to maintain compatibility
export const getMerchantAccounts = async (merchantId: string): Promise<MerchantAccount[]> => {
    const endpoint = `${env.api.endpoints.merchant.getMerchantById.replace(':MerchantId', merchantId)}/accounts`;
    const result = await apiClient.get<ApiListResponse<MerchantAccount>>(endpoint);
    return result.data;
};

export async function getAllMerchantAccounts(page: number = 1, limit: number = 100) {
    try {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
            throw new Error('No authentication token available');
        }

        const response = await apiClient.get<ApiResponse<{
            docs: MerchantAccount[],
            pagination: {
                page: number;
                limit: number;
                totalPages: number;
                totalResults: number;
            }
        }>>(`/merchant-accounts?${queryParams.toString()}`, true, accessToken);

        if (!response.success) {
            throw new Error(response.message || 'Failed to fetch merchant accounts');
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

export async function getMerchantAccountsByMerchantId(merchantId: string, page: number = 1, limit: number = 100) {
    try {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            merchant: merchantId,
        });

        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
            throw new Error('No authentication token available');
        }

        const response = await apiClient.get<ApiResponse<{
            docs: MerchantAccount[],
            pagination: {
                page: number;
                limit: number;
                totalPages: number;
                totalResults: number;
            }
        }>>(`/merchant-accounts?${queryParams.toString()}`, true, accessToken);

        if (!response.success) {
            throw new Error(response.message || 'Failed to fetch merchant accounts');
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