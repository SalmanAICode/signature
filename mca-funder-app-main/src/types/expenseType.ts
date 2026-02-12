import { Funder } from "./funder";
import { Formula } from "./formula";

export interface ExpenseType {
    _id: string;
    funder: string | Funder;
    name: string;
    formula?: string | Formula;
    commission?: boolean;
    syndication?: boolean;
    default?: boolean;
    inactive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
}

export interface CreateExpenseTypeData {
    name: string;
    funder?: string;
    formula?: string;
    commission?: boolean;
    syndication?: boolean;
    default?: boolean;
}

export interface UpdateExpenseTypeData {
    name?: string;
    funder?: string;
    formula?: string;
    commission?: boolean;
    syndication?: boolean;
    default?: boolean;
    inactive?: boolean;
}