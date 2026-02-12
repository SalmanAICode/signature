import { FundingFee, GetFundingFeeListQuery, CreateFundingFeeParams, UpdateFundingFeeParams } from "@/types/fundingFee";
import { env } from "@/config/env";
import ApiClient from "@/lib/api/client";
import { ApiResponse, ApiListResponse, ApiPaginatedResponse } from "@/types/api";
import { Pagination } from "@/types/pagination";

export const getFundingFees = async (query: GetFundingFeeListQuery): Promise<{ data: FundingFee[], pagination: Pagination }> => {
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
    const response = await ApiClient.get<ApiPaginatedResponse<FundingFee>>(`${env.api.endpoints.fundingFee.getFundingFees}?${queryString}`);
    return {
        data: response.data.docs,
        pagination: response.data.pagination
    };
};

export const getFundingFeeById = async (id: string): Promise<FundingFee> => {
    const response = await ApiClient.get<ApiResponse<FundingFee>>(`${env.api.endpoints.fundingFee.getFundingFeeById.replace(':fundingFeeId', id)}`);
    return response.data;
};

export const createFundingFee = async (fundingFee: CreateFundingFeeParams): Promise<FundingFee> => {
    // Filter out empty note and fee_date
    const payload = { ...fundingFee } as any;
    if (!payload.note || payload.note.trim() === '') {
        delete payload.note;
    }
    if (!payload.fee_date || payload.fee_date.trim() === '') {
        delete payload.fee_date;
    }
    const response = await ApiClient.post<ApiResponse<FundingFee>>(`${env.api.endpoints.fundingFee.createFundingFee}`, payload);
    return response.data;
};

export const updateFundingFee = async (id: string, fundingFee: UpdateFundingFeeParams): Promise<FundingFee> => {
    // Filter out empty note and fee_date
    const payload = { ...fundingFee } as any;
    if (!payload.note || payload.note.trim() === '') {
        delete payload.note;
    }
    if (!payload.fee_date || payload.fee_date.trim() === '') {
        delete payload.fee_date;
    }
    const response = await ApiClient.put<ApiResponse<FundingFee>>(`${env.api.endpoints.fundingFee.updateFundingFee.replace(':fundingFeeId', id)}`, payload);
    return response.data;
};

export const deleteFundingFee = async (id: string): Promise<FundingFee> => {
    const response = await ApiClient.delete<ApiResponse<FundingFee>>(`${env.api.endpoints.fundingFee.deleteFundingFee.replace(':fundingFeeId', id)}`);
    return response.data;
};

export const getFundingFeeList = async (): Promise<FundingFee[]> => {
    const response = await ApiClient.get<ApiListResponse<FundingFee>>(`${env.api.endpoints.fundingFee.getFundingFeeList}`);
    return response.data;
};