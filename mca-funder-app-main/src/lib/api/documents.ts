import { env } from "@/config/env";
import apiClient from "@/lib/api/client";
import { Pagination } from "@/types/pagination";
import { Document, CreateDocumentData } from "@/types/document";
import {
  ApiResponse,
  ApiPaginatedResponse,
  ApiListResponse,
} from "@/types/api";
import { TokenService } from "./accesstokenService";

// Get document by ID
export const getDocumentById = async (
  documentId: string,
): Promise<Document> => {
  const endpoint = env.api.endpoints.document.getDocumentById.replace(
    ":documentId",
    documentId,
  );
  const result = await apiClient.get<ApiResponse<Document>>(endpoint);
  return result.data;
};

// Get documents with pagination and filtering
type GetDocumentsParams = {
  sortBy?: string | null;
  sortOrder?: "asc" | "desc" | null;
  page?: number;
  limit?: number;
  include_archived?: boolean;
  search?: string | null;
};

export const getDocuments = async ({
  sortBy,
  sortOrder,
  page = 1,
  limit = 10,
  include_archived = false,
  search,
}: GetDocumentsParams): Promise<{
  data: Document[];
  pagination: Pagination;
}> => {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    include_archived: String(include_archived),
  });

  if (sortBy && sortOrder) {
    query.append("sort", `${sortOrder === "desc" ? "-" : ""}${sortBy}`);
  }

  if (search && search.trim() !== "") {
    query.append("search", search);
  }

  const endpoint = `${env.api.endpoints.document.getDocuments}?${query.toString()}`;
  const result = await apiClient.get<ApiPaginatedResponse<Document>>(endpoint);
  return {
    data: result.data.docs,
    pagination: result.data.pagination,
  };
};

// Get document list (all documents without pagination)
export type QueryParams = {
  merchant?: string;
  funder?: string;
  include_archived?: boolean;
  sort?: string;
  file_type?: string;
};

export const getDocumentList = async (
  queryParams?: QueryParams,
): Promise<Document[]> => {
  const query = new URLSearchParams(
    queryParams as Record<string, string> | undefined,
  );
  const endpoint = `${env.api.endpoints.document.getDocumentList}?${query.toString()}`;
  const result = await apiClient.get<ApiListResponse<Document>>(endpoint);
  return result.data;
};

// preview document
export const previewDocument = async (documentId: string): Promise<Blob> => {
  const endpoint = env.api.endpoints.document.previewDocument.replace(
    ":documentId",
    documentId,
  );
  return apiClient.getBlob(endpoint);
};

// Download document
export const downloadDocument = async (documentId: string): Promise<Blob> => {
  const endpoint = env.api.endpoints.document.downloadDocument.replace(
    ":documentId",
    documentId,
  );
  return apiClient.getBlob(endpoint);
};

// Create document
export const createDocument = async (params: {
  file: File;
  file_name?: string;
  merchant?: string;
  funder?: string;
  iso?: string;
  syndicator?: string;
  application_offer_id?: string; // For Word template processing
}): Promise<Document> => {
  // debugger
  const formData = new FormData();
  formData.append("file", params.file);

  // Only append optional fields if they are provided
  if (params.file_name) formData.append("file_name", params.file_name);
  if (params.merchant) formData.append("merchant", params.merchant);
  if (params.funder) formData.append("funder", params.funder);
  if (params.iso) formData.append("iso", params.iso);
  if (params.syndicator) formData.append("syndicator", params.syndicator);
  if (params.application_offer_id) formData.append("application_offer_id", params.application_offer_id);

  const endpoint = env.api.endpoints.document.createDocument;
  const result = await apiClient.postFormData<ApiResponse<Document>>(
    endpoint,
    formData,
  );
  return result.data;
};

