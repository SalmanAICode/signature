import { StipulationType } from "./stipulationType";
import { User } from "./user";
import { Document } from "./document";

// Status of the stipulation, Enum: ['REQUESTED', 'RECEIVED', 'VERIFIED', 'WAIVED']
export const applicationStipulationStatus = [
    'REQUESTED',
    'RECEIVED',
    'VERIFIED',
    'WAIVED',
] as const;

export type ApplicationStipulationStatus = (typeof applicationStipulationStatus)[number];

export interface ApplicationStipulation {
    _id: string;
    application: string;
    stipulation_type?: StipulationType;
    status: ApplicationStipulationStatus;
    status_date: string;
    __v: number;
    document_count: number;
    document_list: Document[];
    createdAt: string;
    updatedAt: string;
    note?: string;

    checked_by_user?: User;
    latest_upload: null;
    _calculatedStatsComplete: boolean;
}

export interface CreateApplicationStipulationData {
    stipulation_type: string;
    status: ApplicationStipulationStatus;
    note: string;
}

export interface UpdateApplicationStipulationData {
    status?: ApplicationStipulationStatus;
    note?: string;
    stipulation_type?: string;
}