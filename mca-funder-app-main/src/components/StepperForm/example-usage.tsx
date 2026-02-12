import React from 'react';
import { StepperForm, StepperFormStep } from './index';
import * as Yup from 'yup';

// Example: How to refactor ApplicationCreateForm to use StepperForm

interface ApplicationFormValues {
  funder: string;
  merchant: string;
  iso: string;
  newMerchantName: string;
  newISOName: string;
  contact: string;
  representative: string;
  name: string;
  type: string;
  request_amount: string;
  assigned_user: string;
  priority: string;
  assigned_manager: string;
  internal: boolean;
  status: string;
}

const ApplicationCreateFormExample: React.FC<{
  onCancel: () => void;
  onSuccess: (application: any) => void;
}> = ({ onCancel, onSuccess }) => {
  const initialValues: ApplicationFormValues = {
    funder: '',
    merchant: '',
    iso: '',
    newMerchantName: '',
    newISOName: '',
    contact: '',
    representative: '',
    name: '',
    type: '',
    request_amount: '',
    assigned_user: '',
    priority: 'MEDIUM',
    assigned_manager: '',
    internal: false,
    status: 'DRAFT'
  };

  const validationSchema = Yup.object().shape({
    funder: Yup.string().required('Funder is required'),
    merchant: Yup.string().when(['newMerchantName'], {
      is: (newMerchantName: string) => !newMerchantName,
      then: (schema) => schema.required('Merchant is required'),
      otherwise: (schema) => schema
    }),
    newMerchantName: Yup.string().when(['merchant'], {
      is: (merchant: string) => !merchant,
      then: (schema) => schema.required('New merchant name is required'),
      otherwise: (schema) => schema
    }),
    iso: Yup.string().when(['newISOName'], {
      is: (newISOName: string) => !newISOName,
      then: (schema) => schema.required('ISO is required'),
      otherwise: (schema) => schema
    }),
    newISOName: Yup.string().when(['iso'], {
      is: (iso: string) => !iso,
      then: (schema) => schema.required('New ISO name is required'),
      otherwise: (schema) => schema
    }),
    name: Yup.string().required('Application name is required'),
    type: Yup.string().required('Type is required'),
    request_amount: Yup.string().required('Request amount is required'),
    assigned_user: Yup.string().required('Assigned user is required')
  });

  const steps: StepperFormStep[] = [
    {
      number: 1,
      label: 'Basic Info',
      subtitle: 'Please select entities below.',
      fieldsToValidate: ['funder', 'merchant', 'newMerchantName', 'iso', 'newISOName'],
      component: (
        <div>
          {/* Step 1 component content */}
          <p>Step 1: Basic Info Component</p>
        </div>
      ),
      onNext: async (values) => {
        // Handle step 1 logic (create merchant/ISO if needed)
        console.log('Step 1 completed:', values);
      }
    },
    {
      number: 2,
      label: 'Application Details',
      subtitle: 'Please enter application details below.',
      fieldsToValidate: ['name', 'type', 'request_amount', 'assigned_user'],
      component: (
        <div>
          {/* Step 2 component content */}
          <p>Step 2: Application Details Component</p>
        </div>
      ),
      onNext: async (values) => {
        // Handle step 2 logic (create application)
        console.log('Step 2 completed:', values);
      }
    },
    {
      number: 3,
      label: 'Stipulations',
      subtitle: 'Please add any stipulations below.',
      component: (
        <div>
          {/* Step 3 component content */}
          <p>Step 3: Stipulations Component</p>
        </div>
      )
    },
    {
      number: 4,
      label: 'Success',
      subtitle: 'Application created successfully!',
      component: (
        <div>
          {/* Step 4 component content */}
          <p>Step 4: Success Component</p>
        </div>
      )
    }
  ];

  return (
    <StepperForm
      steps={steps}
      title="Create Application"
      onCancel={onCancel}
      onSuccess={onSuccess}
      initialValues={initialValues}
      validationSchema={validationSchema}
      variant="success-checkmark"
      maxWidth={700}
    />
  );
};

export default ApplicationCreateFormExample; 