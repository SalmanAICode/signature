import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Pagination } from '@/types/pagination';
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';
import { Funder } from '@/types/funder';
import { ISO } from '@/types/iso';
import { IsoFunder, PaginatedIsoFunderResponse } from '@/types/isoFunder';

/**
 * Get a list of Funder ISOs
 * @param funder_id - The ID of the funder
 * @param iso_id - The ID of the ISO
 * @returns A list of Funder ISOs
 */
export const getFunderISOList = async (funder_id: string, iso_id: string): Promise<IsoFunder[]> => {
    const query = new URLSearchParams();

    if (funder_id) query.append('funder', funder_id);
    if (iso_id) query.append('iso', iso_id);

    const endpoint = `${env.api.endpoints.isoFunder.getISOFunderList}?${query.toString()}`;
    const result = await apiClient.get<ApiListResponse<IsoFunder>>(endpoint);
    return result.data;
};

/**
 * Add a Funder ISO
 * @param funder_id - The ID of the funder
 * @param iso_id - The ID of the ISO
 * @param commission_formula_id - The ID of the commission formula
 * @returns The added Funder ISO
 */
export const addFunderISO = async (
    funder_id: string,
    iso_id: string,
    commission_formula_id: string
): Promise<IsoFunder> => {
    const body: Record<string, string> = {};

    if (funder_id) body.funder = funder_id;
    if (iso_id) body.iso = iso_id;
    if (commission_formula_id) body.commission_formula = commission_formula_id;

    const endpoint = env.api.endpoints.isoFunder.addISOFunder;
    const result = await apiClient.post<ApiResponse<IsoFunder>>(endpoint, body);
    return result.data;
};

/**
 * Delete a Funder ISO
 * @param isoFunder_id - The ID of the Funder ISO
 * @returns The deleted Funder ISO
 */
export const deleteFunderISO = async (isoFunder_id: string): Promise<IsoFunder> => {
    if (!isoFunder_id) {
        throw new Error('Funder ISO ID is required');
    }   

    const endpoint = env.api.endpoints.isoFunder.deleteISOFunder.replace(':isoFunderId', isoFunder_id);
    const result = await apiClient.delete<ApiResponse<IsoFunder>>(endpoint);
    return result.data;
};

/**
 * Get a Funder ISO by ID
 * @param isoFunder_id - The ID of the Funder ISO
 * @returns The Funder ISO
 */
export const getFunderISOById = async (isoFunder_id: string): Promise<IsoFunder> => {
    if (!isoFunder_id) {
        throw new Error('Funder ISO ID is required');
    }   

    const endpoint = env.api.endpoints.isoFunder.getISOFunderById.replace(':isoFunderId', isoFunder_id);
    const result = await apiClient.get<ApiResponse<IsoFunder>>(endpoint);
    return result.data;
};

type GetFunderISOParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    include_inactive?: boolean;
    funder_id: string;
    search?: string;
};

export const getFunderISOs = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    include_inactive = true,
    funder_id = "",
    search = "",
}: GetFunderISOParams): Promise<{ data: IsoFunder[], pagination: Pagination }> => {
    if (!funder_id) {
        throw new Error('Funder ID is required');
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

    const endpoint = `${env.api.endpoints.isoFunder.getISOFunders}?${query.toString()}`;
    const result = await apiClient.get<ApiPaginatedResponse<IsoFunder>>(endpoint);
    return {
        data: result.data.docs,
        pagination: result.data.pagination,
    };
};

export const getISOFunders= async (): Promise<{ iso: ISO; funder: Funder }[]> => {
    const result = await apiClient.get<{ success: boolean; data: { docs: { iso: ISO; funder: Funder }[] } }>(
      '/iso-funders',
      true
    );
    return result.data.docs;
  };

// Get paginated list
export async function getIsoFunders(params: {
  page?: number;
  limit?: number;
  iso?: string;
  funder?: string;
  include_inactive?: boolean;
}): Promise<{ data: IsoFunder[]; pagination: PaginatedIsoFunderResponse['pagination'] }> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.include_inactive !== undefined) query.append('include_inactive', String(params.include_inactive));
  if (params.iso) query.append('iso', params.iso);
  if (params.funder) query.append('funder', params.funder);

  const endpoint = `${env.api.endpoints.isoFunder.getISOFunders}?${query.toString()}`;
  const result = await apiClient.get<ApiPaginatedResponse<IsoFunder>>(endpoint);
  
  return {
    data: result.data.docs,
    pagination: result.data.pagination,
  };
}

// Get by ID
export async function getIsoFunderById(id: string): Promise<IsoFunder> {
  const result = await apiClient.get<ApiResponse<IsoFunder>>(`/iso-funders/${id}`);
  return result.data;
}

// Create
export async function createIsoFunder(payload: {
  iso: string;
  funder: string;
  commission_formula?: string;
}): Promise<IsoFunder> {
  const result = await apiClient.post<ApiResponse<IsoFunder>>('/iso-funders', payload);
  return result.data;
}

// Update
export async function updateIsoFunder(id: string, payload: Partial<IsoFunder>): Promise<IsoFunder> {
  const result = await apiClient.put<ApiResponse<IsoFunder>>(`/iso-funders/${id}`, payload);
  return result.data;
}

// Delete
export async function deleteIsoFunder(id: string): Promise<void> {
  await apiClient.delete(`/iso-funders/${id}`);
}