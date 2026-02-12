import { Address } from "./address";

export interface User {
    _id: string;
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_mobile?: string;
    phone_work?: string;
    phone_home?: string;
    birthday?: string;
    address_detail?: Address;
    type: string;
    permission_list?: string[];
    last_login?: string;
    online?: boolean;
    inactive: boolean;

    // virtual fields
    funder_count?: number;
    access_log_count?: number;

    // system fields
    __v: number;
    updatedAt?: string;
    createdAt?: string;


    // Frontend Custom fields
    funder_list?: Array<{
        funder: {
            _id: string;
            name: string;
        };
        role_list: Array<{
            _id: string;
            name: string;
        }>;
        inactive: boolean;
    }>;
}

export interface UserResponse {
    success: boolean;
    data: User;
}

export interface UsersResponse {
    success: boolean;
    data: {
        docs: User[];
        pagination: {
            page: number;
            limit: number;
            totalPages: number;
            totalResults: number;
        }
    }
}

export interface CreateUserData {
    first_name: string;
    last_name: string;
    email: string;
    phone_mobile: string;
    phone_work?: string;
    phone_home?: string;
    birthday?: string;
    address_detail?: Address;
    type: string;
    permission_list?: string[];
    password: string;
    funder_list?: string[];
}

export interface UpdateUserData {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_mobile?: string;
    phone_work?: string;
    phone_home?: string;
    birthday?: string;
    address_detail?: Address;
    type?: string;
    permission_list?: string[];
    inactive?: boolean;
}

