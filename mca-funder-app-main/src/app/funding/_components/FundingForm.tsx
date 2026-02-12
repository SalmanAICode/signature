import React from 'react';
import { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react';
import { Formik, Form, ErrorMessage, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import FormModalLayout from '@/components/FormModalLayout';
import clsx from 'clsx';
import FormErrorAlert from '@/components/FormErrorAlert';

// API Imports
import { getLenderList } from '@/lib/api/lenders';
import { getMerchantList, createMerchant } from '@/lib/api/merchants';
import { getISOList, createISO } from '@/lib/api/isos';
import { createFunding } from '@/lib/api/fundings';
import { getApplications } from '@/lib/api/applications';
import { getApplicationOffers } from '@/lib/api/applicationOffers';
import { getFeeTypes } from '@/lib/api/feeTypes';
import { getIsoFunders, createIsoFunder } from '@/lib/api/isoFunders';
import { createMerchantFunder, getMerchantFunders } from '@/lib/api/merchantFunders';
import { calculateFormula } from '@/lib/api/formulas';
import { getUserList } from '@/lib/api/users';
import { createPaybackPlan } from '@/lib/api/paybackPlans';
import { createDisbursementIntent } from '@/lib/api/disbursementIntents';
import { createCommissionIntent } from '@/lib/api/commissionIntents';
import { getFundingStatuses, FundingStatus } from '@/lib/api/fundingStatuses';

// Type Imports
import { Funder } from '@/types/funder';
import { Merchant } from '@/types/merchant';
import { ISO } from '@/types/iso';
import { Application } from '@/types/application';
import { ApplicationOffer } from '@/types/applicationOffer';
import { FunderMerchant } from '@/types/merchantFunder';
import { IsoFunder } from '@/types/isoFunder';
import { User } from '@/types/user';
import { Formula, CreateFormulaData } from '@/types/formula';
import { Pagination } from "@/types/pagination";
import { FundingFee, FundingExpense } from '@/types/funding';
import { Lender } from '@/types/lender';
import { Funding } from '@/types/funding';

// Component Imports
import CreateMerchant from './CreateMerchant';
import CreateISO from './CreateISO';
import Step1_SelectEntities from './FundingFormSteps/Step1_SelectEntities';
import Step2_BasicInfo from './FundingFormSteps/Step2_BasicInfo';
const Step3_PaybackPlanStep = lazy(() => import('./FundingFormSteps/Step3_PaybackPlanStep'));
import Step4_DisbursementStep from './FundingFormSteps/Step4_DisbursementStep';
import Step5_CommissionStep from './FundingFormSteps/Step5_CommissionStep';
import FundingSuccessModal from './FundingSuccessModal';

// Hook & Store Imports
import { useCommissionCalculation } from '@/hooks/useCommissionCalculation';
import { useRouter } from 'next/navigation';
import { useFundingFormStore } from '@/lib/store/fundingFormStore';
import useAuthStore from '@/lib/store/auth';

// Util Imports
import { calculateISOCommission } from '@/lib/utils/calculateISOCommission';
import { formatCurrency } from '@/lib/utils/format';

// StepperForm Import
import { StepperForm, StepperFormStep } from '@/components/StepperForm';

interface FundingFormProps {
  onCancel: () => void;
  onSuccess: (funding?: Funding) => void;
}

interface FormValues {
  lender: string;
  merchant: string;
  iso: string;
  application: string;
  application_offer: string;
  name: string;
  type: string;
  status: string;
  funded_amount: string;
  payback_amount: string;
  fee_list: (FundingFee & { 
    fee_type: string;
  })[];
  expense_list: (FundingExpense & { 
    expense_type: string;
  })[];
  assigned_manager: string;
  assigned_user: string;
  follower_list: string[];
  internal: boolean;
  position: number;
  payback_plan_list?: {
    merchant_account: string;
    funder_account: string;
    payment_method: string;
    ach_processor: string;
    total_amount: number;
    payback_count: number;
    start_date: string;
    frequency: string;
    payday_list: number[];
  }[];
}

const initialValues: FormValues = {
  lender: '',
  merchant: '',
  iso: '',
  application: '',
  application_offer: '',
  name: '',
  type: 'NEW',
  status: 'CREATED',
  funded_amount: '',
  payback_amount: '',
  fee_list: [{ name: '', fee_type: '', amount: 0, upfront: false }],
  expense_list: [{ name: '', expense_type: '', amount: 0, commission: false, syndication: false }],
  assigned_manager: '',
  assigned_user: '',
  follower_list: [],
  internal: false,
  position: 0,
};

const validationSchema = Yup.object().shape({
  lender: Yup.string().required('Lender is required'),
  merchant: Yup.string().required('Merchant is required'),
  iso: Yup.string(),
  application: Yup.string(),
  application_offer: Yup.string(),
  name: Yup.string().required('Funding name is required'),
  type: Yup.string().required('Type is required'),
  funded_amount: Yup.string()
    .required('Funded amount is required')
    .test('funded-positive', 'Funded amount must be greater than 0', function(value) {
      if (!value) return true; // Let required validation handle empty values
      return Number(value) > 0;
    }),
  payback_amount: Yup.string()
    .required('Payback amount is required')
    .test('payback-greater-than-funded', 'Payback amount must be larger than funded amount', function(value) {
      const { funded_amount } = this.parent;
      if (!value || !funded_amount) return true; // Let required validation handle empty values
      return Number(value) > Number(funded_amount);
    }),
  fee_list: Yup.array().of(
    Yup.object().shape({
      fee_type_id: Yup.string(),
      fee_amount: Yup.string(),
    })
  ),
  expense_list: Yup.array().of(
    Yup.object().shape({
      expense_type_id: Yup.string(),
      expense_amount: Yup.string(),
    })
  ),
  // No disbursement validation required for now
});

const inputClasses = 'w-full px-3 py-2 border rounded-lg focus:outline-none text-sm';
const labelClasses = 'block text-xs font-medium text-gray-700 mb-1';
const errorClasses = 'text-red-500 text-xs';

const paymentMethods = [
  { value: 'WIRE', label: 'WIRE' },
  { value: 'ACH', label: 'ACH' },
  { value: 'CHECK', label: 'CHECK' },
  { value: 'OTHER', label: 'OTHER' },
];
const achProcessors = [
  { value: 'ACHWorks', label: 'ACHWorks' },
  { value: 'Actum', label: 'Actum' },
  { value: 'Manual', label: 'Manual' },
  { value: 'Other', label: 'Other' },
];

interface FeeType {
  _id: string;
  name: string;
  upfront?: boolean;
  formula?: string | { _id: string };
  funder?: string | { _id: string };
}

interface ApiResponse<T> {
  data: T[];
  pagination: Pagination;
}

const FundingForm = ({ onCancel, onSuccess }: FundingFormProps) => {
  const { funder: currentFunder } = useAuthStore();
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isos, setIsos] = useState<ISO[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [loadingLists, setLoadingLists] = useState<{ merchants: boolean; isos: boolean }>({ merchants: false, isos: false });
  const [step, setStep] = useState(1);
  const [applications, setApplications] = useState<Application[]>([]);
  const [offers, setOffers] = useState<ApplicationOffer[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loadingFeeTypes, setLoadingFeeTypes] = useState(false);
  const [calculatedFields, setCalculatedFields] = useState({
    upfront_fee_amount: 0,
    net_amount: 0,
    factor_rate: 0,
    buy_rate: 0
  });
  const [availableUpfrontFees, setAvailableUpfrontFees] = useState<FeeType[]>([]);
  const [addFeeDropdownOpen, setAddFeeDropdownOpen] = useState(false);
  const [addFeeLoading, setAddFeeLoading] = useState(false);
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [pendingMerchantName, setPendingMerchantName] = useState('');
  const [showISOModal, setShowISOModal] = useState(false);
  const [pendingISOName, setPendingISOName] = useState('');
  const [installmentCount, setInstallmentCount] = useState(1);
  const [disbursements, setDisbursements] = useState([
    {
      date: '',
      amount: 0,
      funderAccount: '',
      merchantAccount: '',
      method: 'WIRE',
      achProcessor: '',
    },
  ]);
  const [commissionInstallmentCount, setCommissionInstallmentCount] = useState(1);
  const [commissionDisbursements, setCommissionDisbursements] = useState([
    {
      date: '',
      amount: 0,
      funderAccount: '',
      isoAccount: '',
      method: 'WIRE',
      achProcessor: '',
    },
  ]);
  const [paybackStartDate, setPaybackStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [paybackFrequency, setPaybackFrequency] = useState('DAILY');
  const [paybackPayDays, setPaybackPayDays] = useState<string[]>([]);
  const [paybackTotalAmount, setPaybackTotalAmount] = useState('');
  const payDaysOptions = [
    { value: 'MON', label: 'Mon' },
    { value: 'TUE', label: 'Tue' },
    { value: 'WED', label: 'Wed' },
    { value: 'THU', label: 'Thu' },
    { value: 'FRI', label: 'Fri' },
    { value: 'SAT', label: 'Sat' },
    { value: 'SUN', label: 'Sun' },
  ];

  // Calculated fields for payback plan
  const [paybackCalculated, setPaybackCalculated] = useState({
    next_payback_date: '',
    next_payback_amount: 0,
    term_length: 0,
    scheduled_end_date: '',
  });

  // Success modal state
  const [createdFundingId, setCreatedFundingId] = useState<string>('');
  const [createdFundingName, setCreatedFundingName] = useState<string>('');
  const [createdFunding, setCreatedFunding] = useState<Funding | undefined>(undefined);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const calculateCommission = useCommissionCalculation();
  const router = useRouter();
  const formState = useFundingFormStore();

  // Data fetching states
  const [fundingStatuses, setFundingStatuses] = useState<FundingStatus[]>([]);
  const [loadingFundingStatuses, setLoadingFundingStatuses] = useState(false);

  // Fetch initial data on mount
  useEffect(() => {
    // Fetch lenders
    getLenderList()
      .then((result) => setLenders(result))
      .catch(() => setError('Failed to load lenders'));

    // Fetch all merchants and ISOs on mount
    setLoadingLists(l => ({ ...l, merchants: true }));
    getMerchantList()
      .then((result) => setMerchants(result))
      .catch(() => setError('Failed to load merchants'))
      .finally(() => setLoadingLists(l => ({ ...l, merchants: false })));

    setLoadingLists(l => ({ ...l, isos: true }));
    getISOList()
      .then((result) => setIsos(result))
      .catch(() => setError('Failed to load ISOs'))
      .finally(() => setLoadingLists(l => ({ ...l, isos: false })));

    getUserList({ include_inactive: false })
      .then(setUsers)
      .catch(() => setError('Failed to load users'));
  }, []);

  // Update disbursements when installmentCount or net_amount changes
  useEffect(() => {
    const netAmount = calculatedFields.net_amount || 0;
    const baseAmount = Math.floor((netAmount / installmentCount) * 100) / 100;
    const lastAmount = Math.round((netAmount - baseAmount * (installmentCount - 1)) * 100) / 100;
    setDisbursements((prev) =>
      Array.from({ length: installmentCount }, (_, i) => ({
        ...prev[i],
        date: prev[i]?.date || '',
        amount: i === installmentCount - 1 ? lastAmount : baseAmount,
        funderAccount: prev[i]?.funderAccount || '',
        merchantAccount: prev[i]?.merchantAccount || '',
        method: prev[i]?.method || 'WIRE',
        achProcessor: prev[i]?.achProcessor || '',
      }))
    );
  }, [installmentCount, calculatedFields.net_amount]);

  // Navigation handlers
  const handleNext = async (formikValues: any, validateFormFn?: (values?: any) => Promise<any>, setTouchedFn?: (touched: any) => void): Promise<void> => {
    if (step === 1) {
      if (validateFormFn) {
        // Mark the required fields as touched so ErrorMessage components will show
        if (setTouchedFn) {
          setTouchedFn({
            lender: true,
            merchant: true
          });
        }
        
        const errors = await validateFormFn();
        if (errors && (errors.lender || errors.merchant)) {
          return;
        }
      }
      setStep(step + 1);
    } else if (step === 2) {
      if (validateFormFn && setTouchedFn) {
        setTouchedFn({
          name: true,
          type: true,
          funded_amount: true,
          payback_amount: true,
        });
        const errors = await validateFormFn();
        if (errors && Object.keys(errors).length > 0) {
          return;
        }
      }
      
      setLoading(true);
      setError('');
      try {
        // Transform form values to match the API structure
        const fundingData = {
          // Required fields
          lender: formikValues.lender,
          merchant: formikValues.merchant,
          name: formikValues.name,
          type: formikValues.type,
          funded_amount: Number(formikValues.funded_amount),
          payback_amount: Number(formikValues.payback_amount),
          
          // Optional fields
          iso: formikValues.iso || undefined,
          application: formikValues.application || undefined,
          application_offer: formikValues.application_offer || undefined,
          
          // Fee list - transform from form structure to API structure
          fee_list: formikValues.fee_list?.map((fee: any) => ({
            name: fee.name || undefined,
            fee_type: fee.fee_type || undefined, // Already a string ID
            amount: fee.amount,
            upfront: fee.upfront || false
          })).filter((fee: any) => fee.amount > 0) || undefined,
          
          // Expense list - transform from form structure to API structure
          expense_list: formikValues.expense_list?.map((expense: any) => ({
            name: expense.name || undefined,
            expense_type: expense.expense_type || undefined, // Already a string ID
            amount: expense.amount,
            commission: expense.commission || false,
            syndication: expense.syndication || false
          })).filter((expense: any) => expense.amount > 0) || undefined,
          
          // User assignments
          assigned_manager: formikValues.assigned_manager || undefined,
          assigned_user: formikValues.assigned_user || undefined,
          follower_list: formikValues.follower_list || undefined,
          
          // Status and other fields
          status: formikValues.status || 'CREATED',
          internal: formikValues.internal || false,
          position: formikValues.position || 0
        };
        
        const newFunding = await createFunding(fundingData);
        useFundingFormStore.getState().setFundingId(newFunding.data._id);
        
        // Show success modal instead of proceeding to step 3
        setCreatedFundingId(newFunding.data._id);
        setCreatedFundingName(formikValues.name);
        setCreatedFunding(newFunding.data);
        setShowSuccessModal(true);
      } catch (e: any) {
        setError(e?.message || 'Failed to create funding');
        return;
      } finally {
        setLoading(false);
      }
      
      // Don't automatically proceed to step 3 - wait for user action
      // setStep(step + 1);
    } else if (step === 3) {
      // Create payback plan
      setLoading(true);
      setError('');
      try {
        const storeState = useFundingFormStore.getState();
        const fundingId = storeState.fundingId;
        if (!fundingId) {
          throw new Error('No funding ID found. Please complete step 2 first.');
        }

        const paybackPlan = formikValues.payback_plan_list?.[0];
        if (!paybackPlan) throw new Error('No payback plan data found');

        const paybackPlanPayload = {
          funding: fundingId,
          merchant_account: paybackPlan.merchant_account,
          funder_account: paybackPlan.funder_account,
          payment_method: (paybackPlan.payment_method === 'OTHER' ? 'Other' : paybackPlan.payment_method) as 'ACH' | 'WIRE' | 'CHECK' | 'Other' | 'Credit Card',
          ach_processor: paybackPlan.ach_processor as 'ACHWorks' | 'Actum' | 'Manual' | 'Other',
          total_amount: paybackPlan.total_amount,
          payback_count: paybackPlan.payback_count,
          start_date: paybackPlan.start_date,
          frequency: paybackPlan.frequency as "DAILY" | "WEEKLY" | "MONTHLY",
          payday_list: paybackPlan.payday_list,
          next_payback_date: paybackPlan.start_date,
          status: 'ACTIVE' as "ACTIVE" | "PAUSED" | "STOPPED"
        };

        await createPaybackPlan(paybackPlanPayload);
        setStep(step + 1);
      } catch (e: any) {
        setError(e?.message || 'Failed to create payback plan');
        return;
      } finally {
        setLoading(false);
      }
    } else if (step === 4) {
      setLoading(true);
      setError('');
      try {
        const storeState = useFundingFormStore.getState();
        const fundingId = storeState.fundingId;
        if (!fundingId) {
          throw new Error('No funding ID found. Please complete step 2 first.');
        }

        // Validate disbursements
        const invalidDisbursements = disbursements.filter(disb => !disb.date || disb.amount <= 0);
        if (invalidDisbursements.length > 0) {
          throw new Error('Please fill in all disbursement dates and amounts');
        }

        // Create disbursement intents
        for (const disb of disbursements) {
          const disbPayload = {
            funding: fundingId,
            disbursement_date: disb.date ? new Date(disb.date).toISOString() : new Date().toISOString(),
            amount: disb.amount,
            payment_method: disb.method as "WIRE" | "ACH" | "CHECK" | "OTHER",
            ach_processor: (disb.achProcessor || 'Manual') as 'ACHWorks' | 'Actum' | 'Manual' | 'Other',
            funder_account: disb.funderAccount || '',
            merchant_account: disb.merchantAccount,
          };
          await createDisbursementIntent(disbPayload);
        }
        setStep(step + 1);
      } catch (e: any) {
        setError(e?.message || 'Failed to create disbursement intents');
        return;
      } finally {
        setLoading(false);
      }
    } else if (step === 5) {
      // Create commission intents
      setLoading(true);
      setError('');
      try {
        const storeState = useFundingFormStore.getState();
        const fundingId = storeState.fundingId;
        if (!fundingId) {
          throw new Error('No funding ID found. Please complete step 2 first.');
        }

        // Create commission intents if ISO is selected and commission disbursements exist
        if (formikValues.iso && commissionDisbursements.length > 0) {
          for (const commission of commissionDisbursements) {
            if (commission.date && commission.amount > 0) {
              const commissionPayload = {
                funding: fundingId,
                iso: formikValues.iso,
                commission_date: commission.date ? new Date(commission.date).toISOString() : new Date().toISOString(),
                amount: commission.amount,
                payment_method: commission.method as "WIRE" | "ACH" | "CHECK" | "OTHER",
                ach_processor: (commission.achProcessor || 'Manual') as 'ACHWorks' | 'Actum' | 'Manual' | 'Other',
                funder_account: commission.funderAccount || '',
                iso_account: commission.isoAccount,
              };
              await createCommissionIntent(commissionPayload);
            }
          }
        }

        // Complete the form
        onSuccess(createdFunding);
      } catch (e: any) {
        setError(e?.message || 'Failed to create commission intents');
        return;
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  };
  
  const handleBack = () => {
    // Prevent going back from steps 3-5 to avoid data inconsistency
    if (step >= 3) {
      return;
    }
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Success modal handlers
  const handleContinueToPayback = () => {
    setShowSuccessModal(false);
    setStep(3); // Proceed to payback plan step
  };

  const handleCloseSuccessModal = () => {
    console.log('handleCloseSuccessModal called - closing success modal and form');
    setShowSuccessModal(false);
    // Add a small delay to make the transition feel smoother
    setTimeout(() => {
      onSuccess(createdFunding); // Close the entire form
    }, 100);
  };

  // Create the beautiful vertical stepper design
  const VerticalStepper = () => {
    const steps = [
      { number: 1, label: 'Select Entities', subtitle: 'Select the main parties for this funding' },
      { number: 2, label: 'Basic Info', subtitle: 'Provide funding details and amounts' },
      { number: 3, label: 'Payback Plan', subtitle: 'Set up the payback schedule' },
      { number: 4, label: 'Disbursement Schedule', subtitle: 'Set up disbursement schedule' },
      { number: 5, label: 'Commission Schedule', subtitle: 'Set up commission schedule' }
    ];

    return (
      <div className="flex flex-col items-start py-8 pr-8 min-w-[220px] bg-transparent">
        {steps.map((stepItem, index) => {
          const isActive = stepItem.number === step;
          const isCompleted = step > stepItem.number;
          const isUpcoming = !isActive && !isCompleted;
          const isCreating = isActive && loading;

          // Circle styles
          let circleClass =
            "w-8 h-8 flex items-center justify-center rounded-full border-2 text-base font-bold transition-all duration-200";
          if (isActive) {
            circleClass += " bg-[#1A2341] border-[#1A2341] text-white";
          } else if (isCompleted) {
            circleClass += " bg-green-500 border-green-500 text-white";
          } else {
            circleClass += " bg-gray-100 border-gray-200 text-gray-400";
          }

          // Label styles
          let labelClass = "text-sm font-semibold";
          if (isActive) {
            labelClass += " text-[#1A2341] font-bold";
          } else if (isCompleted) {
            labelClass += " text-green-600";
          } else {
            labelClass += " text-gray-400";
          }

          const subtitleClass = "text-xs text-gray-400 mt-1";

          return (
            <React.Fragment key={stepItem.number}>
              <div className="flex items-start" style={{ minHeight: 80 }}>
                <div className="flex flex-col items-center" style={{ minHeight: 80 }}>
                  <div className={circleClass + " mt-1"}>
                    {isCreating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : isCompleted ? (
                      <span className="text-xl font-bold">✓</span>
                    ) : (
                      stepItem.number
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className="w-0.5"
                      style={{
                        height: 48,
                        background: isCompleted ? '#22c55e' : '#D1D5DB', // green-500 for completed, gray-200 otherwise
                        margin: '0 auto'
                      }}
                    />
                  )}
                </div>
                <div className="ml-4 flex flex-col items-start min-w-[120px]">
                  <span className={labelClass}>
                    {stepItem.label}
                    {isCreating && <span className="ml-2 text-xs text-blue-600">(Creating...)</span>}
                  </span>
                  {stepItem.subtitle && <span className={subtitleClass}>{stepItem.subtitle}</span>}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <Formik
      initialValues={{
        ...initialValues,
        fee_list: [{ name: '', fee_type: '', amount: 0, upfront: false }],
        expense_list: [{ name: '', expense_type: '', amount: 0, commission: false, syndication: false }],
      }}
      validationSchema={validationSchema}
      context={{ step }}
      validateOnChange={false}
      validateOnBlur={false}
      validateOnMount={false}
      onSubmit={async (values, { setSubmitting }) => {
        // All entity creation is handled in handleNext function for each step
        // This function is no longer needed for entity creation
        onSuccess();
      }}
    >
      {(formikProps) => {
        const { values, setFieldValue, isSubmitting, handleSubmit, validateForm } = formikProps;

        // Fetch funder-dependent data when funder changes
        useEffect(() => {
          const lenderId = values.lender;
          console.log('Debug - lenderId:', lenderId);
          if (!lenderId) {
            setApplications([]);
            setOffers([]);
            return;
          }

          // Fetch applications for the selected funder
          setLoadingApps(true);
          console.log('Debug - calling getApplications with lender:', lenderId);
          getApplications({
            lender: lenderId,
            merchant: '',
            iso: '',
            include_inactive: false,
            limit: 1000,
          })
            .then((result) => setApplications(result.data))
            .catch(() => {
              setError('Failed to load applications');
              setApplications([]);
            })
            .finally(() => setLoadingApps(false));

        }, [values.lender, setFieldValue]);
        
        // Fetch formulas based on selected funder
        useEffect(() => {
          // Formulas are not needed for ISO creation anymore
          // Commission calculation is now handled through expense_list
        }, [values.lender]);

        useEffect(() => {
          if (step === 2) {
            const fundedAmount = parseFloat(values.funded_amount) || 0;
            const paybackAmount = parseFloat(values.payback_amount) || 0;
            
            // Calculate upfront fee amount from fee_list
            const upfrontFeeAmount = values.fee_list.reduce((sum: number, fee: { amount: number; upfront: boolean }) => {
              return sum + (fee.upfront ? (fee.amount || 0) : 0);
            }, 0);

            const netAmount = fundedAmount - upfrontFeeAmount;
            const factorRate = fundedAmount > 0 ? paybackAmount / fundedAmount : 0;
            const buyRate = fundedAmount > 0 ? (paybackAmount - upfrontFeeAmount) / fundedAmount : 0;

            setCalculatedFields({
              upfront_fee_amount: upfrontFeeAmount,
              net_amount: netAmount,
              factor_rate: factorRate,
              buy_rate: buyRate
            });
          }
        }, [step, values.funded_amount, values.payback_amount, values.fee_list]);

        // --- Upfront Fee Logic ---
        useEffect(() => {
          async function fetchUpfrontFeeTypes() {
            if (!values.lender) {
              setFeeTypes([]);
              setFieldValue('fee_list', []);
              return;
            }
            setLoadingFeeTypes(true);
            try {
              
              // Fetch all fee types for the selected merchant
              const allFeeTypes = (await getFeeTypes()).data;
              
              const feeTypes = allFeeTypes.filter((ft: FeeType) => {
                const funderId = typeof ft.funder === 'object' ? ft.funder?._id : ft.funder;
                return funderId === values.lender;
              });
              
              // Only include upfront fees with a valid formula
              const upfrontFeeTypes = feeTypes.filter((ft: FeeType) => ft.upfront && ft.formula);
              
              setFeeTypes(upfrontFeeTypes);
              // Only set the fee type list structure, not calculate amounts yet
              const feeList = upfrontFeeTypes.map((feeType: FeeType) => {
                return {
                  name: feeType.name,
                  fee_type: feeType._id, // Store as simple string ID
                  amount: 0
                };
              });
              setFieldValue('fee_list', feeList);
            } catch (err) {
              setError('Failed to load fee types');
              setFeeTypes([]);
              setFieldValue('fee_list', []);
            } finally {
              setLoadingFeeTypes(false);
            }
          }
          fetchUpfrontFeeTypes();
          // eslint-disable-next-line
        }, [values.lender]);

        // 2. When application offer changes, set funded/payback amounts and calculate upfront fees
        useEffect(() => {
          if (!values.application_offer) return;
          const selectedOffer = offers.find(offer => offer._id === values.application_offer);
          if (selectedOffer) {
            // Set funded and payback amounts from offer
            setFieldValue('funded_amount', selectedOffer.offered_amount?.toString() || '');
            setFieldValue('payback_amount', selectedOffer.payback_amount?.toString() || '');
            // Calculate upfront fees using offer's amounts
            calculateAndSetUpfrontFees(selectedOffer.offered_amount, selectedOffer.payback_amount);
          }
          // eslint-disable-next-line
        }, [values.application_offer]);

        // 3. When funded/payback amount changes (and no offer is selected), calculate upfront fees if both are valid
        useEffect(() => {
          if (values.application_offer) return; // Skip if offer is selected
          const fundedAmount = parseFloat(values.funded_amount);
          const paybackAmount = parseFloat(values.payback_amount);
          if (!values.lender || isNaN(fundedAmount) || isNaN(paybackAmount) || fundedAmount <= 0 || paybackAmount <= 0) {
            // Clear calculated amounts if not valid
            setFieldValue('fee_list', feeTypes.map(feeType => ({
              name: feeType.name,
              fee_type: feeType._id,
              amount: 0
            })));
            return;
          }
          // Calculate upfront fees using manual input
          calculateAndSetUpfrontFees(fundedAmount, paybackAmount);
          // eslint-disable-next-line
        }, [values.funded_amount, values.payback_amount, values.lender]);

        // --- Helper function to calculate and set upfront fees ---
        const calculateAndSetUpfrontFees = async (fundedAmount: number, paybackAmount: number) => {
          if (!feeTypes.length) return;
          setLoadingFeeTypes(true);
          try {
            const newFees = await Promise.all(
              feeTypes.map(async (feeType) => {
                let formulaId = '';
                if (typeof feeType.formula === 'string') {
                  formulaId = feeType.formula;
                } else if (feeType.formula && typeof feeType.formula === 'object' && '_id' in feeType.formula) {
                  formulaId = (feeType.formula as { _id: string })._id;
                }
                
                if (!formulaId) {
                  return null;
                }
                
                let amount = 0;
                try {
                  const result = await calculateFormula({
                    formulaId,
                    fund: fundedAmount,
                    payback: paybackAmount,
                  });
                  amount = result;
                } catch (err) {
                  amount = 0;
                }
                
                const feeItem = {
                  name: feeType.name,
                  fee_type: feeType._id,
                  amount: amount
                };
                
                return feeItem;
              })
            );
            
            const validFees = newFees.filter(fee => fee !== null);
            
            setFieldValue('fee_list', validFees);
          } catch (err) {
            setError('Failed to calculate upfront fees');
          } finally {
            setLoadingFeeTypes(false);
          }
        };

        // Calculate commission amount when iso, funder, funded_amount, or payback_amount changes
        useEffect(() => {
          // Commission calculation is now handled through expense_list
          // This logic will be implemented in the expense list component
        }, [values.iso, values.lender, values.funded_amount, values.payback_amount]);

        // Commission disbursement logic is now handled through expense_list
        // This will be implemented in the expense list component

        const handleCreateMerchant = async (inputValue: string) => {
          setPendingMerchantName(inputValue);
          setShowMerchantModal(true);
          return null; 
        };

        const handleCreateISO = async (inputValue: string) => {
          setPendingISOName(inputValue);
          setShowISOModal(true);
          return null; 
        };

        const handleISOCreation = async (data: {
          name: string;
          email: string;
          phone: string;
          formula_id: string | null;
          new_formula_data?: Omit<CreateFormulaData, 'funder'>;
        }) => {
          try {
            // Step 1: Create the ISO
            const newISO = await createISO({
              name: data.name,
              email: data.email,
              phone: data.phone,
            });

            // No longer need to link to funder immediately
            const freshlyCreatedISO = { ...newISO };
            setIsos(prev => [...prev, freshlyCreatedISO]);
            setFieldValue('iso', newISO._id);
            setShowISOModal(false);
          } catch (err) {
            console.error("Failed to create ISO", err);
            throw new Error('Failed to create ISO');
          }
        };

        const handleMerchantCreate = async (merchantData: { name: string; email: string; phone: string; assigned_manager?: string; assigned_user?: string; }) => {
          try {
            console.log('Step 1: Creating merchant with data:', {
              name: merchantData.name,
              email: merchantData.email,
              phone: merchantData.phone,
            });
            const newMerchant = await createMerchant({
              name: merchantData.name,
              dba_name: merchantData.name,
              email: merchantData.email,
              phone: merchantData.phone || 'N/A',
            });

            // No longer need to link to funder immediately
            const freshlyCreatedMerchant = { ...newMerchant };
            setMerchants(prev => [...prev, freshlyCreatedMerchant]);
            setFieldValue('merchant', newMerchant._id);
            setShowMerchantModal(false);
          } catch (err) {
            console.error("Failed to create merchant", err);
            throw new Error('Failed to create merchant');
          }
        };

        useEffect(() => {
          let nextDate = paybackStartDate;
          let paybackCount = 0;
          let termLength = 0;
          let scheduledEnd = paybackStartDate;
          const total = parseFloat(paybackTotalAmount) || parseFloat(values.payback_amount) || 0;
          if (paybackFrequency === 'DAILY') {
            paybackCount = 22;
            termLength = paybackCount;
            const d = new Date(paybackStartDate);
            d.setDate(d.getDate() + 1);
            nextDate = d.toISOString().split('T')[0];
            const end = new Date(paybackStartDate);
            end.setDate(end.getDate() + paybackCount - 1);
            scheduledEnd = end.toISOString().split('T')[0];
          } else if (paybackFrequency === 'WEEKLY') {
            paybackCount = paybackPayDays.length * 4 || 4;
            termLength = paybackCount;
            const d = new Date(paybackStartDate);
            let found = false;
            for (let i = 1; i <= 7 && !found; i++) {
              d.setDate(d.getDate() + 1);
              const day = d.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
              if (paybackPayDays.includes(day)) {
                found = true;
                nextDate = d.toISOString().split('T')[0];
              }
            }
            const end = new Date(paybackStartDate);
            end.setDate(end.getDate() + paybackCount * 7 - 1);
            scheduledEnd = end.toISOString().split('T')[0];
          } else if (paybackFrequency === 'MONTHLY') {
            paybackCount = paybackPayDays.length || 1;
            termLength = paybackCount;
            const d = new Date(paybackStartDate);
            d.setMonth(d.getMonth() + 1);
            nextDate = d.toISOString().split('T')[0];
            const end = new Date(paybackStartDate);
            end.setMonth(end.getMonth() + paybackCount);
            scheduledEnd = end.toISOString().split('T')[0];
          }
          setPaybackCalculated({
            next_payback_date: nextDate,
            next_payback_amount: paybackCount ? total / paybackCount : 0,
            term_length: termLength,
            scheduled_end_date: scheduledEnd,
          });
        }, [paybackStartDate, paybackFrequency, paybackPayDays, paybackTotalAmount, values.payback_amount]);

        // Fetch application offers when application changes
        useEffect(() => {
          if (!values.application) {
            setOffers([]);
            setFieldValue('application_offer', '');
            return;
          }
          setLoadingOffers(true);
          getApplicationOffers({
            application: values.application,
            include_inactive: false,
            limit: 1000,
          })
            .then((result) => setOffers(result.data))
            .catch(() => {
              setError('Failed to load application offers');
              setOffers([]);
            })
            .finally(() => setLoadingOffers(false));
        }, [values.application, setFieldValue]);

        useEffect(() => {
          const fetchFundingStatuses = async () => {
            try {
              setLoadingFundingStatuses(true);
              const result = await getFundingStatuses({ 
                include_inactive: false 
              });
              setFundingStatuses(result.data);
            } catch (error) {
              console.error('Error fetching funding statuses:', error);
              setError('Failed to load funding statuses');
            } finally {
              setLoadingFundingStatuses(false);
            }
          };

          fetchFundingStatuses();
        }, []);

        return (
          <>
            <CreateMerchant
              open={showMerchantModal}
              initialName={pendingMerchantName}
              onCancel={() => setShowMerchantModal(false)}
              onCreate={handleMerchantCreate}
              users={users}
            />
            <CreateISO
              open={showISOModal}
              initialName={pendingISOName}
              onCancel={() => setShowISOModal(false)}
              onCreate={handleISOCreation}
            />
            {/* Success Modal */}
            {showSuccessModal && (
              <FundingSuccessModal
                fundingId={createdFundingId}
                fundingName={createdFundingName}
                onContinueToPayback={handleContinueToPayback}
                onClose={handleCloseSuccessModal}
              />
            )}
            {/* Modal Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-white max-w-6xl mx-auto w-full max-h-[90vh] overflow-y-auto">
                {/* Title Header */}
                <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 text-center">Create Funding</h2>
                </div>
                <div className="flex min-h-[500px]">
                  {/* Sidebar Stepper */}
                  <div className="bg-gray-50 shadow-md rounded-l-2xl py-10 px-8 flex flex-col items-center" style={{ minWidth: 240 }}>
                    <VerticalStepper />
                  </div>
                  {/* Main Content */}
                  <div className="flex-1 px-8 py-8">
                    <div className="text-sm text-gray-500 font-medium mb-4">
                    </div>
                    <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                      <Form className="space-y-4" onSubmit={handleSubmit}>
                        {step === 1 && (
                          <Step1_SelectEntities
                            lenders={lenders}
                            merchants={merchants}
                            isos={isos}
                            applications={applications}
                            offers={offers}
                            values={values}
                            setFieldValue={setFieldValue}
                            setFieldTouched={formikProps.setFieldTouched}
                            setFieldError={formikProps.setFieldError}
                            setTouched={formikProps.setTouched}
                            validateForm={validateForm}
                            loadingLists={loadingLists}
                            loadingApps={loadingApps}
                            loadingOffers={loadingOffers}
                            handleCreateMerchant={handleCreateMerchant}
                            handleCreateISO={handleCreateISO}
                            labelClasses={labelClasses}
                            errorClasses={errorClasses}
                            setError={setError}
                          />
                        )}
                        {step === 2 && (
                          <Step2_BasicInfo
                            values={values}
                            setFieldValue={setFieldValue}
                            setFieldTouched={formikProps.setFieldTouched}
                            setFieldError={formikProps.setFieldError}
                            setTouched={formikProps.setTouched}
                            calculatedFields={calculatedFields}
                            feeTypes={feeTypes}
                            error={error}
                            labelClasses={labelClasses}
                            errorClasses={errorClasses}
                            merchants={merchants}
                            setError={setError}
                            fundingStatuses={fundingStatuses}
                            loadingFundingStatuses={loadingFundingStatuses}
                          />
                        )}
                        {step === 3 && (
                          <Suspense fallback={<div>Loading Payback Plan...</div>}>
                            <Step3_PaybackPlanStep
                              values={{
                                ...values,
                                payback_plan_list: values.payback_plan_list || [
                                  {
                                    merchant_account: '',
                                    funder_account: '',
                                    payment_method: 'ACH',
                                    ach_processor: '',
                                    total_amount: parseFloat(values.payback_amount) || 0,
                                    payback_count: 0,
                                    start_date: new Date().toISOString().split('T')[0],
                                    frequency: 'DAILY',
                                    payday_list: [2, 3, 4, 5, 6],
                                  },
                                ],
                              }}
                              setFieldValue={setFieldValue}
                              achProcessors={achProcessors.map((a) => ({ id: a.value, name: a.label }))}
                              error={error}
                              labelClasses={labelClasses}
                              errorClasses={errorClasses}
                            />
                          </Suspense>
                        )}
                        {step === 4 && (
                          <Step4_DisbursementStep
                            onNext={() => void handleNext(values, validateForm)}
                            calculatedFields={calculatedFields}
                            funderId={values.merchant}
                            merchantId={values.merchant}
                            installmentCount={installmentCount}
                            setInstallmentCount={setInstallmentCount}
                            disbursements={disbursements}
                            setDisbursements={setDisbursements}
                          />
                        )}
                        {step === 5 && (
                          <Step5_CommissionStep
                            commissionInstallmentCount={commissionInstallmentCount}
                            setCommissionInstallmentCount={setCommissionInstallmentCount}
                            commissionDisbursements={commissionDisbursements}
                            setCommissionDisbursements={setCommissionDisbursements}
                            paymentMethods={paymentMethods}
                            achProcessors={achProcessors}
                            inputClasses={inputClasses}
                            labelClasses={labelClasses}
                            funderId={values.merchant}
                            isoId={values.iso}
                          />
                        )}
                      </Form>
                    </div>
                    {/* Navigation buttons */}
                    <div className="flex justify-between pt-6">
                      {step < 3 ? (
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={handleBack}
                            className="bg-white border border-gray-300 text-gray-700 rounded px-6 py-2 font-semibold disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                            disabled={loading || isSubmitting}
                          >
                            Previous
                          </button>
                        </div>
                      ) : (
                        <div />
                      )}
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
                          className="bg-[#2196F3] hover:bg-[#1769AA] text-white rounded px-6 py-2 font-semibold shadow"
                          disabled={loading || isSubmitting}
                          onClick={async () => {
                            if (step === 1) {
                              await handleNext(values, validateForm, formikProps.setTouched);
                            } else if (step === 2) {
                              await handleNext(values, validateForm, formikProps.setTouched);
                            } else {
                              void handleNext(values);
                            }
                          }}
                        >
                          {loading ? 'Loading...' : step === 5 ? 'Complete' : 'Next'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      }}
    </Formik>
  );
};

export default FundingForm; 