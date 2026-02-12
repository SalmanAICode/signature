import { Funder } from "./funder";

export interface StipulationType {
    _id: string;
    funder: Funder;
    name: string;
    required?: boolean;
    inactive: boolean;
    createdAt?: string;
    updatedAt?: string;
    __v: number;
}

export interface StipulationTypeResponse {
    success: boolean;
    data: StipulationType;
}

export interface StipulationTypesResponse {
    success: boolean;
    data: {
        docs: StipulationType[];
        pagination: {
            page: number;
            limit: number;
            totalPages: number;
            totalResults: number;
        }
    }
}

export interface CreateStipulationType {
    funder: string;
    name: string;
    required?: boolean;
}

export interface UpdateStipulationType {
    name?: string;
    required?: boolean;
    inactive?: boolean;
}







