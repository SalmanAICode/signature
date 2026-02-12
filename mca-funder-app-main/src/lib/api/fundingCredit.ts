import { FundingCredit, GetFundingCreditListQuery, CreateFundingCreditParams, UpdateFundingCreditParams } from "@/types/fundingCredit";
import { env } from "@/config/env";
import ApiClient from "@/lib/api/client";
import { ApiResponse, ApiListResponse, ApiPaginatedResponse } from "@/types/api";
import { Pagination } from "@/types/pagination";

export const getFundingCredits = async (query: GetFundingCreditListQuery): Promise<{ data: FundingCredit[], pagination: Pagination }> => {
    // Filter out undefined values
    const filteredQuery = Object.fromEntries(
        Object.entries(query).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    
    const queryParams = new URLSearchParams();
    
    // Add basic query parameters
    Object.entries(filteredQuery).forEach(([key, value]) => {
        if (key !== 'sortBy' && key !== 'sortOrder') {
            queryParams.append(key, String(value));
        }
    });
    
    // Handle sorting like applications.ts
    if (query.sortBy && query.sortOrder) {
        queryParams.append('sort', `${query.sortOrder === 'desc' ? '-' : ''}${query.sortBy}`);
    }
    
    const queryString = queryParams.toString();
    const response = await ApiClient.get<ApiPaginatedResponse<FundingCredit>>(`${env.api.endpoints.fundingCredit.getFundingCredits}?${queryString}`);
    return {
        data: response.data.docs,
        pagination: response.data.pagination
    };
};

export const getFundingCreditById = async (id: string): Promise<FundingCredit> => {
    const response = await ApiClient.get<ApiResponse<FundingCredit>>(`${env.api.endpoints.fundingCredit.getFundingCreditById.replace(':fundingCreditId', id)}`);
    return response.data;
};

export const createFundingCredit = async (fundingCredit: CreateFundingCreditParams): Promise<FundingCredit> => {
    const payload = { ...fundingCredit } as any;
    if (!payload.note || payload.note.trim() === '') {
        delete payload.note;
    }
    if (!payload.credit_date || payload.credit_date.trim() === '') {
        delete payload.credit_date;
    }
    const response = await ApiClient.post<ApiResponse<FundingCredit>>(`${env.api.endpoints.fundingCredit.createFundingCredit}`, payload);
    return response.data;
};

export const updateFundingCredit = async (id: string, fundingCredit: UpdateFundingCreditParams): Promise<FundingCredit> => {
    const payload = { ...fundingCredit } as any;
    if (!payload.note || payload.note.trim() === '') {
        delete payload.note;
    }
    if (!payload.credit_date || payload.credit_date.trim() === '') {
        delete payload.credit_date;
    }
    const response = await ApiClient.put<ApiResponse<FundingCredit>>(`${env.api.endpoints.fundingCredit.updateFundingCredit.replace(':fundingCreditId', id)}`, payload);
    return response.data;
};

export const deleteFundingCredit = async (id: string): Promise<FundingCredit> => {
    const response = await ApiClient.delete<ApiResponse<FundingCredit>>(`${env.api.endpoints.fundingCredit.deleteFundingCredit.replace(':fundingCreditId', id)}`);
    return response.data;
};

export const getFundingCreditList = async (): Promise<FundingCredit[]> => {
    const response = await ApiClient.get<ApiListResponse<FundingCredit>>(`${env.api.endpoints.fundingCredit.getFundingCreditList}`);
    return response.data;
};