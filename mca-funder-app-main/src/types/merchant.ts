import { BusinessDetail } from "./businessDetail";
import { Address } from "./address";
import { Contact } from "./contact";
import { Entity } from "./entity";

export type SICDetail = {
    code: string;
    description: string;
};

export type NAICSDetail = {
    code: string;
    title: string;
    description: string;
};

export interface Merchant extends Entity {
    _id: string;
    id: string;
    name: string;
    dba_name: string;
    email: string;
    phone: string;
    website: string;
    sic_detail: SICDetail;
    naics_detail: NAICSDetail;
    business_detail: BusinessDetail;
    address_list: Address[];
    primary_contact: Contact;
    primary_owner: Contact;
    inactive: boolean;

    // virtual fields
    contact_count: number;
    funder_count: number;
    iso_count: number;
    account_count: number;
    
    application_count: number;
    pending_application_count: number;
    funding_count: number;
    active_funding_count: number;
    delayed_funding_count: number;
    slow_payback_funding_count: number;
    completed_funding_count: number;
    default_funding_count: number;
    
    application_request_amount: number;
    pending_application_request_amount: number;
    funding_amount: number;
    active_funding_amount: number;
    delayed_funding_amount: number;
    slow_payback_funding_amount: number;
    completed_funding_amount: number;
    default_funding_amount: number;


    // System fields
    __v: number;
    createdAt: string;
    updatedAt: string;
};

export type MerchantResponse = {
    success: boolean;
    data: {
        docs: Merchant[];
    };
};

export type MerchantAccount = {
    _id: string;
    merchant: {
        _id: string;
        name: string;
        email?: string;
        phone?: string;
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
};


