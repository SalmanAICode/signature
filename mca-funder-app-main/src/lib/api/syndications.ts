import { Syndication, GetSyndicationParams, CreateSyndicationData, UpdateSyndicationData, GetSyndicationListParams } from '@/types/syndication';
import apiClient from './client';
import useAuthStore from '@/lib/store/auth';
import { ApiListResponse } from '@/types/api';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data: T;
}

/**
 * Get paginated syndication list
 */
export const getSyndications = async ({
  sortBy,
  sortOrder,
  page = 1,
  limit = 10,
  include_inactive = false,
  search,
  funding,
}: GetSyndicationParams): Promise<{ data: Syndication[], pagination: any }> => {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    include_inactive: String(include_inactive),
  });
  
  // Only add search parameter if it exists and is not empty
  if (search && search.trim() !== '') {
    query.append('search', search);
  }
  
  if (sortBy && sortOrder) {
    query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
  }
  
  if (funding && funding.trim() !== '') {
    query.append('funding', funding);
  }
  
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) throw new Error('No authentication token available');
  
  const response = await apiClient.get<{ 
    success: boolean; 
    message?: string; 
    data: { docs: Syndication[]; pagination: any } 
  }>(
    `/syndications?${query.toString()}`,
    true,
    accessToken
  );
  
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch syndications');
  }
  
  return {
    data: response.data.docs,
    pagination: response.data.pagination,
  };
};

/**
 * Get simplified syndication list (for dropdowns, etc.)
 */
export const getSyndicationList = async ({
  sortBy,
  sortOrder,
  include_inactive = true,
  funding,
  funder,
  syndicator,
}: GetSyndicationListParams): Promise<Syndication[]> => {
  const query = new URLSearchParams({
    include_inactive: String(include_inactive),
  });

  if (sortBy && sortOrder) {
    query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
  }

  if (funding && funding.trim() !== '') {
    query.append('funding', funding);
  }

  if (funder && funder.trim() !== '') {
    query.append('funder', funder);
  }

  if (syndicator && syndicator.trim() !== '') {
    query.append('syndicator', syndicator);
  }
  
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) throw new Error('No authentication token available');
  
  const response = await apiClient.get<ApiResponse<Syndication[]>>(
    `/syndications/list?${query.toString()}`,
    true,
    accessToken
  );
  
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch syndication list');
  }
  
  return response.data;
};

/**
 * Get single syndication by ID
 */
export const getSyndication = async (syndicationId: string): Promise<ApiResponse<Syndication>> => {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.get<ApiResponse<Syndication>>(
      `/syndications/${syndicationId}`,
      true,
      accessToken
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch syndication');
    }

    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Create new syndication
 */
export const createSyndication = async (syndicationData: CreateSyndicationData): Promise<ApiResponse<Syndication>> => {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.post<ApiResponse<Syndication>>(
      '/syndications',
      syndicationData,
      true,
      accessToken
    );

    return {
      success: response.success,
      message: response.message,
      statusCode: response.statusCode,
      data: response.data
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update syndication
 */
export const updateSyndication = async (
  syndicationId: string, 
  syndicationData: UpdateSyndicationData
): Promise<ApiResponse<Syndication>> => {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.put<ApiResponse<Syndication>>(
      `/syndications/${syndicationId}`,
      syndicationData,
      true,
      accessToken
    );

    return {
      success: true,
      message: 'Syndication updated successfully',
      statusCode: 200,
      data: response.data
    };
  } catch (error) {
    throw error;
  }
};
