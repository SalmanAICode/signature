import { create } from 'zustand';
import { Funder } from '@/types/funder';
import { Merchant } from '@/types/merchant';
import { ISO } from '@/types/iso';
import { Application } from '@/types/application';
import { ApplicationOffer } from '@/types/applicationOffer';
import isEqual from 'fast-deep-equal';

interface UpfrontFee {
  fee_type_id: string;
  fee_type_name: string;
  fee_amount: string;
}

interface Disbursement {
  date: string;
  amount: number;
  funderAccount: string;
  merchantAccount: string;
  method: 'WIRE' | 'ACH';
  achProcessor: string;
}

interface CommissionDisbursement {
  date: string;
  amount: number;
  funderAccount: string;
  isoAccount: string;
  method: 'WIRE' | 'ACH';
  achProcessor: string;
}

interface PaybackPlan {
  merchant_account: string;
  funder_account: string;
  payment_method: 'ACH' | 'WIRE' | 'CHECK';
  ach_processor: string;
  total_amount: number;
  payback_count: number;
  start_date: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  payday_list: number[];
}

interface FundingFormState {
  // Step 1: Select Entities
  lender: string;
  merchant: string;
  iso: string;
  application: string;
  application_offer: string;
  
  // Step 2: Basic Info
  name: string;
  type: string;
  status: string;
  funded_amount: string;
  payback_amount: string;
  upfront_fee_list: UpfrontFee[];
  commission_amount: string;
  
  // Step 3: Payback Plan
  paybackPlan: PaybackPlan | null;
  
  // Step 4: Disbursement
  disbursements: Disbursement[];
  
  // Step 5: Commission
  commissionDisbursements: CommissionDisbursement[];
  
  // Lists
  funders: Funder[];
  merchants: Merchant[];
  isos: ISO[];
  applications: Application[];
  offers: ApplicationOffer[];
  
  // Funding ID
  fundingId: string | null;
  
  // Actions
  setStep1Data: (data: {
    lender: string;
    merchant: string;
    iso: string;
    application: string;
    application_offer: string;
  }) => void;
  
  setStep2Data: (data: {
    name: string;
    type: string;
    status: string;
    funded_amount: string;
    payback_amount: string;
    upfront_fee_list: UpfrontFee[];
    commission_amount: string;
  }) => void;
  
  setPaybackPlan: (plan: PaybackPlan) => void;
  
  setDisbursements: (disbursements: Disbursement[]) => void;
  
  setCommissionDisbursements: (disbursements: CommissionDisbursement[]) => void;
  
  setLists: (data: {
    funders: Funder[];
    merchants: Merchant[];
    isos: ISO[];
    applications: Application[];
    offers: ApplicationOffer[];
  }) => void;
  
  setFundingId: (id: string) => void;
  
  resetForm: () => void;
}

const initialState: FundingFormState = {
  // Step 1
  lender: '',
  merchant: '',
  iso: '',
  application: '',
  application_offer: '',
  
  // Step 2
  name: '',
  type: 'NEW',
  status: 'CREATED',
  funded_amount: '',
  payback_amount: '',
  upfront_fee_list: [{ fee_type_id: '', fee_type_name: '', fee_amount: '' }],
  commission_amount: '',
  
  // Step 3
  paybackPlan: null,
  
  // Step 4
  disbursements: [{
    date: '',
    amount: 0,
    funderAccount: '',
    merchantAccount: '',
    method: 'WIRE' as const,
    achProcessor: '',
  }],
  
  // Step 5
  commissionDisbursements: [{
    date: '',
    amount: 0,
    funderAccount: '',
    isoAccount: '',
    method: 'WIRE' as const,
    achProcessor: '',
  }],
  
  // Lists
  funders: [],
  merchants: [],
  isos: [],
  applications: [],
  offers: [],
  
  // Funding ID
  fundingId: null,
  
  // Actions
  setStep1Data: () => {},
  setStep2Data: () => {},
  setPaybackPlan: () => {},
  setDisbursements: () => {},
  setCommissionDisbursements: () => {},
  setLists: () => {},
  setFundingId: () => {},
  resetForm: () => {},
};

export const useFundingFormStore = create<FundingFormState>((set) => ({
  ...initialState,
  
  setStep1Data: (data) => set((state) => ({
    ...state,
    ...data,
  })),
  
  setStep2Data: (data) => set((state) => ({
    ...state,
    ...data,
  })),
  
  setPaybackPlan: (plan) => set((state) => {
    if (isEqual(state.paybackPlan, plan)) return state; // no-op if equal
    return { ...state, paybackPlan: plan };
  }),
  
  setDisbursements: (disbursements) => set((state) => ({
    ...state,
    disbursements,
  })),
  
  setCommissionDisbursements: (disbursements) => set((state) => ({
    ...state,
    commissionDisbursements: disbursements,
  })),
  
  setLists: (data) => set((state) => ({
    ...state,
    ...data,
  })),
  
  setFundingId: (id) => set((state) => {
    const newState = {
      ...state,
      fundingId: id,
    };
    return newState;
  }),
  
  resetForm: () => set(initialState),
})); 