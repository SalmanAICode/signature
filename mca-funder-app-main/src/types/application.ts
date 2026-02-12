// Application related type definitions

import { Funder } from "./funder";
import { ISO } from "./iso";
import { Contact } from "./contact";
import { Merchant } from "./merchant";
import { Status } from "./status";
import { Syndicator } from "./syndicator";
import { User } from "./user";
import { Representative } from "./representative";


export const applicationTypeList = [
  'NEW',
  'RENEWAL',
  'RESUBMISSION',
  'RENEWAL_RESUBMISSION',
] as const;

// Application type options
export type ApplicationType = (typeof applicationTypeList)[number];

export interface Application {
  id: string;
  _id: string;
  name: string;
  merchant?:  Merchant;
  contact?: Contact;
  funder?:  Funder;
  iso?: ISO;
  representative?: Representative;
  syndicator?: Syndicator;

  priority: boolean;
  type: ApplicationType;

  assigned_manager: User;
  assigned_user: User;
  follower_list: User[];
  internal: boolean;
  request_amount: number;
  request_date: string;
  status: Status;
  status_date: string;
  declined_reason: string;
  closed: boolean;
  inactive: boolean;



  createdAt?: string;
  updatedAt?: string;

  stipulation_list: string[];
  document_list?: { document: string; stipulation?: string; }[];


  document_count: number;
  offer_count: number;
  history_count: number;
  stipulation_count: number;
  requested_stipulation_count: number;
  uploaded_document_count: number;
  generated_document_count: number;
  checked_stipulation_count: number;
  received_stipulation_count: number;
}


export type CreateApplicationData = {
  merchant: string;
  funder: string;
  iso: string;
  contact: string;
  representative: string;
  name: string;
  priority: boolean;
  internal: boolean;
  request_date: string;
  type: string;
  assigned_user: string;
  assigned_manager: string;
  request_amount: number;
  status?: string;

  stipulation_list?: string[];
  document_list?: {
      document: string;
      stipulation: string;
  }[];
}

export type UpdateApplicationData = {
  name: string;
  priority: boolean;
  type: string;
  assigned_user: string;
  // request_amount: number;
  stipulation_list?: string[];
  status?: string;
  document_list?: {
      document: string;
      stipulation: string;
  }[];
  follower_list?: string[];
}


export type GetApplicationListParams = {
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
  page?: number;
  limit?: number;
  include_inactive?: boolean;
  search?: string | null;
  iso?: string | null;
};

export type GetApplicationParams = {
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
  page?: number;
  limit?: number;
  include_inactive?: boolean;
  search?: string | null;
  funder?: string;
  lender?: string;
  merchant?: string;
  iso?: string;
};



