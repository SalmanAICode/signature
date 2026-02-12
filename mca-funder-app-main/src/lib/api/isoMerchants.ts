import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Pagination } from '@/types/pagination';
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';
import { Merchant } from '@/types/merchant';
import { ISO } from '@/types/iso';
import { IsoMerchant } from '@/types/isoMerchant';

/**
 * Get a list of ISO Merchants
 * @param iso_id - The ID of the ISO
 * @param merchant_id - The ID of the merchant
 * @returns A list of ISO Merchants
 */
export const getISOMerchantList = async (iso_id: string, merchant_id: string): Promise<IsoMerchant[]> => {
    const query = new URLSearchParams();

    if (iso_id) query.append('iso', iso_id);
    if (merchant_id) query.append('merchant', merchant_id);

    const endpoint = `${env.api.endpoints.isoMerchant.getISOMerchantList}?${query.toString()}`;
    const result = await apiClient.get<ApiListResponse<IsoMerchant>>(endpoint);
    return result.data;
};

/**
 * Add an ISO Merchant
 * @param iso_id - The ID of the ISO
 * @param merchant_id - The ID of the merchant
 * @param commission_formula_id - The ID of the commission formula
 * @returns The added ISO Merchant
 */
export const addISOMerchant = async (
    iso_id: string,
    merchant_id: string,
    commission_formula_id?: string
): Promise<IsoMerchant> => {
    const body: Record<string, string> = {};

    if (iso_id) body.iso = iso_id;
    if (merchant_id) body.merchant = merchant_id;
    if (commission_formula_id) body.commission_formula = commission_formula_id;

    const endpoint = env.api.endpoints.isoMerchant.addISOMerchant;
    const result = await apiClient.post<ApiResponse<IsoMerchant>>(endpoint, body);
    return result.data;
};

/**
 * Delete an ISO Merchant
 * @param isoMerchant_id - The ID of the ISO Merchant
 * @returns The deleted ISO Merchant
 */
export const deleteISOMerchant = async (isoMerchant_id: string): Promise<IsoMerchant> => {
    if (!isoMerchant_id) {
        throw new Error('ISO Merchant ID is required');
    }   

    const endpoint = env.api.endpoints.isoMerchant.deleteISOMerchant.replace(':isoMerchantId', isoMerchant_id);
    const result = await apiClient.delete<ApiResponse<IsoMerchant>>(endpoint);
    return result.data;
};

/**
 * Get an ISO Merchant by ID
 * @param isoMerchant_id - The ID of the ISO Merchant
 * @returns The ISO Merchant
 */
export const getISOMerchantById = async (isoMerchant_id: string): Promise<IsoMerchant> => {
    if (!isoMerchant_id) {
        throw new Error('ISO Merchant ID is required');
    }   

    const endpoint = env.api.endpoints.isoMerchant.getISOMerchantById.replace(':isoMerchantId', isoMerchant_id);
    const result = await apiClient.get<ApiResponse<IsoMerchant>>(endpoint);
    return result.data;
};

type GetISOMerchantParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    include_inactive?: boolean;
    iso_id: string;
    search?: string;
};

export const getISOMerchants = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    include_inactive = true,
    iso_id = "",
    search = "",
}: GetISOMerchantParams): Promise<{ data: IsoMerchant[], pagination: Pagination }> => {
    if (!iso_id) {
        throw new Error('ISO ID is required');
    }

    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        include_inactive: String(include_inactive),
    });

    // Only add search parameter if it's not empty
    if (search && search.trim() !== '') {
        query.append('search', search);
    }

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }

    const endpoint = `${env.api.endpoints.isoMerchant.getISOMerchants}?${query.toString()}`;
    const result = await apiClient.get<ApiPaginatedResponse<IsoMerchant>>(endpoint);
    return {
        data: result.data.docs,
        pagination: result.data.pagination,
    };
};

export const getISOMerchantsData = async (): Promise<{ iso: ISO; merchant: Merchant }[]> => {
    const result = await apiClient.get<{ success: boolean; data: { docs: { iso: ISO; merchant: Merchant }[] } }>(
      '/iso-merchants',
      true
    );
    return result.data.docs;
};

// Get paginated list
export async function getIsoMerchants(params: {
  page?: number;
  limit?: number;
  iso?: string;
  merchant?: string;
  include_inactive?: boolean;
}): Promise<{ data: IsoMerchant[]; pagination: Pagination }> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.include_inactive !== undefined) query.append('include_inactive', String(params.include_inactive));
  if (params.iso) query.append('iso', params.iso);
  if (params.merchant) query.append('merchant', params.merchant);

  const endpoint = `${env.api.endpoints.isoMerchant.getISOMerchants}?${query.toString()}`;
  const result = await apiClient.get<ApiPaginatedResponse<IsoMerchant>>(endpoint);
  
  return {
    data: result.data.docs,
    pagination: result.data.pagination,
  };
}

// Get by ID
export async function getIsoMerchantById(id: string): Promise<IsoMerchant> {
  const result = await apiClient.get<ApiResponse<IsoMerchant>>(`/iso-merchants/${id}`);
  return result.data;
}

// Create
export async function createIsoMerchant(payload: {
  iso: string;
  merchant: string;
  commission_formula?: string;
}): Promise<IsoMerchant> {
  const result = await apiClient.post<ApiResponse<IsoMerchant>>('/iso-merchants', payload);
  return result.data;
}

// Update
export async function updateIsoMerchant(id: string, payload: Partial<IsoMerchant>): Promise<IsoMerchant> {
  const result = await apiClient.put<ApiResponse<IsoMerchant>>(`/iso-merchants/${id}`, payload);
  return result.data;
}

// Delete
export async function deleteIsoMerchant(id: string): Promise<void> {
  await apiClient.delete(`/iso-merchants/${id}`);
}
