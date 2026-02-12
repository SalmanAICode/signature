export interface FunderMerchantUser {
    _id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_mobile?: string;
  }
  
  export interface FunderMerchantFunder {
    _id: string;
    name: string;
    email: string;
    phone: string;
  }
  
  export interface FunderMerchantMerchant {
    _id: string;
    name: string;
    dba_name?: string;
    email?: string;
    phone?: string;
  }
  
  export interface FunderMerchant {
    _id: string;
    merchant: FunderMerchantMerchant | null;
    funder: FunderMerchantFunder;
    assigned_manager?: FunderMerchantUser;
    assigned_user?: FunderMerchantUser;
    inactive: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
  } 