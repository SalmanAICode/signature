import { User } from "./user";
import { BankAccount } from "./bankAccount";

interface DisbursementIntentInfo {
  _id: string;
  funding: string;
  disbursement_date: string;
  amount: number;
  note?: string;
}

export interface Disbursement {
  _id: string;
  disbursement_intent: DisbursementIntentInfo | null;
  funder_account: BankAccount;
  lender_account?: BankAccount;
  merchant_account: BankAccount;
  payment_method: 'ACH' | 'WIRE' | 'CHECK' | 'OTHER';
  ach_processor: 'ACHWorks' | 'Actum' | 'Manual' | 'Other';
  submitted_date: string;
  processed_date?: string;
  responsed_date?: string;
  amount: number;
  status: 'SUBMITTED' | 'PROCESSING' | 'SUCCEED' | 'FAILED';
  created_by_user?: User;
  updated_by_user?: User | null;
  reconciled: boolean;
  transaction?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
} 