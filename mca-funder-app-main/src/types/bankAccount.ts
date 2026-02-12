export enum AccountType {
  CHECKING = 'CHECKING',
  SAVING = 'SAVING',
  CASH = 'CASH',
  OTHER = 'OTHER'
}

export interface BankAccount {
  _id?: string;
  name: string;
  bank_name: string;
  routing_number: string;
  account_number: string;
  account_type: AccountType;  
  branch?: string;
  dda?: string;
  available_balance?: number;
}