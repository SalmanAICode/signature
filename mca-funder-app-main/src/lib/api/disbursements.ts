import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { ApiResponse, ApiListResponse } from '@/types/api';
import { Disbursement } from '@/types/disbursement';

export interface GetDisbursementListParams {
  disbursement_intent?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  include_inactive?: boolean;
  status?: string;
}

export interface GetDisbursementParams extends GetDisbursementListParams {
  page?: number;
  limit?: number;
}

export interface CreateDisbursementParams {
  funder_account: string;
  merchant_account: string;
  payment_method: 'ACH' | 'WIRE' | 'CHECK' | 'OTHER';
  ach_processor: 'ACHWorks' | 'Actum' | 'Manual' | 'Other';
  submitted_date?: string;
  responsed_date?: string;
  amount: number;
  status: 'SUBMITTED' | 'PROCESSING' | 'SUCCEED' | 'FAILED';
  reconciled?: boolean;
}

export interface UpdateDisbursementParams {
  funder_account?: string;
  merchant_account?: string;
  payment_method?: 'ACH' | 'WIRE' | 'CHECK' | 'OTHER';
  ach_processor?: 'ACHWorks' | 'Actum' | 'Manual' | 'Other';
  submitted_date?: string;
  responsed_date?: string;
  amount?: number;
  status?: 'SUBMITTED' | 'PROCESSING' | 'SUCCEED' | 'FAILED';
  reconciled?: boolean;
}

// Get disbursements by disbursement intent ID
export const getDisbursementsByDisbursementIntent = async (disbursementIntentId: string): Promise<Disbursement[]> => {
  const endpoint = `/disbursement-intents/${disbursementIntentId}/disbursements`;
  const result = await apiClient.get<ApiResponse<{ docs: Disbursement[]; pagination: any }>>(endpoint);
  return result.data.docs;
};

// Create a new disbursement for a disbursement intent
export const createDisbursement = async (disbursementIntentId: string, data: CreateDisbursementParams): Promise<Disbursement> => {
  const endpoint = `/disbursement-intents/${disbursementIntentId}/disbursements`;
  const result = await apiClient.post<ApiResponse<Disbursement>>(endpoint, data);
  return result.data;
};

// Update a disbursement
export const updateDisbursement = async (disbursementIntentId: string, disbursementId: string, data: UpdateDisbursementParams): Promise<Disbursement> => {
  const endpoint = `/disbursement-intents/${disbursementIntentId}/disbursements/${disbursementId}`;
  const result = await apiClient.put<ApiResponse<Disbursement>>(endpoint, data);
  return result.data;
};
