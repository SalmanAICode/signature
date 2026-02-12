import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { ApiResponse, ApiListResponse } from '@/types/api';

interface BankAccount {
  _id: string;
  name: string;
  bank_name: string;
  routing_number: string;
  account_number: string;
  account_type: string;
}

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_mobile: string;
}

interface Funding {
  _id: string;
  name: string;
}

interface Entity {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface DisbursementIntent {
  _id: string;
  funding: Funding;
  funder: Entity;
  merchant: Entity;
  disbursement_date: string;
  amount: number;
  payment_method: 'WIRE' | 'ACH' | 'CHECK' | 'OTHER';
  ach_processor: 'ACHWorks' | 'Actum' | 'Manual' | 'Other';
  funder_account: BankAccount;
  merchant_account: BankAccount;
  created_by_user?: User;
  updated_by_user?: User;
  note?: string;
  status: 'SCHEDULED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  inactive?: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  submitted_count: number;
  processing_count: number;
  succeed_count: number;
  failed_count: number;
  submitted_amount: number;
  processing_amount: number;
  succeed_amount: number;
  failed_amount: number;
  paid_amount: number;
  pending_amount: number;
  pending_count: number;
  remaining_balance: number;
  _calculatedStatsComplete: boolean;
}

export interface CreateDisbursementIntent {
  funding: string;
  disbursement_date: string;
  amount: number;
  payment_method?: 'WIRE' | 'ACH' | 'CHECK' | 'OTHER';
  ach_processor?: 'ACHWorks' | 'Actum' | 'Manual' | 'Other';
  funder_account: string;
  merchant_account: string;
  note?: string;
  status?: 'SCHEDULED' | 'SUBMITTED' | 'SUCCEED' | 'FAILED' | 'CANCELLED';
  funder?: string;
  merchant?: string;
}

export interface UpdateDisbursementIntent {
  disbursement_date?: string;
  amount?: number;
  payment_method?: 'WIRE' | 'ACH' | 'CHECK' | 'OTHER';
  ach_processor?: 'ACHWorks' | 'Actum' | 'Manual' | 'Other';
  funder_account?: string;
  merchant_account?: string;
  note?: string;
  status?: 'SCHEDULED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  inactive?: boolean;
}

// Get disbursement intent by ID
export const getDisbursementIntentById = async (id: string): Promise<DisbursementIntent> => {
  const endpoint = `/disbursement-intents/${id}`;
  const result = await apiClient.get<ApiResponse<DisbursementIntent>>(endpoint);
  return result.data;
};

// Get list of disbursement intents
export const getDisbursementIntentList = async (params?: { funding?: string }) => {
  let endpoint = '/disbursement-intents';
  if (params && params.funding) {
    endpoint += `?funding=${encodeURIComponent(params.funding)}`;
  }
  const result = await apiClient.get<ApiResponse<{ docs: DisbursementIntent[]; pagination: { page: number; limit: number; totalPages: number; totalResults: number } }>>(endpoint);
  return result.data;
};

// Create disbursement intent
export const createDisbursementIntent = async (data: CreateDisbursementIntent): Promise<DisbursementIntent> => {
  const endpoint = '/disbursement-intents';
  const result = await apiClient.post<ApiResponse<DisbursementIntent>>(endpoint, data);
  return result.data;
};

// Update disbursement intent
export const updateDisbursementIntent = async (id: string, data: UpdateDisbursementIntent): Promise<DisbursementIntent> => {
  const endpoint = `/disbursement-intents/${id}`;
  const result = await apiClient.put<ApiResponse<DisbursementIntent>>(endpoint, data);
  return result.data;
};

// Delete disbursement intent
export const deleteDisbursementIntent = async (id: string): Promise<void> => {
  const endpoint = `/disbursement-intents/${id}`;
  await apiClient.delete<ApiResponse<void>>(endpoint);
}; 