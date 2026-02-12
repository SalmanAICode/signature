import React, { useState, useEffect } from 'react';
import { useFunderAccounts } from '@/hooks/useFunderAccounts';
import { useMerchantAccountsByMerchantId } from '@/hooks/useMerchantAccountsByMerchantId';
import { FunderAccount } from '@/types/funder';
import { MerchantAccount } from '@/types/merchant';

interface Disbursement {
  date: string;
  amount: number;
  funderAccount: string;
  merchantAccount: string;
  method: string;
  achProcessor: string;
}

interface DisbursementStepProps {
  onNext: () => void;
  onBack?: () => void;
  calculatedFields: {
    net_amount: number;
  };
  funderId: string;
  merchantId: string;
  installmentCount: number;
  setInstallmentCount: (count: number) => void;
  disbursements: Disbursement[];
  setDisbursements: (ds: Disbursement[] | ((prev: Disbursement[]) => Disbursement[])) => void;
}

const paymentMethods = [
  { value: 'WIRE', label: 'WIRE' },
  { value: 'ACH', label: 'ACH' },
];

const achProcessors = [
  { value: 'ACHWorks', label: 'ACHWorks' },
  { value: 'Actum', label: 'Actum' },
  { value: 'Manual', label: 'Manual' },
  { value: 'Other', label: 'Other' },
];

const inputClasses = 'w-full px-3 py-2 border rounded-lg focus:outline-none text-sm';
const labelClasses = 'block text-xs font-medium text-gray-700 mb-1';
const errorClasses = 'text-red-500 text-xs mt-1';

const Step4_DisbursementStep = ({ onNext, onBack, calculatedFields, funderId, merchantId, installmentCount, setInstallmentCount, disbursements, setDisbursements }: DisbursementStepProps) => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Get funder accounts based on selected funder
  const { 
    accounts: funderAccounts, 
    loading: funderAccountsLoading, 
    error: funderAccountsError 
  } = useFunderAccounts();

  // Get merchant accounts based on selected merchant
  const { 
    accounts: merchantAccounts, 
    loading: merchantAccountsLoading, 
    error: merchantAccountsError 
  } = useMerchantAccountsByMerchantId(merchantId);

  const validateDisbursements = (): boolean => {
    const errors: string[] = [];
    
    disbursements.forEach((disbursement, index) => {
      if (!disbursement.date || disbursement.date.trim() === '') {
        errors.push(`Disbursement date is required for installment #${index + 1}`);
      }
      if (!disbursement.amount || disbursement.amount <= 0) {
        errors.push(`Disbursement amount must be greater than 0 for installment #${index + 1}`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateDisbursements()) {
      onNext();
    }
  };

  return (
    <>
      <div
        className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100"
        style={{ minHeight: 320, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}
      >
        <h3 className="text-xl font-bold mb-4 text-[#1A2341]">Disbursement Intents</h3>
        
        {validationErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</div>
            <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-6 flex items-end gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Installments</label>
            <input
              type="number"
              min={1}
              value={installmentCount}
              onChange={e => setInstallmentCount(Math.max(1, Number(e.target.value)))}
              className="border rounded px-3 py-2 w-28 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div style={{ maxHeight: '70vh', overflowY: disbursements.length > 1 ? 'auto' : 'visible' }} className="space-y-4">
          {disbursements.map((row, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
              <div className="flex gap-4 items-center">
                <div className="text-xs font-semibold text-gray-500">Installment #{idx + 1}</div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className={labelClasses}>Disbursement Date *</label>
                  <input 
                    type="date" 
                    value={row.date} 
                    onChange={e => {
                      setDisbursements((prev: Disbursement[]) => prev.map((r, i) => i === idx ? { ...r, date: e.target.value } : r));
                      // Clear validation errors when user starts typing
                      if (validationErrors.length > 0) {
                        setValidationErrors([]);
                      }
                    }} 
                    className={`${inputClasses} rounded-lg ${!row.date ? 'border-red-300 focus:border-red-500' : ''}`}
                    required
                  />
                  {!row.date && (
                    <div className={errorClasses}>Disbursement date is required</div>
                  )}
                </div>
                <div className="flex-1">
                  <label className={labelClasses}>Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input 
                      type="number" 
                      value={row.amount} 
                      onChange={e => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        setDisbursements((prev: Disbursement[]) => prev.map((r, i) => i === idx ? { ...r, amount: value } : r));
                        // Clear validation errors when user starts typing
                        if (validationErrors.length > 0) {
                          setValidationErrors([]);
                        }
                      }}
                      className={`${inputClasses} rounded-lg text-right pl-7 ${row.amount <= 0 ? 'border-red-300 focus:border-red-500' : ''}`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  {row.amount <= 0 && (
                    <div className={errorClasses}>Amount must be greater than 0</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className={labelClasses}>Funder Account</label>
                  <select 
                    value={row.funderAccount} 
                    onChange={e => setDisbursements((prev: Disbursement[]) => prev.map((r, i) => i === idx ? { ...r, funderAccount: e.target.value } : r))} 
                    className={inputClasses + ' rounded-lg'}
                    disabled={funderAccountsLoading}
                  >
                    <option value="">Select Funder Account</option>
                    {funderAccounts
                      .map((acc: FunderAccount) => (
                        <option key={acc._id} value={acc._id}>{acc.name}</option>
                      ))}
                  </select>
                  {funderAccountsLoading && <div className="text-xs text-gray-500">Loading accounts...</div>}
                  {funderAccountsError && <div className={errorClasses}>{funderAccountsError}</div>}
                </div>
                <div className="flex-1">
                  <label className={labelClasses}>Merchant Account</label>
                  <select 
                    value={row.merchantAccount} 
                    onChange={e => setDisbursements((prev: Disbursement[]) => prev.map((r, i) => i === idx ? { ...r, merchantAccount: e.target.value } : r))} 
                    className={inputClasses + ' rounded-lg'}
                    disabled={!merchantId || merchantAccountsLoading}
                  >
                    <option value="">Select Merchant Account</option>
                    {merchantAccounts
                      .map((acc: MerchantAccount) => (
                        <option key={acc._id} value={acc._id}>{acc.name}</option>
                      ))}
                  </select>
                  {merchantAccountsLoading && <div className="text-xs text-gray-500">Loading accounts...</div>}
                  {merchantAccountsError && <div className={errorClasses}>{merchantAccountsError}</div>}
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className={labelClasses}>Payment Method</label>
                  <select value={row.method} onChange={e => setDisbursements((prev: Disbursement[]) => prev.map((r, i) => i === idx ? { ...r, method: e.target.value } : r))} className={inputClasses + ' rounded-lg'}>
                    {paymentMethods.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  {row.method === 'ACH' && (
                    <>
                      <label className={labelClasses}>ACH Processor</label>
                      <select value={row.achProcessor} onChange={e => setDisbursements((prev: Disbursement[]) => prev.map((r, i) => i === idx ? { ...r, achProcessor: e.target.value } : r))} className={inputClasses + ' rounded-lg'}>
                        <option value="">Select</option>
                        {achProcessors.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={handleNext}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Next
        </button>
      </div>
    </>
  );
};

export default Step4_DisbursementStep; 