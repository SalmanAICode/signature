import { ISO, ISOResponse, ISOsResponse } from '@/types/iso';
import apiClient from './client';
import useAuthStore from '@/lib/store/auth';

import { env } from '@/config/env';
import { authFetch } from '@/lib/api/authFetch';
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data: T;
}

interface ISOFilters {
  includeInactive?: boolean;
  search?: string;
}

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
  inactive?: boolean;
}

export interface UpdateISOData {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_list?: Array<{
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    zip?: string;
  }>;
  inactive?: boolean;
}




export const getISOById = async (id: string): Promise<ISO> => {

  const endpoint = env.api.endpoints.iso.getISOById.replace(':ISOId', id);
  const response = await authFetch(`${env.api.baseUrl}${endpoint}`, {
      method: "GET",
  });

  const result = await response.json();

  if (!response.ok) {
      const message = result?.message || 'Failed to fetch ISO';
      throw new Error(message);
  }

  return result.data;
};


export async function getISOs(page: number = 1, limit: number = 10, filters?: ISOFilters): Promise<ISOsResponse> {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      include_inactive: (filters?.includeInactive ?? false).toString()
    });
    
    if (filters?.search) {
      queryParams.append('search', filters.search);
    }
    
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }
    
    const response = await apiClient.get<ApiResponse<{ 
      docs: ISO[],
      pagination: {
        page: number;
        limit: number;
        totalPages: number;
        totalResults: number;
      }
    }>>(`/isos?${queryParams.toString()}`, true, accessToken);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch ISOs');
    }
    
    return {
      success: true,
      data: {
        docs: response.data.docs,
        pagination: response.data.pagination
      }
    };
  } catch (error) {
    throw error;
  }
}

export async function createISO(isoData: CreateISOData): Promise<ApiResponse<ISO>> {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.post<ApiResponse<ISO>>('/isos', isoData, true, accessToken);

    return response;
  } catch (error) {
    throw error;
  }
}

export async function updateISO(isoId: string, isoData: UpdateISOData): Promise<ApiResponse<ISO>> {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.put<ApiResponse<ISO>>(`/isos/${isoId}`, isoData, true, accessToken);

    return response;
  } catch (error) {
    throw error;
  }
}

export async function deleteISO(isoId: string): Promise<ApiResponse<any>> {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.delete<ApiResponse<any>>(`/isos/${isoId}`, true, accessToken);

    return response;
  } catch (error) {
    throw error;
  }
}

export async function getISO(isoId: string): Promise<ApiResponse<ISO>> {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.get<ApiResponse<ISO>>(`/isos/${isoId}`, true, accessToken);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch ISO');
    }

    return response;
  } catch (error) {
    throw error;
  }
}

export async function getFunderISOs(funderId: string, page: number = 1, limit: number = 10): Promise<ISOsResponse> {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }
    
    const response = await apiClient.get<ApiResponse<{ 
      docs: ISO[],
      pagination: {
        page: number;
        limit: number;
        totalPages: number;
        totalResults: number;
      }
    }>>(`/funders/${funderId}/isos?${queryParams.toString()}`, true, accessToken);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch funder ISOs');
    }
    
    return {
      success: true,
      data: {
        docs: response.data.docs,
        pagination: response.data.pagination
      }
    };
  } catch (error) {
    throw error;
  }
} 