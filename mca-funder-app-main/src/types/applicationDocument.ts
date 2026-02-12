// Application Document types based on the API response structure

import { Document } from "./document";
import { ApplicationStipulation } from "./applicationStipulation";

export interface ApplicationInfo {
  merchant: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  iso: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  _id: string;
  name?: string;
  id?: string;
}

export interface ApplicationDocument {
  _id: string;
  application_stipulation?: ApplicationStipulation;
  /** Stipulation type name when not linked to application_stipulation (e.g. "Bank Draft") */
  document_type?: string;
  document: Document;
  application: string;
  __v: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicationOfferDocument {
  _id: string;
  application_stipulation?: ApplicationStipulation;
  /** Stipulation type name when not linked to application_stipulation (e.g. "Bank Draft") */
  document_type?: string;
  document: Document;
  application: string;
  __v: number;
  createdAt?: string;
  updatedAt?: string;
}

// For creating new application documents
export interface CreateApplicationDocumentData {
  application_stipulation: string;
  document: string;
}

// For creating new application offer documents
export interface CreateApplicationOfferDocumentData {
  application_stipulation: string;
  document: string;
}

// For updating application documents
export interface UpdateApplicationDocumentData {
  application_stipulation?: string;
}

// For updating application offer documents
export interface UpdateApplicationOfferDocumentData {
  application_stipulation?: string;
}
