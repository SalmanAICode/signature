import { Funding } from "./funding";
import { User } from "./user";
import { FeeType } from "./feeType";
import { Funder } from "./funder";

export type FundingFee = {
    _id: string;
    funding: Funding;
    merchant: null;
    funder: Funder;
    fee_type: FeeType;
    amount: number;
    fee_date?: string;
    created_by_user: User;
    note: string;
    inactive: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
    updated_by_user: User;
}

export type CreateFundingFeeParams = {
    funding: string;
    fee_type: string;
    amount: number;
    fee_date?: string;
    note: string;
}

export type UpdateFundingFeeParams = {
    fee_type: string;
    amount: number;
    fee_date?: string;
    note: string;
    inactive: boolean;
}

export type GetFundingFeeListQuery = {
    page?: number;
    limit?: number;
    funding?: string;
    search?: string;
    include_inactive?: boolean;
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
}