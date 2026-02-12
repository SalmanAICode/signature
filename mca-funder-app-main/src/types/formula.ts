import { Funder } from "./funder";
import { BaseItem } from "./baseItem"
import { Calculate } from "./calculate"
import { Tier, TierList } from "./tier"

// Tier configuration for formula calculations
export interface FormulaTier {
    min_number?: number | null;
    max_number?: number | null;
    amount?: number | null;      // For fixed amount calculations
    percent?: number | null;     // For percentage calculations
}

// Main Formula interface
export interface Formula {
    _id: string;
    funder: Funder;
    name: string;
    calculate_type: Calculate;
    base_item?: BaseItem;
    tier_type?: Tier;
    tier_list: TierList[];
    shared?: boolean;
    inactive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
}

// Create formula request interface
export interface CreateFormulaData {
    funder: string;
    name: string;
    calculate_type: Calculate;
    base_item?: BaseItem;
    tier_type?: Tier;
    tier_list: TierList[];
    shared?: boolean;
    inactive?: boolean;
}

// Update formula request interface
export interface UpdateFormulaData {
    name: string;
    calculate_type: Calculate;
    base_item?: BaseItem;
    tier_type?: Tier;
    tier_list: TierList[];
    shared?: boolean;
    inactive?: boolean;
}

// Get formulas parameters interface
export interface GetFormulaParams {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    include_inactive?: boolean;
    include_private?: boolean;
    search?: string | null;
    funder?: string | null;
}