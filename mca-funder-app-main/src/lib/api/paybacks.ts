import { env } from '@/config/env';
import { authFetch } from '@/lib/api/authFetch';
import { Payback, PaybackResponse } from '@/types/payback';

export interface PaybacksResponse {
  success: boolean;
  data: {
    docs: Payback[];
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      totalResults: number;
    };
  };
}

export async function getPaybacks(fundingId: string, page: number = 1, limit: number = 10): Promise<PaybacksResponse> {
  const response = await authFetch(
    `${env.api.baseUrl}/paybacks?funding=${fundingId}&page=${page}&limit=${limit}`
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch paybacks');
  return result;
}

export async function getPaybacksByPlan(paybackPlanId: string, page: number = 1, limit: number = 100): Promise<PaybacksResponse> {
  const response = await authFetch(
    `${env.api.baseUrl}/paybacks?payback_plan=${paybackPlanId}&page=${page}&limit=${limit}`
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch paybacks');
  return result;
}

export async function getPaybackById(id: string): Promise<PaybackResponse> {
  const response = await authFetch(`${env.api.baseUrl}/paybacks/${id}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch payback');
  return result;
}

export async function createPayback(payload: any): Promise<any> {
  const response = await authFetch(
    `${env.api.baseUrl}/paybacks`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to create payback');
  return result;
}

export async function updatePayback(paybackId: string, payload: any): Promise<any> {
  const response = await authFetch(
    `${env.api.baseUrl}/paybacks/${paybackId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to update payback');
  return result;
}

export async function deletePayback(paybackId: string): Promise<any> {
  const response = await authFetch(
    `${env.api.baseUrl}/paybacks/${paybackId}`,
    {
      method: 'DELETE',
    }
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to delete payback');
  return result;
} 