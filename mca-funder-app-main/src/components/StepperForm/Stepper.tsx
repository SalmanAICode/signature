import React from 'react';

export interface StepperStep {
  number: number;
  label: string;
  subtitle?: string;
  isCompleted?: boolean;
  isCurrent?: boolean;
}

export interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'success-checkmark';
  className?: string;
  showConnectors?: boolean;
  connectorClassName?: string;
  stepClassName?: string;
  labelClassName?: string;
  stepMinWidth?: string;
  connectorThickness?: string;
  connectorMinWidth?: string;
  connectorMaxWidth?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  orientation = 'horizontal',
  variant = 'default',
  className = '',
  showConnectors = true,
  connectorClassName = '',
  stepClassName = '',
  labelClassName = '',
  stepMinWidth = '100px',
  connectorThickness = '1',
  connectorMinWidth = '40px',
  connectorMaxWidth = '120px',
}) => {
  if (orientation === 'vertical') {
    return (
      <div className={`flex flex-col items-start py-8 pr-8 min-w-[220px] ${className}`} style={{background: 'transparent'}}>
        {steps.map((step, index) => {
          const isActive = step.isCurrent || currentStep === step.number;
          const isCompleted = step.isCompleted || currentStep > step.number;
          const isUpcoming = !isActive && !isCompleted;
          const circleBase = 'w-8 h-8 flex items-center justify-center rounded-full border-2 text-base font-bold transition-all duration-200';
          const circleActive = 'bg-[#2196F3] border-[#2196F3] text-white shadow-lg';
          const circleCompleted = 'bg-blue-500 border-blue-500 text-white';
          const circleUpcoming = 'bg-gray-100 border-gray-200 text-gray-400';
          let circleClass = circleBase;
          if (isActive) {
            circleClass += ' ' + circleActive;
          } else if (isCompleted) {
            circleClass += ' ' + circleCompleted;
          } else {
            circleClass += ' ' + circleUpcoming;
          }
          const labelBase = 'text-sm font-semibold';
          const labelActive = 'text-[#1A2341] font-bold';
          const labelCompleted = 'text-blue-600';
          const labelUpcoming = 'text-gray-400';
          let labelClass = labelBase;
          if (isActive) {
            labelClass += ' ' + labelActive;
          } else if (isCompleted) {
            labelClass += ' ' + labelCompleted;
          } else {
            labelClass += ' ' + labelUpcoming;
          }
          const subtitleClass = 'text-xs text-gray-400 mt-1';
          return (
            <React.Fragment key={step.number}>
              <div className="flex items-start" style={{ minHeight: 80 }}>
                <div className="flex flex-col items-center" style={{ minHeight: 80 }}>
                  <div className={circleClass + " mt-1"}>{step.number}</div>
                  {showConnectors && index < steps.length - 1 && (
                    <div
                      className="w-0.5"
                      style={{
                        height: 48,
                        background: isCompleted ? '#3B82F6' : '#D1D5DB',
                        margin: '0 auto'
                      }}
                    />
                  )}
                </div>
                <div className="ml-4 flex flex-col items-start min-w-[120px]">
                  <span className={labelClass}>{step.label}</span>
                  {step.subtitle && <span className={subtitleClass}>{step.subtitle}</span>}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Horizontal (default)
  return (
    <div className={`flex items-center justify-center mb-8 w-full ${className}`} style={{gap: 0}}>
      {steps.map((step, index) => {
        const isActive = step.isCurrent || currentStep === step.number;
        const isCompleted = step.isCompleted || currentStep > step.number;
        const isUpcoming = !isActive && !isCompleted;
        const circleBase = 'w-8 h-8 flex items-center justify-center rounded-full border-2 text-base font-bold transition-all duration-200';
        const circleActive = 'bg-[#2196F3] border-[#2196F3] text-white shadow-lg';
        const circleCompleted = 'bg-blue-500 border-blue-500 text-white';
        const circleUpcoming = 'bg-gray-100 border-gray-200 text-gray-400';
        const labelBase = 'mt-2 text-xs font-semibold text-center';
        const labelActive = 'text-[#1A2341] font-bold';
        const labelCompleted = 'text-blue-600';
        const labelUpcoming = 'text-gray-400';
        let circleClass = circleBase;
        let labelClass = labelBase;
        if (isActive) {
          circleClass += ' ' + circleActive;
          labelClass += ' ' + labelActive;
        } else if (isCompleted) {
          circleClass += ' ' + circleCompleted;
          labelClass += ' ' + labelCompleted;
        } else {
          circleClass += ' ' + circleUpcoming;
          labelClass += ' ' + labelUpcoming;
        }
        return (
          <React.Fragment key={step.number}>
            <div className={`flex flex-col items-center min-w-[${stepMinWidth}]`}>
              <div className={circleClass}>{step.number}</div>
              <span className={labelClass}>{step.label}</span>
            </div>
            {showConnectors && index < steps.length - 1 && (
              <div className="flex-1 flex items-center justify-center min-w-[40px] max-w-[120px]">
                <div className={`h-1 w-full ${isCompleted ? 'bg-blue-500' : 'bg-gray-200'}`}/>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Stepper; 