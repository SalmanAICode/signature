import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Funder } from '@/types/funder';
import { ApiResponse, ApiListResponse, ApiPaginatedResponse } from '@/types/api';
import { Pagination } from '@/types/pagination';

/**
 * Get funders assigned to a specific user
 * @param userId - The ID of the user
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param search - Search query (optional)
 * @param sortBy - Sort field (optional)
 * @param sortOrder - Sort order (optional)
 * @returns The list of funders assigned to the user with pagination
 */
export const getUserFunders = async (
    userId: string, 
    page: number = 1, 
    limit: number = 10, 
    search?: string, 
    sortBy?: string, 
    sortOrder?: 'asc' | 'desc' | null
): Promise<{ data: Funder[], pagination: Pagination }> => {
    const endpoint = env.api.endpoints.user.getUserFunders.replace(':userId', userId);
    
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
    const response = await apiClient.get<ApiPaginatedResponse<Funder>>(url);
    
    return {
        data: response.data.docs,
        pagination: response.data.pagination,
    };
};

/**
 * Get a list of funders for a specific user (alternative endpoint)
 * @param userId - The ID of the user
 * @returns The list of funders for the user
 */
export const getUserFunderList = async (userId: string): Promise<Funder[]> => {
    const endpoint = env.api.endpoints.user.getUserFunderList.replace(':userId', userId);
    const response = await apiClient.get<ApiListResponse<Funder>>(endpoint);
    return response.data;
};

/**
 * Add a funder to a user
 * @param userId - The ID of the user
 * @param funderId - The ID of the funder to add
 * @returns The updated funder or confirmation
 */
export const addUserFunder = async (userId: string, funderId: string): Promise<Funder> => {
    const endpoint = env.api.endpoints.user.addUserFunder.replace(':userId', userId);
    const response = await apiClient.post<ApiResponse<Funder>>(endpoint, { funder: funderId });
    return response.data;
};

/**
 * Remove a funder from a user
 * @param userId - The ID of the user
 * @param funderId - The ID of the funder to remove
 * @returns Confirmation of removal
 */
export const removeUserFunder = async (userId: string, funderId: string): Promise<void> => {
    const endpoint = env.api.endpoints.user.removeUserFunder
        .replace(':userId', userId)
        .replace(':funderId', funderId);
    await apiClient.delete<ApiResponse<void>>(endpoint);
};
