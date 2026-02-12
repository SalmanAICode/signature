import { Funder } from "./funder";
import { Syndicator } from "./syndicator";
import { Funding } from "./funding";
import { Payback } from "./payback";
import { Syndication } from "./syndication";
import { User } from "./user";
import { Lender } from "./lender";

export type GetPayoutListParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    include_inactive?: boolean;
    funding?: string;
    syndication?: string;
    payback?: string;
    funder?: string;
    lender?: string;
    syndicator?: string;
    pending?: boolean;
};

export type Payout = {
    _id: string;
    payback: string | Payback;
    syndication: string | Syndication;
    funding: string | Funding;
    funder: string | Funder;
    lender?: string | Lender;
    syndicator: string | Syndicator;
    payout_amount: number;
    fee_amount: number;
    credit_amount: number;
    created_date: string;
    created_by_user?: string | User;
    redeemed_date?: string;
    pending: boolean;
    inactive: boolean;

    // calculated fields
    available_amount?: number;

    // system fields
    createdAt: string;
    updatedAt: string;
    __v: number;
};