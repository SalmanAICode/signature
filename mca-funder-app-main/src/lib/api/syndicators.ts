import { env } from "@/config/env";
import apiClient from "@/lib/api/client";
import { Syndicator, SyndicatorFunder, GetSyndicatorParams, CreateSyndicatorData, UpdateSyndicatorData, GetSyndicatorFunderParams } from "@/types/syndicator";
import { Pagination } from "@/types/pagination";
import { ApiResponse, ApiListResponse, ApiPaginatedResponse } from "@/types/api";

/**
 * Delete a syndicator
 * @param syndicatorId - The ID of the syndicator
 * @returns The deleted syndicator
 */
export async function deleteSyndicator(syndicatorId: string) {
    const endpoint = env.api.endpoints.syndicator.deleteSyndicator.replace(':syndicatorId', syndicatorId);
    const result = await apiClient.delete<ApiResponse<Syndicator>>(endpoint);
    return result.data;
}

/**
 * Get a syndicator by ID
 * @param id - The ID of the syndicator
 * @returns The syndicator
 */
export const getSyndicatorById = async (id: string): Promise<Syndicator> => {
    const endpoint = env.api.endpoints.syndicator.getSyndicatorById.replace(':syndicatorId', id);
    const result = await apiClient.get<ApiResponse<Syndicator>>(endpoint);
    return result.data;
};

/**
 * Get a list of syndicators
 * @returns The list of syndicators
 */
export const getSyndicatorList = async (): Promise<Syndicator[]> => {
    const endpoint = env.api.endpoints.syndicator.getSyndicatorList;
    const result = await apiClient.get<ApiListResponse<Syndicator>>(endpoint);
    return result.data;
};

/**
 * Get a list of syndicators
 * @param params - The parameters for the request
 * @returns The list of syndicators
 */
export const getSyndicators = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    include_inactive = true,
    search = ''
}: GetSyndicatorParams): Promise<{ data: Syndicator[], pagination: Pagination }> => {
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        include_inactive: String(include_inactive),
        search: search || '',
    });

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }

    const endpoint = `${env.api.endpoints.syndicator.getSyndicators}?${query.toString()}`;
    const result = await apiClient.get<ApiPaginatedResponse<Syndicator>>(endpoint);

    return {
        data: result.data.docs,
        pagination: result.data.pagination,
    };
};

/**
 * Create a syndicator
 * @param syndicatorData - The data for the syndicator
 * @returns The created syndicator
 */
export async function createSyndicator(syndicatorData: CreateSyndicatorData): Promise<Syndicator> {
    const endpoint = env.api.endpoints.syndicator.createSyndicator;
    const result = await apiClient.post<ApiResponse<Syndicator>>(endpoint, syndicatorData);
    return result.data;
}

/**
 * Update a syndicator
 * @param syndicatorId - The ID of the syndicator
 * @param syndicatorData - The data for the syndicator
 * @returns The updated syndicator
 */
export async function updateSyndicator(syndicatorId: string, syndicatorData: UpdateSyndicatorData): Promise<Syndicator> {
    const endpoint = env.api.endpoints.syndicator.updateSyndicator.replace(':syndicatorId', syndicatorId);
    const result = await apiClient.put<ApiResponse<Syndicator>>(endpoint, syndicatorData);
    return result.data;
}

/**
 * Get a list of syndicator funders
 * @param params - The parameters for the request
 * @returns The list of syndicator funders
 */
export const getSyndicatorFunders = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    include_inactive = true,
    syndicator,
    funder
}: GetSyndicatorFunderParams): Promise<{ data: SyndicatorFunder[], pagination: Pagination }> => {
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        include_inactive: String(include_inactive),
    });

    if (syndicator && syndicator.trim() !== '') {
        query.append('syndicator', syndicator);
    }

    if (funder && funder.trim() !== '') {
        query.append('funder', funder);
    }

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }

    const endpoint = `${env.api.endpoints.syndicator.getSyndicatorFunders}?${query.toString()}`;
    const result = await apiClient.get<ApiPaginatedResponse<SyndicatorFunder>>(endpoint);

    return {
        data: result.data.docs,
        pagination: result.data.pagination,
    };
};

/**
 * Get a list of syndicator funders
 * @param syndicatorId - The ID of the syndicator
 * @param funderId - The ID of the funder
 * @returns The list of syndicator funders
 */
export const getSyndicatorFunderList = async (syndicatorId?: string, funderId?: string): Promise<SyndicatorFunder[]> => {
    const query = new URLSearchParams();
    
    if (syndicatorId && syndicatorId.trim()) {
        query.append('syndicator', syndicatorId);
    }
    
    if (funderId && funderId.trim()) {
        query.append('funder', funderId);
    }

    const endpoint = `${env.api.endpoints.syndicator.getSyndicatorFunderList}?${query.toString()}`;
    const result = await apiClient.get<ApiListResponse<SyndicatorFunder>>(endpoint);
    return result.data;
};

/**
 * Create a syndicator funder
 * @param syndicatorId - The ID of the syndicator
 * @param funderId - The ID of the funder
 * @returns The created syndicator funder
 */
export const createSyndicatorFunder = async (syndicatorId: string, funderId: string): Promise<SyndicatorFunder> => {
    const endpoint = env.api.endpoints.syndicator.createSyndicatorFunder;
    const result = await apiClient.post<ApiResponse<SyndicatorFunder>>(endpoint, {
        syndicator: syndicatorId,
        funder: funderId,
    });
    return result.data;
};

/**
 * Delete a syndicator funder
 * @param syndicatorFunderId - The ID of the syndicator funder
 * @returns The deleted syndicator funder
 */
export const deleteSyndicatorFunder = async (syndicatorFunderId: string): Promise<SyndicatorFunder> => {
    const endpoint = env.api.endpoints.syndicator.deleteSyndicatorFunder.replace(':syndicatorFunderId', syndicatorFunderId);
    const result = await apiClient.delete<ApiResponse<SyndicatorFunder>>(endpoint);
    return result.data;
};

/**
 * Update a syndicator funder
 * @param syndicatorFunderId - The ID of the syndicator funder
 * @param syndicatorId - The ID of the syndicator
 * @param funderId - The ID of the funder
 * @returns The updated syndicator funder
 */
export const updateSyndicatorFunder = async (syndicatorFunderId: string, syndicatorId: string, funderId: string): Promise<SyndicatorFunder> => {
    const endpoint = env.api.endpoints.syndicator.updateSyndicatorFunder.replace(':syndicatorFunderId', syndicatorFunderId);
    const result = await apiClient.put<ApiResponse<SyndicatorFunder>>(endpoint, {
        syndicator: syndicatorId,
        funder: funderId,
    });
    return result.data;
};
