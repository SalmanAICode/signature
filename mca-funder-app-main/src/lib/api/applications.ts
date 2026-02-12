// src/lib/api/syndicator/getMe.ts

import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Pagination } from '@/types/pagination';
import { Application, GetApplicationListParams, GetApplicationParams, CreateApplicationData, UpdateApplicationData } from '@/types/application';
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';

/**
 * Get an application by ID
 * @param id - The ID of the application
 * @returns The application
 */
export const getApplicationById = async (id: string): Promise<Application> => {
    const endpoint = env.api.endpoints.application.getApplicationById.replace(':applicationId', id);
    const response = await apiClient.get<ApiResponse<Application>>(endpoint);
    return response.data;
};

/**
 * Get a list of applications
 * @param params - The parameters for the request
 * @returns The list of applications
 */
export const getApplicationList = async ({
    sortBy,
    sortOrder,
    include_inactive = true,
    iso,
    search,
}: GetApplicationListParams): Promise<Application[]> => {
    const query = new URLSearchParams({
        include_inactive: String(include_inactive),
    });

    const response = await apiClient.get<ApiListResponse<Application>>(
        `${env.api.endpoints.application.getApplicationList}?${query.toString()}`
    );
    return response.data;
};

/**
 * Get a list of applications with pagination
 * @param params - The parameters for the request
 * @returns The list of applications and pagination info
 */
export const getApplications = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    include_inactive = true,
    search,
    funder,
    lender,
    merchant,
    iso,
}: GetApplicationParams): Promise<{ data: Application[], pagination: Pagination }> => {
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        include_inactive: String(include_inactive),
    });

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }

    if (search && search.trim() !== '') {
        query.append('search', search);
    }

    if (funder) {
        query.append('funder', funder);
    }

    if (lender) {
        query.append('lender', lender);
    }

    if (merchant) {
        query.append('merchant', merchant);
    }

    if (iso) {
        query.append('iso', iso);
    }

    const response = await apiClient.get<ApiPaginatedResponse<Application>>(
        `${env.api.endpoints.application.getApplications}?${query.toString()}`
    );

    return {
        data: response.data.docs,
        pagination: response.data.pagination,
    };
};

/**
 * Create an application
 * @param application - The application to create
 * @returns The created application
 */
export const createApplication = async (application: CreateApplicationData): Promise<Application> => {
    // Extract optional fields
    const { status, stipulation_list, document_list, iso, assigned_manager, assigned_user, contact, representative, ...requiredFields } = application;

    // Build request body with only non-empty optional fields
    const requestBody = {
        ...requiredFields,
        ...(assigned_user ? { assigned_user } : {}),
        ...(assigned_manager ? { assigned_manager } : {}),
        ...(iso ? { iso: iso } : {}),
        ...(status ? { status } : {}),
        ...(stipulation_list && stipulation_list.length > 0 ? { stipulation_list } : {}),
        ...(document_list && document_list.length > 0 ? { document_list } : {}),
        ...(contact ? { contact } : {}),
        ...(representative ? { representative } : {}),
    };

    const response = await apiClient.post<ApiResponse<Application>>(
        env.api.endpoints.application.createApplication,
        requestBody
    );
    return response.data;
};

/**
 * Update an application
 * @param applicationId - The ID of the application
 * @param params - The updated application data
 * @returns The updated application
 */
export const updateApplication = async (applicationId: string, params: UpdateApplicationData): Promise<Application> => {
    const endpoint = env.api.endpoints.application.updateApplication.replace(':applicationId', applicationId);
    const response = await apiClient.put<ApiResponse<Application>>(endpoint, params);
    return response.data;
};

/**
 * Delete an application
 * @param id - The ID of the application
 */
export const deleteApplication = async (id: string): Promise<void> => {
    const endpoint = env.api.endpoints.application.deleteApplication.replace(':applicationId', id);
    await apiClient.delete<ApiResponse<void>>(endpoint);
};



