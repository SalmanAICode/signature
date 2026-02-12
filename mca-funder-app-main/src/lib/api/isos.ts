import { env } from "@/config/env";
import apiClient from "@/lib/api/client";
import { ISO } from "@/types/iso";
import { Funder } from "@/types/funder";
import { Pagination } from "@/types/pagination";
import { Representative } from "@/types/representative";
import { Application } from "@/types/application";
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';

export interface CreateISOData {
    name: string;
    email: string;
    phone?: string;
    website?: string;
    address_list?: Array<{
      address_1: string;
      address_2?: string;
      city: string;
      state: string;
      zip: string;
    }>;
    iso_detail: {
      ein: string;
      entity_type: string;
      incorporation_date: string;
      state_of_incorporation: string;
    };
    primary_representative?: string;
}

export const getISOById = async (id: string): Promise<ISO> => {
    const endpoint = env.api.endpoints.iso.getISOById.replace(':ISOId', id);
    const result = await apiClient.get<ApiResponse<ISO>>(endpoint);
    return result.data;
};

export const getISOList = async (): Promise<ISO[]> => { 
    const endpoint = env.api.endpoints.iso.getISOList;
    const result = await apiClient.get<ApiListResponse<ISO>>(endpoint);
    return result.data;
};

type GetISOParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    include_inactive?: boolean;
    search?: string;
};

export const getISOs = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    include_inactive = true,
    search = "",
}: GetISOParams): Promise<{ data: ISO[], pagination: Pagination }> => {
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        include_inactive: String(include_inactive),
        search: search,
    });

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }

    const endpoint = `${env.api.endpoints.iso.getISOs}?${query.toString()}`;
    const result = await apiClient.get<ApiPaginatedResponse<ISO>>(endpoint);
    return {
        data: result.data.docs,
        pagination: result.data.pagination,
    };
};

export const getISOFunderList = async (iso_id: string): Promise<Funder[]> => {
    if (!iso_id) {
        throw new Error('ISO ID is required');
    }

    const endpoint = env.api.endpoints.iso.getISOFunderList.replace(':isoId', iso_id);
    const result = await apiClient.get<ApiListResponse<Funder>>(endpoint);
    return result.data;
};

export const createISO = async (iso: Partial<CreateISOData>): Promise<ISO> => {
    const endpoint = env.api.endpoints.iso.createISO;
    const result = await apiClient.post<ApiResponse<ISO>>(endpoint, iso);
    return result.data;
};

export const updateISO = async (iso: ISO): Promise<ISO> => {
    const endpoint = env.api.endpoints.iso.updateISO.replace(':isoId', iso.id);
    const result = await apiClient.put<ApiResponse<ISO>>(endpoint, iso);
    return result.data;
};

export const deleteISO = async (iso_id: string): Promise<ISO> => {
    const endpoint = env.api.endpoints.iso.deleteISO.replace(':isoId', iso_id);
    const result = await apiClient.delete<ApiResponse<ISO>>(endpoint);
    return result.data;
};

export const addISORepresentative = async (iso_id: string, representative: Representative) => {
    const endpoint = env.api.endpoints.iso.addISORepresentative.replace(':isoId', iso_id);
    const result = await apiClient.post<ApiResponse<Representative>>(endpoint, representative);
    return result.data;
};

export const getISORepresentativeList = async (iso_id: string): Promise<Representative[]> => {
    if (!iso_id) {
        throw new Error('ISO ID is required');
    }

    const endpoint = env.api.endpoints.iso.getISORepresentativeList.replace(':isoId', iso_id);
    const result = await apiClient.get<ApiListResponse<Representative>>(endpoint);
    return result.data;
};
