'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon, 
  ArrowPathIcon,
  UserIcon,
  BanknotesIcon,
  ChartPieIcon,
  BuildingStorefrontIcon,
  PercentBadgeIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';

interface Step6Props {
  importState: {
    apiKey: string;
    selectedFunder: {
      _id: string;
      name: string;
    };
  };
  updateImportState: (updates: unknown) => void;
  nextStep: () => void;
  previousStep: () => void;
}

interface OverallProgress {
  totalSteps: number;
  completedSteps: number;
  totalImported: number;
  totalNeedsSync: number;
  totalSynced: number;
}

interface StepProgress {
  imported: number;
  needsSync: number;
  synced: number;
  pending: number;
  completed: boolean;
}

interface ProgressData {
  overallProgress: OverallProgress;
  stepProgress: Record<string, StepProgress>;
  importOrder: string[];
}

export default function Step6OverallProgress({ importState, nextStep }: Step6Props) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);

  // Get appropriate icon for each entity type
  const getEntityIcon = (entityType: string, completed: boolean, hasImported: boolean) => {
    const iconProps = "w-6 h-6";
    
    // If completed, show check circle
    if (completed) {
      return <CheckCircleIcon className={`${iconProps} text-green-500`} />;
    }
    
    // If has imported data but not complete, show clock
    if (hasImported) {
      return <ClockIcon className={`${iconProps} text-yellow-500`} />;
    }
    
    // Otherwise show entity-specific icon in gray
    const iconClass = `${iconProps} text-gray-400`;
    
    switch (entityType.toLowerCase()) {
      case 'user':
        return <UserIcon className={iconClass} />;
      case 'lender':
        return <BanknotesIcon className={iconClass} />;
      case 'iso':
        return <PercentBadgeIcon className={iconClass} />;
      case 'merchant':
        return <BuildingStorefrontIcon className={iconClass} />;
      case 'syndicator':
        return <ChartPieIcon className={iconClass} />;
      case 'advance':
        return <CircleStackIcon className={iconClass} />;
      default:
        return <XCircleIcon className={iconClass} />;
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    if (!importState.apiKey || !importState.selectedFunder) return;
    
    setLoading(true);
    try {
      const { getSyncOverallProgress } = await import('@/lib/api/orgmeterSync');
      const result = await getSyncOverallProgress(importState.apiKey, importState.selectedFunder._id);
      
      // Transform the API response to match our expected structure
      const transformedData: ProgressData = {
        overallProgress: {
          totalSteps: result.data.overallStats.totalEntityTypes,
          completedSteps: result.data.overallStats.implementedEntityTypes,
          totalImported: result.data.overallStats.totalEntities,
          totalNeedsSync: result.data.overallStats.totalSelected,
          totalSynced: result.data.overallStats.totalSynced
        },
        stepProgress: Object.entries(result.data.entityProgress).reduce((acc, [entityType, progress]) => {
          acc[entityType] = {
            imported: progress.total,
            needsSync: progress.selected,
            synced: progress.synced,
            pending: progress.pending,
            completed: progress.completionRate === '100%'
          };
          return acc;
        }, {} as Record<string, StepProgress>),
        importOrder: result.data.syncOrder
      };
      
      setProgressData(transformedData);
    } catch (error) {
      console.error('Failed to fetch progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncAllPendingRecords = async () => {
    if (!importState.apiKey || !importState.selectedFunder) return;
    
    setSyncingAll(true);
    try {
      // Note: This function may not exist in the current API - placeholder for now
      // const { syncAllPendingRecords: syncAllApi } = await import('@/lib/api/orgmeterSync');
      // await syncAllApi(importState.apiKey, importState.selectedFunder._id);
      console.log('Sync all pending records not yet implemented');
      await fetchProgressData(); // Refresh data
    } catch (error) {
      console.error('Failed to sync all records:', error);
    } finally {
      setSyncingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading import progress...</p>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No progress data available</p>
      </div>
    );
  }

  const { overallProgress, stepProgress, importOrder } = progressData;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Import Summary
        </h2>
        <p className="text-gray-600">
          Complete overview of your OrgMeter data import progress
        </p>
      </div>

      {/* Overall Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Progress</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{overallProgress.completedSteps}</div>
            <div className="text-sm text-gray-600">of {overallProgress.totalSteps} steps completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{overallProgress.totalImported}</div>
            <div className="text-sm text-gray-600">total records imported</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{overallProgress.totalNeedsSync}</div>
            <div className="text-sm text-gray-600">records need sync</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{overallProgress.totalSynced}</div>
            <div className="text-sm text-gray-600">records synced</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${(overallProgress.completedSteps / overallProgress.totalSteps) * 100}%` }}
          />
        </div>
        <div className="text-center text-sm text-gray-600">
          {Math.round((overallProgress.completedSteps / overallProgress.totalSteps) * 100)}% Complete
        </div>
      </div>

      {/* Step-by-Step Progress */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Details by Entity</h3>
        
        <div className="space-y-4">
          {importOrder.map((entityType) => {
            const step = stepProgress[entityType];
            if (!step) return null;

            return (
              <div key={entityType} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getEntityIcon(entityType, step.completed, step.imported > 0)}
                    <h4 className="font-medium text-gray-900">{entityType}</h4>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    step.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {step.completed ? 'Completed' : 'In Progress'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">{step.imported}</div>
                    <div className="text-xs text-blue-800">Imported</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <div className="text-lg font-bold text-yellow-600">{step.needsSync}</div>
                    <div className="text-xs text-yellow-800">Needs Sync</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">{step.synced}</div>
                    <div className="text-xs text-green-800">Synced</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-gray-600">{step.pending}</div>
                    <div className="text-xs text-gray-800">Pending</div>
                  </div>
                </div>

                {/* Progress bar for this step */}
                {step.imported > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${step.imported > 0 ? (step.synced / step.imported) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {step.imported > 0 ? Math.round((step.synced / step.imported) * 100) : 0}% synced
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
        
        <div className="space-y-4">
          {overallProgress.totalNeedsSync > 0 && (
            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <h4 className="font-medium text-yellow-900">Sync Pending Records</h4>
                <p className="text-sm text-yellow-800">
                  {overallProgress.totalNeedsSync} records are ready to be synced to your main system
                </p>
              </div>
              <button
                onClick={syncAllPendingRecords}
                disabled={syncingAll}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition-colors"
              >
                {syncingAll ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="w-4 h-4" />
                    Sync All Now
                  </>
                )}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <h4 className="font-medium text-green-900">Import Complete</h4>
              <p className="text-sm text-green-800">
                Your OrgMeter data has been successfully imported. You can now manage this data in your system.
              </p>
            </div>
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Finish
            </button>
          </div>
        </div>
      </div>

      {/* Import Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Import Configuration Summary</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Funder:</strong> {importState.selectedFunder?.name}</p>
          <p><strong>Import Date:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Total Steps:</strong> {overallProgress.totalSteps}</p>
          <p><strong>Total Records:</strong> {overallProgress.totalImported}</p>
          <p><strong>API Source:</strong> OrgMeter</p>
        </div>
      </div>
    </div>
  );
} 