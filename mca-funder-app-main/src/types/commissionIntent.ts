import { User } from "./user";
import { BankAccount } from "./bankAccount";

interface Funding {
  _id: string;
  name: string;
}

interface Entity {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface CommissionIntent {
  _id: string;
  funding: Funding;
  funder: Entity;
  lender: Entity;
  iso: Entity;
  commission_date: string;
  amount: number;
  payment_method?: 'ACH' | 'WIRE' | 'CHECK' | 'OTHER' | null;
  ach_processor?: 'ACHWorks' | 'Actum' | 'Manual' | 'Other' | null;
  funder_account?: BankAccount;
  iso_account?: BankAccount;
  created_by_user?: User;
  updated_by_user?: User;
  note?: string;
  status: 'SCHEDULED' | 'SUBMITTED' | 'SUCCEED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  // Calculated fields (when calculate: true is passed)
  submitted_count?: number;
  processing_count?: number;
  succeed_count?: number;
  failed_count?: number;
  pending_count?: number;
  submitted_amount?: number;
  processing_amount?: number;
  succeed_amount?: number;
  failed_amount?: number;
  paid_amount?: number;
  pending_amount?: number;
  remaining_balance?: number;
  _calculatedStatsComplete?: boolean;
}

export interface CreateCommissionIntent {
  funding: string;
  commission_date: string;
  amount: number;
  funder_account: string;
  iso_account: string;
  payment_method?: 'ACH' | 'WIRE' | 'CHECK' | 'OTHER' | null;
  ach_processor?: 'ACHWorks' | 'Actum' | 'Manual' | 'Other' | null;
  note?: string;
  status?: 'SCHEDULED' | 'SUBMITTED' | 'SUCCEED' | 'FAILED' | 'CANCELLED';
}

export interface UpdateCommissionIntent {
  funder?: Entity;
  lender?: Entity;
  iso?: Entity;
  commission_date?: string;
  amount?: number;
  payment_method?: 'ACH' | 'WIRE' | 'CHECK' | 'OTHER' | null;
  ach_processor?: 'ACHWorks' | 'Actum' | 'Manual' | 'Other' | null;
  funder_account?: string;
  iso_account?: string;
  note?: string;
  status?: 'SCHEDULED' | 'SUBMITTED' | 'SUCCEED' | 'FAILED' | 'CANCELLED';
} 