import { FunderAccount, FunderAccountsResponse } from '@/types/funder';
import apiClient from './client';
import useAuthStore from '@/lib/store/auth';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data: T;
}

export async function getFunderAccountsByFunderId(funderId: string, page: number = 1, limit: number = 100): Promise<FunderAccountsResponse> {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      funder: funderId,
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

// New function that doesn't require funder ID - funder is handled by access token
export async function getFunderAccounts(page: number = 1, limit: number = 100): Promise<FunderAccountsResponse> {
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