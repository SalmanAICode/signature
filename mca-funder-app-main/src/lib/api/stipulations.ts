import apiClient from "@/lib/api/client";
import { env } from "@/config/env";
import { Stipulation } from "@/types/stipulationType";
import { Pagination } from "@/types/pagination";
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';

export const createStipulation = async (stipulation: Stipulation): Promise<Stipulation> => {
    const endpoint = env.api.endpoints.stipulation.createStipulation;
    const result = await apiClient.post<ApiResponse<Stipulation>>(endpoint, stipulation);
    return result.data;
};

export const updateStipulation = async (stipulationId: string, stipulation: Stipulation): Promise<Stipulation> => {
    const endpoint = env.api.endpoints.stipulation.updateStipulation.replace(':stipulationId', stipulationId);
    const result = await apiClient.put<ApiResponse<Stipulation>>(endpoint, stipulation);
    return result.data;
};

export const deleteStipulation = async (stipulationId: string): Promise<void> => {
    const endpoint = env.api.endpoints.stipulation.deleteStipulation.replace(':stipulationId', stipulationId);
    await apiClient.delete<ApiResponse<void>>(endpoint);
};

export const getStipulationById = async (stipulationId: string): Promise<Stipulation> => {
    const endpoint = env.api.endpoints.stipulation.getStipulationById.replace(':stipulationId', stipulationId);
    const result = await apiClient.get<ApiResponse<Stipulation>>(endpoint);
    return result.data;
};

type GetStipulationsParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    include_inactive?: boolean;
    funder?: string;
};

export const getStipulations = async ({
    sortBy,
    sortOrder,
    include_inactive,
    funder  
}: GetStipulationsParams): Promise<{ data: Stipulation[], pagination: Pagination }> => {
    const query = new URLSearchParams();

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }
    if (include_inactive !== undefined) {
        query.append('include_inactive', String(include_inactive));
    }
    if (funder) {
        query.append('funder', funder);
    }

    const endpoint = `${env.api.endpoints.stipulation.getStipulations}${query.toString() ? `?${query.toString()}` : ''}`;
    const result = await apiClient.get<ApiPaginatedResponse<Stipulation>>(endpoint);
    return {
        data: result.data.docs,
        pagination: result.data.pagination
    };
};

type GetStipulationListParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    include_inactive?: boolean;
    funder?: string;
};

export const getStipulationList = async ({
    sortBy,
    sortOrder,
    include_inactive,
    funder  
}: GetStipulationListParams): Promise<Stipulation[]> => {
    const query = new URLSearchParams();

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }
    if (include_inactive !== undefined) {
        query.append('include_inactive', String(include_inactive));
    }
    if (funder) {
        query.append('funder', funder);
    }

    const endpoint = `${env.api.endpoints.stipulation.getStipulationList}${query.toString() ? `?${query.toString()}` : ''}`;
    const result = await apiClient.get<ApiListResponse<Stipulation>>(endpoint);
    return result.data;
};