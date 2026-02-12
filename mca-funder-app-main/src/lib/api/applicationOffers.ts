import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Pagination } from '@/types/pagination';
import { ApplicationOffer, CreateApplicationOfferParams, UpdateApplicationOfferParams } from '@/types/applicationOffer';
import { ApiResponse, ApiListResponse, ApiPaginatedResponse } from '@/types/api';

export const getApplicationOfferById = async (id: string): Promise<ApplicationOffer> => {
    const endpoint = env.api.endpoints.applicationOffer.getApplicationOfferById.replace(':applicationOfferId', id);
    const response = await apiClient.get<ApiResponse<ApplicationOffer>>(endpoint);
    return response.data;
};

type GetApplicationOfferListParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    include_inactive?: boolean;
    search?: string | null;
    application?: string | null;
    funder?: string | null;
    merchant?: string | null;
    iso?: string | null;
};

export const getApplicationOfferList = async ({
    sortBy,
    sortOrder,
    include_inactive = true,
    application,
    search,
    funder,
    merchant,
    iso,
}: GetApplicationOfferListParams): Promise<ApplicationOffer[]> => {
    const query = new URLSearchParams({
        include_inactive: String(include_inactive),
    });

    if (application) {
        query.append('application', application);
    }

    if (search) {
        query.append('search', search);
    }

    if (funder) {
        query.append('funder', funder);
    }

    if (merchant) {
        query.append('merchant', merchant);
    }

    if (iso) {
        query.append('iso', iso);
    }

    const response = await apiClient.get<ApiListResponse<ApplicationOffer>>(
        `${env.api.endpoints.applicationOffer.getApplicationOfferList}?${query.toString()}`
    );
    return response.data;
};

type GetApplicationOffersParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    include_inactive?: boolean;
    search?: string | null;
    application?: string | null;
    funder?: string | null;
    merchant?: string | null;
    iso?: string | null;
};

export const getApplicationOffers = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    include_inactive = true,
    search,
    application,
    funder,
    merchant,
    iso,
}: GetApplicationOffersParams): Promise<{ data: ApplicationOffer[], pagination: Pagination }> => {
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        include_inactive: String(include_inactive),
    });

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }

    if (search && search.trim() !== '') {
        query.append('search', search);
    }

    if (application) {
        query.append('application', application);
    }

    if (funder) {
        query.append('funder', funder);
    }

    if (merchant) {
        query.append('merchant', merchant);
    }

    if (iso) {
        query.append('iso', iso);
    }

    const response = await apiClient.get<ApiPaginatedResponse<ApplicationOffer>>(
        `${env.api.endpoints.applicationOffer.getApplicationOffers}?${query.toString()}`
    );
    
    return {
        data: response.data.docs,
        pagination: response.data.pagination,
    };
};

export const createApplicationOffer = async (params: CreateApplicationOfferParams): Promise<ApplicationOffer> => {
    const response = await apiClient.post<ApiResponse<ApplicationOffer>>(
        env.api.endpoints.applicationOffer.createApplicationOffer,
        params
    );
    return response.data;
};


export const updateApplicationOffer = async (offerId: string, params: UpdateApplicationOfferParams): Promise<ApplicationOffer> => {
    const endpoint = env.api.endpoints.applicationOffer.updateApplicationOffer.replace(':applicationOfferId', offerId);
    const response = await apiClient.put<ApiResponse<ApplicationOffer>>(endpoint, params);
    return response.data;
};

export const deleteApplicationOffer = async (id: string): Promise<ApplicationOffer> => {
    const endpoint = env.api.endpoints.applicationOffer.deleteApplicationOffer.replace(':applicationOfferId', id);
    const response = await apiClient.delete<ApiResponse<ApplicationOffer>>(endpoint);
    return response.data;
};

export const acceptApplicationOffer = async (id: string): Promise<ApplicationOffer> => {
    const endpoint = env.api.endpoints.applicationOffer.acceptApplicationOffer.replace(':applicationOfferId', id);
    const response = await apiClient.put<ApiResponse<ApplicationOffer>>(endpoint, {});
    return response.data;
};

export const declineApplicationOffer = async (id: string): Promise<ApplicationOffer> => {
    const endpoint = env.api.endpoints.applicationOffer.declineApplicationOffer.replace(':applicationOfferId', id);
    const response = await apiClient.put<ApiResponse<ApplicationOffer>>(endpoint, {});
    return response.data;
};