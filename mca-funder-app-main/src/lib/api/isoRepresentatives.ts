import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Pagination } from '@/types/pagination';
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';
import { Representative } from '@/types/representative';
import { ISO } from '@/types/iso';

/**
 * Get a list of ISO Representatives
 * @param iso_id - The ID of the ISO
 * @param representative_id - The ID of the representative
 * @returns A list of ISO Representatives
 */
export const getISORepresentativeList = async (iso_id: string, representative_id?: string): Promise<Representative[]> => {
    const query = new URLSearchParams();
    const endpoint = env.api.endpoints.isoRepresentative.getISORepresentativeList.replace(':isoId', iso_id);
    const result = await apiClient.get<ApiListResponse<Representative>>(`${endpoint}?${query.toString()}`);
    return result.data;
};

/**
 * Add an ISO Representative
 * @param iso_id - The ID of the ISO
 * @param representative_id - The ID of the representative
 * @returns The added ISO Representative
 */
export const addISORepresentative = async (
    iso_id: string,
    representative_id: string
): Promise<Representative> => {
    const body: Record<string, string> = {};

    if (representative_id) body.representative = representative_id;

    const endpoint = env.api.endpoints.isoRepresentative.addISORepresentative.replace(':isoId', iso_id);
    const result = await apiClient.post<ApiResponse<Representative>>(endpoint, body);
    return result.data;
};

/**
 * Delete an ISO Representative
 * @param iso_id - The ID of the ISO
 * @param representative_id - The ID of the representative
 * @returns The deleted ISO Representative
 */
export const deleteISORepresentative = async (iso_id: string, representative_id: string): Promise<Representative> => {
    if (!iso_id) {
        throw new Error('ISO ID is required');
    }
    if (!representative_id) {
        throw new Error('Representative ID is required');
    }   

    const endpoint = env.api.endpoints.isoRepresentative.deleteISORepresentative
        .replace(':isoId', iso_id)
        .replace(':isoRepresentativeId', representative_id);
    const result = await apiClient.delete<ApiResponse<Representative>>(endpoint);
    return result.data;
};

type GetISORepresentativeParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    include_inactive?: boolean;
    iso_id: string;
    search?: string;
};

export const getISORepresentatives = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    include_inactive = true,
    iso_id = "",
    search = "",
}: GetISORepresentativeParams): Promise<{ data: Representative[], pagination: Pagination }> => {
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

    const endpoint = env.api.endpoints.isoRepresentative.getISORepresentatives.replace(':isoId', iso_id);
    const result = await apiClient.get<ApiPaginatedResponse<Representative>>(`${endpoint}?${query.toString()}`);
    return {
        data: result.data.docs,
        pagination: result.data.pagination,
    };
};

export const getISORepresentativesData = async (): Promise<{ iso: ISO; representative: Representative }[]> => {
    const result = await apiClient.get<{ success: boolean; data: { docs: { iso: ISO; representative: Representative }[] } }>(
      '/iso-representatives',
      true
    );
    return result.data.docs;
};

// Get paginated list
export async function getIsoRepresentatives(params: {
  page?: number;
  limit?: number;
  iso?: string;
  representative?: string;
  include_inactive?: boolean;
}): Promise<{ data: Representative[]; pagination: Pagination }> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.include_inactive !== undefined) query.append('include_inactive', String(params.include_inactive));
  if (params.iso) query.append('iso', params.iso);

  const endpoint = `${env.api.endpoints.isoRepresentative.getISORepresentatives}?${query.toString()}`;
  const result = await apiClient.get<ApiPaginatedResponse<Representative>>(endpoint);
  
  return {
    data: result.data.docs,
    pagination: result.data.pagination,
  };
}

// Create
export async function createIsoRepresentative(iso_id: string, payload: {
  representative: string;
}): Promise<Representative> {
  const endpoint = env.api.endpoints.isoRepresentative.addISORepresentative.replace(':isoId', iso_id);
  const result = await apiClient.post<ApiResponse<Representative>>(endpoint, payload);
  return result.data;
}

// Delete
export async function deleteIsoRepresentative(iso_id: string, representative_id: string): Promise<void> {
  const endpoint = env.api.endpoints.isoRepresentative.deleteISORepresentative
    .replace(':isoId', iso_id)
    .replace(':isoRepresentativeId', representative_id);
  await apiClient.delete(endpoint);
}
