import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { User } from '@/types/user';
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';
import { Pagination } from '@/types/pagination';

/**
 * Get users assigned to a specific lender
 * @param lenderId - The ID of the lender
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param search - Search query (optional)
 * @param sortBy - Sort field (optional)
 * @param sortOrder - Sort order (optional)
 * @returns The list of users assigned to the lender with pagination
 */
export const getLenderUsers = async (
    lenderId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc' | null
): Promise<{ data: User[], pagination: Pagination }> => {
    const endpoint = env.api.endpoints.lender.getLenderUsers.replace(':lenderId', lenderId);
    
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
    const response = await apiClient.get<ApiPaginatedResponse<User>>(url);
    
    return {
        data: response.data.docs,
        pagination: response.data.pagination,
    };
};

/**
 * Get a list of users for a specific lender (alternative endpoint)
 * @param lenderId - The ID of the lender
 * @returns The list of users for the lender
 */
export const getLenderUserList = async (lenderId: string): Promise<User[]> => {
    const endpoint = env.api.endpoints.lender.getLenderUserList.replace(':lenderId', lenderId);
    const response = await apiClient.get<ApiListResponse<User>>(endpoint);
    return response.data;
};

/**
 * Add a user to a lender
 * @param lenderId - The ID of the lender
 * @param userId - The ID of the user to add
 * @returns The updated user or confirmation
 */
export const addLenderUser = async (lenderId: string, userId: string): Promise<User> => {
    const endpoint = env.api.endpoints.lender.addLenderUser.replace(':lenderId', lenderId);
    const response = await apiClient.post<ApiResponse<User>>(endpoint, { user: userId });
    return response.data;
};

/**
 * Remove a user from a lender
 * @param lenderId - The ID of the lender
 * @param userId - The ID of the user to remove
 * @returns Confirmation of removal
 */
export const removeLenderUser = async (lenderId: string, userId: string): Promise<void > => {
    const endpoint = env.api.endpoints.lender.removeLenderUser
        .replace(':lenderId', lenderId)
        .replace(':userId', userId);
    await apiClient.delete<ApiResponse<void>>(endpoint);
};