import React, { useState, ReactNode } from 'react';
import { Formik, FormikProps, FormikConfig, FormikValues, FormikHelpers } from 'formik';
import Stepper, { StepperStep } from './Stepper';
import FormModalLayout from '@/components/FormModalLayout';

export interface StepperFormStep extends StepperStep {
  component: ReactNode;
  fieldsToValidate?: string[];
  canProceed?: (values: any) => boolean | Promise<boolean>;
  onNext?: (values: any) => void | Promise<void>;
  onBack?: (values: any) => void | Promise<void>;
}

export interface StepperFormProps extends Omit<FormikConfig<any>, 'onSubmit'> {
  steps: StepperFormStep[];
  title: string;
  onCancel: () => void;
  onSuccess: (values: any) => void | Promise<void>;
  maxWidth?: number;
  variant?: 'default' | 'success-checkmark';
  showStepNumbers?: boolean;
  allowStepNavigation?: boolean;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const StepperForm: React.FC<StepperFormProps> = ({
  steps,
  title,
  onCancel,
  onSuccess,
  maxWidth = 700,
  variant = 'default',
  showStepNumbers = true,
  allowStepNavigation = false,
  className = '',
  orientation = 'vertical',
  ...formikProps
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentStepData = steps.find(step => step.number === currentStep);
  const stepperSteps: StepperStep[] = steps.map(step => ({
    number: step.number,
    label: step.label,
    subtitle: step.subtitle,
    isCompleted: currentStep > step.number,
    isCurrent: currentStep === step.number
  }));

  const handleNextStep = async (formikProps: FormikProps<any>) => {
    const { values, setTouched, validateForm } = formikProps;
    const current = steps.find(step => step.number === currentStep);
    
    if (!current) return;

    setError('');
    setLoading(true);

    try {
      // Validate current step fields
      if (current.fieldsToValidate && current.fieldsToValidate.length > 0) {
        const touchedFields = current.fieldsToValidate.reduce((acc, field) => {
          acc[field] = true;
          return acc;
        }, {} as Record<string, boolean>);

        await setTouched({ ...formikProps.touched, ...touchedFields });
        const formErrors = await validateForm();
        
        const hasErrors = current.fieldsToValidate.some(field =>
          (formErrors as any)[field] !== undefined
        );

        if (hasErrors) {
          setLoading(false);
          return;
        }
      }

      // Check if can proceed
      if (current.canProceed) {
        const canProceed = await current.canProceed(values);
        if (!canProceed) {
          setLoading(false);
          return;
        }
      }

      // Execute onNext callback
      if (current.onNext) {
        await current.onNext(values);
      }

      // Move to next step or complete
      if (currentStep < steps.length) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Final step - call onSuccess
        await onSuccess(values);
      }
    } catch (err: any) {
      console.error('Error in step navigation:', err);
      setError(err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousStep = async (formikProps: FormikProps<any>) => {
    const { values } = formikProps;
    const current = steps.find(step => step.number === currentStep);
    
    if (!current) return;

    try {
      // Execute onBack callback
      if (current.onBack) {
        await current.onBack(values);
      }

      // Move to previous step
      if (currentStep > 1) {
        setCurrentStep(prev => prev - 1);
      }
    } catch (err: any) {
      console.error('Error going back:', err);
      setError(err?.message || 'An error occurred');
    }
  };

  const handleStepClick = (stepNumber: number) => {
    if (!allowStepNavigation) return;
    
    // Only allow navigation to completed steps or current step
    if (stepNumber <= currentStep || stepNumber === 1) {
      setCurrentStep(stepNumber);
    }
  };

  // --- VERTICAL LAYOUT ---
  if (orientation === 'vertical') {
    return (
      <FormModalLayout
        title={title}
        onCancel={onCancel}
        maxWidth={maxWidth}
      >
        <div className="flex min-h-[500px]">
          {/* Sidebar Stepper */}
          <div className="bg-gray-50 shadow-md rounded-l-2xl py-10 px-8 flex flex-col items-center" style={{ minWidth: 220 }}>
            {showStepNumbers && (
              <Stepper
                steps={stepperSteps}
                currentStep={currentStep}
                orientation="vertical"
                variant={variant}
                className={className}
                stepClassName={allowStepNavigation ? 'cursor-pointer hover:opacity-80' : ''}
              />
            )}
          </div>
          {/* Main Content */}
          <div className="flex-1 px-8 py-8">
            {currentStepData?.subtitle && (
              <div className="text-lg text-gray-500 font-medium mb-4">
                {currentStepData.subtitle}
              </div>
            )}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <Formik
              {...formikProps}
              onSubmit={async (values, formikHelpers) => {
                await handleNextStep(formikHelpers as FormikProps<any>);
              }}
            >
              {(formikProps) => (
                <div className="space-y-6">
                  {/* Current step component */}
                  {currentStepData?.component}

                  {/* Navigation buttons */}
                  <div className="flex justify-between pt-6">
                    <button
                      type="button"
                      onClick={() => handlePreviousStep(formikProps)}
                      disabled={currentStep === 1 || loading}
                      className="bg-white border border-gray-300 text-gray-700 rounded px-6 py-2 font-semibold"
                    >
                      Previous
                    </button>

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={onCancel}
                        className="bg-white border border-gray-300 text-gray-700 rounded px-6 py-2 font-semibold"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleNextStep(formikProps)}
                        disabled={loading}
                        className="bg-[#2196F3] hover:bg-[#1769AA] text-white rounded px-6 py-2 font-semibold shadow"
                      >
                        {loading ? 'Loading...' : currentStep === steps.length ? 'Complete' : 'Next'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Formik>
          </div>
        </div>
      </FormModalLayout>
    );
  }

  // --- HORIZONTAL LAYOUT (default) ---
  return (
    <FormModalLayout
      title={title}
      onCancel={onCancel}
      maxWidth={maxWidth}
    >
      {/* Subtitle above the stepper */}
      {currentStepData?.subtitle && (
        <div className="text-center text-gray-500 text-base font-medium mb-2">
          {currentStepData.subtitle}
        </div>
      )}
      {showStepNumbers && (
        <Stepper
          steps={stepperSteps}
          currentStep={currentStep}
          variant={variant}
          className={className}
          stepClassName={allowStepNavigation ? 'cursor-pointer hover:opacity-80' : ''}
        />
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <Formik
        {...formikProps}
        onSubmit={async (values, formikHelpers) => {
          await handleNextStep(formikHelpers as FormikProps<any>);
        }}
      >
        {(formikProps) => (
          <div className="space-y-6">
            {/* Current step component */}
            {currentStepData?.component}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => handlePreviousStep(formikProps)}
                disabled={currentStep === 1 || loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A2341] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A2341]"
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={() => handleNextStep(formikProps)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1A2341] border border-transparent rounded-md hover:bg-[#1A2341]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A2341] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : currentStep === steps.length ? 'Complete' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Formik>
    </FormModalLayout>
  );
};

export default StepperForm; 