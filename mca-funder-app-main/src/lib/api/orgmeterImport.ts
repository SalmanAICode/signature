import apiClient from './client';

// Core interfaces
export interface JobData {
  jobId: string;
  entityType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  progress: {
    total: number;
    processed: number;
    percentage: number;
    currentEntity: string | null;
  };
  parameters?: {
    funder: string;
    batchSize: number;
    updateExisting: boolean;
  };
  results?: {
    imported: number;
    updated: number;
    errors: number;
    skipped: number;
    details?: unknown;
  };
  error?: string | null;
  startedAt?: string;
  completedAt?: string | null;
  estimatedTimeRemaining?: number | null;
  lastProgressUpdate?: string;
  createdAt?: string;
}

export interface Funder {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  bgcolor?: string;
  import?: {
    api_key?: string;
    client_name?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// API Request/Response interfaces
export interface ValidateApiRequest {
  apiKey: string;
}

export interface ValidateApiResponse {
  success: boolean;
  message: string;
  data?: {
    connected: boolean;
    apiInfo: {
      baseUrl: string;
      version: string;
    };
    importSteps: string[];
  };
}

export interface CreateFunderRequest {
  name: string;
  email: string;
  import: {
    api_key: string;
    client_name?: string;
  };
  user_list: string[];
}

export interface CreateFunderResponse {
  success: boolean;
  message: string;
  data: Funder;
}

export interface JobCreationRequest {
  entityType: string;
  apiKey: string;
  funder: string;
  batchSize?: number;
  updateExisting?: boolean;
}

export interface JobCreationResponse {
  success: boolean;
  message: string;
  data?: {
    jobId: string;
    entityType: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
    progress: {
      total: number;
      processed: number;
      percentage: number;
      currentEntity: string | null;
    };
    estimatedTimeRemaining: number | null;
  };
}

export interface JobListResponse {
  success: boolean;
  message: string;
  data: {
    jobs: JobData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    statistics: {
      pending: number;
      running: number;
      completed: number;
      failed: number;
      cancelled: number;
      paused: number;
    };
    filters: {
      funder: string;
      status: string;
      entityType: string;
    };
  };
}

export interface ActiveJobsResponse {
  success: boolean;
  message: string;
  data: {
    activeJobs: (JobData & {
      isActuallyRunning: boolean;
      canBeCancelled: boolean;
      canBePaused: boolean;
      canBeResumed: boolean;
    })[];
    count: number;
    runningInMemory: number;
    runningJobIds: string[];
  };
}

export interface EntityStatusResponse {
  success: boolean;
  message: string;
  data: {
    entityType: string;
    funder: string;
    canCreateNewJob: boolean;
    entityCollection: {
      totalRecords: number;
      entityType: string;
    };
    jobSummary: {
      totalJobs: number;
      completedJobs: number;
      failedJobs: number;
      runningJobs: number;
      pendingJobs: number;
      pausedJobs: number;
      hasActiveJobs: boolean;
      hasPausedJobs: boolean;
    };
    activeJob: JobData | null;
    pausedJob: JobData | null;
    lastCompletedJob: JobData | null;
    lastFailedJob: (JobData & { canResume: boolean }) | null;
    detailedStatistics: {
      completed: {
        count: number;
        lastCreated: string;
        totalImported: number;
        totalUpdated: number;
        totalErrors: number;
      };
      failed: {
        count: number;
        lastCreated: string;
        totalImported: number;
        totalUpdated: number;
        totalErrors: number;
      };
      running: {
        count: number;
        lastCreated: string;
        totalImported: number;
        totalUpdated: number;
        totalErrors: number;
      };
    };
    recentJobs: JobData[];
  };
}

export interface JobActionResponse {
  success: boolean;
  message: string;
  data: {
    jobId: string;
    status: string;
    [key: string]: unknown;
  };
}

export interface ExistingFundersRequest {
  apiKey: string;
}

export interface FunderImportStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  entityTypes: string[];
  lastJobCreated: string | null;
  lastJobCompleted: string | null;
}

export interface ExistingFunderDetails {
  funderId: string;
  funderName: string;
  funderEmail: string | null;
  importStats: FunderImportStats;
  hasActiveJobs: boolean;
  canResume: boolean;
}

export interface ExistingFundersResponse {
  success: boolean;
  message: string;
  data: {
    apiKey: {
      isValid: boolean;
      apiInfo: {
        baseUrl: string;
        version: string;
      };
    };
    funders: ExistingFunderDetails[];
    summary: {
      totalFunders: number;
      fundersWithActiveJobs: number;
      totalActiveJobs: number;
      totalCompletedJobs: number;
    };
  };
}

// API Functions

/**
 * Validate OrgMeter API key
 */
export const validateOrgMeterApi = async (request: ValidateApiRequest): Promise<ValidateApiResponse> => {
  const response = await apiClient.post<ValidateApiResponse>(
    '/import/orgmeter/validate-api-key',
    request,
    false
  );
  return response;
};

/**
 * Get existing funders by API key
 */
export const getExistingFunders = async (request: ExistingFundersRequest): Promise<ExistingFundersResponse> => {
  const response = await apiClient.post<ExistingFundersResponse>(
    '/import/orgmeter/funders',
    request,
    false
  );
  return response;
};

/**
 * Create a new funder
 */
export const createFunder = async (request: CreateFunderRequest): Promise<CreateFunderResponse> => {
  const response = await apiClient.post<CreateFunderResponse>(
    '/import/orgmeter/funders/create',
    request,
    false
  );
  return response;
};

/**
 * Create a new import job (unified endpoint)
 */
export const createImportJob = async (request: JobCreationRequest): Promise<JobCreationResponse> => {
  const response = await apiClient.post<JobCreationResponse>(
    '/import/orgmeter/jobs',
    request,
    false
  );
  return response;
};

/**
 * Get all import jobs with filtering and pagination
 */
export const getImportJobs = async (params: {
  funder?: string;
  status?: string;
  entityType?: string;
  page?: number;
  limit?: number;
} = {}): Promise<JobListResponse> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      query.append(key, String(value));
    }
  });

  const response = await apiClient.get<JobListResponse>(
    `/import/orgmeter/jobs${query.toString() ? `?${query.toString()}` : ''}`,
    false
  );
  return response;
};

