'use client';

import { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import FormModalLayout from '@/components/FormModalLayout';
import { createApplication } from '@/lib/api/applications';
import ApplicationCreateStep1 from './ApplicationCreateStep1';
import ApplicationCreateStep2 from './ApplicationCreateStep2';
import ApplicationCreateStep3 from './ApplicationCreateStep3';
import { ApplicationType, CreateApplicationData, Application } from '@/types/application';
import { FunderMerchant } from '@/types/merchantFunder';
import ApplicationCreateStep4 from './ApplicationCreateStep4';

import { useRouter } from 'next/navigation';
import { createMerchant } from '@/lib/api/merchants';
import { createISO } from '@/lib/api/isos';
import { addFunderMerchant } from '@/lib/api/merchantFunders';
import { addFunderISO } from '@/lib/api/isoFunders';
import { Funder } from '@/types/funder';
import { getFunderISOList } from '@/lib/api/isoFunders';
import { IsoFunder } from '@/types/isoFunder';
import { getFunderMerchantList } from '@/lib/api/merchantFunders';
import { getUserList } from '@/lib/api/users';
import { User } from '@/types/user';
import { getApplicationStatusList } from '@/lib/api/applicationStatuses';
import { ApplicationStatus } from '@/types/applicationStatus';
import toast from 'react-hot-toast';

interface ApplicationCreateFormProps {
  onCancel: () => void;
  onSuccess: (application: Application) => void;
  funder: Funder;
}

interface ExtendedCreateApplicationData extends CreateApplicationData {
  newMerchantName: string;
  newISOName: string;
}

// Step-based validation schemas
const step1ValidationSchema = Yup.object().shape({
  funder: Yup.string().required('Funder is required'),
  merchant: Yup.string().test(
    'merchant-or-new',
    'Merchant is required',
    function (value) {
      const { context } = this.options;
      const newMerchantName = context?.newMerchantName;
      return Boolean(value && value.trim()) || Boolean(newMerchantName && newMerchantName.trim());
    }
  ),
  iso: Yup.string(), // Optional
  contact: Yup.string(),
  representative: Yup.string(),
});

const step2ValidationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  type: Yup.string().required('Type is required'),
  request_amount: Yup.number().required('Request amount is required').moreThan(0, 'Amount must be greater than 0'),
  request_date: Yup.string().required('Request date is required'),
  internal: Yup.boolean(),
  assigned_user: Yup.string().required('Assigned user is required'),
  assigned_manager: Yup.string().required('Assigned manager is required'),
  priority: Yup.boolean(),
  status: Yup.string().required('Status is required'),
});

const step3ValidationSchema = Yup.object().shape({
  document_list: Yup.array().of(
    Yup.object().shape({
      document: Yup.string().required('Document is required'),
      stipulation: Yup.string().nullable(),
    })
  ).nullable(),
});

// Complete validation schema
const validationSchema = step1ValidationSchema.concat(step2ValidationSchema).concat(step3ValidationSchema);

const getValidationSchema = (step: number) => {
  return step === 1
    ? step1ValidationSchema
    : step === 2
      ? step2ValidationSchema
      : step3ValidationSchema;
};


