import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Pagination } from '@/types/pagination';
import { Lender } from '@/types/lender';
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';

/**
 * Helper function to clean lender data by removing empty fields
 */
const cleanLenderData = (data: Partial<Lender>): Partial<Lender> => {
  const cleaned: any = {};
  
  // Clean top-level fields
  Object.keys(data).forEach(key => {
    const value = (data as any)[key];
    
    // Special handling for user_list - don't include if empty
    if (key === 'user_list') {
      if (Array.isArray(value) && value.length > 0) {
        cleaned[key] = value;
      }
      return; // Skip further processing for user_list
    }
    
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Handle nested objects like business_detail and address_detail
        const cleanedNested = cleanLenderData(value);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    }
  });
  
  return cleaned;
};

/**
 * Get a lender by ID
 * @param id - The ID of the lender
 * @returns The lender
 */
export const getLenderById = async (id: string): Promise<Lender> => {
    const endpoint = env.api.endpoints.lender.getLenderById.replace(':lenderId', id);
    const response = await apiClient.get<ApiResponse<Lender>>(endpoint);
    return response.data;
};

/**
 * Get a list of all lenders
 * @returns The list of all lenders
 */
export const getLenderList = async (): Promise<Lender[]> => {
    const endpoint = env.api.endpoints.lender.getLenderList;
    const response = await apiClient.get<ApiListResponse<Lender>>(endpoint);
    return response.data;
};

/**
 * Get a list of lenders with pagination
 * @param params - The parameters for the request (sortBy, sortOrder, page, limit, search)
 * @returns The list of lenders and pagination info
 */
export const getLenders = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    search,
    include_inactive = false,
}: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    search?: string;
    include_inactive?: boolean;
} = {}): Promise<{ data: Lender[], pagination: Pagination }> => {
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        include_inactive: String(include_inactive),
    });

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }

    if (search && search.trim() !== '') {
        query.append('search', search);
    }

    const response = await apiClient.get<ApiPaginatedResponse<Lender>>(
        `${env.api.endpoints.lender.getLenders}?${query.toString()}`
    );

    return {
        data: response.data.docs,
        pagination: response.data.pagination,
    };
};

/**
 * Create a lender
 * @param lender - The lender to create (Partial<Lender> or required fields only)
 * @returns The created lender
 */
export const createLender = async (lender: Partial<Lender>): Promise<Lender> => {
    const cleanedData = cleanLenderData(lender);
    const response = await apiClient.post<ApiResponse<Lender>>(
        env.api.endpoints.lender.createLender,
        cleanedData
    );
    return response.data;
};

/**
 * Update a lender
 * @param lenderId - The ID of the lender
 * @param params - The updated lender data (Partial<Lender>)
 * @returns The updated lender
 */
export const updateLender = async (lenderId: string, params: Partial<Lender>): Promise<Lender> => {
    const cleanedData = cleanLenderData(params);
    const endpoint = env.api.endpoints.lender.updateLender.replace(':lenderId', lenderId);
    const response = await apiClient.put<ApiResponse<Lender>>(endpoint, cleanedData);
    return response.data;
};

/**
 * Delete a lender
 * @param id - The ID of the lender
 */
export const deleteLender = async (id: string): Promise<Lender> => {
    const endpoint = env.api.endpoints.lender.deleteLender.replace(':lenderId', id);
    const response = await apiClient.delete<ApiResponse<Lender>>(endpoint);
    return response.data;
};
