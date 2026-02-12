import { Merchant } from "./merchant";
import { Funder } from "./funder";
import { ISO } from "./iso";
import { Application } from "./application";
import { User } from "./user";
import { Lender } from "./lender";
import { ExpenseType } from "./expenseType";
import { FeeType } from "./feeType";

interface Fee {
  name?: string;
  fee_type?: FeeType | string;
  amount: number;
  upfront?: boolean;
}

interface Expense {
  name?: string;
  expense_type?: ExpenseType | string;
  amount: number;
  commission?: boolean;
  syndication?: boolean;
}

// Don't change the order of the lis, it is used for Create  Offer Form
export const FrequencyTypeList = [
  'DAILY', 'WEEKLY' , 'MONTHLY'
] as const;

export const ApplicationOfferStatusList = [
  'OFFERED', 'ACCEPTED' , 'DECLINED' , 'CANCELLED'
] as const;



export type FrequencyType = (typeof FrequencyTypeList)[number];
export type ApplicationOfferStatus = (typeof ApplicationOfferStatusList)[number];



export interface ApplicationOffer {
  _id: string;
  merchant: Merchant; 
  funder: Funder;
  lender: Lender;
  iso: ISO;
  application: Application;
  offered_amount: number;
  payback_amount: number;

  fee_list: Fee[];
  expense_list: Expense[];
  // Unused fields
  expense_amount?: number;

  
  installment: number;
  frequency: FrequencyType;
  payday_list?: number[];

  avoid_holiday: boolean;

  commission_amount?: number;
  payback_count: number;

  offered_date: string;
  offered_by_user: User;
  updated_by_user: User;
  decided_by_contact: User;
  status: ApplicationOfferStatus;
  inactive: boolean;


  __v: number;
  // virtual fields
  fee_amount: number;
  disbursement_amount: number;
  payment_amount: number;
  term_length: number;
  factor_rate: number;
  buy_rate: number;

  // System maintained fields
  createdAt?: string;
  updatedAt?: string;
}

export type CreateApplicationOfferParams = {
  application: string;
  lender: string;
  offered_amount: number;
  payback_count: number;
  payback_amount: number;
  fee_list?: Fee[];
  expense_list?: Expense[];
  frequency: FrequencyType;
  payday_list: number[];
  avoid_holiday: boolean;
  commission_amount?: number;
  offered_date?: string;
  offered_by_user?: string;
};

export type UpdateApplicationOfferParams = {
  offered_amount?: number;
  payback_count?: number;
  payback_amount?: number;
  fee_list?: Fee[];
  expense_list?: Expense[];
  frequency?: FrequencyType;
  payday_list?: number[];
  avoid_holiday?: boolean;
  commission_amount?: number;
  status?: ApplicationOfferStatus;
};