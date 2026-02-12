import { Address } from "./address";
import { User } from "./user";

export type RepresentativeType = 'iso_manager' | 'iso_sales';

export interface Representative extends User {
  _id: string;
  title?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_mobile: string;
  phone_work?: string;
  phone_home?: string;
  birthday?: string;
  address_detail?: Address;
  type: RepresentativeType;
  last_login?: string;
  online?: boolean;
  inactive: boolean;

  __v: number;

  iso_count?: number;
  access_log_count?: number;


  createdAt: string;
  updatedAt: string;
}