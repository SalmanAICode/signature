import { Funder } from "./funder";
import { ISO } from "./iso";

export type CommissionFormula = {
    _id: string;
    name: string;
}


export interface IsoFunder {
  _id: string;
  iso: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  } | string;
  funder: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  } | string;
  commission_formula?: {
    _id: string;
    name: string;
  };
  inactive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface PaginatedIsoFunderResponse {
  docs: IsoFunder[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
}