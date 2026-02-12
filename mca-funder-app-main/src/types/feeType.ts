import { Funder } from "./funder";
import { Formula } from "./formula";

export interface FeeType {
    id: string;
    _id: string;
    funder: string | Funder;
    name: string;
    formula?: string | Formula;
    upfront?: boolean;
    inactive: boolean;

    default?: boolean;
    createdAt?: string;
    updatedAt?: string;
    __v: number;
}

export interface FeeTypeResponse {
    success: boolean;
    data: FeeType;
}

export interface FeeTypesResponse {
    success: boolean;
    data: {
        docs: FeeType[];
        pagination: {
            page: number;
            limit: number;
            totalPages: number;
            totalResults: number;
        }
    }
}

export interface CreateFeeType {
    funder: string;
    name: string;
    formula?: string;
    default?: boolean;
    upfront?: boolean;
}

export interface UpdateFeeType {
    name?: string;
    formula?: string;
    upfront?: boolean;
    inactive?: boolean;
    default?: boolean;
}