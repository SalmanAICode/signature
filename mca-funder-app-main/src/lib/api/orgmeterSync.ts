import apiClient from '@/lib/api/client';
import { env } from '@/config/env';
import { ApiResponse } from '@/types/api';

// Sync-specific Types
export interface SyncReviewParams {
  apiKey: string;
  funderId: string;
  syncStatus?: string;
  search?: string;
}

export interface SyncSelectionRequest {
  apiKey: string;
  funderId: string;
  records?: { id: number | string; needsSync: boolean }[];
  selectAll?: boolean;
  selectValue?: boolean;
}

export interface SyncJobRequest {
  apiKey: string;
  funderId: string;
  updateExisting: boolean;
  onlySelected: boolean;
  dryRun: boolean;
}

export interface SyncOverallStats {
  totalEntities: number;
  totalSynced: number;
  totalSelected: number;
  totalPending: number;
  totalIgnored: number;
  overallCompletionRate: string;
  overallSelectionRate: string;
  hasAnyData: boolean;
  hasRunningJobs: boolean;
  implementedEntityTypes: number;
  totalEntityTypes: number;
}

export interface SyncEntityProgress {
  name: string;
  implemented: boolean;
  total: number;
  synced: number;
  selected: number;
  pending: number;
  ignored: number;
  completionRate: string;
  selectionRate: string;
  hasData: boolean;
  isRunning: boolean;
  runningJob: Record<string, unknown> | null;
  lastSyncJob: Record<string, unknown> | null;
}

export interface SyncProgressResponse {
  success: boolean;
  data: {
    funderId: string;
    overallStats: SyncOverallStats;
    entityProgress: Record<string, SyncEntityProgress>;
    syncTimeline: Record<string, unknown>[];
    runningJobs: Record<string, Record<string, unknown>> | null;
    recentActivity: Record<string, unknown>[];
    syncOrder: string[];
    generatedAt: string;
  };
}

export interface SyncStatistics {
  total: number;
  selected: number;
  pending: number;
  synced: number;
  ignored: number;
}

export interface SyncReviewResponse {
  success: boolean;
  data: {
    entityType: string;
    funderId: string;
    items: SyncReviewItem[];
    totalCount: number;
    syncStatistics: SyncStatistics;
  };
}

export interface SyncReviewItem {
  id: number | string;
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  federalId?: string;
  type?: string;
  status?: string;
  amount?: number;
  factorRate?: number;
  term?: number;
  deleted: boolean;
  importMetadata: {
    funder: string;
    source: string;
    importedAt: string;
    importedBy: string;
    lastUpdatedAt?: string;
    lastUpdatedBy?: string;
  };
  syncMetadata: {
    needsSync: boolean;
    lastSyncedAt?: string;
    lastSyncedBy?: string;
    syncId?: string;
  };
  underwriterUsers?: Array<{ id: string; name: string; email?: string }>;
  salesRepUsers?: Array<{ id: string; name: string; email?: string }>;
}

export interface StartSyncJobResponse {
  success: boolean;
  jobId: string;
  message: string;
  job: {
    jobId: string;
    entityType: string;
    status: string;
    progress: Record<string, unknown>;
    parameters: Record<string, unknown>;
    [key: string]: unknown;
  };
  data?: {
    jobId: string;
    message: string;
  };
}

export interface SyncJobStatusResponse {
  job: {
    _id: string;
    jobId: string;
    entityType: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: {
      total: number;
      processed: number;
      percentage: number;
      currentEntity: string | null;
    };
    parameters: {
      apiKey: string;
      funder: string;
      updateExisting: boolean;
      onlySelected: boolean;
      dryRun: boolean;
    };
    results?: {
      synced: number;
      updated: number;
      skipped: number;
      failed: number;
      details: Record<string, unknown>;
    };
    error: {
      message: string | null;
      stack: string | null;
      timestamp: string | null;
    };
    startedAt: string;
    completedAt?: string;
    estimatedTimeRemaining: number;
    lastProgressUpdate: string;
    createdAt: string;
    updatedAt: string;
  };
  relatedJobs: Array<{
    _id: string;
    jobId: string;
    entityType: string;
    status: string;
    progress: Record<string, unknown>;
    parameters: Record<string, unknown>;
    results: Record<string, unknown>;
    error: Record<string, unknown>;
    startedAt: string;
    completedAt: string;
    estimatedTimeRemaining: number;
    lastProgressUpdate: string;
    createdAt: string;
    updatedAt: string;
  }>;
  entityStats: {
    total: number;
    synced: number;
    pending: number;
  };
  isRunning: boolean;
}

