import apiClient from '@/lib/api/client';
import { ApiResponse, ApiListResponse } from '@/types/api';
import { CommissionIntent, CreateCommissionIntent, UpdateCommissionIntent } from '@/types/commissionIntent';

// Get commission intent by ID
export const getCommissionIntentById = async (id: string): Promise<CommissionIntent> => {
  const endpoint = `/commission-intents/${id}`;
  const result = await apiClient.get<ApiResponse<CommissionIntent>>(endpoint);
  return result.data;
};

// Get list of commission intents
export const getCommissionIntentList = async (): Promise<{ docs: CommissionIntent[]; pagination: { page: number; limit: number; totalPages: number; totalResults: number } }> => {
  const endpoint = '/commission-intents';
  const result = await apiClient.get<ApiResponse<{ docs: CommissionIntent[]; pagination: { page: number; limit: number; totalPages: number; totalResults: number } }>>(endpoint);
  return result.data;
};

// Create commission intent
export const createCommissionIntent = async (data: CreateCommissionIntent): Promise<CommissionIntent> => {
  const endpoint = '/commission-intents';
  // Include all fields in the request body as the API expects them
  const result = await apiClient.post<ApiResponse<CommissionIntent>>(endpoint, data);
  return result.data;
};

// Update commission intent
export const updateCommissionIntent = async (id: string, data: UpdateCommissionIntent): Promise<CommissionIntent> => {
  const endpoint = `/commission-intents/${id}`;
  const result = await apiClient.put<ApiResponse<CommissionIntent>>(endpoint, data);
  return result.data;
};

// Delete commission intent
export const deleteCommissionIntent = async (id: string): Promise<void> => {
  const endpoint = `/commission-intents/${id}`;
  await apiClient.delete<ApiResponse<void>>(endpoint);
}; 