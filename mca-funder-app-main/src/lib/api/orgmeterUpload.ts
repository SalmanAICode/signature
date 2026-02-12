import apiClient from './client';
import { env } from '@/config/env';

// Upload job interfaces
export interface UploadJob {
  jobId: string;
  entityType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: {
    total: number;
    processed: number;
    percentage: number;
    currentRecord?: number;
  };
  parameters?: {
    funder: string;
    fileName: string;
    fieldMappings: Record<string, string>;
    skipFirstRow: boolean;
  };
  uploadData?: {
    fileSize: number;
    totalRows: number;
  };
  results?: {
    created: number;
    updated: number;
    errors: number;
    skipped: number;
    details?: unknown;
    errorDetails?: Array<{
      row: number;
      error: string;
      data?: unknown;
    }>;
  };
  validation?: {
    foundFields: string[];
    columnIndexes: Record<string, number>;
  };
  estimatedTimeRemaining?: number;
  startedAt?: string;
  completedAt?: string;
  lastProgressUpdate?: string;
  error?: string;
  fileName?: string;
  createdAt?: string;
  isRunning?: boolean;
}

// Request interfaces
export interface CreateUploadJobRequest {
  csvFile: File;
  funder: string;
  fieldMappings: Record<string, string>;
  skipFirstRow?: boolean;
}

export interface GetUploadJobsRequest {
  funder: string;
  status?: string;
  entityType?: string;
  page?: number;
  limit?: number;
}

// Response interfaces
export interface CreateUploadJobResponse {
  success: boolean;
  message: string;
  data: {
    jobId: string;
    entityType: string;
    status: string;
    fileName: string;
    fileSize: number;
    totalRows: number;
    validation: {
      foundFields: string[];
      columnIndexes: Record<string, number>;
    };
  };
}

export interface GetUploadJobStatusResponse {
  success: boolean;
  message: string;
  data: UploadJob;
}

export interface CancelUploadJobResponse {
  success: boolean;
  message: string;
  data: {
    jobId: string;
    status: string;
    completedAt: string;
    wasRunning: boolean;
  };
}

export interface GetUploadJobsResponse {
  success: boolean;
  message: string;
  data: {
    jobs: UploadJob[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    statistics: {
      completed: number;
      running: number;
      failed: number;
      cancelled: number;
      pending: number;
    };
    runningJobs: number;
  };
}

// API functions
export const createUploadJob = async (
  entityType: string,
  request: CreateUploadJobRequest
): Promise<CreateUploadJobResponse> => {
  const formData = new FormData();
  formData.append('csvFile', request.csvFile);
  formData.append('funder', request.funder);
  formData.append('fieldMappings', JSON.stringify(request.fieldMappings));
  formData.append('skipFirstRow', String(request.skipFirstRow ?? true));

  const endpoint = env.api.endpoints.upload.orgmeter.createUploadJob.replace(':entityType', entityType);
  
  return apiClient.postFormData(endpoint, formData, false);
};

export const getUploadJobStatus = async (jobId: string): Promise<GetUploadJobStatusResponse> => {
  const endpoint = env.api.endpoints.upload.orgmeter.getUploadJobStatus.replace(':jobId', jobId);
  return apiClient.get(endpoint, false);
};

export const cancelUploadJob = async (jobId: string): Promise<CancelUploadJobResponse> => {
  const endpoint = env.api.endpoints.upload.orgmeter.cancelUploadJob.replace(':jobId', jobId);
  return apiClient.post(endpoint, {}, false);
};

export const getUploadJobs = async (request: GetUploadJobsRequest): Promise<GetUploadJobsResponse> => {
  const endpoint = env.api.endpoints.upload.orgmeter.getUploadJobs;
  return apiClient.post(endpoint, request, false);
}; 