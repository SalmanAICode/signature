'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Funder } from '@/lib/api/orgmeterImport';
import Step1ApiValidation from './steps/Step1ApiValidation';
import Step2FunderCreation from './steps/Step2FunderCreation';
import Step3ImportProcess from './steps/Step3ImportProcess';
import Step4DataSync from './steps/Step4DataSync';
import Step5ExtraData from './steps/Step5ExtraData';
import Step6OverallProgress from './steps/Step6OverallProgress';

interface ImportState {
  currentStep: number;
  apiKey: string;
  selectedFunder: Funder | null;
  stepData: Record<string, unknown>;
  importResults: Record<string, unknown>;
  selectedRecords: Set<string>;
  apiValidated: boolean;
  funderCreated: boolean;
  importOrder: string[];
  currentEntityType: string;
  allImportsComplete: boolean;
}

const IMPORT_STEPS = [
  { id: 1, title: 'API Validation', component: Step1ApiValidation },
  { id: 2, title: 'Funder Selection', component: Step2FunderCreation },
  { id: 3, title: 'Import All Entities', component: Step3ImportProcess },
  { id: 4, title: 'Data Syncing', component: Step4DataSync },
  { id: 5, title: 'Extra Data', component: Step5ExtraData },
  { id: 6, title: 'Progress Summary', component: Step6OverallProgress },
];

export default function OrgMeterImportClient() {
  const router = useRouter();
  
  const [importState, setImportState] = useState<ImportState>({
    currentStep: 1,
    apiKey: '',
    selectedFunder: null,
    stepData: {},
    importResults: {},
    selectedRecords: new Set(),
    apiValidated: false,
    funderCreated: false,
    importOrder: ['user', 'lender', 'iso', 'merchant', 'syndicator', 'advance'],
    currentEntityType: 'user',
    allImportsComplete: false
  });

  const handleBackToImport = () => {
    router.push('/import');
  };

  const updateImportState = (updates: Partial<ImportState>) => {
    setImportState(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    // Validate step requirements before allowing navigation
    if (!canProceedToNextStep()) {
      return;
    }
    
    if (importState.currentStep < IMPORT_STEPS.length) {
      setImportState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  };

  const canProceedToNextStep = () => {
    switch (importState.currentStep) {
      case 1: // API Validation step
        return importState.apiValidated;
      case 2: // Funder Selection step
        // Allow proceeding if a funder is selected (either created or existing)
        return importState.selectedFunder !== null;
      case 3: // Import All Entities step
        return importState.selectedFunder !== null && importState.allImportsComplete; // All imports must be complete to proceed
      case 4: // Data Syncing step
        return importState.selectedFunder !== null && importState.allImportsComplete; // Syncing requires a funder and all imports complete
      case 5: // Extra Data step
        return importState.selectedFunder !== null && importState.allImportsComplete; // Extra data requires a funder and all imports complete
      case 6: // Progress Summary step
        return true; // Final step
      default:
        return true;
    }
  };

  const getStepRequirementMessage = () => {
    switch (importState.currentStep) {
      case 1:
        return 'Please validate your API key before proceeding';
      case 2:
        return 'Please select or create a funder before proceeding';
      case 3:
        if (!importState.allImportsComplete) {
          return 'Please complete all entity imports before proceeding to data syncing';
        }
        return 'Import process in progress';
      case 4:
        if (!importState.allImportsComplete) {
          return 'All entity imports must be completed before data syncing can begin';
        }
        return 'Please complete the current step requirements';
      case 5:
        if (!importState.allImportsComplete) {
          return 'All entity imports must be completed before extra data can be processed';
        }
        return 'Please complete the current step requirements';
      default:
        return 'Please complete the current step requirements';
    }
  };

  const previousStep = () => {
    if (importState.currentStep > 1) {
      setImportState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const getCurrentStep = () => {
    return IMPORT_STEPS.find(step => step.id === importState.currentStep);
  };

  const currentStep = getCurrentStep();
  const CurrentStepComponent = currentStep?.component;

  return (
    <main className="flex flex-col min-h-screen w-full bg-custom-blue">
      {/* Header */}
      <div className="w-full bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToImport}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Import Options
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-800">
                OrgMeter Import
              </h1>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Step {importState.currentStep} of {IMPORT_STEPS.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(importState.currentStep / IMPORT_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation Breadcrumb */}
      <div className="w-full bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            {IMPORT_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <span 
                  className={`px-2 py-1 rounded ${
                    step.id === importState.currentStep 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : step.id < importState.currentStep 
                        ? 'text-green-600' 
                        : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
                {index < IMPORT_STEPS.length - 1 && (
                  <span className="text-gray-400">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {CurrentStepComponent && (
            <CurrentStepComponent
              importState={importState as any}
              updateImportState={updateImportState}
              nextStep={nextStep}
              previousStep={previousStep}
            />
          )}
        </div>
      </div>

      {/* Import Completion Status */}
      {(importState.currentStep === 3 || importState.currentStep === 4 || importState.currentStep === 5) && importState.selectedFunder && (
        <div className="w-full bg-gray-50 border-t border-b">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${importState.allImportsComplete ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-sm font-medium text-gray-700">
                  Import Status: {importState.allImportsComplete ? 'All imports completed' : 'Imports in progress'}
                </span>
              </div>
              {importState.currentStep === 3 && !importState.allImportsComplete && (
                <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                  Complete all entity imports to proceed to data syncing
                </span>
              )}
              {importState.currentStep === 4 && !importState.allImportsComplete && (
                <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                  Cannot sync until all imports are complete
                </span>
              )}
              {importState.currentStep === 5 && !importState.allImportsComplete && (
                <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                  Cannot proceed to extra data until all imports are complete
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="w-full bg-white border-t">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={previousStep}
              disabled={importState.currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Previous Step
            </button>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {currentStep?.title}
              </span>
              {importState.currentStep === IMPORT_STEPS.length ? (
                <button
                  onClick={handleBackToImport}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Complete Import
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={!canProceedToNextStep()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  title={!canProceedToNextStep() ? getStepRequirementMessage() : undefined}
                >
                  Next Step
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 