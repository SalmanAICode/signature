import { Address } from "./address";
import { Funder } from "./funder";

export type BusinessDetail = {
    ein: string;
    entity_type: string;
    incorporation_date: string;
    state_of_incorporation: string;
} 

export type GetSyndicatorParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    include_inactive?: boolean;
    search?: string;
};

export type Syndicator = {
    id: string;
    _id: string;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_mobile: string;
    phone_work: string;
    phone_home: string;
    ssn: string;
    birthday: string;
    drivers_license_number: string;
    dln_issue_date: string;
    dln_issue_state: string;
    address_detail: Address;
    business_detail: BusinessDetail;
    inactive: boolean;

    // virtual fields
    access_log_count: number;
    funder_count: number;
    account_count: number;
    total_available_balance: number;

    syndication_offer_count: number;
    pending_syndication_offer_count: number;
    accepted_syndication_offer_count: number;
    declined_syndication_offer_count: number;
    cancelled_syndication_offer_count: number;

    syndication_offer_amount: number;
    pending_syndication_offer_amount: number;
    accepted_syndication_offer_amount: number;
    declined_syndication_offer_amount: number;
    cancelled_syndication_offer_amount: number;

    syndication_count: number;
    active_syndication_count: number;
    closed_syndication_count: number;

    syndication_amount: number;
    active_syndication_amount: number;
    closed_syndication_amount: number;

    // system fields
    createdAt: string;
    updatedAt: string;
    __v: number;
}



export type CreateSyndicatorData = {
    name: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_mobile?: string;
    phone_work?: string;
    phone_home?: string;
    birthday?: string; // Date as string
    ssn?: string;
    drivers_license_number?: string; // Note: drivers_license_number not driver_license_number
    dln_issue_date?: string; // Date as string
    dln_issue_state?: string;
    address_detail?: Address;
    business_detail?: BusinessDetail;
    password?: string;
    funder_list?: string[]; // Array of funder IDs
}

export type UpdateSyndicatorData = {
    _id?: string; // Add _id field for update operations
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_mobile?: string;
    phone_work?: string;
    phone_home?: string;
    birthday?: string; // Date as string
    ssn?: string;
    drivers_license_number?: string;
    dln_issue_date?: string; // Date as string
    dln_issue_state?: string;
    address_detail?: Address;
    business_detail?: BusinessDetail;
    inactive?: boolean;
}


// TODO: move this type to a separate file

export type SyndicatorFunder = {
    _id: string;
    syndicator: Syndicator | string;
    funder: Funder | {
        _id: string;
        name: string;
        email: string;
        phone: string;
    };
    available_balance: number;
    payout_frequency: string;
    next_payout_date: string;
    inactive: boolean;
    __v: number;
    pending_balance?: number;
    id?: string;
}


export type GetSyndicatorFunderParams = {
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
  page?: number;
  limit?: number;
  include_inactive?: boolean;
  syndicator?: string;
  funder?: string;
};