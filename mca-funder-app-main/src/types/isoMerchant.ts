import { Merchant } from "./merchant";
import { ISO } from "./iso";

export interface IsoMerchant {
  _id: string;
  iso: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  } | string;
  merchant: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  } | string;
  inactive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}