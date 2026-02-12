import { Funder } from "./funder";
import { Funding } from "./funding";
import { Merchant } from "./merchant";
import { User } from "./user";



export type FundingCredit = {
    _id: string;
    funding: Funding;
    merchant: Merchant;
    funder: Funder;
    amount: number;
    credit_date: string;
    created_by_user: User;
    note: string;
    inactive: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
    updated_by_user: User;
}

export type CreateFundingCreditParams = {
    funding: string;
    credit_date: string;
    amount: number;
    note: string;
}


export type UpdateFundingCreditParams = {
    credit_date: string;
    amount: number;
    note: string;
    inactive: boolean;
}

export type GetFundingCreditListQuery = {
    page?: number;
    limit?: number;
    funding?: string;
    search?: string;
    include_inactive?: boolean;
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
}