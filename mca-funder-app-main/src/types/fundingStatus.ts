import { Funder } from "./funder";
import { Funding } from "./funding";

export interface FundingStatus {
    _id: string;
    funder: Funder;
    name: string;
    bgcolor?: string;
    idx: number;
    initial?: boolean;
    funded?: boolean;
    performing?: boolean;
    warning?: boolean;
    closed?: boolean;
    defaulted?: boolean;
    system?: boolean;
    inactive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    __v: number;

    funding?: Funding
}

export interface FundingStatusResponse {
    success: boolean;
    data: FundingStatus;
}

export interface FundingStatusesResponse {
    success: boolean;
    data: {
        docs: FundingStatus[];
        pagination: {
            page: number;
            limit: number;
            totalPages: number;
            totalResults: number;
        }
    }
}

export interface CreateFundingStatus {
    funder?: string;
    name: string;
    bgcolor?: string;
    initial?: boolean;
    funded?: boolean;
    performing?: boolean;
    warning?: boolean;
    closed?: boolean;
    defaulted?: boolean;
    system?: boolean;
}

export interface UpdateFundingStatusData {
    name: string;
    bgcolor?: string;
    initial?: boolean;
    funded?: boolean;
    performing?: boolean;
    warning?: boolean;
    closed?: boolean;
    defaulted?: boolean;
    inactive?: boolean;
}

export interface UpdateFundingStatus {
    funder: string;
    ids: string[];
}