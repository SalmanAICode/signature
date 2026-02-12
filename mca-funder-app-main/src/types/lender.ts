import { Address } from "./address";
import { BusinessDetail } from "./businessDetail";

export const LenderTypeList = ['internal', 'external'] as const;

export type LenderType = (typeof LenderTypeList)[number];

export interface Lender {
    _id: string;
    id: string;
    name: string;
    email: string;
    phone: string;
    type: LenderType;
    website: string;
    business_detail: BusinessDetail;
    address_detail: Address;
    inactive: boolean;
    application_offer_count: number;
    funding_count: number;
    user_count: number;
    account_count: number;
    available_balance: number;
    createdAt: string;
    updatedAt: string;

    user_list: string[];
}