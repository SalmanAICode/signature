import { Entity } from "./entity";

export interface Funder extends Entity {
    _id: string;
    name: string;
    email: string;
    phone: string;
    website?: string;
    business_detail?: {
        ein: string;
        entity_type: string;
        incorporation_date: string;
        state_of_incorporation: string;
    };
    address?: {
        address_1: string;
        address_2?: string;
        city: string;
        state: string;
        zip: string;
    };
    bgcolor?: string;
    import?: {
        source?: string;
        api_key?: string;
        client_name?: string;
    };
    inactive: boolean;
    created_date: string;
    updated_date: string;
    __v: number;
    user_count: number;
    iso_count: number;
    merchant_count: number;
    syndicator_count: number;
    application_count: number;
    pending_application_count: number;
    account_count: number;
    account_list: FunderAccount[];
    available_balance: number;
    user_list?: string[];
    id: string;
}

export interface FunderAccount {
    _id: string;
    funder: {
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
    inactive: boolean;
    __v: number;
    transaction_list: Record<string, any>;
    id: string;
}

export interface FunderResponse {
    success: boolean;
    data: {
        docs: Funder[];
        pagination: {
            page: number;
            limit: number;
            totalPages: number;
            totalResults: number;
        }
    }
}

export interface CreateFunderData {
    name: string;
    email: string;
    phone: string;
    website?: string;
    business_detail?: {
        ein: string;
        entity_type: string;
        incorporation_date: string;
        state_of_incorporation: string;
    };
    address?: {
        address_1: string;
        address_2?: string;
        city: string;
        state: string;
        zip: string;
    };
    address_detail?: {
        address_1: string;
        address_2?: string;
        city: string;
        state: string;
        zip: string;
    };
    bgcolor?: string;
    import?: {
        source?: string;
        api_key?: string;
        client_name?: string;
    };
    user_list?: string[];
}

export interface UpdateFunderData {
    name?: string;
    email?: string;
    phone?: string;
    website?: string;
    business_detail?: {
        ein?: string;
        entity_type?: string;
        incorporation_date?: string;
        state_of_incorporation?: string;
    };
    address?: {
        address_1?: string;
        address_2?: string;
        city?: string;
        state?: string;
        zip?: string;
    };
    user_list?: string[];
    inactive?: boolean;
}

export interface FunderAccountsResponse {
    success: boolean;
    data: {
        docs: FunderAccount[];
        pagination: {
            page: number;
            limit: number;
            totalPages: number;
            totalResults: number;
        }
    }
} 