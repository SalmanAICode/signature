// Types for syndication offer entities

import { User } from ".";
import { ApiResponse } from "./api";
import { Funder } from "./funder";
import { Lender } from "./lender";
import { Syndicator } from "./syndicator";
import { ExpenseItem, FeeItem } from "./syndication";


interface Funding {
  _id: string;
  id: string;
  name: string;
  funded_amount: number;
  payback_amount: number;
}


export const syndicationOfferStatusList = [
  'SUBMITTED',
  'DECLINED',
  'ACCEPTED',
  'CANCELLED',
  'EXPIRED',
] as const;

export type SyndicationOfferStatus = (typeof syndicationOfferStatusList)[number];

type UserType = {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface SyndicationOffer {
  _id: string;
  funding: Funding;
  syndicator: Syndicator;
  funder: Funder;
  lender?: Lender;
  participate_amount: number;
  management_percent: number;
  status: SyndicationOfferStatus;
  offered_date: string;
  expired_date?: string;
  status_date: string;
  status_data: string;
  created_by_user: string | UserType;
  updated_by_user: string | UserType;
  inactive: boolean;
  createdAt: string;
  updatedAt: string;
  total_funded_amount: number;
  total_payback_amount: number;
  total_commission_amount: number;

  factor_rate: number;
  buy_rate: number;
  participate_percent: number;
  syndicated_amount: number;
  commission_amount: number;
  payback_amount: number;
  _calculatedStatsComputed: boolean;
  __v: number;

  // Fee and Credit related fields
  fee_list: ExpenseItem[];
  credit_list: FeeItem[];
  total_fee_amount: number;
  total_credit_amount: number;
  upfront_fee_amount: number;
  upfront_credit_amount: number;
  recurring_fee_amount: number;
  recurring_credit_amount: number;
}

// Types for creating syndication offers
export interface CreateSyndicationOfferData {
  funding: string; // funding ID
  syndicator: string; // syndicator ID
  participate_percent: number;
  participate_amount: number;
  payback_amount: number;
  fee_list?: [
    {
      name: string | null;
      expense_type: string | null;
      amount: number;
      upfront: boolean;
    }
  ]; // Optional
  credit_list?: [
    {
      name: string | null;
      fee_type: string | null;
      amount: number;
      upfront: boolean;
    }
  ];
  offered_date?: string;
  expired_date?: string;
  status?: SyndicationOfferStatus;
  created_by_user?: string;
}

// Types for updating syndication offers
export interface UpdateSyndicationOfferData {
  participate_percent: number;
  participate_amount: number;
  payback_amount: number;
  fee_list?: ExpenseItem[];
  credit_list?: FeeItem[];
  offered_date?: string;
  expired_date?: string;
  status?: SyndicationOfferStatus;
  inactive?: boolean;
}

// Types for querying syndication offers
export interface GetSyndicationOfferParams {
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
  page?: number;
  limit?: number;
  include_inactive?: boolean;
  search?: string;
  syndicator?: string;
  funder?: string;
  lender?: string;
  funding?: string;
  status?: string;
}

export interface GetSyndicationOfferListParams {
  funding?: string;
  include_inactive?: boolean;
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
  syndicator?: string;
  funder?: string;
  lender?: string;
}
