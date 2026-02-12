import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { ApiResponse, ApiListResponse } from '@/types/api';

export interface MerchantAccount {
  id: string;
  name: string;
  merchant_id: string;
  account_number: string;
  routing_number: string;
  account_type: 'CHECKING' | 'SAVINGS';
  bank_name: string;
  inactive: boolean;
}

export const getMerchantAccounts = async (merchantId: string): Promise<MerchantAccount[]> => {
  const endpoint = `${env.api.endpoints.merchant.getMerchantById.replace(':MerchantId', merchantId)}/accounts`;
  const result = await apiClient.get<ApiListResponse<MerchantAccount>>(endpoint);
  return result.data;
}; 