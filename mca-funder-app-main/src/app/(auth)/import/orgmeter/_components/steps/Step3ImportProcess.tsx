'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  StopIcon,
  PlayIcon,
  PauseIcon,
  UserIcon,
  BanknotesIcon,
  ChartPieIcon,
  BuildingStorefrontIcon,
  PercentBadgeIcon,
  CircleStackIcon,
  ClockIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  createImportJob,
  getEntityStatus,
  getJobStatus,
  pauseJob,
  resumeJob,
  resumeAllJobs,
  cancelJob,
  JobData
} from '@/lib/api/orgmeterImport';

interface ImportState {
  currentStep: number;
  apiKey: string;
  selectedFunder: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  } | null;
  stepData: Record<string, unknown>;
  importResults: Record<string, unknown>;
  selectedRecords: Set<string>;
  apiValidated: boolean;
  funderCreated: boolean;
  importOrder: string[];
  currentEntityType: string;
  allImportsComplete: boolean;
}

interface Step3ImportProcessProps {
  importState: ImportState;
  updateImportState: (updates: Partial<ImportState>) => void;
  nextStep: () => void;
  previousStep: () => void;
}

interface EntityStatus {
  entityType: string;
  canCreateNewJob: boolean;
  totalRecords: number;
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
  loading: boolean;
  error: string | null;
}

const allEntities = ['user', 'lender', 'iso', 'merchant', 'syndicator', 'advance'];

const entityIcons = {
  user: UserIcon,
  lender: BanknotesIcon,
  iso: ChartPieIcon,
  merchant: BuildingStorefrontIcon,
  syndicator: PercentBadgeIcon,
  advance: CircleStackIcon,
};

const entityNames = {
  user: 'Users',
  lender: 'Lenders',
  iso: 'ISOs',
  merchant: 'Merchants',
  syndicator: 'Syndicators',
  advance: 'Advances',
};

