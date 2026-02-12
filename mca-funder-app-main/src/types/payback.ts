export interface MerchantAccount {
  name: string;
  bank_name: string;
  routing_number: string;
  account_number: string;
  account_type: string;
  branch: string;
  dda: string;
}

export interface FunderAccount extends MerchantAccount {
  available_balance: number;
}

export interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_mobile: string;
}

export interface Payback {
  _id: string;
  funding: {
    _id: string;
    name: string;
  };
  merchant: {
    _id: string;
    email: string;
    phone: string;
    name: string;
  };
  funder: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  merchant_account: MerchantAccount;
  funder_account: FunderAccount;
  payback_plan: string;
  due_date?: string;
  submitted_date: string;
  processed_date?: string;
  responsed_date?: string;
  response?: string;
  amount: number;
  payback_amount?: number;
  funded_amount?: number;
  fee_amount?: number;
  credit_amount?: number;
  payment_method: string;
  ach_processor: string;
  status: string;
  note: string;
  reconciled: boolean;
  createdAt: string;
  updatedAt: string;
  created_by_user?: User;
  updated_by_user?: User;
  payout_count: number;
  log_count: number;
}

export interface PaybackResponse {
  success: boolean;
  data: {
    docs: Payback[];
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      totalResults: number;
    };
  };
}
