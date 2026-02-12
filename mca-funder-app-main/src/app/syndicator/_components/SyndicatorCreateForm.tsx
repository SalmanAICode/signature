'use client';

import { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import FormModalLayout from '@/components/FormModalLayout';
import { createSyndicator } from '@/lib/api/syndicators';
import { CreateSyndicatorData, Syndicator } from '@/types/syndicator';
import SyndicatorCreateStep1 from './SyndicatorCreateStep1';
import SyndicatorCreateStep2 from './SyndicatorCreateStep2';
import SyndicatorCreateStep3 from './SyndicatorCreateStep3';

interface SyndicatorCreateFormProps {
  onCancel: () => void;
  onSuccess: (syndicator: Syndicator) => void;
  onError: (error: string) => void;
}

// Step-based validation schemas
const step1ValidationSchema = Yup.object().shape({
  name: Yup.string().required('Business Name is required'),
  first_name: Yup.string(),
  last_name: Yup.string(),
  email: Yup.string().email('Invalid email format'),
});

const step2ValidationSchema = Yup.object().shape({
  phone_mobile: Yup.string(),
  phone_work: Yup.string(),
  phone_home: Yup.string(),
  birthday: Yup.string(),
  ssn: Yup.string(),
  drivers_license_number: Yup.string(),
  password: Yup.string(),
});

const step3ValidationSchema = Yup.object().shape({
  'address_detail.address_1': Yup.string(),
  'address_detail.city': Yup.string(),
  'address_detail.state': Yup.string(),
  'address_detail.zip': Yup.string(),
  'business_detail.ein': Yup.string(),
  'business_detail.entity_type': Yup.string(),
});

const getValidationSchema = (step: number) => {
  return step === 1
    ? step1ValidationSchema
    : step === 2
      ? step2ValidationSchema
      : step3ValidationSchema;
};

export default function SyndicatorCreateForm({ onCancel, onSuccess, onError }: SyndicatorCreateFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Initial values for the form
  const initialValues: CreateSyndicatorData = {
    name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_mobile: '',
    phone_work: '',
    phone_home: '',
    birthday: '',
    ssn: '',
    drivers_license_number: '',
    dln_issue_date: '',
    dln_issue_state: '',
    password: '',
    funder_list: [],
    address_detail: {
      address_1: '',
      address_2: '',
      city: '',
      state: '',
      zip: ''
    },
    business_detail: {
      ein: '',
      entity_type: '',
      incorporation_date: '',
      state_of_incorporation: ''
    }
  };

  const steps = [
    {
      number: 1,
      label: 'Basic Info',
      subtitle: 'Please enter basic information for the syndicator.',
      fieldsToValidate: ['name'],
    },
    {
      number: 2,
      label: 'Contact Details',
      subtitle: 'Please enter contact and personal information.',
      fieldsToValidate: [],
    },
    {
      number: 3,
      label: 'Address & Business',
      subtitle: 'Please enter address and business details.',
      fieldsToValidate: [],
    },
  ];

  // Stepper component
  function Stepper() {
    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              currentStep >= step.number
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-300 text-gray-300'
            }`}>
              {currentStep > step.number ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-sm font-medium">{step.number}</span>
              )}
            </div>
            <div className="ml-3">
              <div className={`text-sm font-medium ${
                currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.label}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-4 ${
                currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  }

  // Helper function to filter out empty fields
  const filterEmptyFields = (data: CreateSyndicatorData): CreateSyndicatorData => {
    const hasNonEmptyValues = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      return Object.values(obj).some(value => 
        value !== '' && value !== null && value !== undefined
      );
    };

    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => {
        // Always include required fields
        if (key === 'name') return true;
        
        // Keep arrays (like funder_list) even if empty
        if (Array.isArray(value)) return true;
        
        // For nested objects, only include if they have non-empty values
        if (typeof value === 'object' && value !== null) {
          return hasNonEmptyValues(value);
        }
        
        // Filter out empty strings, null, and undefined for optional fields
        return value !== '' && value !== undefined && value !== null;
      })
    ) as CreateSyndicatorData;

    return filteredData;
  };

  async function submitSyndicator(values: CreateSyndicatorData) {
    setLoading(true);
    setError('');
    
    try {
      const filteredData = filterEmptyFields(values);
      const newSyndicator = await createSyndicator(filteredData);
      onSuccess(newSyndicator);
      return true;
    } catch (e: any) {
      const errorMessage = e?.message || 'Failed to create syndicator';
      setError(errorMessage);
      onError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={getValidationSchema(currentStep)}
      validateOnChange={true}
      validateOnBlur={true}
      onSubmit={() => {}}
    >
      {(formikProps) => {
        const { values, setFieldValue, validateForm } = formikProps;

        const handleNextStep = async () => {
          const { touched, setTouched } = formikProps;
          const current = steps.find(step => step.number === currentStep);
          const fieldsToValidate = current?.fieldsToValidate ?? [];

          // Mark relevant fields as touched so errors will show
          const touchedFields = fieldsToValidate.reduce((acc, field) => {
            acc[field] = true;
            return acc;
          }, {} as Record<string, boolean>);

          await setTouched({ ...touched, ...touchedFields });

          // Trigger validation
          const formErrors = await formikProps.validateForm();

          // Check if any of the current step fields have errors
          const hasErrors = fieldsToValidate.some(field =>
            formErrors[field as keyof typeof formErrors]
          );

          if (!hasErrors) {
            if (currentStep < 3) {
              setCurrentStep(prev => prev + 1);
            } else {
              // Submit on last step
              const success = await submitSyndicator(values);
              if (success) {
                onCancel(); // Close modal on success
              }
            }
          }
        };

        const handlePreviousStep = () => {
          setCurrentStep(prev => prev - 1);
        };

        return (
          <FormModalLayout
            title="Create Syndicator"
            subtitle={steps[currentStep - 1].subtitle}
            onCancel={onCancel}
            maxWidth={700}
          >
            <Stepper />

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

            <Form className="space-y-6">
              {currentStep === 1 && (
                <SyndicatorCreateStep1
                  values={values}
                  setFieldValue={setFieldValue}
                  onNext={handleNextStep}
                  onCancel={onCancel}
                  loading={loading}
                />
              )}

              {currentStep === 2 && (
                <SyndicatorCreateStep2
                  values={values}
                  setFieldValue={setFieldValue}
                  onNext={handleNextStep}
                  onBack={handlePreviousStep}
                  loading={loading}
                />
              )}

              {currentStep === 3 && (
                <SyndicatorCreateStep3
                  values={values}
                  setFieldValue={setFieldValue}
                  onNext={handleNextStep}
                  onBack={handlePreviousStep}
                  loading={loading}
                />
              )}
            </Form>
          </FormModalLayout>
        );
      }}
    </Formik>
  );
} 