import { User } from "./user";
import { BankAccount } from "./bankAccount";

interface CommissionIntentInfo {
  _id: string;
  funding: string;
  commission_date: string;
  amount: number;
  note?: string;
}

export interface Commission {
  _id: string;
  commission_intent: CommissionIntentInfo;
  funder_account: string;
  iso_account: string;
  payment_method: 'ACH' | 'WIRE' | 'CHECK' | 'OTHER';
  ach_processor: 'ACHWorks' | 'Actum' | 'Manual' | 'Other';
  submitted_date?: string;
  processed_date?: string;
  responsed_date?: string;
  created_date?: string;
  hit_date?: string;
  response_date?: string;
  amount: number;
  status: 'SUBMITTED' | 'PROCESSING' | 'SUCCEED' | 'FAILED';
  transaction?: string;
  created_by_user?: User;
  updated_by_user?: User | null;
  reconciled: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface GetCommissionListParams {
  commission_intent?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  include_inactive?: boolean;
  status?: string;
}

export interface GetCommissionParams extends GetCommissionListParams {
  page?: number;
  limit?: number;
}

export interface CreateCommissionParams {
  commission_intent: string;
  funder_account: string;
  iso_account: string;
  payment_method: 'ACH' | 'WIRE' | 'CHECK' | 'OTHER';
  ach_processor: 'ACHWorks' | 'Actum' | 'Manual' | 'Other';
  submitted_date?: string;
  responsed_date?: string;
  amount: number;
  status: 'SUBMITTED' | 'PROCESSING' | 'SUCCEED' | 'FAILED';
  reconciled?: boolean;
}

export interface UpdateCommissionParams {
  funder_account?: BankAccount;
  iso_account?: BankAccount;
  payment_method?: 'ACH' | 'WIRE' | 'CHECK' | 'OTHER';
  ach_processor?: 'ACHWorks' | 'Actum' | 'Manual' | 'Other';
  submitted_date?: string;
  responsed_date?: string;
  amount?: number;
  status?: 'SUBMITTED' | 'PROCESSING' | 'SUCCEED' | 'FAILED';
  reconciled?: boolean;
} 