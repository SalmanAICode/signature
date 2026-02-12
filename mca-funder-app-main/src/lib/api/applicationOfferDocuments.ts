import { env } from "@/config/env";
import apiClient from "@/lib/api/client";
import { Pagination } from "@/types/pagination";
import { ApplicationOfferDocument } from "@/types/applicationDocument";
import { ApiResponse, ApiPaginatedResponse } from "@/types/api";

// Get application documents with pagination and filtering
type GetApplicationOfferDocumentsParams = {
  sortBy?: string | null;
  sortOrder?: "asc" | "desc" | null;
  page?: number;
  limit?: number;
  search?: string | null;
};

export const getApplicationOfferDocuments = async (
  applicationId: string,
  {
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    search,
  }: GetApplicationOfferDocumentsParams = {},
): Promise<{ data: ApplicationOfferDocument[]; pagination: Pagination }> => {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (sortBy && sortOrder) {
    query.append("sort", `${sortOrder === "desc" ? "-" : ""}${sortBy}`);
  }

  if (search && search.trim() !== "") {
    query.append("search", search);
  }

  const endpoint =
    env.api.endpoints.application.getApplicationOfferDocuments.replace(
      ":applicationId",
      applicationId,
    );
  const response = await apiClient.get<
    ApiPaginatedResponse<ApplicationOfferDocument>
  >(`${endpoint}?${query.toString()}`);

  return {
    data: response.data.docs,
    pagination: response.data.pagination,
  };
};

// define query params for getApplicationDocumentsByStipulationId
type GetApplicationOfferDocumentsByStipulationIdParams = {
  type?: string | null;
  sortBy?: string | null;
  sortOrder?: "asc" | "desc" | null;
  application_stipulation?: string | null;
};

// Get application document list (all documents without pagination)
export const getApplicationOfferDocumentList = async (
  applicationId: string,
  {
    type,
    sortBy,
    sortOrder,
    application_stipulation,
  }: GetApplicationOfferDocumentsByStipulationIdParams = {},
): Promise<ApplicationOfferDocument[]> => {
  const query = new URLSearchParams();

  if (sortBy && sortOrder) {
    query.append("sort", `${sortOrder === "desc" ? "-" : ""}${sortBy}`);
  }

  if (application_stipulation) {
    query.append("application_stipulation", application_stipulation);
  }

  if (type && type.trim() !== "") {
    query.append("type", type);
  }

  const endpoint =
    env.api.endpoints.application.getApplicationOfferDocumentList.replace(
      ":applicationId",
      applicationId,
    );

  const response = await apiClient.get<ApiResponse<ApplicationOfferDocument[]>>(
    `${endpoint}?${query.toString()}`,
  );

  return response.data;
};

// Get application document by ID
export const getApplicationOfferDocumentById = async (
  applicationId: string,
  documentId: string,
): Promise<ApplicationOfferDocument> => {
  const endpoint = env.api.endpoints.application.getApplicationOfferDocumentById
    .replace(":applicationId", applicationId)
    .replace(":documentId", documentId);

  const response =
    await apiClient.get<ApiResponse<ApplicationOfferDocument>>(endpoint);
  return response.data;
};

// Create application document
export const createApplicationOfferDocument = async (
  applicationId: string,
  documentId: string,
  options?: { stipulationId?: string; documentType?: string },
): Promise<ApplicationOfferDocument> => {
  const endpoint =
    env.api.endpoints.application.createApplicationOfferDocument.replace(
      ":applicationId",
      applicationId,
    );

  const requestBody: {
    document: string;
    application_stipulation?: string;
    document_type?: string;
  } = {
    document: documentId,
  };

  if (options?.stipulationId?.trim()) {
    requestBody.application_stipulation = options.stipulationId;
  }
  if (options?.documentType?.trim()) {
    requestBody.document_type = options.documentType;
  }

  const response = await apiClient.post<ApiResponse<ApplicationOfferDocument>>(
    endpoint,
    requestBody,
  );
  return response.data;
};

// Update application document
export const updateApplicationOfferDocument = async ({
  applicationId,
  documentId,
  applicationStipulationId,
}: {
  applicationId: string;
  documentId: string;
  applicationStipulationId?: string;
}): Promise<ApplicationOfferDocument> => {
  const endpoint = env.api.endpoints.application.updateApplicationOfferDocument
    .replace(":applicationId", applicationId)
    .replace(":documentId", documentId);

  const requestBody = {
    ...(applicationStipulationId && {
      application_stipulation: applicationStipulationId,
    }),
  };

  const response = await apiClient.put<ApiResponse<ApplicationOfferDocument>>(
    endpoint,
    requestBody,
  );
  return response.data;
};

// Check application document (specific to applications)
export const checkApplicationOfferDocument = async (
  applicationId: string,
  documentId: string,
): Promise<{ status: string; message?: string }> => {
  const endpoint = env.api.endpoints.application.checkApplicationOfferDocument
    .replace(":applicationId", applicationId)
    .replace(":documentId", documentId);

  const response = await apiClient.put<
    ApiResponse<{ status: string; message?: string }>
  >(endpoint, {});
  return response.data;
};

// Delete application document
export const deleteApplicationOfferDocument = async (
  applicationId: string,
  documentId: string,
): Promise<void> => {
  const endpoint = env.api.endpoints.application.deleteApplicationOfferDocument
    .replace(":applicationId", applicationId)
    .replace(":documentId", documentId);

  await apiClient.delete<ApiResponse<void>>(endpoint);
};

// Utility function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