/**
 * Get all active import jobs
 */
export const getActiveImportJobs = async (): Promise<ActiveJobsResponse> => {
  const response = await apiClient.get<ActiveJobsResponse>('/import/orgmeter/jobs/active', false);
  return response;
};

/**
 * Get job status by ID
 */
export const getJobStatus = async (jobId: string): Promise<{ success: boolean; message: string; data: JobData }> => {
  const response = await apiClient.get<{ success: boolean; message: string; data: JobData }>(
    `/import/orgmeter/jobs/${jobId}`,
    false
  );
  return response;
};

/**
 * Get entity-specific status and job information
 */
export const getEntityStatus = async (entityType: string, funderId: string): Promise<EntityStatusResponse> => {
  const response = await apiClient.get<EntityStatusResponse>(
    `/import/orgmeter/entities/${entityType}/status?funder=${funderId}`,
    false
  );
  return response;
};

/**
 * Pause a running job
 */
export const pauseJob = async (jobId: string): Promise<JobActionResponse> => {
  const response = await apiClient.post<JobActionResponse>(`/import/orgmeter/jobs/${jobId}/pause`, {}, false);
  return response;
};

/**
 * Resume a paused or failed job
 */
export const resumeJob = async (jobId: string, options: {
  resumeFrom?: 'current' | 'beginning';
  parameters?: {
    batchSize?: number;
    updateExisting?: boolean;
  };
} = {}): Promise<JobActionResponse> => {
  const response = await apiClient.post<JobActionResponse>(
    `/import/orgmeter/jobs/${jobId}/resume`,
    {
      resumeFrom: options.resumeFrom || 'current',
      parameters: options.parameters || {}
    },
    false
  );
  return response;
};

/**
 * Cancel a job
 */
export const cancelJob = async (jobId: string): Promise<JobActionResponse> => {
  const response = await apiClient.post<JobActionResponse>(`/import/orgmeter/jobs/${jobId}/cancel`, {}, false);
  return response;
};

/**
 * Resume all paused/failed jobs for a funder
 */
export const resumeAllJobs = async (params: {
  funder: string;
  entityTypes?: string[];
  resumeFrom?: 'current' | 'beginning';
  parameters?: {
    batchSize?: number;
    updateExisting?: boolean;
  };
}): Promise<JobActionResponse> => {
  const response = await apiClient.post<JobActionResponse>(
    '/import/orgmeter/jobs/resume-all',
    params,
    false
  );
  return response;
}; 