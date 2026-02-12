import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Lender } from '@/types/lender';
import { ApiResponse, ApiListResponse, ApiPaginatedResponse } from '@/types/api';
import { Pagination } from '@/types/pagination';

/**
 * Get lenders assigned to a specific user
 * @param userId - The ID of the user
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param search - Search query (optional)
 * @param sortBy - Sort field (optional)
 * @param sortOrder - Sort order (optional)
 * @returns The list of lenders assigned to the user with pagination
 */
export const getUserLenders = async (
    userId: string, 
    page: number = 1, 
    limit: number = 10, 
    search?: string, 
    sortBy?: string, 
    sortOrder?: 'asc' | 'desc' | null
): Promise<{ data: Lender[], pagination: Pagination }> => {
    const endpoint = env.api.endpoints.user.getUserLenders.replace(':userId', userId);
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (search) {
        params.append('search', search);
    }
    
    if (sortBy && sortOrder) {
        params.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }
    
    const url = `${endpoint}?${params.toString()}`;
    const response = await apiClient.get<ApiPaginatedResponse<Lender>>(url);
    
    return {
        data: response.data.docs,
        pagination: response.data.pagination,
    };
};

/**
 * Get a list of lenders for a specific user (alternative endpoint)
 * @param userId - The ID of the user
 * @returns The list of lenders for the user
 */
export const getUserLenderList = async (userId: string): Promise<Lender[]> => {
    const endpoint = env.api.endpoints.user.getUserLenderList.replace(':userId', userId);
    const response = await apiClient.get<ApiListResponse<Lender>>(endpoint);
    return response.data;
};

/**
 * Add a lender to a user
 * @param userId - The ID of the user
 * @param lenderId - The ID of the lender to add
 * @returns The updated lender or confirmation
 */
export const addUserLender = async (userId: string, lenderId: string): Promise<Lender> => {
    const endpoint = env.api.endpoints.user.addUserLender.replace(':userId', userId);
    const response = await apiClient.post<ApiResponse<Lender>>(endpoint, { lender: lenderId });
    return response.data;
};

/**
 * Remove a lender from a user
 * @param userId - The ID of the user
 * @param lenderId - The ID of the lender to remove
 * @returns Confirmation of removal
 */
export const removeUserLender = async (userId: string, lenderId: string): Promise<void> => {
    const endpoint = env.api.endpoints.user.removeUserLender
        .replace(':userId', userId)
        .replace(':lenderId', lenderId);
    await apiClient.delete<ApiResponse<void>>(endpoint);
};
