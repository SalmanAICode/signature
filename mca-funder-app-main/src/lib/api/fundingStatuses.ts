/**
 * Funding Status API Client
 * 
 * This module provides a complete interface for managing funding statuses through the API.
 * All endpoints require authentication and appropriate permissions based on the user's role.
 * 
 * Available endpoints:
 * - GET /api/v1/funding-statuses - Get all funding statuses with pagination
 * - GET /api/v1/funding-statuses/list - Get funding statuses list without pagination
 * - GET /api/v1/funding-statuses/:id - Get a single funding status by ID
 * - POST /api/v1/funding-statuses - Create a new funding status
 * - PUT /api/v1/funding-statuses/:id - Update a funding status
 * - DELETE /api/v1/funding-statuses/:id - Delete a funding status
 * - PUT /api/v1/funding-statuses - Update funding status index (reorder)
 * 
 * Usage Examples:
 * 
 * // Get all funding statuses with pagination
 * const { data, pagination } = await getFundingStatuses({
 *   page: 1,
 *   limit: 10,
 *   funder: 'funderId',
 *   search: 'active'
 * });
 * 
 * // Get funding statuses list without pagination
 * const statuses = await getFundingStatusList({
 *   funder: 'funderId',
 *   initial: true,
 *   include_inactive: false
 * });
 * 
 * // Get a single funding status
 * const status = await getFundingStatusById('statusId');
 * 
 * // Create a new funding status
 * const newStatus = await createFundingStatus({
 *   name: 'Active',
 *   funder: 'funderId',
 *   bgcolor: '#00ff00',
 *   initial: true,
 *   funded: false,
 *   performing: false,
 *   warning: false,
 *   closed: false,
 *   defaulted: false,
 *   system: false
 * });
 * 
 * // Update a funding status
 * const updatedStatus = await updateFundingStatus('statusId', {
 *   name: 'Updated Status',
 *   bgcolor: '#ff0000'
 * });
 * 
 * // Delete a funding status
 * await deleteFundingStatus('statusId');
 * 
 * // Reorder funding statuses
 * await updateFundingStatusIndex({
 *   funder: 'funderId',
 *   ids: ['status1', 'status2', 'status3']
 * });
 */

import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Pagination } from '@/types/pagination';
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';
import { FundingStatus as DefaultFundingStatus, UpdateFundingStatus, CreateFundingStatus } from '@/types/fundingStatus';
import { UpdateFundingStatusData as UpdateFundingStatusDataOld } from '@/types/fundingStatus';

export interface FundingStatus {
  _id: string;
  name: string;
  bgcolor?: string;
  initial: boolean;
  funded: boolean;
  performing: boolean;
  warning: boolean;
  closed: boolean;
  defaulted: boolean;
  system: boolean;
  funder: string;
  idx: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FundingStatusQuery {
  page?: number;
  limit?: number;
  sort?: string;
  funder?: string;
  search?: string;
  initial?: boolean;
  funded?: boolean;
  performing?: boolean;
  warning?: boolean;
  closed?: boolean;
  defaulted?: boolean;
  system?: boolean;
  include_inactive?: boolean;
}

export interface CreateFundingStatusData {
  name: string;
  funder?: string;
  bgcolor?: string;
  initial?: boolean;
  funded?: boolean;
  performing?: boolean;
  warning?: boolean;
  closed?: boolean;
  defaulted?: boolean;
  system?: boolean;
}

export interface UpdateFundingStatusData extends Partial<CreateFundingStatusData> {
  name?: string; // Optional for updates
}

export interface UpdateFundingStatusIndexData {
  funder?: string;
  ids: string[];
}

/**
 * Get all funding statuses with pagination
 * Access: Requires FUNDING_STATUS.READ permission
 */
export const getFundingStatuses = async (query: FundingStatusQuery = {}): Promise<{ data: FundingStatus[], pagination: Pagination }> => {
  const params = new URLSearchParams();
  
  // Add query parameters
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.sort) params.append('sort', query.sort);
  if (query.funder) params.append('funder', query.funder);
  if (query.search) params.append('search', query.search);
  if (query.initial !== undefined) params.append('initial', query.initial.toString());
  if (query.funded !== undefined) params.append('funded', query.funded.toString());
  if (query.performing !== undefined) params.append('performing', query.performing.toString());
  if (query.warning !== undefined) params.append('warning', query.warning.toString());
  if (query.closed !== undefined) params.append('closed', query.closed.toString());
  if (query.defaulted !== undefined) params.append('defaulted', query.defaulted.toString());
  if (query.system !== undefined) params.append('system', query.system.toString());
  if (query.include_inactive !== undefined) params.append('include_inactive', query.include_inactive.toString());
  
  const endpoint = `${env.api.endpoints.fundingStatus.getFundingStatuses}?${params.toString()}`;
  const response = await apiClient.get<ApiPaginatedResponse<FundingStatus>>(endpoint);
  return {
    data: response.data.docs,
    pagination: response.data.pagination,
  };
};

/**
 * Get funding statuses list without pagination
 * Access: Requires FUNDING_STATUS.READ permission
 */
