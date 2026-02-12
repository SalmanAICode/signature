import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Pagination } from '@/types/pagination';
import { FeeType, CreateFeeType, UpdateFeeType } from '@/types/feeType';
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';

// Get fee types with pagination and filtering
type GetFeeTypesParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    search?: string | null;
    funder?: string | null;
    include_inactive?: boolean;
};

export const getFeeTypes = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    search,
    funder,
    include_inactive = false,
}: GetFeeTypesParams = {}): Promise<{ data: FeeType[], pagination: Pagination }> => {
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

    if (funder && funder.trim() !== '') {
        query.append('funder', funder);
    }

    const endpoint = `${env.api.endpoints.feeType.getFeeTypes}?${query.toString()}`;
    const result = await apiClient.get<ApiPaginatedResponse<FeeType>>(endpoint);
    return {
        data: result.data.docs,
        pagination: result.data.pagination,
    };
};

// Get fee type list (all fee types without pagination)
type GetFeeTypeListParams = {
    funder?: string;
    include_inactive?: boolean;
    upfront?: boolean;
};

export const getFeeTypeList = async (params: GetFeeTypeListParams = {}): Promise<FeeType[]> => {
    const { funder, include_inactive = false, upfront = true } = params;
    const query = new URLSearchParams();
    
    if (funder && funder.trim() !== '') {
        query.append('funder', funder);
    }

    if (include_inactive !== undefined) {
        query.append('include_inactive', String(include_inactive));
    }

    if (upfront !== undefined) {
        query.append('upfront', String(upfront));
    }

    const endpoint = `${env.api.endpoints.feeType.getFeeTypeList}${query.toString() ? `?${query.toString()}` : ''}`;
    const result = await apiClient.get<ApiListResponse<FeeType>>(endpoint);
    return result.data;
};

// Get fee type by ID
export const getFeeTypeById = async (feeTypeId: string): Promise<FeeType> => {
    const endpoint = env.api.endpoints.feeType.getFeeTypeById.replace(':feeTypeId', feeTypeId);
    const result = await apiClient.get<ApiResponse<FeeType>>(endpoint);
    return result.data;
};

// Create fee type
export const createFeeType = async (feeTypeData: CreateFeeType): Promise<FeeType> => {
    const endpoint = env.api.endpoints.feeType.createFeeType;
    const result = await apiClient.post<ApiResponse<FeeType>>(endpoint, feeTypeData);
    return result.data;
};

// Update fee type
export const updateFeeType = async (feeTypeId: string, feeTypeData: UpdateFeeType): Promise<FeeType> => {
    const endpoint = env.api.endpoints.feeType.updateFeeType.replace(':feeTypeId', feeTypeId);
    const result = await apiClient.put<ApiResponse<FeeType>>(endpoint, feeTypeData);
    return result.data;
};

// Delete fee type
export const deleteFeeType = async (feeTypeId: string): Promise<void> => {
    const endpoint = env.api.endpoints.feeType.deleteFeeType.replace(':feeTypeId', feeTypeId);
    await apiClient.delete<ApiResponse<void>>(endpoint);
};

// Utility function to get fee type by name
export const getFeeTypeByName = async (name: string, funder?: string): Promise<FeeType | null> => {
    try {
        const feeTypes = await getFeeTypeList({ funder });
        return feeTypes.find(feeType => feeType.name.toLowerCase() === name.toLowerCase()) || null;
    } catch (error) {
        console.error('Error fetching fee type by name:', error);
        return null;
    }
}; 