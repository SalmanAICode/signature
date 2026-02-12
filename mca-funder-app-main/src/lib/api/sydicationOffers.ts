import { env } from "@/config/env";
import apiClient from "@/lib/api/client";
import { SyndicationOffer, CreateSyndicationOfferData, UpdateSyndicationOfferData, GetSyndicationOfferParams, GetSyndicationOfferListParams } from "@/types/syndicationOffer";
import { Pagination } from "@/types/pagination";
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from "@/types/api";

/**
 * Get a syndication offer by ID
 * @param id - The ID of the syndication offer
 * @returns The syndication offer
 */
export const getSyndicationOfferById = async (id: string): Promise<SyndicationOffer> => {
    const endpoint = env.api.endpoints.syndicationOffer.getSyndicationOfferById.replace(':syndicationOfferId', id);
    const result = await apiClient.get<ApiResponse<SyndicationOffer>>(endpoint);
    return result.data;
};

/**
 * Get a list of syndication offers
 * @returns The list of syndication offers
 */
export const getSyndicationOfferList = async ({
    funding,
    include_inactive = true,
    sortBy,
    sortOrder,
    syndicator,
    funder
}: GetSyndicationOfferListParams): Promise<SyndicationOffer[]> => { 
    const query = new URLSearchParams({
        include_inactive: String(include_inactive)
    })

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }

    if (funding && funding.trim() !== '') {
        query.append('funding', funding);
    }

    if (syndicator && syndicator.trim() !== '') {
        query.append('syndicator', syndicator);
    }

    if (funder && funder.trim() !== '') {
        query.append('funder', funder);
    }

    const endpoint = `${env.api.endpoints.syndicationOffer.getSyndicationOfferList}?${query.toString()}`;
    const result = await apiClient.get<ApiListResponse<SyndicationOffer>>(endpoint);
    return result.data;
};

/**
 * Get a list of syndication offers
 * @param params - The parameters for the request
 * @returns The list of syndication offers
 */
export const getSyndicationOffers = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    include_inactive = true,
    // search = "",
    syndicator,
    funder,
    funding,
    status,
}: GetSyndicationOfferParams): Promise<{ data: SyndicationOffer[], pagination: Pagination }> => {
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        include_inactive: String(include_inactive),
        // search: search,
    });

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }

    if (syndicator && syndicator.trim() !== '') {
        query.append('syndicator', syndicator);
    }

    if (funder && funder.trim() !== '') {
        query.append('funder', funder);
    }

    if (funding && funding.trim() !== '') {
        query.append('funding', funding);
    }

    if (status && status.trim() !== '') {
        query.append('status', status);
    }

    const endpoint = `${env.api.endpoints.syndicationOffer.getSyndicationOffers}?${query.toString()}`;
    const result = await apiClient.get<ApiPaginatedResponse<SyndicationOffer>>(endpoint);
    return {
        data: result.data.docs,
        pagination: result.data.pagination,
    };
};

/**
 * Create a syndication offer
 * @param syndicationOffer - The syndication offer to create
 * @returns The created syndication offer
 */
export const createSyndicationOffer = async (syndicationOffer: CreateSyndicationOfferData): Promise<SyndicationOffer> => {
    // Filter out empty fields
    const filteredData = Object.fromEntries(
        Object.entries(syndicationOffer).filter(([key, value]) => 
            value !== '' && value !== null && value !== undefined
        )
    );

    const endpoint = env.api.endpoints.syndicationOffer.createSyndicationOffer;
    const result = await apiClient.post<ApiResponse<SyndicationOffer>>(endpoint, filteredData);
    return result.data;
};

/**
 * Update a syndication offer
 * @param syndicationOfferId - The ID of the syndication offer
 * @param params - The parameters for the request
 * @returns The updated syndication offer
 */
export const updateSyndicationOffer = async (syndicationOfferId: string, params: UpdateSyndicationOfferData): Promise<SyndicationOffer> => {
    const endpoint = env.api.endpoints.syndicationOffer.updateSyndicationOffer.replace(':syndicationOfferId', syndicationOfferId);
    const result = await apiClient.put<ApiResponse<SyndicationOffer>>(endpoint, params);
    return result.data;
};

/**
 * Delete a syndication offer
 * @param syndicationOfferId - The ID of the syndication offer
 * @returns The deleted syndication offer
 */
export const deleteSyndicationOffer = async (syndicationOfferId: string): Promise<SyndicationOffer> => {
    const endpoint = env.api.endpoints.syndicationOffer.deleteSyndicationOffer.replace(':syndicationOfferId', syndicationOfferId);
    const result = await apiClient.delete<ApiResponse<SyndicationOffer>>(endpoint);
    return result.data;
};
