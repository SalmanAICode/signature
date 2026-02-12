import { Merchant } from "./merchant";
import { Funder } from "./funder";
import { User } from "./user";
import { Application } from "./application";
import { ApplicationOffer } from "./applicationOffer";

export interface UpfrontFee {
  name: string;
  fee_type: { id: string; name: string; formula: string };
  amount: number;
}

export interface FundingFee {
  name?: string;
  fee_type?: string;
  amount: number;
  upfront?: boolean;
}

export interface FundingExpense {
  name?: string;
  expense_type?: string; 
  amount: number;
  commission?: boolean;
  syndication?: boolean;
}

export interface Funding {
  _id: string;
  lender: Funder | { id: string; name: string; email?: string; phone?: string };
  merchant: Merchant | { id: string; name: string; email?: string; phone?: string };
  funder?: Funder | { id: string; name: string; email?: string; phone?: string };
  iso?: { id: string; name: string; email?: string; phone?: string };
  syndicator_list?: any[];
  application?: string | Application;
  application_offer?: string | ApplicationOffer;
  name: string;
  type: string;
  funded_amount: number;
  payback_amount: number;
  upfront_fee_list?: UpfrontFee[];
  fee_list?: FundingFee[]; 
  expense_list?: FundingExpense[]; 
  commission_amount: number;
  current_payback_plan?: string;
  created_by_user?: User | { id: string; name: string };
  updated_by_user?: User | { id: string; name: string };
  status: { name: string; bgcolor?: string } | string; 
  assigned_manager?: User | string; 
  assigned_user?: User | string; // can be user object or user ID
  follower_list?: User[]; // array of User objects (populated)
  internal?: boolean;
  position?: number;
  inactive: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Virtual/system fields
  upfront_fee_amount?: number;
  net_amount?: number;
  factor_rate?: number;
  buy_rate?: number;
  fee_amount?: number;
  fee_count?: number;
  credit_amount?: number;
  credit_count?: number;
  payback_plan_count?: number;
  payback_submitted_count?: number;
  payback_processing_pcount?: number;
  payback_failed_count?: number;
  payback_succeed_count?: number;
  payback_bounced_count?: number;
  payback_disputed_count?: number;
  payback_remaining_count?: number;
  payback_plan_amount?: number;
  payback_submitted_amount?: number;
  payback_processing_amount?: number;
  payback_failed_amount?: number;
  payback_succeed_amount?: number;
  payback_bounced_amount?: number;
  payback_disputed_amount?: number;
  disbursement_succeed_count?: number;
  finalized_offer?: {
    offered_amount?: number;
    payback_amount?: number;
    factor_rate?: number;
    commission_amount?: number;
  };
  disbursement_paid_amount?: number;
  disbursement_unscheduled_amount?: number;
  commission_unscheduled_amount?: number;
  disbursement_remaining_amount?: number;
  paid_amount?: number;
  pending_amount?: number;
  pending_count?: number;
  unschduled_amount?: number;
  remaining_balance?: number;
  remaining_count?: number;
  succeed_rate?: number;
  balance_history_list?: any[];
  syndication_list?: any[];
  payout_list?: any[];
  syndication_offer_list?: any[];
  commission_list?: any[];
  commission_paid_amount?: number;
  followers?: string[];
  payback_remaining_amount?: number;
  syndication_offer_count?: number;
  syndication_offer_amount?: number;
  syndication_count?: number;
  syndication_amount?: number;
  syndication_percent?: number;
  paid_payback_funded_amount?: number;
  paid_payback_fee_amount?: number;
}

export type UpdateFundingData = {
  follower_list?: User[];
}; 