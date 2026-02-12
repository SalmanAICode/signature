import { Funder } from "./funder";
import { Funding } from "./funding";
import { Merchant } from "./merchant";
import { User } from "./user";
import { BankAccount } from './bankAccount';

interface PaybackPlanMerchantAccount {
    _id: string;
    merchant: string;
    name: string;
}

interface PaybackPlanFunderAccount {
    _id: string;
    funder: string;
    name: string;
}

export interface PaybackPlan {
    _id: string;
    createdAt: string;
    updatedAt: string;
    funding: Funding | string;
    merchant: string | Merchant;
    funder: string | Funder;
    merchant_account: string | PaybackPlanMerchantAccount;
    funder_account: string | PaybackPlanFunderAccount;
    payment_method: 'ACH' | 'WIRE' | 'CHECK' | 'Credit Card' | 'Other';
    ach_processor?: 'ACHWorks' | 'Actum' | 'Manual' | 'Other' | string;
    total_amount: number;
    payback_count: number;
    start_date: string;
    end_date?: string;
    next_payback_date?: string;
    created_by_user?: string | User;
    updated_by_user?: string | User | null;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'Daily' | 'Weekly' | 'Monthly';
    payday_list?: (string | number)[];
    distribution_priority?: 'FUND' | 'FEE' | 'BOTH';
    note?: string;
    status: 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'COMPLETED';

    // Calculated fields
    submitted_count?: number;
    processing_count?: number;
    failed_count?: number;
    succeed_count?: number;
    bounced_count?: number;
    disputed_count?: number;

    submitted_amount?: number;
    processing_amount?: number;
    failed_amount?: number;
    succeed_amount?: number;
    bounced_amount?: number;
    disputed_amount?: number;

    paid_amount?: number;
    pending_amount?: number;
    pending_count?: number;
    remaining_balance?: number;
    remaining_count?: number;

    succeed_rate?: number;
    next_payback_amount?: number;

    term_length?: number;
    scheduled_end_date?: string;
    expected_end_date?: string;
    
    _calculatedStatsComplete?: boolean;

    // System fields
    __v: number;
}

export type PaybackPlanCreatePayload = Omit<
    PaybackPlan,
    | '_id'
    | 'createdAt'
    | 'updatedAt'
    | 'remaining_balance'
    | 'next_payback_date'
    | 'next_payback_amount'
    | 'merchant'
    | 'funder'
    | '__v'
>