export interface RunningJob {
  _id: string;
  jobId: string;
  entityType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    total: number;
    processed: number;
    percentage: number;
    currentEntity: string | null;
  };
  parameters: {
    apiKey: string;
    funder: string;
    updateExisting: boolean;
    onlySelected: boolean;
    dryRun: boolean;
  };
  results?: {
    synced: number;
    updated: number;
    skipped: number;
    failed: number;
    details: Record<string, unknown>;
  };
  error: {
    message: string | null;
    stack: string | null;
    timestamp: string | null;
  };
  startedAt: string;
  completedAt?: string;
  estimatedTimeRemaining: number;
  lastProgressUpdate: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetRunningJobsResponse {
  success: boolean;
  data: {
    jobs: RunningJob[];
  };
}

export interface ContinueSyncJobResponse {
  success: boolean;
  message: string;
  jobId?: string;
  job?: {
    jobId: string;
    entityType: string;
    status: string;
    progress: {
      processed: number;
      total: number;
      percentage: number;
      currentEntity: string | null;
    };
    parameters: {
      funder: string;
      updateExisting: boolean;
      onlySelected: boolean;
      dryRun: boolean;
    };
  };
  resumeFromIndex?: number;
}

// Sync API Functions
export const getSyncJobProgress = async (jobId: string): Promise<SyncJobStatusResponse> => {
  const url = env.api.endpoints.sync.orgmeter.getSyncJobStatus.replace(':jobId', jobId);
  
  // Add cache-busting timestamp to prevent 304 responses
  const cacheBuster = Date.now();
  const urlWithCacheBuster = `${url}?_t=${cacheBuster}`;
  
  const response = await apiClient.get<SyncJobStatusResponse>(
    urlWithCacheBuster,
    false // Don't require authentication for sync operations
  );
  return response;
};

export const getSyncOverallProgress = async (apiKey: string, funderId: string): Promise<SyncProgressResponse> => {
  const url = env.api.endpoints.sync.orgmeter.getOverallProgress;
  
  const response = await apiClient.post<SyncProgressResponse>(
    url,
    { apiKey, funderId },
    false // Don't require authentication for sync operations
  );
  return response;
};

export const getImportedDataForReview = async (entityType: string, params: SyncReviewParams): Promise<SyncReviewResponse> => {
  const requestBody = {
    apiKey: params.apiKey,
    funderId: params.funderId,
    ...(params.syncStatus && params.syncStatus !== 'all' && { syncStatus: params.syncStatus }),
    ...(params.search && { search: params.search })
  };

  const url = env.api.endpoints.sync.orgmeter.getImportedDataForReview.replace(':entityType', entityType);
  
  const response = await apiClient.post<SyncReviewResponse>(
    url,
    requestBody,
    false // Don't require authentication for sync operations
  );
  return response;
};

export const updateSyncSelection = async (entityType: string, request: SyncSelectionRequest): Promise<{ success: boolean }> => {
  const url = env.api.endpoints.sync.orgmeter.updateSyncSelection.replace(':entityType', entityType);
  
  const response = await apiClient.put<ApiResponse<{ success: boolean }>>(
    url,
    request,
    false // Don't require authentication for sync operations
  );
  
  // Return the response directly since it should be { success: boolean }
  return response;
};

export const startEntitySync = async (entityType: string, request: SyncJobRequest): Promise<StartSyncJobResponse> => {
  const url = env.api.endpoints.sync.orgmeter.startEntitySync.replace(':entityType', entityType);
  
  const response = await apiClient.post<StartSyncJobResponse>(
    url,
    request,
    false // Don't require authentication for sync operations
  );
  return response;
};

export const getSyncJobStatus = async (jobId: string, apiKey: string, funderId: string): Promise<SyncJobStatusResponse> => {
  const url = env.api.endpoints.sync.orgmeter.getSyncJobs + `/${jobId}`;
  
  const response = await apiClient.post<SyncJobStatusResponse>(
    url,
    { apiKey, funderId },
    false // Don't require authentication for sync operations
  );
  return response;
};

export const cancelSyncJob = async (jobId: string, apiKey: string, funderId: string): Promise<{ success: boolean; message: string }> => {
  const url = env.api.endpoints.sync.orgmeter.cancelSyncJob.replace(':jobId', jobId);
  
  const response = await apiClient.post<{ success: boolean; message: string }>(
    url,
    { apiKey, funderId }, // Include apiKey and funderId for authorization
    false // Don't require authentication for sync operations
  );
  return response;
};

export const getRunningJobsForEntity = async (entityType: string, apiKey: string, funderId: string): Promise<GetRunningJobsResponse> => {
  const url = env.api.endpoints.sync.orgmeter.getSyncJobs.replace(':entityType', entityType);
  const response = await apiClient.post<GetRunningJobsResponse>(url, {
    apiKey,
    funderId,
    entityType,
    status: 'pending,running'
  }, false); // Don't require authentication for sync operations
  
  return response;
};

export const continueSyncJob = async (jobId: string, apiKey: string, funderId: string): Promise<ContinueSyncJobResponse> => {
  const url = env.api.endpoints.sync.orgmeter.continueSyncJob.replace(':jobId', jobId);
  const response = await apiClient.post<ContinueSyncJobResponse>(url, {
    apiKey,
    funderId
  }, false);
  return response;
}; 