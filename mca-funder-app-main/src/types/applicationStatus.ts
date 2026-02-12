import { Funder } from "./funder";

export interface ApplicationStatus {
    _id: string;
    funder: Funder;
    name: string;
    idx: number;
    initial: boolean;
    approved: boolean;
    closed: boolean;
    system: boolean;
    inactive: boolean;
    bgcolor?: string;
    createdAt?: string;
    updatedAt?: string;
    __v: number;
}

export interface ApplicationStatusResponse {
    success: boolean;
    data: ApplicationStatus;
}

export interface ApplicationStatusesResponse {
    success: boolean;
    data: {
        docs: ApplicationStatus[];
        pagination: {
            page: number;
            limit: number;
            totalPages: number;
            totalResults: number;
        }
    }
}

export interface CreateApplicationStatus {
    funder: string;
    name: string;
    bgcolor?: string;
    initial?: boolean;
    closed?: boolean;
    approved?: boolean;
}

// For updating individual application status (excludes funder field)
export interface UpdateApplicationStatusData {
    name?: string;
    bgcolor?: string;
    initial?: boolean;
    closed?: boolean;
    approved?: boolean;
    inactive?: boolean;
}

export interface UpdateApplicationStatus {
    funder: string;
    ids: string[];
}
