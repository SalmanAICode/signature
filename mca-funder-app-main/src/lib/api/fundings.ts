import { Funding, FundingFee, FundingExpense } from "@/types/funding";
import { authFetch } from "@/lib/api/authFetch";
import { env } from "@/config/env";
import { User } from "@/types/user";

export interface FundingResponse {
  success: boolean;
  data: Funding;
}

export interface FundingsResponse {
  success: boolean;
  data: {
    docs: Funding[];
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      totalResults: number;
    };
  };
}

export interface FundingListResponse {
  success: boolean;
  data: Funding[];
}

export interface CreateFundingData {
  // Required fields
  lender: string; // lender ID
  merchant: string; // merchant ID
  name: string;
  type: string;
  funded_amount: number;
  payback_amount: number;
  
  // Optional fields
  funder?: string; // funder ID (optional)
  iso?: string; // ISO ID (optional)
  application?: string; // application ID (optional)
  application_offer?: string; // application offer ID (optional)
  
  // Fee list (optional)
  fee_list?: {
    name?: string;
    fee_type?: string; // fee type ID (string)
    amount: number;
    upfront?: boolean;
  }[];
  
  // Expense list (optional)
  expense_list?: {
    name?: string;
    expense_type?: string; // expense type ID (string)
    amount: number;
    commission?: boolean;
    syndication?: boolean;
  }[];
  
  // User assignments (optional)
  assigned_manager?: string; // user ID (optional)
  assigned_user?: string; // user ID (optional)
  follower_list?: User[]; // array of user IDs (optional)
  
  // Status and other fields (optional)
  status?: string; // status ID (optional)
  internal?: boolean; // optional boolean
  position?: number; // optional number
}

export const getFundings = async (params: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string } = {}) => {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
    ...(params.search ? { search: params.search } : {}),
  });
  if (params.sortBy) {
    const sort = params.sortOrder === 'desc' ? `-${params.sortBy}` : params.sortBy;
    query.append('sort', sort);
  }
  const response = await authFetch(`${env.api.baseUrl}/fundings?${query.toString()}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Failed to fetch fundings");
  return result as FundingsResponse;
};

export const getFundingById = async (id: string) => {
  const response = await authFetch(`${env.api.baseUrl}/fundings/${id}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Failed to fetch funding");
  return result as FundingResponse;
};

export const createFunding = async (data: CreateFundingData) => {
  const response = await authFetch(`${env.api.baseUrl}/fundings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Failed to create funding");
  return result as FundingResponse;
};

export const updateFunding = async (id: string, data: Partial<Funding>) => {
  const response = await authFetch(`${env.api.baseUrl}/fundings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Failed to update funding");
  return result.data;
};

export const getFundingList = async () => {
  const response = await authFetch(`${env.api.baseUrl}/fundings/list`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Failed to fetch funding list");
  return result as FundingListResponse;
};

export const deleteFunding = async (id: string): Promise<void> => {
  const response = await authFetch(`${env.api.baseUrl}/fundings/${id}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to delete funding');
}; 