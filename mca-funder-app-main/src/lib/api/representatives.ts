import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Pagination } from '@/types/pagination';
import { Representative } from '@/types/representative';
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';

export const getRepresentativeById = async (id: string): Promise<Representative> => {
    const endpoint = env.api.endpoints.representative.getRepresentativeById.replace(':representativeId', id);
    const result = await apiClient.get<ApiResponse<Representative>>(endpoint);
    return result.data;
};

type GetRepresentativeListParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    include_inactive?: boolean;
    search?: string | null;
    iso?: string | null;
};

export const getRepresentativeList = async ({
    sortBy,
    sortOrder,
    include_inactive = false,
    iso,
    search,
}: GetRepresentativeListParams): Promise<Representative[]> => {
    const query = new URLSearchParams({
        include_inactive: String(include_inactive),
    });

    if (iso) {
        query.append('iso', iso);
    }

    if (search) {
        query.append('search', search);
    }

    const endpoint = `${env.api.endpoints.representative.getRepresentativeList}?${query.toString()}`;
    const result = await apiClient.get<ApiListResponse<Representative>>(endpoint);
    return result.data;
};

type GetRepresentativesParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    include_inactive?: boolean;
    search?: string | null;
};

export const getRepresentatives = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    include_inactive = true,
    search,
}: GetRepresentativesParams): Promise<{ data: Representative[], pagination: Pagination }> => {
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

    const endpoint = `${env.api.endpoints.representative.getRepresentatives}?${query.toString()}`;
    const result = await apiClient.get<ApiPaginatedResponse<Representative>>(endpoint);
    return {
        data: result.data.docs,
        pagination: result.data.pagination,
    };
};

type CreateRepresentativeParams = {
    first_name: string;
    last_name: string;
    email: string;
    phone_mobile?: string;
    phone_work?: string;
    title?: string;
    birthday?: string;
    address_detail?: {
        address_1?: string;
        address_2?: string;
        city?: string;
        state?: string;
        zip?: string;
    };
    type?: string;
    online?: boolean;
    inactive?: boolean;
};

export const createRepresentative = async (representative: CreateRepresentativeParams): Promise<Representative> => {
    const endpoint = env.api.endpoints.representative.createRepresentative;
    const result = await apiClient.post<ApiResponse<Representative>>(endpoint, representative);
    return result.data;
};

type UpdateRepresentativeParams = {
    first_name: string;
    last_name: string;
    email: string;
    phone_mobile?: string;
    phone_work?: string;
    title?: string;
    birthday?: string;
    address_detail?: {
        address_1?: string;
        address_2?: string;
        city?: string;
        state?: string;
        zip?: string;
    };
    type?: string;
    online?: boolean;
    inactive?: boolean;
};

export const updateRepresentative = async (representativeId: string, params: UpdateRepresentativeParams): Promise<Representative> => {
    const endpoint = env.api.endpoints.representative.updateRepresentative.replace(':representativeId', representativeId);
    const result = await apiClient.put<ApiResponse<Representative>>(endpoint, params);
    return result.data;
};

export const deleteRepresentative = async (id: string): Promise<void> => {
    const endpoint = env.api.endpoints.representative.deleteRepresentative.replace(':representativeId', id);
    await apiClient.delete<ApiResponse<void>>(endpoint);
};

export const getRepresentativesByIsoId = async (isoId: string): Promise<Representative[]> => {
    const endpoint = `${env.api.endpoints.representative.getRepresentatives}/${isoId}`;
    const result = await apiClient.get<ApiListResponse<Representative>>(endpoint);
    return result.data;
};