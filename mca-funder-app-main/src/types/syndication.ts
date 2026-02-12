import { Syndicator } from "./syndicator";
import { SyndicationOffer } from "./syndicationOffer";
import { Funder } from "./funder";
import { Funding } from "./funding";
import { Lender } from "./lender";

export type GetSyndicationParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    include_inactive?: boolean;
    search?: string;
    funder?: string;
    lender?: string;
    syndicator?: string;
    funding?: string;
};

export type GetSyndicationListParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    include_inactive?: boolean;
    funder?: string;
    syndicator?: string;
    funding?: string;
};

export type ExpenseItem = {
    name: string;
    expense_type: {
        id: string; // Expense Type ID
        name: string;
        formula: string; // Formula ID
    };
    amount: number;
    upfront: boolean;
};
export type FeeItem = {
    name: string;
    fee_type: {
        id: string; // Fee Type ID
        name: string;
        formula: string; // Formula ID
    };
    amount: number;
    upfront: boolean;
}


export type Syndication = {
    _id: string;
    funding: string | Funding;
    funder?: string | Funder;
    lender?: string | Lender;
    syndicator: string | Syndicator;
    syndication_offer?: string | SyndicationOffer;
    participate_percent: number;
    participate_amount: number;
    payback_amount: number;
    fee_list: ExpenseItem[];
    credit_list: FeeItem[];
    start_date: string;
    end_date?: string;
    status?: 'ACTIVE' | 'CLOSED';
    
    // system fields
    createdAt: string;
    updatedAt: string;
    __v: number;
    inactive?: boolean;

    total_funded_amount?: number;
    total_payback_amount?: number;

    upfront_fee_amount?: number;
    upfront_credit_amount?: number;
    recurring_fee_amount?: number;
    recurring_credit_amount?: number;
    total_fee_amount?: number;
    total_credit_amount?: number;

    factor_rate?: number;
    buy_rate?: number;
    syndicated_amount?: number

    payout_count?: number;
    payout_amount?: number;
    management_amount?: number;
    payout_fee_amount?: number;
    payout_credit_amount?: number;
    redeemed_amount?: number;
    pending_amount?: number;

    total_payout_amount?: number;
    remaining_credit_amount?: number;
    remaining_payback_amount?: number;
    remaining_balance?: number;
};

export type CreateSyndicationData = {
    funding: string; // Required - Funding ID
    syndicator: string; // Required - Syndicator ID
    syndication_offer?: string; // Optional - Syndication offer ID
    participate_percent: number; // Required
    participate_amount: number; // Required
    payback_amount: number; // Required
    fee_list?: [
        {
            name: string | null;
            expense_type: string | null;
            amount: number;
            upfront: boolean;
        }
    ]; // Optional
    credit_list?: [
        {
            name: string | null;
            fee_type: string | null;
            amount: number;
            upfront: boolean;
        }
    ]; // Optional
    start_date: string; // Required - Date as string
    status: 'ACTIVE' | 'CLOSED'; // Required
};

export type UpdateSyndicationData = {
    end_date?: string;
    status?: 'ACTIVE' | 'CLOSED';
};