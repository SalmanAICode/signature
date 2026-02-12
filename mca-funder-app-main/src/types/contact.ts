import { Address } from "./address";
import { User } from "./user";

export interface Contact extends User {
    _id: string;
    title: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_mobile?: string;
    phone_work?: string;
    phone_home?: string;
    fico_score?: number;
    birthday?: string;
    dln_issue_date?: string;
    dln_issue_state?: string;
    address_detail?: Address;
    created_date: string;
    updated_date: string;
    last_login?: string;
    online: boolean;
    inactive: boolean;
    __v: number;
    id: string;
    ssn?: string;
    drivers_license_number?: string;
    merchants?: string[];
    merchant_count?: number;
    access_log_count?: number;
    createdAt?: string;
    updatedAt?: string;
    password?: string;
}

export interface ContactResponse {
    success: boolean;
    data: Contact;
}

export interface ContactsResponse {
    success: boolean;
    data: {
        docs: Contact[];
        pagination: {
            page: number;
            limit: number;
            totalPages: number;
            totalResults: number;
        }
    }
}

export interface CreateContactData {
    title: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_mobile?: string;
    phone_work?: string;
    phone_home?: string;
    fico_score?: number;
    birthday?: string;
    dln_issue_date?: string;
    dln_issue_state?: string;
    address_detail?: Address;
    ssn?: string;
    drivers_license_number?: string;
    merchants?: string[];
    password?: string;
}

export interface UpdateContactData {
    title?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_mobile?: string;
    phone_work?: string;
    phone_home?: string;
    fico_score?: number;
    birthday?: string;
    dln_issue_date?: string;
    dln_issue_state?: string;
    address_detail?: Address;
    ssn?: string;
    drivers_license_number?: string;
    merchants?: string[];
    inactive?: boolean;
}