export const getFundingStatusList = async (query: Omit<FundingStatusQuery, 'page' | 'limit'> = {}): Promise<FundingStatus[]> => {
  const params = new URLSearchParams();
  
  // Add query parameters (excluding page and limit)
  if (query.sort) params.append('sort', query.sort);
  if (query.funder) params.append('funder', query.funder);
  if (query.search) params.append('search', query.search);
  if (query.initial !== undefined) params.append('initial', query.initial.toString());
  if (query.funded !== undefined) params.append('funded', query.funded.toString());
  if (query.performing !== undefined) params.append('performing', query.performing.toString());
  if (query.warning !== undefined) params.append('warning', query.warning.toString());
  if (query.closed !== undefined) params.append('closed', query.closed.toString());
  if (query.defaulted !== undefined) params.append('defaulted', query.defaulted.toString());
  if (query.system !== undefined) params.append('system', query.system.toString());
  if (query.include_inactive !== undefined) params.append('include_inactive', query.include_inactive.toString());
  
  const endpoint = `${env.api.endpoints.fundingStatus.getFundingStatusList}?${params.toString()}`;
  const response = await apiClient.get<ApiListResponse<FundingStatus>>(endpoint);
  return response.data;
};

/**
 * Get a single funding status by ID
 * Access: Requires FUNDING_STATUS.READ permission
 */
export const getFundingStatusById = async (id: string): Promise<FundingStatus> => {
  const endpoint = env.api.endpoints.fundingStatus.getFundingStatusById.replace(':statusId', id);
  const response = await apiClient.get<ApiResponse<FundingStatus>>(endpoint);
  return response.data;
};

/**
 * Create a new funding status
 * Access: Requires FUNDING_STATUS.CREATE permission
 */
export const createFundingStatus = async (data: CreateFundingStatusData): Promise<FundingStatus> => {
  const endpoint = env.api.endpoints.fundingStatus.createFundingStatus;
  const response = await apiClient.post<ApiResponse<FundingStatus>>(endpoint, data);
  return response.data;
};

/**
 * Update a funding status
 * Access: Requires FUNDING_STATUS.UPDATE permission
 */
export const updateFundingStatus = async (id: string, data: UpdateFundingStatusData): Promise<FundingStatus> => {
  const endpoint = env.api.endpoints.fundingStatus.updateFundingStatus.replace(':statusId', id);
  const response = await apiClient.put<ApiResponse<FundingStatus>>(endpoint, data);
  return response.data;
};

/**
 * Delete a funding status
 * Access: Requires FUNDING_STATUS.DELETE permission
 */
export const deleteFundingStatus = async (id: string): Promise<void> => {
  const endpoint = env.api.endpoints.fundingStatus.deleteFundingStatus.replace(':statusId', id);
  await apiClient.delete<ApiResponse<void>>(endpoint);
};

/**
 * Update funding status index (reorder)
 * Access: Requires FUNDING_STATUS.UPDATE permission
 */
export const updateFundingStatusIndex = async (data: UpdateFundingStatusIndexData): Promise<void> => {
  const endpoint = env.api.endpoints.fundingStatus.updateFundingStatusIndex;
  await apiClient.put<ApiResponse<void>>(endpoint, data);
}; 

// Update funding status order
export const updateFundingStatusOrder = async (orderData: UpdateFundingStatus): Promise<DefaultFundingStatus[]> => {
  const endpoint = env.api.endpoints.fundingStatus.getFundingStatuses;
  const result = await apiClient.put<ApiResponse<DefaultFundingStatus[]>>(endpoint, orderData);
  return result.data;
};

// Get funding status list (all statuses without pagination)
export const getFundingStatusListWithDefaultSort = async (
  funder?: string,
  include_inactive?: boolean,
  initial?: boolean,
  funded?: boolean,
  performing?: boolean,
  warning?: boolean,
  closed?: boolean,
  defaulted?: boolean,
  system?: boolean,
): Promise<DefaultFundingStatus[]> => {
  const query = new URLSearchParams();
  
  if (funder && funder.trim() !== '') {
      query.append('funder', funder);
  }

  if (include_inactive !== undefined) {
      query.append('include_inactive', String(include_inactive));
  }

  if (initial !== undefined) {
      query.append('initial', String(initial));
  }
  if (funded !== undefined) {
      query.append('funded', String(funded));
  }
  if (performing !== undefined) {
      query.append('performing', String(performing));
  }
  if (warning !== undefined) {
      query.append('warning', String(warning));
  }
  if (closed !== undefined) {
      query.append('closed', String(closed));
  }
  if (defaulted !== undefined) {
      query.append('defaulted', String(defaulted));
  }
  if (system !== undefined) {
      query.append('system', String(system));
  }

  const endpoint = `${env.api.endpoints.fundingStatus.getFundingStatusList}${query.toString() ? `?${query.toString()}` : ''}`;
  const result = await apiClient.get<ApiListResponse<DefaultFundingStatus>>(endpoint);
  return result.data;
};

// Create funding status
export const createFundingStatusOld = async (statusData: CreateFundingStatus): Promise<DefaultFundingStatus> => {
  const endpoint = env.api.endpoints.fundingStatus.createFundingStatus;
  const result = await apiClient.post<ApiResponse<DefaultFundingStatus>>(endpoint, statusData);
  return result.data;
};

// Update funding status
export const updateFundingStatusOld = async (statusId: string, statusData: UpdateFundingStatusDataOld): Promise<DefaultFundingStatus> => {
  const endpoint = env.api.endpoints.fundingStatus.updateFundingStatus.replace(':statusId', statusId);
  const result = await apiClient.put<ApiResponse<DefaultFundingStatus>>(endpoint, statusData);
  return result.data;
};