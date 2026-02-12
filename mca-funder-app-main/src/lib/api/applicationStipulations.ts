import apiClient from "@/lib/api/client";
import {
  ApplicationStipulation,
  CreateApplicationStipulationData,
  UpdateApplicationStipulationData,
} from "@/types/applicationStipulation";
import { env } from "@/config/env";
import {
  ApiPaginatedResponse,
  ApiResponse,
  ApiListResponse,
} from "@/types/api";
import { Pagination } from "@/types/pagination";

/**
 * Get all stipulations for an application
 */

export interface queryParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export const getApplicationStipulations = async (
  applicationId: string,
  { page, limit, sortBy, sortOrder, search }: queryParams,
): Promise<{ data: ApplicationStipulation[]; pagination: Pagination }> => {
  const query = new URLSearchParams();
  if (page) {
    query.append("page", page.toString());
  }
  if (limit) {
    query.append("limit", limit.toString());
  }
  if (sortBy && sortOrder) {
    query.append("sort", `${sortOrder === "desc" ? "-" : ""}${sortBy}`);
  }
  if (search) {
    query.append("search", search);
  }
  const result = await apiClient.get<
    ApiPaginatedResponse<ApplicationStipulation>
  >(
    `${env.api.endpoints.application.getApplicationStipulations.replace(":applicationId", applicationId)}?${query.toString()}`,
  );
  return {
    data: result.data.docs,
    pagination: result.data.pagination,
  };
};

export const getApplicationStipulationList = async (
  applicationId: string,
): Promise<ApplicationStipulation[]> => {
  const result = await apiClient.get<ApiListResponse<ApplicationStipulation>>(
    env.api.endpoints.application.getApplicationStipulationList.replace(
      ":applicationId",
      applicationId,
    ),
  );
  return result.data;
};

export const getApplicationOfferStipulationList = async (
  applicationId: string,
): Promise<ApplicationStipulation[]> => {
  const result = await apiClient.get<ApiListResponse<ApplicationStipulation>>(
    env.api.endpoints.application.getApplicationOfferStipulationList.replace(
      ":applicationId",
      applicationId,
    ),
  );
  return result.data;
};

/**
 * Create a new stipulation for an application
 */
export const createApplicationStipulation = async (
  applicationId: string,
  data: CreateApplicationStipulationData,
): Promise<ApplicationStipulation> => {
  const result = await apiClient.post<ApiResponse<ApplicationStipulation>>(
    env.api.endpoints.application.createApplicationStipulation.replace(
      ":applicationId",
      applicationId,
    ),
    data,
  );
  return result.data;
};

/**
 * Update an application stipulation
 */
export const updateApplicationStipulation = async (
  applicationId: string,
  stipulationId: string,
  data: UpdateApplicationStipulationData,
): Promise<ApplicationStipulation> => {
  const result = await apiClient.put<ApiResponse<ApplicationStipulation>>(
    env.api.endpoints.application.updateApplicationStipulation
      .replace(":applicationId", applicationId)
      .replace(":stipulationId", stipulationId),
    data,
  );
  return result.data;
};

/**
 * Delete an application stipulation
 */
export const deleteApplicationStipulation = async (
  applicationId: string,
  stipulationId: string,
): Promise<void> => {
  await apiClient.delete(
    env.api.endpoints.application.deleteApplicationStipulation
      .replace(":applicationId", applicationId)
      .replace(":stipulationId", stipulationId),
  );
};

/**
 * Check/Uncheck an application stipulation
 */
export const toggleApplicationStipulation = async (
  applicationId: string,
  stipulationId: string,
  checked: boolean,
): Promise<ApplicationStipulation> => {
  const result = await apiClient.put<ApiResponse<ApplicationStipulation>>(
    env.api.endpoints.application.toggleApplicationStipulation
      .replace(":applicationId", applicationId)
      .replace(":stipulationId", stipulationId),
    { checked },
  );
  return result.data;
};