export default function ApplicationCreateForm({ onCancel, onSuccess, funder }: ApplicationCreateFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [funderMerchant, setFunderMerchant] = useState<FunderMerchant | null>(null);
  const [createdApplication, setCreatedApplication] = useState<Application | null>(null);
  const [documentsUploaded, setDocumentsUploaded] = useState(false);

  // Add state for funder data
  const [funderISOs, setFunderISOs] = useState<IsoFunder[]>([]);
  const [funderMerchants, setFunderMerchants] = useState<FunderMerchant[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Add state for step 2 data
  const [users, setUsers] = useState<User[]>([]);
  const [statusList, setStatusList] = useState<ApplicationStatus[]>([]);

  const router = useRouter();

  // Fetch all data once on mount
  useEffect(() => {
    const fetchAllData = async () => {
      setLoadingData(true);
      
      try {
        const [isosData, merchantsData, usersData, statusData] = await Promise.all([
          // Step 1: ISOs and Merchants
          getFunderISOList(funder._id, ''),
          getFunderMerchantList({ funder: funder._id }),
          // Step 2: Users and Status
          getUserList({ funder: funder._id }),
          getApplicationStatusList(funder._id),
        ]);

        setFunderISOs(isosData);
        setFunderMerchants(merchantsData);
        setUsers(usersData);
        setStatusList(statusData);
      } catch (error: any) {
        toast.error(error?.message || 'Error fetching form data');
      } finally {
        setLoadingData(false);
      }
    };

    fetchAllData();
  }, []);

  // Create initial values with funder from props
  const initialValues: ExtendedCreateApplicationData = {
    // Step 1: Entity selection
    funder: funder._id,
    merchant: '',
    iso: '',
    contact: '',
    representative: '',

    // hidden fields for new merchant and ISO
    newMerchantName: '', // merchant name if new merchant is selected
    newISOName: '', // ISO name if new ISO is selected

    // Step 2: Basic information
    name: '',
    type: 'NEW' as ApplicationType,
    internal: false,
    request_amount: 0,
    request_date: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
    assigned_user: '',
    assigned_manager: '',
    priority: false,
    status: '',

    // Step 3: Document management
    document_list: [],
  };

  const steps = [
    {
      number: 1,
      label: 'Select Entities',
      subtitle: 'Please select the merchant and ISO for this application.',
      fieldsToValidate: ['merchant', 'iso'],
    },
    {
      number: 2,
      label: 'Basic Info',
      subtitle: 'Please enter the basic information for this application.',
      fieldsToValidate: ['name', 'type', 'request_amount', 'assigned_user'],
    },
    {
      number: 3,
      label: 'Documents',
      subtitle: 'Please select and link documents for this application.',
      fieldsToValidate: [],
    },
    {
      number: 4,
      label: 'Success',
      subtitle: 'Application created successfully.',
      fieldsToValidate: [],
    },
  ];

  // Stepper component
  function Stepper() {
    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-base ${currentStep === step.number && currentStep !== 4
                ? 'bg-[#1A2341] text-white'
                : currentStep > step.number || currentStep === 4
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}>
                {currentStep > step.number || currentStep === 4 ? '✓' : step.number}
              </div>
              <span className={`mt-2 text-sm font-semibold ${currentStep === step.number && currentStep !== 4
                ? 'text-[#1A2341]'
                : currentStep > step.number || currentStep === 4
                  ? 'text-green-600'
                  : 'text-gray-400'
                }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-gray-200 mx-2" style={{ minWidth: 40, maxWidth: 80 }} />
            )}
          </div>
        ))}
      </div>
    );
  }


  async function submitApplication(values: ExtendedCreateApplicationData) {
    setLoading(true);
    setError('');

    try {
      const payload: any = {
        name: values.name,
        type: values.type,
        request_amount: values.request_amount,
        merchant: values.merchant,
        funder: values.funder,
        iso: values.iso,
        assigned_user: values.assigned_user,
        priority: values.priority,
        assigned_manager: values.assigned_manager,
        internal: values.internal,
        status: values.status,
        follower_list: [...new Set([values.assigned_user, values.assigned_manager].filter(Boolean))],
        contact: values.contact,
        representative: values.representative,
      };

      const response = await createApplication(payload);
      setCreatedApplication(response);
      return response;
    } catch (e: any) {
      setError(e?.message || 'Failed to create application');
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
      onSubmit={() => { }}
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
            if (currentStep === 1 || currentStep === 3) {
              // Move from step 1 to step 2
              setCurrentStep(prev => prev + 1);
            } else if (currentStep === 2) {
              // check if ISO is selected
              try {
                let updatedValues = { ...values };
                // check if merchant is selected
                if (values.merchant === '' && values.newMerchantName) {
                  // create new merchant
                  const newMerchant = await createMerchant({ name: values.newMerchantName });
                  await setFieldValue('merchant', newMerchant._id);
                  await addFunderMerchant(values.funder, newMerchant._id, '', '');
                  updatedValues.merchant = newMerchant._id;
                }

                if (values.iso === '' && values.newISOName) {
                  // create new ISO
                  const newISO = await createISO({ name: values.newISOName });
                  await setFieldValue('iso', newISO._id);
                  await addFunderISO(values.funder, newISO._id, '');
                  updatedValues.iso = newISO._id;
                }

                // Submit application and move to step 3
                const response = await submitApplication(updatedValues);
                if (!response) return; // Stop if submission fails
                setCurrentStep(prev => prev + 1);
              } catch (error: any) {
                console.error('Error creating new merchant or ISO:', error);
                setError(error?.message || 'Failed to create new merchant or ISO');
                return;
              }
            }
          }
        };

        const handlePreviousStep = () => {
          setCurrentStep(prev => prev - 1);
        };

        return (
          <FormModalLayout
            title="Create Application"
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
                <ApplicationCreateStep1
                  values={{
                    funder: values.funder,
                    merchant: values.merchant,
                    iso: values.iso,
                    newMerchantName: values.newMerchantName,
                    newISOName: values.newISOName,
                    contact: values.contact,
                    representative: values.representative,
                  }}
                  setFieldValue={setFieldValue}
                  funder={funder}
                  funderISOs={funderISOs}
                  funderMerchants={funderMerchants}
                  loadingData={loadingData}
                  onNext={handleNextStep}
                  onCancel={onCancel}
                  loading={loading}
                  onMerchantChange={
                    (funderMerchant: FunderMerchant | null) => {
                      setFunderMerchant(funderMerchant);
                    }
                  }
                />
              )}

              {currentStep === 2 && (
                <ApplicationCreateStep2
                  values={{
                    funder: values.funder,
                    name: values.name,
                    type: values.type,
                    request_amount: values.request_amount,
                    assigned_user: values.assigned_user,
                    assigned_manager: values.assigned_manager,
                    priority: values.priority,
                    internal: values.internal,
                    status: values.status,
                    request_date: values.request_date,
                    newMerchantName: values.newMerchantName,
                  }}
                  setFieldValue={setFieldValue}
                  funderMerchant={funderMerchant}
                  users={users}
                  statusList={statusList}
                  onNext={handleNextStep}
                  onBack={handlePreviousStep}
                  loading={loading}
                />
              )}

              {currentStep === 3 && (
                <ApplicationCreateStep3
                  values={{
                    document_list: values.document_list || [],
                    merchant: values.merchant,
                    funder: values.funder,
                    iso: values.iso,
                  }}
                  setFieldValue={setFieldValue}
                  onNext={handleNextStep}
                  loading={loading}
                  applicationId={createdApplication?._id || ''}
                  setDocumentsUploaded={setDocumentsUploaded}
                />
              )}

              {currentStep === 4 && (
                <ApplicationCreateStep4
                  onFinish={() => {
                    if (createdApplication) {
                      onSuccess(createdApplication);
                    }
                    onCancel();
                  }}
                  onViewApplication={() => {
                    if (createdApplication) {
                      router.push(`/dashboard/application/${createdApplication._id}`);
                    }
                  }}
                  documentsUploaded={documentsUploaded}
                />
              )}
            </Form>
          </FormModalLayout>
        );
      }}
    </Formik>
  );
} 