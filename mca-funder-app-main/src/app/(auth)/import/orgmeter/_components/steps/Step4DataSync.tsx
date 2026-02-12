'use client';

import { useState, useEffect } from 'react';
import { intervalToDuration, formatDuration } from 'date-fns';
import { 
  MagnifyingGlassIcon, 
  StopIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserIcon,
  BanknotesIcon,
  ChartPieIcon,
  BuildingStorefrontIcon,
  PercentBadgeIcon,
  CircleStackIcon,
  ClockIcon,
  PencilSquareIcon,
  UserCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

// Import the new types from the API
import type { RunningJob } from '@/lib/api/orgmeterSync';

interface Funder {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface ImportState {
  currentEntityType: string;
  apiKey: string;
  selectedFunder: Funder | null;
}

interface Step4Props {
  importState: ImportState;
  updateImportState: (updates: Partial<ImportState>) => void;
}

// Types based on the specification
interface FundingData {
  principalAmount?: { $numberDecimal: string };
  factorRate?: { $numberDecimal: string };
  termMonths?: { $numberDecimal: string };
  [key: string]: unknown;
}

interface SyncItem {
  funding?: FundingData;
  entity?: {
    id: number;
    name: string;
    type: string;
  };
  phone?: string;
  username?: string;
  availableBalanceAmount?: number;
  id: number | string;
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  businessDba?: string;
  businessType?: string;
  federalId?: string;
  sicCode?: string;
  naicsCode?: string;
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
  // Entity-specific nested data
  underwriterUsers?: Array<{ id: string; name: string; email?: string }>;
  salesRepUsers?: Array<{ id: string; name: string; email?: string }>;
}

interface SyncStatistics {
  total: number;
  selected: number;
  pending: number;
  synced: number;
  ignored: number;
}

interface SyncReviewData {
  entityType: string;
  funderId: string;
  items: SyncItem[];
  totalCount: number;
  syncStatistics: SyncStatistics;
}

interface SyncJob {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  results?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  estimatedTimeRemaining?: number; // in milliseconds
}

interface WrappedSyncResponse {
  success: boolean;
  data?: {
    job?: SyncJob;
  };
  job?: SyncJob;
}

// Entity order according to specification
const ENTITY_ORDER = [
  'lender',
  'iso', 
  'merchant',
  'syndicator',
  'user',
  'underwriter',
  'representative',
  'advance'
];

const ENTITY_LABELS = {
  'lender': 'Lenders',
  'iso': 'ISOs',
  'merchant': 'Merchants', 
  'syndicator': 'Syndicators',
  'user': 'Users',
  'underwriter': 'Underwriter',
  'representative': 'Representatives',
  'advance': 'Advances'
};

// Get appropriate icon for each entity type
const getEntityIcon = (entityType: string, size: 'small' | 'medium' | 'large' = 'medium') => {
  const iconProps = size === 'small' ? "w-4 h-4" : size === 'large' ? "w-8 h-8" : "w-6 h-6";
  
  switch (entityType.toLowerCase()) {
    case 'user':
      return <UserIcon className={iconProps} />;
    case 'underwriter':
      return <PencilSquareIcon className={iconProps} />;
    case 'representative':
      return <UserCircleIcon className={iconProps} />;
    case 'lender':
      return <BanknotesIcon className={iconProps} />;
    case 'iso':
      return <PercentBadgeIcon className={iconProps} />;
    case 'merchant':
      return <BuildingStorefrontIcon className={iconProps} />;
    case 'syndicator':
      return <ChartPieIcon className={iconProps} />;
    case 'advance':
      return <CircleStackIcon className={iconProps} />;
    default:
      return <ClockIcon className={iconProps} />;
  }
};

export default function Step4DataSync({ importState }: Step4Props) {
  const [currentEntityIndex, setCurrentEntityIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState<boolean>(false);
  const [reviewData, setReviewData] = useState<SyncReviewData | null>(null);
  const [localSelections, setLocalSelections] = useState<Set<number | string>>(new Set());
  const [syncInProgress, setSyncInProgress] = useState<boolean>(false);
  const [currentSyncJob, setCurrentSyncJob] = useState<SyncJob | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [entityCompletionStatus, setEntityCompletionStatus] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    details?: string;
  } | null>(null);
  const [showUserPasswordDialog, setShowUserPasswordDialog] = useState<boolean>(false);
  const [sortConfig, setSortConfig] = useState<{
    key: 'id' | 'name' | 'type' | 'importDate' | 'synced' | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // Running jobs state
  const [runningJobs, setRunningJobs] = useState<RunningJob[]>([]);
  const [checkingRunningJobs, setCheckingRunningJobs] = useState<boolean>(false);
  const [showRunningJobsDialog, setShowRunningJobsDialog] = useState<boolean>(false);

  const currentEntityType = ENTITY_ORDER[currentEntityIndex];
  const { selectedFunder, apiKey } = importState;

  // Helper function to check if a record is truly synced
  const isRecordSynced = (item: SyncItem): boolean => {
    // Simple check: if syncId exists and is not null/undefined, the record is synced
    return item.syncMetadata.syncId != null;
  };

  // Function to check for running jobs for the current entity
  const checkRunningJobs = async (entityType: string) => {
    if (!selectedFunder) return false;
    
    setCheckingRunningJobs(true);
    try {
      const { getRunningJobsForEntity } = await import('@/lib/api/orgmeterSync');
      const response = await getRunningJobsForEntity(entityType, apiKey, selectedFunder._id);
      
      if (response.success && response.data?.jobs?.length > 0) {
        addLog(`Found ${response.data.jobs.length} running job(s) for ${entityType}`);
        setRunningJobs(response.data.jobs);
        return true;
      } else {
        setRunningJobs([]);
        return false;
      }
    } catch (error) {
      addLog(`Error checking running jobs: ${error instanceof Error ? error.message : error}`);
      setRunningJobs([]);
      return false;
    } finally {
      setCheckingRunningJobs(false);
    }
  };

  // Function to continue a running job
  const continueRunningJob = async (job: RunningJob) => {
    addLog(`Continuing running job: ${job.jobId}`);
    
    try {
      const { continueSyncJob } = await import('@/lib/api/orgmeterSync');
      const response = await continueSyncJob(job.jobId, apiKey, selectedFunder!._id);
      
      if (response.success) {
        addLog(`Successfully continued job: ${response.message}`);
        
        // Use the job data from the API response if available, otherwise fall back to the original job
        const jobData = response.job || job;
        const jobId = response.jobId || job.jobId;
        
        // Convert to SyncJob format
        const syncJob: SyncJob = {
          jobId: jobId,
          status: jobData.status as 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
          progress: {
            current: jobData.progress?.processed || job.progress.processed,
            total: jobData.progress?.total || job.progress.total,
            percentage: jobData.progress?.percentage || job.progress.percentage
          },
          results: job.results,
          error: job.error.message || undefined,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          estimatedTimeRemaining: job.estimatedTimeRemaining
        };
        
        setCurrentSyncJob(syncJob);
        setSyncInProgress(true);
        
        // Start polling for this job using the jobId from response
        await startSyncPolling(jobId);
        
        // Remove the job from running jobs list since it's now being continued
        setRunningJobs(prev => prev.filter(j => j.jobId !== job.jobId));
      } else {
        addLog(`Failed to continue job: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      addLog(`Error continuing job: ${error instanceof Error ? error.message : error}`);
    }
  };

  // Function to handle entity selection with running jobs check
  const handleEntitySelection = async (entityIndex: number) => {
    const newEntityType = ENTITY_ORDER[entityIndex];
    
    // Check for running jobs before switching
    await checkRunningJobs(newEntityType);
    
    // Always switch to the entity (running jobs will be displayed inline)
    setCurrentEntityIndex(entityIndex);
  };

  // Function to proceed with entity selection (called from dialog)
  const proceedWithEntitySelection = (entityIndex: number) => {
    setShowRunningJobsDialog(false);
    setRunningJobs([]);
    setCurrentEntityIndex(entityIndex);
  };

  // Calculate statistics including local selections
  const calculateStatistics = () => {
    if (!reviewData) return null;
    
    const total = reviewData.items.length;
    const synced = reviewData.items.filter(item => isRecordSynced(item)).length;
    const selected = localSelections.size;
    const pending = Math.max(0, selected - synced); // Pending = Selected - Synced (never negative)
    const deleted = reviewData.items.filter(item => item.deleted).length;
    
    return { total, synced, selected, pending, deleted };
  };

  const statistics = calculateStatistics();

  // Load review data on component mount
  useEffect(() => {
    if (selectedFunder && currentEntityType) {
      addLog(`Switched to ${currentEntityType} entity`);
      loadReviewData();
      checkEntityCompletion();
      // Check for running jobs when switching to an entity
      checkRunningJobs(currentEntityType);
    }
  }, [selectedFunder, currentEntityType]);

  // Load review data when filters change
  useEffect(() => {
    if (currentEntityType && selectedFunder) {
      loadReviewData();
    }
  }, [searchTerm]);

  // Initialize local selections when review data loads
  useEffect(() => {
    if (reviewData) {
      const initialSelections = new Set<number | string>();
      reviewData.items.forEach(item => {
        // Include items that need sync OR are already synced (synced items are always selected)
        if (item.syncMetadata.needsSync || isRecordSynced(item)) {
          initialSelections.add(item.id);
        }
      });
      setLocalSelections(initialSelections);
    }
  }, [reviewData]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Early return if no funder is selected (after hooks)
  if (!selectedFunder) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No funder selected. Please go back and select a funder.</p>
      </div>
    );
  }

  const checkEntityCompletion = async () => {
    if (!selectedFunder) return;
    
    try {
      const { getSyncOverallProgress } = await import('@/lib/api/orgmeterSync');
      const progressData = await getSyncOverallProgress(apiKey, selectedFunder._id);
      
      // Simplified logging - only log key information
      addLog(`Checking entity completion status...`);
      
      // Also log what we're currently showing in the UI vs what the API says
      if (reviewData) {
        const actualSyncedCount = reviewData.items.filter(item => isRecordSynced(item)).length;
        addLog(`UI shows: ${actualSyncedCount} synced out of ${reviewData.items.length} total`);
        if (progressData.data?.entityProgress?.[currentEntityType]) {
          const apiData = progressData.data.entityProgress[currentEntityType];
          addLog(`API shows: ${apiData.synced} synced out of ${apiData.total} total`);
        }
      }
      
      // Create completion status map based on sync progress
      const completionMap: Record<string, boolean> = {};
      if (progressData.success && progressData.data && progressData.data.entityProgress) {
        // entityProgress is an object with entityType as keys
        const entityProgress = progressData.data.entityProgress;
        
        ENTITY_ORDER.forEach(entityType => {
          if (entityProgress[entityType]) {
            // An entity is completed if:
            // 1. It has data AND
            // 2. Either no pending records OR all records are synced
            const entityData = entityProgress[entityType];
            const isCompleted = entityData.hasData && 
              (entityData.pending === 0 || entityData.synced === entityData.total);
            
            completionMap[entityType] = isCompleted;
            addLog(`${entityType}: ${entityData.synced}/${entityData.total} synced, completed=${isCompleted}`);
          } else {
            // If entity is not in progress data, mark as not available
            completionMap[entityType] = false;
            addLog(`${entityType}: no data available`);
          }
        });
      } else {
        addLog('Invalid progress data structure - setting all as available');
        // If data structure is invalid, set all entities as available
        ENTITY_ORDER.forEach(entity => {
          completionMap[entity] = true;
        });
      }
      
      setEntityCompletionStatus(completionMap);
    } catch (error) {
      addLog(`Failed to check entity completion: ${error instanceof Error ? error.message : error}`);
      // If sync endpoint fails, set all entities as available for now
      const fallbackMap: Record<string, boolean> = {};
      ENTITY_ORDER.forEach(entity => {
        fallbackMap[entity] = true;
      });
      setEntityCompletionStatus(fallbackMap);
    }
  };

  const loadReviewData = async () => {
    if (!selectedFunder) return;
    
    addLog(`Loading ${currentEntityType} data for review...`);
    
    setLoading(true);
    try {
      const { getImportedDataForReview } = await import('@/lib/api/orgmeterSync');
      const params = {
        apiKey,
        funderId: selectedFunder._id,
        ...(searchTerm && { search: searchTerm })
      };

      const data = await getImportedDataForReview(currentEntityType, params);
      
      if (data.success) {
        const syncedCount = data.data.items.filter(item => isRecordSynced(item)).length;
        const totalCount = data.data.items.length;
        addLog(`Loaded ${totalCount} ${currentEntityType} records (${syncedCount} synced)`);
        
        setReviewData(data.data);
      } else {
        addLog(`Failed to load review data: API returned success=false`);
        // Set empty data on failure
        setReviewData({
          entityType: currentEntityType,
          funderId: selectedFunder._id,
          items: [],
          totalCount: 0,
          syncStatistics: {
            total: 0,
            selected: 0,
            pending: 0,
            synced: 0,
            ignored: 0
          }
        });
      }
    } catch (error) {
      addLog(`Error loading review data: ${error instanceof Error ? error.message : error}`);
      // Set empty data on error
      setReviewData({
        entityType: currentEntityType,
        funderId: selectedFunder._id,
        items: [],
        totalCount: 0,
        syncStatistics: {
          total: 0,
          selected: 0,
          pending: 0,
          synced: 0,
          ignored: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const startSyncJob = async () => {
    if (!selectedFunder || !reviewData) return;
    
    try {
      setBulkUpdateLoading(true);
      
      // First, update selections on the backend
      const { updateSyncSelection, startEntitySync } = await import('@/lib/api/orgmeterSync');
      
      // Prepare records to update based on local selections
      const records = reviewData.items
        .map(item => ({
          id: item.id,
          needsSync: localSelections.has(item.id)
        }));

      // Update selections on backend
      const updateResponse = await updateSyncSelection(currentEntityType, {
        apiKey,
        funderId: selectedFunder._id,
        records
      });

      if (!updateResponse.success) {
        throw new Error('Failed to update selections');
      }

      // Reload review data to get updated state
      await loadReviewData();

      // Now start the sync job
      const syncRequest = {
        apiKey,
        funderId: selectedFunder._id,
        updateExisting: true,
        onlySelected: true,
        dryRun: false
      };

      addLog(`Starting sync job for ${currentEntityType} with ${localSelections.size} selected records`);
      
      const response = await startEntitySync(currentEntityType, syncRequest);
      addLog(`Sync job creation response received`);
      
      if (response.jobId) {
        addLog(`Job created with ID: ${response.jobId}`);
      } else if (response.data?.jobId) {
        addLog(`Job created with ID (in data): ${response.data.jobId}`);
      } else if (response.job?.jobId) {
        addLog(`Job created with ID (in job): ${response.job.jobId}`);
      } else {
        addLog(`No job ID returned - sync may have completed immediately`);
      }
      
      if (response.success) {
        if (response.jobId) {
          // Normal case: job was created and needs polling
          addLog(`Starting sync polling for job ${response.jobId}`);
          const job: SyncJob = {
            jobId: response.jobId,
            status: 'pending',
            createdAt: new Date().toISOString()
          };
          setCurrentSyncJob(job);
          setSyncInProgress(true);
          await startSyncPolling(response.jobId);
        } else if (response.data && response.data.jobId) {
          // Fallback: check data.jobId in case response structure changes
          addLog(`Starting sync polling for job ${response.data.jobId} (found in data)`);
          const job: SyncJob = {
            jobId: response.data.jobId,
            status: 'pending',
            createdAt: new Date().toISOString()
          };
          setCurrentSyncJob(job);
          setSyncInProgress(true);
          await startSyncPolling(response.data.jobId);
        } else if (response.job && response.job.jobId) {
          // Another fallback: check job.jobId
          addLog(`Starting sync polling for job ${response.job.jobId} (found in job object)`);
          const job: SyncJob = {
            jobId: response.job.jobId,
            status: (response.job.status as 'pending' | 'running' | 'completed' | 'failed' | 'cancelled') || 'pending',
            createdAt: new Date().toISOString()
          };
          setCurrentSyncJob(job);
          setSyncInProgress(true);
          await startSyncPolling(response.job.jobId);
        } else {
          // Sync completed immediately - no job to poll
          addLog('Sync completed immediately without creating a polling job');
          
          // Show notification for immediate completion
          setNotification({
            type: 'success',
            message: 'Sync completed instantly!',
            details: 'All selected records were already up-to-date or sync completed very quickly.'
          });
          
          // Clear notification after 5 seconds
          setTimeout(() => setNotification(null), 5000);
          
          await handleSyncJobCompletion('completed');
        }
      } else {
        addLog('Sync job creation failed');
        throw new Error('Sync job creation failed');
      }
    } catch (error) {
      addLog(`Error starting sync job: ${error instanceof Error ? error.message : error}`);
    } finally {
      setBulkUpdateLoading(false);
    }
  };

  const startSyncPolling = async (jobId: string) => {
    let pollCount = 0;
    const maxPolls = 150; // 5 minutes maximum (150 * 2 seconds)
    
    addLog(`Starting sync polling for job: ${jobId}`);
    
    // Give the backend a moment to process the job creation before first check
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // First, do an immediate check to see if the job is already completed
    // This handles the case where the job completes before polling starts
    try {
      addLog('Performing initial job status check...');
      const { getSyncJobProgress } = await import('@/lib/api/orgmeterSync');
      const initialData = await getSyncJobProgress(jobId);
      
      addLog(`Initial response received`);
      
      // The response structure is { success: true, data: SyncJobStatusResponse }
      // where SyncJobStatusResponse has the job property

      const responseData = initialData as unknown as WrappedSyncResponse;
      const jobData = responseData.data?.job || responseData.job;
      addLog(`Initial status check completed - Status: ${jobData?.status || 'unknown'}`);
      
              if (jobData) {
          const progress = jobData.progress as { processed?: number; total?: number; percentage?: number };
          const estimatedTime = (jobData as { estimatedTimeRemaining?: number }).estimatedTimeRemaining;
          
          if (progress) {
            let progressMessage = `Job found: ${progress.processed || 0}/${progress.total || 0} records (${progress.percentage || 0}%)`;
            if (estimatedTime && estimatedTime > 0) {
              const duration = intervalToDuration({ start: 0, end: estimatedTime });
              const formattedTime = formatDuration(duration, { format: ['hours', 'minutes', 'seconds'] });
              progressMessage += ` - ETA: ${formattedTime}`;
            }
            addLog(progressMessage);
          } else {
            addLog('Job found but no progress data available');
          }
          
          const syncJob: SyncJob = {
            jobId: jobData.jobId,
            status: jobData.status,
            progress: progress ? {
              current: progress.processed || 0,
              total: progress.total || 0,
              percentage: progress.percentage || 0
            } : undefined,
            results: jobData.results,
            error: (jobData as { error?: { message?: string } }).error?.message || undefined,
            createdAt: (jobData as { createdAt?: string }).createdAt || '',
            startedAt: (jobData as { startedAt?: string }).startedAt,
            completedAt: (jobData as { completedAt?: string }).completedAt,
            estimatedTimeRemaining: estimatedTime
          };
        
        setCurrentSyncJob(syncJob);
        
        // If job is already completed, don't start polling
        if (jobData.status === 'completed' || jobData.status === 'failed' || jobData.status === 'cancelled') {
          addLog(`Job already completed on initial check: ${jobData.status}`);
          
          // Show notification for fast completion
          setNotification({
            type: 'success',
            message: 'Sync completed successfully!',
            details: jobData.status === 'completed' 
              ? 'All records were processed quickly.' 
              : `Job finished with status: ${jobData.status}`
          });
          
          // Clear notification after 5 seconds
          setTimeout(() => setNotification(null), 5000);
          
          await handleSyncJobCompletion(jobData.status);
          return;
        } else {
          addLog(`Job is still running (${jobData.status}). Starting continuous polling...`);
        }
      } else {
        addLog('No job data received in initial check. Starting polling...');
      }
    } catch (error) {
      addLog(`Failed initial job status check: ${error instanceof Error ? error.message : error}`);
      addLog(`Initial check error details: ${JSON.stringify(error, null, 2).substring(0, 200)}...`);
      // Continue with polling even if initial check fails
    }
    
    const interval = setInterval(async () => {
      pollCount++;
      
      // Safety timeout to prevent infinite polling
      if (pollCount > maxPolls) {
        addLog('Polling timeout reached - stopping');
        clearInterval(interval);
        await handleSyncJobCompletion('cancelled');
        return;
      }
      try {
        const { getSyncJobProgress } = await import('@/lib/api/orgmeterSync');
        const data = await getSyncJobProgress(jobId);
        
        const pollResponseData = data as unknown as WrappedSyncResponse;
        const pollJobData = pollResponseData.data?.job || pollResponseData.job;
        
        if (pollJobData) {
          const progress = pollJobData.progress as { processed?: number; total?: number; percentage?: number };
          const estimatedTime = (pollJobData as { estimatedTimeRemaining?: number }).estimatedTimeRemaining;
          
          let logMessage = `Poll ${pollCount}: ${pollJobData.status} - ${progress?.processed || 0}/${progress?.total || 0} (${progress?.percentage || 0}%)`;
          if (estimatedTime && estimatedTime > 0) {
            const duration = intervalToDuration({ start: 0, end: estimatedTime });
            const formattedTime = formatDuration(duration, { format: ['hours', 'minutes', 'seconds'] });
            logMessage += ` - ETA: ${formattedTime}`;
          }
          addLog(logMessage);
          
          // Convert the job data to match our SyncJob interface
          const syncJob: SyncJob = {
            jobId: pollJobData.jobId,
            status: pollJobData.status,
            progress: progress ? {
              current: progress.processed || 0,
              total: progress.total || 0,
              percentage: progress.percentage || 0
            } : undefined,
            results: pollJobData.results,
            error: (pollJobData as { error?: { message?: string } }).error?.message || undefined,
            createdAt: (pollJobData as { createdAt?: string }).createdAt || '',
            startedAt: (pollJobData as { startedAt?: string }).startedAt,
            completedAt: (pollJobData as { completedAt?: string }).completedAt,
            estimatedTimeRemaining: estimatedTime
          };
          
          setCurrentSyncJob(syncJob);
          
          if (pollJobData.status === 'completed' || pollJobData.status === 'failed' || pollJobData.status === 'cancelled') {
            // Show notification for completion during polling (especially for first poll)
            if (pollCount === 1) {
              setNotification({
                type: 'success',
                message: 'Sync completed on first check!',
                details: 'The sync job finished very quickly and was caught on the first status check.'
              });
              setTimeout(() => setNotification(null), 5000);
            }
            
            clearInterval(interval);
            await handleSyncJobCompletion(pollJobData.status);
          }
        } else {
          addLog(`Poll ${pollCount}: No job data received`);
          // If we continue to get no job data, it might mean the job completed very quickly
          // Try a few more times before giving up
          if (pollCount >= 5) {
            addLog('No job data after 5 attempts - assuming job completed');
            clearInterval(interval);
            await handleSyncJobCompletion('completed');
          }
        }
      } catch (error) {
        addLog(`Poll ${pollCount} failed: ${error instanceof Error ? error.message : error}`);
        addLog(`Poll ${pollCount} error details: ${JSON.stringify(error, null, 2).substring(0, 200)}...`);
        // Don't stop immediately on error - try a few times
        if (pollCount >= 3) {
          addLog('Polling failed after 3 attempts - stopping');
          clearInterval(interval);
          await handleSyncJobCompletion('failed');
        }
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  };

  const cancelSyncJob = async () => {
    if (!currentSyncJob) return;

    try {
      const { cancelSyncJob: cancelSyncJobApi } = await import('@/lib/api/orgmeterSync');
      const response = await cancelSyncJobApi(currentSyncJob.jobId, apiKey, selectedFunder._id);

      if (response.success) {
        setSyncInProgress(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    } catch (error) {
      console.error('Failed to cancel sync job:', error);
    }
  };

  const handleSelectAll = (selectValue: boolean) => {
    if (!reviewData) return;
    
    const newSelections = new Set<number | string>();
    
    reviewData.items.forEach(item => {
      // Always include synced items (they cannot be unchecked)
      if (item.syncMetadata.syncId) {
        newSelections.add(item.id);
      } else if (selectValue) {
        // If selecting all, include non-synced items
        newSelections.add(item.id);
      }
      // If not selecting all and item is not synced, don't add it (effectively unselecting)
    });
    
    setLocalSelections(newSelections);
  };

  const toggleSyncSelection = (id: number | string) => {
    if (!reviewData) return;
    
    const item = reviewData.items.find(item => item.id === id);
    if (!item || item.syncMetadata.syncId) return; // Can't toggle synced items
    
    const newSelections = new Set(localSelections);
    if (newSelections.has(id)) {
      newSelections.delete(id);
    } else {
      newSelections.add(id);
    }
    setLocalSelections(newSelections);
  };

  const getDisplayField = (item: SyncItem): string => {
    if (item.deleted) {
      return `[DELETED] ${getEntityDisplayName(item)}`;
    }
    return getEntityDisplayName(item);
  };

  const getEntityDisplayName = (item: SyncItem): string => {
    switch (currentEntityType) {
      case 'lender':
      case 'iso':
      case 'syndicator':
        return item.name || item.id.toString();
      case 'merchant':
        return item.businessName || item.businessDba || item.id.toString();
      case 'user':
      case 'underwriter':
      case 'representative':
        return `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.username || item.email || item.id.toString();
      case 'advance':
        return `${item.name}`;
      default:
        return item.name || item.id.toString();
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleSort = (key: 'id' | 'name' | 'type' | 'importDate' | 'synced') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedItems = () => {
    if (!reviewData || !sortConfig.key) return reviewData?.items || [];
    
    const sorted = [...reviewData.items].sort((a, b) => {
      let aVal: string | number | Date;
      let bVal: string | number | Date;
      
      switch (sortConfig.key) {
        case 'id':
          aVal = a.entity?.id || a.id;
          bVal = b.entity?.id || b.id;
          // Convert to numbers for proper numeric sorting
          aVal = typeof aVal === 'string' ? parseInt(aVal) || 0 : aVal;
          bVal = typeof bVal === 'string' ? parseInt(bVal) || 0 : bVal;
          break;
          
        case 'name':
          aVal = getEntityDisplayName(a).toLowerCase();
          bVal = getEntityDisplayName(b).toLowerCase();
          break;
          
        case 'type':
          aVal = (a.type || a.businessType || a.status || '').toLowerCase();
          bVal = (b.type || b.businessType || b.status || '').toLowerCase();
          break;
          
        case 'importDate':
          aVal = new Date(a.importMetadata.importedAt);
          bVal = new Date(b.importMetadata.importedAt);
          break;
          
        case 'synced':
          // Sort by sync status first (synced vs not synced), then by sync date
          const aSynced = isRecordSynced(a);
          const bSynced = isRecordSynced(b);
          
          if (aSynced === bSynced) {
            // Both have same sync status, sort by sync date
            aVal = a.syncMetadata.lastSyncedAt ? new Date(a.syncMetadata.lastSyncedAt) : new Date(0);
            bVal = b.syncMetadata.lastSyncedAt ? new Date(b.syncMetadata.lastSyncedAt) : new Date(0);
          } else {
            // Different sync status, prioritize synced records
            aVal = aSynced ? 1 : 0;
            bVal = bSynced ? 1 : 0;
          }
          break;
          
        default:
          aVal = '';
          bVal = '';
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  const handleSyncJobCompletion = async (status: string) => {
    addLog(`Sync job completed with status: ${status}`);
    
    // Reload the review data to show updated sync status
    await loadReviewData();
    
    // Update entity completion status to mark current entity as completed
    if (status === 'completed') {
      addLog(`Marking ${currentEntityType} as completed`);
      
      // Show user password dialog if we just synced users
      if (currentEntityType === 'syndicator' || currentEntityType === 'user' || currentEntityType === 'underwriter') {
        setShowUserPasswordDialog(true);
      }
      
      // Update local state first
      setEntityCompletionStatus(prev => {
        const newStatus = {
          ...prev,
          [currentEntityType]: true
        };
        addLog(`Entity completion status updated: ${JSON.stringify(newStatus)}`);
        return newStatus;
      });
      
      // Also refresh the overall completion status from backend
      await checkEntityCompletion();
      
      // Force a re-render by updating a dummy state
      setTimeout(() => {
        addLog(`Current entity index: ${currentEntityIndex}, completion status: ${JSON.stringify(entityCompletionStatus)}`);
      }, 100);
    }
    
    // Clear sync job state
    setSyncInProgress(false);
    setPollingInterval(null);
    setCurrentSyncJob(null);
  };

  const getEntitySpecificFields = (item: SyncItem) => {
    switch (currentEntityType) {
      case 'lender':
        return (
          <>
            {item.email && (
              <div className="text-sm text-gray-500">{item.email}</div>
            )}
            {item.underwriterUsers && item.underwriterUsers.length > 0 && (
              <div className="text-xs text-blue-600">{item.underwriterUsers.length} underwriter(s)</div>
            )}
          </>
        );
      case 'iso':
        return (
          <>
            {item.email && (
              <div className="text-sm text-gray-500">{item.email}</div>
            )}
            {item.salesRepUsers && item.salesRepUsers.length > 0 && (
              <div className="text-xs text-blue-600">{item.salesRepUsers.length} sales rep(s)</div>
            )}
          </>
        );
      case 'merchant':
        return (
          <>
            <div className="text-xs text-gray-400">{item.sicCode ? `SIC Code: ${item.sicCode}` : ''}</div>
            <div className="text-xs text-gray-400">{item.naicsCode ? `NAICS Code: ${item.naicsCode}` : ''}</div>
          </>
        );
      case 'syndicator':
         return (
           <>
              {item.email && (
                <div className="text-sm text-gray-500">{item.email}</div>
              )}
             {item.availableBalanceAmount !== undefined && (
               <div className="text-sm text-gray-500">
                 Available Balance: ${new Intl.NumberFormat('en-US', { 
                   minimumFractionDigits: 2, 
                   maximumFractionDigits: 2 
                 }).format(item.availableBalanceAmount)}
               </div>
             )}
           </>
         );
      case 'user':
        return (
          <>
            {item.email && (
              <div className="text-sm text-gray-500">{item.email}</div>
            )}
            {item.phone && (
              <div className="text-sm text-gray-500">{item.phone}</div>
            )}
          </>
        );
      
      case 'advance':
        return (
          <>
            <div className="text-sm text-gray-500">
              Factor Rate: {item.funding?.factorRate?.$numberDecimal ? 
                `${Number(item.funding.factorRate.$numberDecimal).toFixed(4)}` : 'N/A'}
            </div>
            <div className="text-xs text-gray-400">
              Term: {item.funding?.termMonths?.$numberDecimal ? 
                `${Number(item.funding.termMonths.$numberDecimal).toFixed(1)} months` : 'N/A'}
            </div>
          </>
        );
      default:
        return item.email && <div className="text-sm text-gray-500">{item.email}</div>;
    }
  };

  const startSyncAllRecords = async () => {
    if (!selectedFunder || !reviewData) return;
    
    addLog(`"${reviewData?.syncStatistics.synced === 0 ? 'Sync' : 'Sync Again'}" clicked - using normal sync process with current selections (${localSelections.size} records)`);
    
    // Just use the normal sync process - the issue should be fixed by proper initialization of localSelections
    await startSyncJob();
  };

  if (loading && !reviewData) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading sync data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Notification Banner */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg border-l-4 ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-400 text-green-800' 
            : notification.type === 'error'
              ? 'bg-red-50 border-red-400 text-red-800'
              : 'bg-blue-50 border-blue-400 text-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{notification.message}</h4>
              {notification.details && (
                <p className="mt-1 text-sm opacity-90">{notification.details}</p>
              )}
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600 ml-4 text-lg font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Data Synchronization
        </h2>
        <p className="text-gray-600">
          Review and synchronize your imported OrgMeter data with the main system
        </p>
      </div>

      {/* Entity Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Entity Navigation</h3>
        {checkingRunningJobs && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-800">Checking for running jobs...</span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {ENTITY_ORDER.map((entityType, index) => {
            const isActive = index === currentEntityIndex;
            const isCompleted = entityCompletionStatus[entityType] || false;
            
            // Entity availability logic:
            // 1. First entity is always available
            // 2. Any completed entity is always available (for review)
            // 3. If an entity is incomplete, it's available if it's the first incomplete entity
            //    (meaning it's the next one to work on)
            let isAvailable = false;
            
            if (index === 0) {
              // First entity is always available
              isAvailable = true;
            } else if (isCompleted) {
              // Completed entities are always available for review
              isAvailable = true;
            } else {
              // For incomplete entities, check if this is the first incomplete one
              const firstIncompleteIndex = ENTITY_ORDER.findIndex(entityType => 
                !entityCompletionStatus[entityType]
              );
              isAvailable = index === firstIncompleteIndex;
            }
            
            const handleClick = () => {
              if (isAvailable) {
                handleEntitySelection(index);
              }
            };
            
            return (
              <div
                key={entityType}
                className={`p-3 rounded-lg border transition-all ${
                  isActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : isCompleted
                      ? 'border-green-300 bg-green-50 hover:bg-green-100 cursor-pointer'
                      : isAvailable
                        ? 'border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer'
                        : 'border-gray-100 bg-gray-25 opacity-50 cursor-not-allowed'
                }`}
                onClick={handleClick}
              >
                <div className="flex items-center justify-center mb-2">
                  {getEntityIcon(entityType, 'small')}
                </div>
                <div className="text-xs font-medium text-gray-700 mb-1 text-center">
                  {ENTITY_LABELS[entityType as keyof typeof ENTITY_LABELS]}
                </div>
                <div className="text-xs text-center">
                  {isCompleted ? (
                    <span className="text-green-600 font-medium">✓ Complete</span>
                  ) : isActive ? (
                    <span className="text-blue-600 font-medium">Current</span>
                  ) : isAvailable ? (
                    <span className="text-gray-500">Available</span>
                  ) : (
                    <span className="text-gray-400">Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Entity Section */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        {/* Entity Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-blue-600">
                {getEntityIcon(currentEntityType, 'large')}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {ENTITY_LABELS[currentEntityType as keyof typeof ENTITY_LABELS]}
                </h3>
                <span className="text-sm text-gray-500">
                  Step {currentEntityIndex + 1} of {ENTITY_ORDER.length}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Navigation buttons moved to right side */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEntitySelection(currentEntityIndex - 1)}
                  disabled={currentEntityIndex === 0}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  title="Previous entity"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Previous</span>
                </button>
                <button
                  onClick={() => handleEntitySelection(currentEntityIndex + 1)}
                  disabled={currentEntityIndex === ENTITY_ORDER.length - 1 || (reviewData?.syncStatistics.synced === 0)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  title={reviewData?.syncStatistics.synced === 0 ? "Complete synchronization before proceeding to next entity" : "Next entity"}
                >
                  <span className="text-sm font-medium">Next</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Statistics display with local selections */}
          {statistics && (
            <div className="grid grid-cols-5 gap-4 mt-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{statistics.total}</div>
                <div className="text-sm text-blue-800">Total</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">{statistics.selected}</div>
                <div className="text-sm text-yellow-800">Selected</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{statistics.synced}</div>
                <div className="text-sm text-green-800">Synced</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-600">{statistics.pending}</div>
                <div className="text-sm text-gray-800">Pending</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">{statistics.deleted}</div>
                <div className="text-sm text-red-800">Deleted</div>
              </div>
            </div>
          )}

          {/* Running Jobs Section */}
          {runningJobs.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <ClockIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-yellow-900">
                    Running Jobs Found
                  </h4>
                  <p className="text-sm text-yellow-700">
                    {runningJobs.length} job(s) are currently running for {ENTITY_LABELS[currentEntityType as keyof typeof ENTITY_LABELS]}
                  </p>
                </div>
              </div>

              {/* Running Jobs List */}
              <div className="space-y-4">
                {runningJobs.map((job) => (
                  <div key={job.jobId} className="border border-yellow-300 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          job.status === 'running' ? 'bg-green-500' : 
                          job.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                        <div>
                          <h5 className="font-medium text-gray-900">Job {job.jobId}</h5>
                          <p className="text-sm text-gray-500 capitalize">{job.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Started: {new Date(job.startedAt).toLocaleString()}
                        </p>
                        {job.estimatedTimeRemaining > 0 && (
                          <p className="text-xs text-blue-600">
                            ETA: {(() => {
                              const duration = intervalToDuration({ start: 0, end: job.estimatedTimeRemaining });
                              return formatDuration(duration, { format: ['hours', 'minutes', 'seconds'] });
                            })()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">
                          {job.progress.processed} of {job.progress.total} records processed
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {job.progress.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            job.status === 'running' ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${job.progress.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Parameters:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• Update Existing: {job.parameters.updateExisting ? 'Yes' : 'No'}</li>
                          <li>• Only Selected: {job.parameters.onlySelected ? 'Yes' : 'No'}</li>
                          <li>• Dry Run: {job.parameters.dryRun ? 'Yes' : 'No'}</li>
                        </ul>
                      </div>
                      {job.results && (
                        <div>
                          <span className="font-medium">Results:</span>
                          <ul className="mt-1 space-y-1">
                            <li>• Synced: {job.results.synced}</li>
                            <li>• Updated: {job.results.updated}</li>
                            <li>• Skipped: {job.results.skipped}</li>
                            <li>• Failed: {job.results.failed}</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => continueRunningJob(job)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <PlayIcon className="w-4 h-4" />
                        Continue Job
                      </button>
                      <button
                        onClick={() => setRunningJobs([])}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={async () => {
                          const { cancelSyncJob } = await import('@/lib/api/orgmeterSync');
                          await cancelSyncJob(job.jobId, apiKey, selectedFunder!._id);
                          setRunningJobs((prev) => prev.filter(j => j.jobId !== job.jobId));
                          addLog(`Cancelled job ${job.jobId}`);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sync Job Management */}
        {reviewData && localSelections.size > 0 && !entityCompletionStatus[currentEntityType] && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Sync Job Management</h4>
                <p className="text-sm text-gray-600">
                  {localSelections.size} records selected for {reviewData?.syncStatistics.synced === 0 ? 'synchronization' : 'sync again'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {!syncInProgress ? (
                  <button
                    onClick={startSyncAllRecords}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    {reviewData?.syncStatistics.synced === 0 ? 'Sync' : 'Sync Again'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={cancelSyncJob}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <StopIcon className="w-4 h-4" />
                      Cancel
                    </button>
                    {currentSyncJob?.status === 'failed' && (
                      <button
                        onClick={startSyncAllRecords}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                        Retry
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {currentSyncJob && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {currentSyncJob.status === 'running' && currentSyncJob.progress 
                      ? `${currentSyncJob.progress.current} of ${currentSyncJob.progress.total} records processed`
                      : `Status: ${currentSyncJob.status}`
                    }
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {currentSyncJob.progress ? `${currentSyncJob.progress.percentage}%` : '0%'}
                    </span>
                    {currentSyncJob.estimatedTimeRemaining && currentSyncJob.estimatedTimeRemaining > 0 && (
                      <span className="text-sm text-blue-600">
                        {(() => {
                          const duration = intervalToDuration({ start: 0, end: currentSyncJob.estimatedTimeRemaining! });
                          return formatDuration(duration, { format: ['hours', 'minutes', 'seconds'] });
                        })()} remaining
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      currentSyncJob.status === 'failed' 
                        ? 'bg-red-500' 
                        : currentSyncJob.status === 'completed' 
                          ? 'bg-green-500' 
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${currentSyncJob.progress?.percentage || 0}%` }}
                  />
                </div>
                
                {currentSyncJob.status === 'failed' && currentSyncJob.error && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Sync Failed</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">{currentSyncJob.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Entity Completion Status */}
        {entityCompletionStatus[currentEntityType] && (
          <div className="p-6 border-b border-gray-200 bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-medium text-green-900">
                    {ENTITY_LABELS[currentEntityType as keyof typeof ENTITY_LABELS]} Completed
                  </h4>
                  <p className="text-sm text-green-700">
                    All records have been synchronized successfully.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {!syncInProgress ? (
                  <button
                    onClick={() => {
                      // For "Sync Again", use selectAll approach instead of individual selections
                      startSyncAllRecords();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    {reviewData?.syncStatistics.synced === 0 ? 'Sync' : 'Sync Again'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={cancelSyncJob}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <StopIcon className="w-4 h-4" />
                      Cancel
                    </button>
                    {currentSyncJob?.status === 'failed' && (
                      <button
                        onClick={startSyncAllRecords}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                        Retry
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Progress Bar for completed entity re-sync */}
            {currentSyncJob && entityCompletionStatus[currentEntityType] && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">
                    {currentSyncJob.status === 'running' && currentSyncJob.progress 
                                           ? `${reviewData?.syncStatistics.synced === 0 ? 'Syncing' : 'Syncing again'}: ${currentSyncJob.progress.current} of ${currentSyncJob.progress.total} records processed`
                       : `${reviewData?.syncStatistics.synced === 0 ? 'Sync' : 'Sync Again'} Status: ${currentSyncJob.status}`
                    }
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600">
                      {currentSyncJob.progress ? `${currentSyncJob.progress.percentage}%` : '0%'}
                    </span>
                    {currentSyncJob.estimatedTimeRemaining && currentSyncJob.estimatedTimeRemaining > 0 && (
                      <span className="text-sm text-blue-600">
                        {(() => {
                          const duration = intervalToDuration({ start: 0, end: currentSyncJob.estimatedTimeRemaining! });
                          return formatDuration(duration, { format: ['hours', 'minutes', 'seconds'] }) + ' remaining';
                        })()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-green-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      currentSyncJob.status === 'failed' 
                        ? 'bg-red-500' 
                        : currentSyncJob.status === 'completed' 
                          ? 'bg-green-600' 
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${currentSyncJob.progress?.percentage || 0}%` }}
                  />
                </div>
                
                {currentSyncJob.status === 'failed' && currentSyncJob.error && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                                             <span className="text-sm font-medium text-red-800">{reviewData?.syncStatistics.synced === 0 ? 'Sync' : 'Sync Again'} Failed</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">{currentSyncJob.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search and Filter */}
            <div className="flex gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleSelectAll(true)}
                disabled={bulkUpdateLoading}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
              >
                Select All
              </button>
              <button
                onClick={() => handleSelectAll(false)}
                disabled={bulkUpdateLoading}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors text-sm"
              >
                Unselect All
              </button>

            </div>
          </div>
        </div>

        {/* Data Table */}
        {reviewData && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={reviewData.items.filter(item => !isRecordSynced(item)).every(item => localSelections.has(item.id)) && reviewData.items.filter(item => !isRecordSynced(item)).length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-1">
                      ID
                      {sortConfig.key === 'id' && (
                        sortConfig.direction === 'asc' ? 
                          <ChevronUpIcon className="w-4 h-4" /> : 
                          <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      {sortConfig.key === 'name' && (
                        sortConfig.direction === 'asc' ? 
                          <ChevronUpIcon className="w-4 h-4" /> : 
                          <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-1">
                      Type/Status
                      {sortConfig.key === 'type' && (
                        sortConfig.direction === 'asc' ? 
                          <ChevronUpIcon className="w-4 h-4" /> : 
                          <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Additional Info
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('importDate')}
                  >
                    <div className="flex items-center gap-1">
                      Import Date
                      {sortConfig.key === 'importDate' && (
                        sortConfig.direction === 'asc' ? 
                          <ChevronUpIcon className="w-4 h-4" /> : 
                          <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('synced')}
                  >
                    <div className="flex items-center gap-1">
                      Synced
                      {sortConfig.key === 'synced' && (
                        sortConfig.direction === 'asc' ? 
                          <ChevronUpIcon className="w-4 h-4" /> : 
                          <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getSortedItems().map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-gray-50 ${item.deleted ? 'opacity-60 bg-red-50' : ''} ${
                      !item.deleted && item.syncMetadata.syncId ? 'bg-green-50' : 
                      !item.deleted && localSelections.has(item.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={localSelections.has(item.id)}
                        onChange={() => toggleSyncSelection(item.id)}
                        disabled={isRecordSynced(item)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.entity?.id ? item.entity.id : item.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm font-medium ${item.deleted ? 'line-through text-red-600' : 'text-gray-900'}`}>
                        {getDisplayField(item)}
                      </div>
                      {item.businessDba && (
                        <div className="text-xs text-gray-500">{item.businessDba}</div>
                      )}
                      {item.funding && (
                        <div className="text-sm text-gray-500">
                          Amount: {item.funding?.principalAmount?.$numberDecimal ? 
                            `$${Number(item.funding.principalAmount.$numberDecimal).toLocaleString()}` : 'N/A'}
                        </div>
                      )}
                      {item.deleted && (
                        <div className="text-xs text-red-500 font-medium">⚠️ DELETED RECORD</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.type && (
                        <div className="text-sm text-gray-500">{item.type}</div>
                      )}
                      {item.businessType && (
                        <div className="text-sm text-gray-500">{item.businessType}</div>
                      )}
                      {item.status && (
                        <div className="text-xs text-gray-500">{item.status}</div>
                      )}
                      {item.entity && (
                        <div className="text-xs text-gray-500">{item.entity.type}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500 space-y-1">
                        {getEntitySpecificFields(item)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(item.importMetadata.importedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {item.syncMetadata.lastSyncedAt ? (
                        <div className="flex items-center gap-2">
                          <CheckIcon className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">
                            {new Date(item.syncMetadata.lastSyncedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {reviewData && reviewData.items.length === 0 && (
          <div className="text-center py-12">
            <InformationCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No records found for the current filter</p>
            <p className="text-sm text-gray-500 mt-2">
              Entity: {currentEntityType} | Search: {searchTerm || 'none'}
            </p>
          </div>
        )}

        {/* No Data Loaded State */}
        {!loading && !reviewData && (
          <div className="text-center py-12">
            <InformationCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No sync data available for {currentEntityType}</p>
            <p className="text-sm text-gray-500 mt-2">
              Make sure the import for this entity type has been completed first.
            </p>
            <button
              onClick={loadReviewData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        )}
      </div>

      {/* Help Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-blue-900 mb-2">Sync Process Information</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Synced:</strong> Records already synchronized with the main system (cannot be unchecked)</li>
          <li>• <strong>Selected:</strong> Records marked for synchronization</li>
          <li>• <strong>Deleted:</strong> Records marked as deleted (shown with red background and strikethrough)</li>
          <li>• <strong>Pending:</strong> Selected records that haven&apos;t been synced yet</li>
          <li>• You must process entities in order: {ENTITY_ORDER.join(' → ')}</li>
          <li>• For completed entities, use the &quot;Sync Again&quot; button to synchronize all records again</li>
          <li>• For incomplete entities, select individual records and use the sync job controls</li>
        </ul>
      </div>

      {/* Activity Log */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Activity Log</h3>
        <div className="bg-white rounded border max-h-64 overflow-y-auto p-3">
          {logs.length > 0 ? (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-xs font-mono text-gray-700">
                  {log}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic">
              No activity yet... Start a sync operation to see real-time logs.
            </div>
          )}
        </div>
      </div>

      {/* User Password Information Dialog */}
      {showUserPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {ENTITY_LABELS[currentEntityType as keyof typeof ENTITY_LABELS]} Sync Complete
              </h3>
              <div className="flex items-start">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 mr-4 flex-shrink-0">
                  <InformationCircleIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-600 mb-4">
                    {ENTITY_LABELS[currentEntityType as keyof typeof ENTITY_LABELS]} have been successfully synchronized. Please note that the default username for each {currentEntityType === 'user' ? 'user' : 'syndicator'} is their <strong>Email</strong> and the default password is their <strong>Orgmeter ID</strong>.
                  </p>
                  <p className="text-sm text-gray-500">
                    {currentEntityType === 'user' ? 'Users' : 'Syndicators'} should change their password after their first login for security purposes.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowUserPasswordDialog(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Running Jobs Dialog */}
      {showRunningJobsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Running Jobs Found
              </h3>
              <div className="flex items-start">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-yellow-100 mr-4 flex-shrink-0">
                  <ClockIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-600 mb-4">
                    We found {runningJobs.length} running job(s) for {ENTITY_LABELS[currentEntityType as keyof typeof ENTITY_LABELS]}. You can continue monitoring these jobs or start fresh.
                  </p>
                </div>
              </div>
            </div>

            {/* Running Jobs List */}
            <div className="space-y-4 mb-6">
              {runningJobs.map((job) => (
                <div key={job.jobId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        job.status === 'running' ? 'bg-green-500' : 
                        job.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`} />
                      <div>
                        <h4 className="font-medium text-gray-900">Job {job.jobId}</h4>
                        <p className="text-sm text-gray-500 capitalize">{job.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Started: {new Date(job.startedAt).toLocaleString()}
                      </p>
                      {job.estimatedTimeRemaining > 0 && (
                        <p className="text-xs text-blue-600">
                          ETA: {(() => {
                            const duration = intervalToDuration({ start: 0, end: job.estimatedTimeRemaining });
                            return formatDuration(duration, { format: ['hours', 'minutes', 'seconds'] });
                          })()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">
                        {job.progress.processed} of {job.progress.total} records processed
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {job.progress.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          job.status === 'running' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${job.progress.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Parameters:</span>
                      <ul className="mt-1 space-y-1">
                        <li>• Update Existing: {job.parameters.updateExisting ? 'Yes' : 'No'}</li>
                        <li>• Only Selected: {job.parameters.onlySelected ? 'Yes' : 'No'}</li>
                        <li>• Dry Run: {job.parameters.dryRun ? 'Yes' : 'No'}</li>
                      </ul>
                    </div>
                    {job.results && (
                      <div>
                        <span className="font-medium">Results:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• Synced: {job.results.synced}</li>
                          <li>• Updated: {job.results.updated}</li>
                          <li>• Skipped: {job.results.skipped}</li>
                          <li>• Failed: {job.results.failed}</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => continueRunningJob(job)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlayIcon className="w-4 h-4" />
                      Continue Job
                    </button>
                    <button
                      onClick={() => proceedWithEntitySelection(ENTITY_ORDER.indexOf(currentEntityType))}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Start Fresh
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRunningJobsDialog(false);
                  setRunningJobs([]);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}