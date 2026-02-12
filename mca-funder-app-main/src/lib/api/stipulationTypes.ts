import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Pagination } from '@/types/pagination';
import { StipulationType, CreateStipulationType, UpdateStipulationType } from '@/types/stipulationType';
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';

// Get stipulation types with pagination and filtering
type GetStipulationTypesParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    search?: string | null;
    funder?: string | null;
    include_inactive?: boolean;
};

export const getStipulationTypes = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    search,
    funder,
    include_inactive = false,
}: GetStipulationTypesParams = {}): Promise<{ data: StipulationType[], pagination: Pagination }> => {
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

    const endpoint = `${env.api.endpoints.stipulationType.getStipulationTypes}?${query.toString()}`;
    const result = await apiClient.get<ApiPaginatedResponse<StipulationType>>(endpoint);
    return {
        data: result.data.docs,
        pagination: result.data.pagination,
    };
};

// Get stipulation type list (all stipulation types without pagination)
export const getStipulationTypeList = async (funder?: string): Promise<StipulationType[]> => {
    const query = new URLSearchParams();
    
    if (funder && funder.trim() !== '') {
        query.append('funder', funder);
    }

    const endpoint = `${env.api.endpoints.stipulationType.getStipulationTypeList}${query.toString() ? `?${query.toString()}` : ''}`;
    const result = await apiClient.get<ApiListResponse<StipulationType>>(endpoint);
    return result.data;
};

// Get stipulation type by ID
export const getStipulationTypeById = async (stipulationTypeId: string): Promise<StipulationType> => {
    const endpoint = env.api.endpoints.stipulationType.getStipulationTypeById.replace(':stipulationTypeId', stipulationTypeId);
    const result = await apiClient.get<ApiResponse<StipulationType>>(endpoint);
    return result.data;
};

// Create stipulation type
export const createStipulationType = async (stipulationTypeData: CreateStipulationType): Promise<StipulationType> => {
    const endpoint = env.api.endpoints.stipulationType.createStipulationType;
    const result = await apiClient.post<ApiResponse<StipulationType>>(endpoint, stipulationTypeData);
    return result.data;
};

// Update stipulation type
export const updateStipulationType = async (stipulationTypeId: string, stipulationTypeData: UpdateStipulationType): Promise<StipulationType> => {
    const endpoint = env.api.endpoints.stipulationType.updateStipulationType.replace(':stipulationTypeId', stipulationTypeId);
    const result = await apiClient.put<ApiResponse<StipulationType>>(endpoint, stipulationTypeData);
    return result.data;
};

// Delete stipulation type
export const deleteStipulationType = async (stipulationTypeId: string): Promise<void> => {
    const endpoint = env.api.endpoints.stipulationType.deleteStipulationType.replace(':stipulationTypeId', stipulationTypeId);
    await apiClient.delete<ApiResponse<void>>(endpoint);
};

// Utility function to get stipulation type by name
export const getStipulationTypeByName = async (name: string, funder?: string): Promise<StipulationType | null> => {
    try {
        const stipulationTypes = await getStipulationTypeList(funder);
        return stipulationTypes.find(stipulationType => stipulationType.name.toLowerCase() === name.toLowerCase()) || null;
    } catch (error) {
        console.error('Error fetching stipulation type by name:', error);
        return null;
    }
};

// Utility function to get required stipulation types for a funder
export const getRequiredStipulationTypes = async (funder: string): Promise<StipulationType[]> => {
    try {
        const stipulationTypes = await getStipulationTypeList(funder);
        return stipulationTypes.filter(stipulationType => stipulationType.required === true);
    } catch (error) {
        console.error('Error fetching required stipulation types:', error);
        return [];
    }
}; 