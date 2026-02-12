import { Address } from "./address";
import { Entity } from "./entity";
import { Representative } from "./representative";
import { BusinessDetail } from "./businessDetail";

export interface ISO extends Entity {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    website?: string;
    business_detail?: BusinessDetail;
    address_list?: Address[];
    primary_representative?: Representative;
    inactive: boolean;

    representative_count?: number;
    funder_count?: number;
    merchant_count?: number;
    account_count?: number;

    application_count?: number;
    pending_application_count?: number;
    funding_count?: number;
    active_funding_count?: number;
    delayed_funding_count?: number;
    slow_payback_funding_count?: number;
    completed_funding_count?: number;
    defaulted_funding_count?: number;

    application_request_amount?: number;
    pending_application_request_amount?: number;
    funding_amount?: number;
    active_funding_amount?: number;
    delayed_funding_amount?: number;
    slow_payback_funding_amount?: number;
    completed_funding_amount?: number;
    default_funding_amount?: number;

    commission_count?: number;
    pending_commission_count?: number;
    paid_commission_count?: number;
    cancelled_commission_count?: number;

    commission_amount?: number;
    pending_commission_amount?: number;
    paid_commission_amount?: number;
    cancelled_commission_amount?: number;

    created_date: string;
    updated_date: string;

    __v: number;
    id: string;
}

export interface ISOResponse {
    success: boolean;
    data: ISO;
}

export interface ISOsResponse {
    success: boolean;
    data: {
        docs: ISO[];
        pagination: {
            page: number;
            limit: number;
            totalPages: number;
            totalResults: number;
        }
    }
}

export interface ISOAccount {
    _id: string;
    iso: {
        _id: string;
        name: string;
        email: string;
        phone: string;
        available_balance: number;
        id: string;
    };
    name: string;
    bank_name: string;
    routing_number: string;
    account_number: string;
    account_type: string;
    branch: string;
    dda: string;
    available_balance: number;

    __v: number;
    transaction_list: Record<string, any>;
    id: string;
}

export interface ISOAccountsResponse {
    success: boolean;
    data: {
        docs: ISOAccount[];
        pagination: {
            page: number;
            limit: number;
            totalPages: number;
            totalResults: number;
        }
    }
} 