export default function Step3ImportProcess({ 
  importState, 
  updateImportState, 
  nextStep, 
  previousStep 
}: Step3ImportProcessProps) {
  const [entityStatuses, setEntityStatuses] = useState<Record<string, EntityStatus>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const pollingIntervalsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Extract values from importState
  const selectedFunder = importState.selectedFunder;
  const apiKey = importState.apiKey;

  // Cleanup effect
  useEffect(() => {
    return () => {
      Object.values(pollingIntervalsRef.current).forEach(interval => {
        if (interval) {
          clearInterval(interval);
        }
      });
    };
  }, []);

  // Initialize entity statuses when component mounts
  useEffect(() => {
    if (selectedFunder) {
      initializeEntityStatuses();
    }
  }, [selectedFunder]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const initializeEntityStatuses = () => {
    const initialStatuses: Record<string, EntityStatus> = {};
    
    allEntities.forEach(entityType => {
      initialStatuses[entityType] = {
        entityType,
        canCreateNewJob: false,
        totalRecords: 0,
        jobSummary: {
          totalJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
          runningJobs: 0,
          pendingJobs: 0,
          pausedJobs: 0,
          hasActiveJobs: false,
          hasPausedJobs: false,
        },
        activeJob: null,
        pausedJob: null,
        lastCompletedJob: null,
        lastFailedJob: null,
        loading: true,
        error: null,
      };
    });
    
    setEntityStatuses(initialStatuses);
    
    // Load entity statuses
    loadAllEntityStatuses();
  };

  const loadAllEntityStatuses = async () => {
    addLog('Loading entity statuses...');
    
    const statusPromises = allEntities.map(entityType => 
      loadEntityStatus(entityType)
    );
    
    await Promise.allSettled(statusPromises);
    addLog('Entity statuses loaded');
  };

  const loadEntityStatus = async (entityType: string) => {
    if (!selectedFunder) return;
    
    try {
      const response = await getEntityStatus(entityType, selectedFunder._id);
      
      setEntityStatuses(prev => ({
        ...prev,
        [entityType]: {
          entityType,
          canCreateNewJob: response.data.canCreateNewJob,
          totalRecords: response.data.entityCollection.totalRecords,
          jobSummary: response.data.jobSummary,
          activeJob: response.data.activeJob,
          pausedJob: response.data.pausedJob,
          lastCompletedJob: response.data.lastCompletedJob,
          lastFailedJob: response.data.lastFailedJob,
          loading: false,
          error: null,
        }
      }));

      // Start polling if there's an active job
      if (response.data.activeJob && (response.data.activeJob.status === 'running' || response.data.activeJob.status === 'pending')) {
        startJobPolling(entityType, response.data.activeJob.jobId);
      }
      
    } catch (error) {
      setEntityStatuses(prev => ({
        ...prev,
        [entityType]: {
          ...prev[entityType],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load status'
        }
      }));
      addLog(`Failed to load ${entityType} status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const startJobPolling = (entityType: string, jobId: string) => {
    // Clear any existing polling
    if (pollingIntervalsRef.current[entityType]) {
      clearInterval(pollingIntervalsRef.current[entityType]);
    }

    // Start new polling
    pollingIntervalsRef.current[entityType] = setInterval(async () => {
      try {
        const response = await getJobStatus(jobId);
        const jobData = response.data;

        setEntityStatuses(prev => ({
          ...prev,
          [entityType]: {
            ...prev[entityType],
            activeJob: jobData,
          }
        }));

        // Stop polling if job is complete
        if (jobData.status === 'completed' || jobData.status === 'failed' || jobData.status === 'cancelled') {
          clearInterval(pollingIntervalsRef.current[entityType]);
          delete pollingIntervalsRef.current[entityType];
          
          // Reload entity status to get updated information
          loadEntityStatus(entityType);
          
          addLog(`${entityNames[entityType as keyof typeof entityNames]} import ${jobData.status}`);
        }
      } catch (error) {
        addLog(`Error polling ${entityType} job: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, 2000);
  };

  const handleCreateJob = async (entityType: string) => {
    try {
      addLog(`Creating ${entityNames[entityType as keyof typeof entityNames]} import job...`);
      
      if (!selectedFunder) return;
      
      const response = await createImportJob({
        entityType,
        apiKey,
        funder: selectedFunder._id,
        batchSize: 20,
        updateExisting: true
      });

      if (response.success && response.data) {
        addLog(`${entityNames[entityType as keyof typeof entityNames]} import job created: ${response.data.jobId}`);
        
        // Update entity status
        setEntityStatuses(prev => ({
          ...prev,
          [entityType]: {
            ...prev[entityType],
            activeJob: {
              jobId: response.data!.jobId,
              entityType: response.data!.entityType,
              status: response.data!.status,
              progress: response.data!.progress,
              startedAt: new Date().toISOString()
            } as JobData,
            canCreateNewJob: false
          }
        }));

        // Start polling
        startJobPolling(entityType, response.data.jobId);
      } else {
        addLog(`Failed to create ${entityNames[entityType as keyof typeof entityNames]} job: ${response.message}`);
      }
    } catch (error) {
      addLog(`Error creating ${entityNames[entityType as keyof typeof entityNames]} job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePauseJob = async (entityType: string, jobId: string) => {
    try {
      addLog(`Pausing ${entityNames[entityType as keyof typeof entityNames]} job...`);
      
      const response = await pauseJob(jobId);
      
      if (response.success) {
        addLog(`${entityNames[entityType as keyof typeof entityNames]} job paused`);
        loadEntityStatus(entityType);
      } else {
        addLog(`Failed to pause ${entityNames[entityType as keyof typeof entityNames]} job: ${response.message}`);
      }
    } catch (error) {
      addLog(`Error pausing ${entityNames[entityType as keyof typeof entityNames]} job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleResumeJob = async (entityType: string, jobId: string) => {
    try {
      addLog(`Resuming ${entityNames[entityType as keyof typeof entityNames]} job...`);
      
      const response = await resumeJob(jobId);
      
      if (response.success) {
        addLog(`${entityNames[entityType as keyof typeof entityNames]} job resumed`);
        loadEntityStatus(entityType);
      } else {
        addLog(`Failed to resume ${entityNames[entityType as keyof typeof entityNames]} job: ${response.message}`);
      }
    } catch (error) {
      addLog(`Error resuming ${entityNames[entityType as keyof typeof entityNames]} job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCancelJob = async (entityType: string, jobId: string) => {
    try {
      addLog(`Cancelling ${entityNames[entityType as keyof typeof entityNames]} job...`);
      
      const response = await cancelJob(jobId);
      
      if (response.success) {
        addLog(`${entityNames[entityType as keyof typeof entityNames]} job cancelled`);
        loadEntityStatus(entityType);
      } else {
        addLog(`Failed to cancel ${entityNames[entityType as keyof typeof entityNames]} job: ${response.message}`);
      }
    } catch (error) {
      addLog(`Error cancelling ${entityNames[entityType as keyof typeof entityNames]} job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Check if Import All button should be shown
  const shouldShowImportAllButton = () => {
    return allEntities.some(entityType => {
      const status = entityStatuses[entityType];
      if (!status || status.loading) return false;
      
      // Show if entity doesn't have completed jobs AND (can create new job OR has paused jobs)
      const hasNoCompletedJobs = status.jobSummary.completedJobs === 0;
      return hasNoCompletedJobs && (status.canCreateNewJob || status.jobSummary.hasPausedJobs);
    });
  };

  // Handle Import All action
  const handleImportAll = async () => {
    if (!selectedFunder) return;
    
    addLog('Starting Import All process...');
    
    try {
      const entitiesToStartNewJobs: string[] = [];
      const entitiesToResume: string[] = [];
      
      // Categorize entities - only include entities without complete jobs
      allEntities.forEach(entityType => {
        const status = entityStatuses[entityType];
        if (!status || status.loading) return;
        
        // Only process entities that don't have completed jobs
        const hasNoCompletedJobs = status.jobSummary.completedJobs === 0;
        if (!hasNoCompletedJobs) return;
        
        if (status.jobSummary.hasPausedJobs) {
          entitiesToResume.push(entityType);
        } else if (status.canCreateNewJob && !status.jobSummary.hasActiveJobs) {
          entitiesToStartNewJobs.push(entityType);
        }
      });
      
      addLog(`Planning to start new jobs for: ${entitiesToStartNewJobs.join(', ')}`);
      addLog(`Planning to resume jobs for: ${entitiesToResume.join(', ')}`);
      
      // Start new jobs for entities that can create new jobs
      const newJobPromises = entitiesToStartNewJobs.map(async (entityType) => {
        try {
          addLog(`Creating new job for ${entityNames[entityType as keyof typeof entityNames]}...`);
          const response = await createImportJob({
            entityType,
            funder: selectedFunder._id,
            apiKey: apiKey
          });
          
          if (response.data) {
            addLog(`New job created for ${entityNames[entityType as keyof typeof entityNames]}: ${response.data.jobId}`);
            
            // Start polling for the new job
            startJobPolling(entityType, response.data.jobId);
            
            return { entityType, success: true, jobId: response.data.jobId };
          } else {
            throw new Error('No data returned from job creation');
          }
        } catch (error) {
          addLog(`Failed to create job for ${entityNames[entityType as keyof typeof entityNames]}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return { entityType, success: false, error };
        }
      });
      
      // Resume paused jobs using resumeAllJobs API
      if (entitiesToResume.length > 0) {
        try {
          addLog('Resuming paused jobs...');
          const resumeResponse = await resumeAllJobs({
            funder: selectedFunder._id,
            entityTypes: entitiesToResume
          });
          
          if (resumeResponse.data?.results && Array.isArray(resumeResponse.data.results)) {
            resumeResponse.data.results.forEach((result: { success: boolean; entityType: string; jobId: string; error?: string }) => {
              if (result.success) {
                addLog(`Resumed job for ${entityNames[result.entityType as keyof typeof entityNames]}: ${result.jobId}`);
                startJobPolling(result.entityType, result.jobId);
              } else {
                addLog(`Failed to resume job for ${entityNames[result.entityType as keyof typeof entityNames]}: ${result.error || 'Unknown error'}`);
              }
            });
          }
        } catch (error) {
          addLog(`Failed to resume jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Wait for all new job creations to complete
      await Promise.allSettled(newJobPromises);
      
      // Reload all entity statuses
      addLog('Reloading entity statuses...');
      await loadAllEntityStatuses();
      
      addLog('Import All process completed');
      
    } catch (error) {
      addLog(`Import All failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'running': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'paused': return 'text-orange-600';
      case 'failed': return 'text-red-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircleIcon;
      case 'running': return PlayIcon;
      case 'pending': return ClockIcon;
      case 'paused': return PauseIcon;
      case 'failed': return XCircleIcon;
      case 'cancelled': return StopIcon;
      default: return InformationCircleIcon;
    }
  };

  const formatTimeRemaining = (milliseconds: number | null | undefined): string => {
    if (!milliseconds || milliseconds <= 0) return '';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `~${hours}h ${minutes % 60}m remaining`;
    } else if (minutes > 0) {
      return `~${minutes}m ${seconds % 60}s remaining`;
    } else {
      return `~${seconds}s remaining`;
    }
  };

  const getEntityCardColor = (entityStatus: EntityStatus) => {
    const activeJob = entityStatus.activeJob;
    const pausedJob = entityStatus.pausedJob;
    const hasActiveJob = activeJob || pausedJob;
    
    // If has running/pause/pending job, show blue
    if (hasActiveJob) {
      return 'border-blue-500 bg-blue-50';
    }
    
    // If has complete job, show green
    if (entityStatus.lastCompletedJob) {
      return 'border-green-500 bg-green-50';
    }
    
    // If has no complete job, show gray
    return 'border-gray-300 bg-gray-50';
  };

  const renderEntityCard = (entityType: string) => {
    const entityStatus = entityStatuses[entityType];
    const IconComponent = entityIcons[entityType as keyof typeof entityIcons];
    
    if (!entityStatus) return null;

    const activeJob = entityStatus.activeJob;
    const pausedJob = entityStatus.pausedJob;
    const hasActiveJob = activeJob || pausedJob;
    const cardColorClass = getEntityCardColor(entityStatus);

    return (
      <div key={entityType} className={`bg-white rounded-lg border-2 p-4 ${cardColorClass}`}>
        {entityStatus.loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : entityStatus.error ? (
          <div className="text-red-600 text-sm py-4">
            Error: {entityStatus.error}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header Row: Entity Info + Job Stats + Action Buttons */}
            <div className="flex items-center justify-between">
              {/* Left: Entity Info + Job Stats */}
              <div className="flex items-center space-x-6">
                {/* Entity Icon and Name */}
                <div className="flex items-center space-x-3">
                  <IconComponent className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {entityNames[entityType as keyof typeof entityNames]}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {entityStatus.totalRecords.toLocaleString()} records
                    </p>
                  </div>
                </div>

                {/* Job Statistics */}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="font-medium text-gray-700">{entityStatus.jobSummary.totalJobs}</span>
                    <span className="text-gray-500">Total</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium text-green-600">{entityStatus.jobSummary.completedJobs}</span>
                    <span className="text-gray-500">Completed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium text-red-600">{entityStatus.jobSummary.failedJobs}</span>
                    <span className="text-gray-500">Failed</span>
                  </div>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center space-x-2">
                {/* Active Job Controls */}
                {activeJob && activeJob.status === 'running' && (
                  <>
                    <button
                      onClick={() => handlePauseJob(entityType, activeJob.jobId)}
                      className="flex items-center space-x-1 px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                    >
                      <PauseIcon className="w-4 h-4" />
                      <span>Pause</span>
                    </button>
                    <button
                      onClick={() => handleCancelJob(entityType, activeJob.jobId)}
                      className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
                
                {activeJob && activeJob.status === 'pending' && (
                  <button
                    onClick={() => handleCancelJob(entityType, activeJob.jobId)}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                )}

                {/* Paused Job Controls */}
                {pausedJob && (
                  <>
                    <button
                      onClick={() => handleResumeJob(entityType, pausedJob.jobId)}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      <PlayIcon className="w-4 h-4" />
                      <span>Resume</span>
                    </button>
                    <button
                      onClick={() => handleCancelJob(entityType, pausedJob.jobId)}
                      className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </>
                )}

                {/* Failed Job Resume */}
                {entityStatus.lastFailedJob && entityStatus.lastFailedJob.canResume && !hasActiveJob && (
                  <button
                    onClick={() => handleResumeJob(entityType, entityStatus.lastFailedJob!.jobId)}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    <span>Resume Failed</span>
                  </button>
                )}

                {/* Start Import / Import Again Button */}
                {entityStatus.canCreateNewJob && !hasActiveJob && (
                  <button
                    onClick={() => handleCreateJob(entityType)}
                    className={`flex items-center space-x-1 px-4 py-1 text-white text-sm rounded transition-colors ${
                      entityStatus.lastCompletedJob 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {entityStatus.lastCompletedJob ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4" />
                        <span>Import Again</span>
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-4 h-4" />
                        <span>Start Import</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Active Job Progress */}
            {activeJob && (
              <div className="bg-white border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const StatusIcon = getStatusIcon(activeJob.status);
                      return <StatusIcon className={`w-4 h-4 ${getStatusColor(activeJob.status)}`} />;
                    })()}
                    <span className={`font-medium text-sm ${getStatusColor(activeJob.status)}`}>
                      {activeJob.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      Job ID: {activeJob.jobId.slice(-8)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-600">
                    {activeJob.progress.percentage > 0 && (
                      <span>{activeJob.progress.processed} / {activeJob.progress.total} processed</span>
                    )}
                    {activeJob.estimatedTimeRemaining && (
                      <span className="text-blue-600 font-medium">
                        {formatTimeRemaining(activeJob.estimatedTimeRemaining)}
                      </span>
                    )}
                  </div>
                </div>
                
                {activeJob.progress.percentage > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${activeJob.progress.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 min-w-[3rem]">
                      {activeJob.progress.percentage}%
                    </span>
                  </div>
                )}
              </div>
            )}




          </div>
        )}
      </div>
    );
  };

  const allJobsCompleted = () => {
    return allEntities.every(entityType => {
      const status = entityStatuses[entityType];
      // An entity is considered complete if:
      // 1. Status is loaded (not loading and no error)
      // 2. Has at least one completed job
      // 3. Has no active jobs (running or pending)
      return status && 
             !status.loading && 
             status.jobSummary.completedJobs > 0 && 
             !status.jobSummary.hasActiveJobs;
    });
  };

  // Update import state when completion status changes (moved to useEffect to avoid render-time state updates)
  useEffect(() => {
    const completed = allJobsCompleted();
    if (completed !== importState.allImportsComplete) {
      updateImportState({ allImportsComplete: completed });
    }
  }, [entityStatuses, importState.allImportsComplete, updateImportState]);

  // Handle next step with confirmation if not all entities are complete
  const handleNextStep = () => {
    const completed = allJobsCompleted();
    if (!completed) {
      setShowConfirmDialog(true);
    } else {
      nextStep();
    }
  };

  // Handle confirmed next step
  const handleConfirmedNextStep = () => {
    setShowConfirmDialog(false);
    nextStep();
  };

  // Handle cancel confirmation
  const handleCancelConfirmation = () => {
    setShowConfirmDialog(false);
  };

  // Early return if no funder is selected
  if (!selectedFunder) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No funder selected. Please go back and select a funder.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Process</h2>
          <p className="text-gray-600">
            Manage import jobs for <span className="font-semibold">{selectedFunder!.name}</span>
          </p>
        </div>
        
        {/* Import All Button - Top Right */}
        {shouldShowImportAllButton() && (
          <button
            onClick={handleImportAll}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            <PlayIcon className="w-5 h-5" />
            <span>Import All</span>
          </button>
        )}
      </div>

      {/* Entity Cards - Single Column Layout */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {allEntities.map(entityType => renderEntityCard(entityType))}
      </div>

      {/* Activity Log */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h3>
        <div className="bg-white border rounded-lg p-4 max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-xs">No activity yet...</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-xs font-mono text-gray-700">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={previousStep}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Previous Step
        </button>
        <button
          onClick={handleNextStep}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue to Next Step
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Incomplete Import Warning
              </h3>
              <div className="flex items-start">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-yellow-100 mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 flex-1">
                  Not all entities have completed their import jobs. Are you sure you want to continue to the next step?
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelConfirmation}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedNextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 