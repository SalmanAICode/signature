import { env } from "@/config/env";
import apiClient from "@/lib/api/client";
import { Payout, GetPayoutListParams } from "@/types/payout";
import { ApiListResponse } from "@/types/api";

/**
 * Get a list of payouts without pagination
 * @param params - The parameters for the request
 * @returns The list of payouts
 */
export const getPayoutList = async ({
    sortBy,
    sortOrder,
    include_inactive = true,
    funding,
    syndication,
    payback,
    funder,
    syndicator,
    pending
}: GetPayoutListParams): Promise<Payout[]> => {
    const query = new URLSearchParams({
        include_inactive: String(include_inactive)
    });

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }

    if (funding && funding.trim() !== '') {
        query.append('funding', funding);
    }

    if (syndication && syndication.trim() !== '') {
        query.append('syndication', syndication);
    }

    if (payback && payback.trim() !== '') {
        query.append('payback', payback);
    }

    if (funder && funder.trim() !== '') {
        query.append('funder', funder);
    }

    if (syndicator && syndicator.trim() !== '') {
        query.append('syndicator', syndicator);
    }

    if (pending !== undefined) {
        query.append('pending', String(pending));
    }

    const endpoint = `${env.api.endpoints.payout.getPayoutList}?${query.toString()}`;
    const result = await apiClient.get<ApiListResponse<Payout>>(endpoint);
    return result.data;
};
