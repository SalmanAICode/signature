import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Commission, GetCommissionParams, CreateCommissionParams, UpdateCommissionParams } from '@/types/commission';
import { ApiResponse, ApiPaginatedResponse } from '@/types/api';
import { Pagination } from '@/types/pagination';

/**
 * Get a commission by ID
 * @param id - The ID of the commission
 * @returns The commission
 */
export const getCommissionById = async (id: string): Promise<Commission> => {
  const endpoint = `/commissions/${id}`;
  const result = await apiClient.get<ApiResponse<Commission>>(endpoint);
  return result.data;
};

/**
 * Get a list of commissions
 * @param params - The parameters for the request
 * @returns The list of commissions with pagination
 */
export const getCommissions = async ({
  sortBy,
  sortOrder,
  page = 1,
  limit = 10,
  include_inactive = true,
  commission_intent,
  status,
}: GetCommissionParams = {}): Promise<{ data: Commission[]; pagination: Pagination }> => {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    include_inactive: String(include_inactive),
  });

  if (sortBy && sortOrder) {
    query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
  }

  if (commission_intent && commission_intent.trim() !== '') {
    query.append('commission_intent', commission_intent);
  }

  if (status && status.trim() !== '') {
    query.append('status', status);
  }

  const endpoint = `/commissions?${query.toString()}`;
  const result = await apiClient.get<ApiPaginatedResponse<Commission>>(endpoint);
  return {
    data: result.data.docs,
    pagination: result.data.pagination,
  };
};

/**
 * Get commissions by commission intent ID
 * @param commissionIntentId - The ID of the commission intent
 * @returns The list of commissions with pagination
 */
export const getCommissionsByCommissionIntent = async (commissionIntentId: string): Promise<{ data: Commission[]; pagination: Pagination }> => {
  const endpoint = `/commission-intents/${commissionIntentId}/commissions`;
  const result = await apiClient.get<ApiPaginatedResponse<Commission>>(endpoint);
  return {
    data: result.data.docs,
    pagination: result.data.pagination,
  };
};

/**
 * Create a commission
 * @param commission_intent_id - The ID of the commission intent
 * @param data - The commission data
 * @returns The created commission
 */
export const createCommission = async (commission_intent_id: string, data: Omit<CreateCommissionParams, 'commission_intent'>): Promise<Commission> => {
  const endpoint = `/commission-intents/${commission_intent_id}/commissions`;
  const result = await apiClient.post<ApiResponse<Commission>>(endpoint, data);
  return result.data;
};

/**
 * Update a commission
 * @param commission_intent_id - The ID of the commission intent
 * @param commission_id - The ID of the commission to update
 * @param data - The commission data to update
 * @returns The updated commission
 */
export const updateCommission = async (
  commission_intent_id: string,
  commission_id: string,
  data: UpdateCommissionParams
): Promise<Commission> => {
  const endpoint = `/commission-intents/${commission_intent_id}/commissions/${commission_id}`;
  const result = await apiClient.put<ApiResponse<Commission>>(endpoint, data);
  return result.data;
};

/**
 * Delete a commission
 * @param id - The ID of the commission to delete
 */
export const deleteCommission = async (id: string): Promise<void> => {
  const endpoint = `/commissions/${id}`;
  await apiClient.delete<ApiResponse<void>>(endpoint);
};
