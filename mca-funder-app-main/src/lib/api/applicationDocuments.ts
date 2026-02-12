import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Pagination } from '@/types/pagination';
import { ApplicationDocument } from '@/types/applicationDocument';
import { ApiResponse, ApiPaginatedResponse } from '@/types/api';

// Get application documents with pagination and filtering
type GetApplicationDocumentsParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    search?: string | null;
};

export const getApplicationDocuments = async (
    applicationId: string,
    {
        sortBy,
        sortOrder,
        page = 1,
        limit = 10,
        search,
    }: GetApplicationDocumentsParams = {}
): Promise<{ data: ApplicationDocument[], pagination: Pagination }> => {
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }

    if (search && search.trim() !== '') {
        query.append('search', search);
    }

    const endpoint = env.api.endpoints.application.getApplicationDocuments.replace(':applicationId', applicationId);
    const response = await apiClient.get<ApiPaginatedResponse<ApplicationDocument>>(
        `${endpoint}?${query.toString()}`
    );
    
    return {
        data: response.data.docs,
        pagination: response.data.pagination,
    };
};


// define query params for getApplicationDocumentsByStipulationId
type GetApplicationDocumentsByStipulationIdParams = {
    type?: string | null;
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    application_stipulation?: string | null;
};

// Get application document list (all documents without pagination)
export const getApplicationDocumentList = async (applicationId: string, {
    type,
    sortBy,
    sortOrder,
    application_stipulation,
}: GetApplicationDocumentsByStipulationIdParams = {}): Promise<ApplicationDocument[]> => {
    const query = new URLSearchParams();

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }

    if (application_stipulation ) {
        query.append('application_stipulation', application_stipulation);
    }

    if (type && type.trim() !== '') {
        query.append('type', type);
    }
    
    const endpoint = env.api.endpoints.application.getApplicationDocumentList.replace(':applicationId', applicationId);

    const response = await apiClient.get<ApiResponse<ApplicationDocument[]>>(`${endpoint}?${query.toString()}`);
    
    return response.data;
};

// Get application document by ID
export const getApplicationDocumentById = async (applicationId: string, documentId: string): Promise<ApplicationDocument> => {
    const endpoint = env.api.endpoints.application.getApplicationDocumentById
        .replace(':applicationId', applicationId)
        .replace(':documentId', documentId);
    
    const response = await apiClient.get<ApiResponse<ApplicationDocument>>(endpoint);
    return response.data;
};

// Create application document
export const createApplicationDocument = async (
    applicationId: string, 
    documentId: string,
    stipulationId?: string,
): Promise<ApplicationDocument> => {
    const endpoint = env.api.endpoints.application.createApplicationDocument.replace(':applicationId', applicationId);
    
    // Create the request body, only including stipulation_id if it exists and is not empty
    const requestBody = {
        document: documentId,
        ...(stipulationId && stipulationId.trim() !== '' ? { application_stipulation: stipulationId } : {})
    };

    const response = await apiClient.post<ApiResponse<ApplicationDocument>>(endpoint, requestBody);
    return response.data;
};

// Update application document
export const updateApplicationDocument = async ({
    applicationId,
    documentId,
    applicationStipulationId,
}: {
    applicationId: string;
    documentId: string;
    applicationStipulationId?: string;
}): Promise<ApplicationDocument> => {
    const endpoint = env.api.endpoints.application.updateApplicationDocument
        .replace(':applicationId', applicationId)
        .replace(':documentId', documentId);
    
    const requestBody = {
        ...(applicationStipulationId && { application_stipulation: applicationStipulationId }),
    };

    const response = await apiClient.put<ApiResponse<ApplicationDocument>>(endpoint, requestBody);
    return response.data;
};

// Check application document (specific to applications)
export const checkApplicationDocument = async (
    applicationId: string, 
    documentId: string
): Promise<{ status: string; message?: string }> => {
    const endpoint = env.api.endpoints.application.checkApplicationDocument
        .replace(':applicationId', applicationId)
        .replace(':documentId', documentId);
    
    const response = await apiClient.put<ApiResponse<{ status: string; message?: string }>>(endpoint, {});
    return response.data;
};

// Delete application document
export const deleteApplicationDocument = async (applicationId: string, documentId: string): Promise<void> => {
    const endpoint = env.api.endpoints.application.deleteApplicationDocument
        .replace(':applicationId', applicationId)
        .replace(':documentId', documentId);
    
    await apiClient.delete<ApiResponse<void>>(endpoint);
};

// Utility function to format file size
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};