import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Pagination } from '@/types/pagination';
import { FunderMerchant } from '@/types/merchantFunder';
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';

// --- CRUD Functions ---

/**
 * Add a Funder Merchant
 */
export const addFunderMerchant = async (
    funder: string,
    merchant: string,
    assigned_manager: string,
    assigned_user: string
): Promise<FunderMerchant> => {
    const body: Record<string, string> = {};
    if (funder) body.funder = funder;
    if (merchant) body.merchant = merchant;
    if (assigned_manager) body.assigned_manager = assigned_manager;
    if (assigned_user) body.assigned_user = assigned_user;
    const endpoint = env.api.endpoints.merchantFunder.addMerchantFunder;
    const result = await apiClient.post<ApiResponse<FunderMerchant>>(endpoint, body);
    return result.data;
};

/**
 * Update a Funder Merchant
 */
export const updateFunderMerchant = async (
    merchantFunderId: string,
    data: Partial<FunderMerchant>
): Promise<FunderMerchant> => {
    const endpoint = env.api.endpoints.merchantFunder.updateMerchantFunder.replace(':merchantFunderId', merchantFunderId);
    const result = await apiClient.put<ApiResponse<FunderMerchant>>(endpoint, data);
    return result.data;
};

/**
 * Delete a Funder Merchant
 */
export const deleteFunderMerchant = async (merchantFunder_id: string): Promise<FunderMerchant> => {
    if (!merchantFunder_id) {
        throw new Error('Funder Merchant ID is required');
    }
    const endpoint = env.api.endpoints.merchantFunder.deleteMerchantFunder.replace(':merchantFunderId', merchantFunder_id);
    const result = await apiClient.delete<ApiResponse<FunderMerchant>>(endpoint);
    return result.data;
};

/**
 * Get a Funder Merchant by ID
 */
export const getFunderMerchantById = async (merchantFunder_id: string): Promise<FunderMerchant> => {
    if (!merchantFunder_id) {
        throw new Error('Funder Merchant ID is required');
    }
    const endpoint = env.api.endpoints.merchantFunder.getMerchantFunderById.replace(':merchantFunderId', merchantFunder_id);
    const result = await apiClient.get<ApiResponse<FunderMerchant>>(endpoint);
    return result.data;
};

// --- Paginated List Function ---

export const getMerchantFunders = async (params: {
  page?: number;
  limit?: number;
  include_inactive?: boolean;
  merchant?: string;
  funder?: string;
}): Promise<{ data: FunderMerchant[]; pagination: Pagination }> => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.include_inactive !== undefined) query.append('include_inactive', String(params.include_inactive));
  if (params.merchant) query.append('merchant', params.merchant);
  if (params.funder) query.append('funder', params.funder);

  const endpoint = `${env.api.endpoints.merchantFunder.getMerchantFunders}?${query.toString()}`;
  const result = await apiClient.get<ApiPaginatedResponse<FunderMerchant>>(endpoint);

  return {
    data: result.data.docs,
    pagination: result.data.pagination,
  };
};

/**
 * Get a list of Funder Merchants
 */
export const getFunderMerchantList = async (params: { funder?: string; merchant?: string }): Promise<FunderMerchant[]> => {
    const query = new URLSearchParams();
    if (params.funder) query.append('funder', params.funder);
    if (params.merchant) query.append('merchant', params.merchant);
    const endpoint = `${env.api.endpoints.merchantFunder.getMerchantFunderList}?${query.toString()}`;
    const result = await apiClient.get<ApiListResponse<FunderMerchant>>(endpoint);
    return result.data;
};

export const createMerchantFunder = async (payload: {
  merchant: string;
  funder: string;
  assigned_manager?: string;
  assigned_user?: string;
}): Promise<FunderMerchant> => {
  const endpoint = env.api.endpoints.merchantFunder.getMerchantFunders; // Re-use the base endpoint
  const result = await apiClient.post<ApiResponse<FunderMerchant>>(endpoint, payload);
  return result.data;
};