// Create documents in bulk
export const createDocumentBulk = async (
  documents: CreateDocumentData[],
): Promise<Document[]> => {
  const endpoint = env.api.endpoints.document.createDocumentBulk;
  const result = await apiClient.post<ApiResponse<Document[]>>(endpoint, {
    documents,
  });
  return result.data;
};

// Update document
export const updateDocument = async (
  documentId: string,
  document: Partial<Document>,
): Promise<Document> => {
  const endpoint = env.api.endpoints.document.updateDocument.replace(
    ":documentId",
    documentId,
  );
  const result = await apiClient.put<ApiResponse<Document>>(endpoint, document);
  return result.data;
};

// Upload file to existing document
export const uploadExistingDocument = async (
  documentId: string,
  file: File,
): Promise<Document> => {
  const endpoint = env.api.endpoints.document.uploadExistingDocument.replace(
    ":documentId",
    documentId,
  );

  const formData = new FormData();
  formData.append("file", file);

  const result = await apiClient.postFormData<ApiResponse<Document>>(
    endpoint,
    formData,
  );
  return result.data;
};

// Delete document
export const deleteDocument = async (documentId: string): Promise<void> => {
  const endpoint = env.api.endpoints.document.deleteDocument.replace(
    ":documentId",
    documentId,
  );
  await apiClient.delete<ApiResponse<void>>(endpoint);
};

// Utility function to get file extension from filename
export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

// Generate document from template
export const generateDocumentFromTemplate = async (
  templateId: string,
  offerId: string,
): Promise<Document> => {
  try {
    const endpoint = env.api.endpoints.document.generateFromTemplate;
    const result = await apiClient.post<ApiResponse<Document>>(endpoint, {
      template_id: templateId,
      offer_id: offerId,
    });
    return result.data;
  } catch (error: any) {
    // Provide more detailed error information
    const errorMessage = error?.message || "Unknown error";
    console.error("Error in generateDocumentFromTemplate:", {
      error,
      message: errorMessage,
      templateId,
      offerId,
      endpoint: env.api.endpoints.document.generateFromTemplate,
    });
    throw new Error(
      `Failed to generate document from template: ${errorMessage}`,
    );
  }
};

// Utility function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Signature types
export interface Signer {
  email: string;
  name: string;
  role: "seller" | "guarantor" | "buyer" | "signer";
  order?: number;
  fields?: Array<{
    id: number;
    type: "SIGNATURE" | "INITIALS" | "LOCAL_DATE" | "TEXTBOX" | "CHECKBOX";
    currentValue: "";
    position: {
      docNumber: number;
      pageIndex: number;
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}

export interface SignatureStatus {
  document_id: string;
  signature_request_id: string | null;
  status: "not_initiated" | "pending" | "completed" | "declined" | "cancelled";
  signers: Array<{
    email: string;
    name: string;
    role: string;
    status: "pending" | "completed" | "declined";
    signed_at: string | null;
  }>;
}

// Initiate signature request
export const initiateSignature = async (
  documentId: string,
  signers: Signer[],
  file_content?: string,
  message?: string,
  title?: string,
): Promise<{
  signature_request_id: string;
  document_id: string;
  status: string;
  file_content: string;
  signers: any[];
}> => {
  const endpoint = env.api.endpoints.document.initiateSignature.replace(
    ":documentId",
    documentId,
  );
  const result = await apiClient.post<
    ApiResponse<{
      signature_request_id: string;
      document_id: string;
      status: string;
      file_content: string;
      signers: any[];
    }>
  >(endpoint, {
    signers,
    file_content,
    message,
    ...(title && title.trim() ? { title: title.trim() } : {}),
  });
  return result.data;
};

// Get signature status
export const getSignatureStatus = async (
  documentId: string,
): Promise<SignatureStatus> => {
  const endpoint = env.api.endpoints.document.getSignatureStatus.replace(
    ":documentId",
    documentId,
  );
  const result = await apiClient.get<ApiResponse<SignatureStatus>>(endpoint);
  return result.data;
};
