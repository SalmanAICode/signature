import React from 'react';
import { useFunderAccountsByFunderId } from '@/hooks/useFunderAccountsByFunderId';
import { useISOAccounts } from '@/hooks/useISOAccounts';
import { FunderAccount } from '@/types/funder';

interface CommissionDisbursement {
  date: string;
  amount: number;
  funderAccount: string;
  isoAccount: string;
  method: string;
  achProcessor: string;
}

interface CommissionStepProps {
  commissionInstallmentCount: number;
  setCommissionInstallmentCount: (count: number) => void;
  commissionDisbursements: CommissionDisbursement[];
  setCommissionDisbursements: (ds: CommissionDisbursement[]) => void;
  paymentMethods: { value: string; label: string }[];
  achProcessors: { value: string; label: string }[];
  inputClasses: string;
  labelClasses: string;
  funderId: string;
  isoId: string;
}

const Step5_CommissionStep = ({
  commissionInstallmentCount,
  setCommissionInstallmentCount,
  commissionDisbursements,
  setCommissionDisbursements,
  paymentMethods,
  achProcessors,
  inputClasses,
  labelClasses,
  funderId,
  isoId,
}: CommissionStepProps) => {
  // Get funder accounts based on selected funder
  const { 
    accounts: funderAccounts, 
    loading: funderAccountsLoading, 
    error: funderAccountsError 
  } = useFunderAccountsByFunderId(funderId);

  // Get ISO accounts based on selected ISO
  const { 
    accounts: isoAccounts, 
    loading: isoAccountsLoading, 
    error: isoAccountsError 
  } = useISOAccounts();

  return (
    <div
      className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100"
      style={{ minHeight: 320, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}
    >
      <h3 className="text-xl font-bold mb-4 text-[#1A2341]">Commission Intents</h3>
      <div className="mb-6 flex items-end gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Installments</label>
          <input
            type="number"
            min={1}
            value={commissionInstallmentCount}
            onChange={e => setCommissionInstallmentCount(Math.max(1, Number(e.target.value)))}
            className="border rounded px-3 py-2 w-28 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div style={{ maxHeight: 320, overflowY: commissionDisbursements.length > 1 ? 'auto' : 'visible' }} className="space-y-4">
        {commissionDisbursements.map((row, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex gap-4 items-center">
              <div className="text-xs font-semibold text-gray-500">Installment #{idx + 1}</div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className={labelClasses}>Commission Date</label>
                <input type="date" value={row.date} onChange={e => setCommissionDisbursements(commissionDisbursements.map((r, i) => i === idx ? { ...r, date: e.target.value } : r))} className={inputClasses + ' rounded-lg'} />
              </div>
              <div className="flex-1">
                <label className={labelClasses}>Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input type="number" value={row.amount} readOnly className={inputClasses + ' rounded-lg bg-gray-100 text-right pl-7'} />
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className={labelClasses}>Funder Account</label>
                <select 
                  value={row.funderAccount} 
                  onChange={e => setCommissionDisbursements(commissionDisbursements.map((r, i) => i === idx ? { ...r, funderAccount: e.target.value } : r))} 
                  className={inputClasses + ' rounded-lg'}
                  disabled={!funderId || funderAccountsLoading}
                >
                  <option value="">Select Funder Account</option>
                  {funderAccounts
                    .filter((acc: FunderAccount) => String(acc.funder._id).trim() === String(funderId).trim())
                    .map((acc: FunderAccount) => (
                      <option key={acc._id} value={acc._id}>{acc.name}</option>
                    ))}
                </select>
                {funderAccountsLoading && <div className="text-xs text-gray-500">Loading accounts...</div>}
                {funderAccountsError && <div className="text-red-500 text-xs mt-1">{funderAccountsError}</div>}
              </div>
              <div className="flex-1">
                <label className={labelClasses}>ISO Account</label>
                <select 
                  value={row.isoAccount} 
                  onChange={e => setCommissionDisbursements(commissionDisbursements.map((r, i) => i === idx ? { ...r, isoAccount: e.target.value } : r))} 
                  className={inputClasses + ' rounded-lg'}
                  disabled={!isoId || isoAccountsLoading}
                >
                  <option value="">Select ISO Account</option>
                  {isoAccounts
                    .filter((acc: any) => String(acc.iso._id).trim() === String(isoId).trim())
                    .map((acc: any) => (
                      <option key={acc._id} value={acc._id}>{acc.name}</option>
                    ))}
                </select>
                {isoAccountsLoading && <div className="text-xs text-gray-500">Loading accounts...</div>}
                {isoAccountsError && <div className="text-red-500 text-xs mt-1">{isoAccountsError}</div>}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className={labelClasses}>Payment Method</label>
                <select value={row.method} onChange={e => setCommissionDisbursements(commissionDisbursements.map((r, i) => i === idx ? { ...r, method: e.target.value } : r))} className={inputClasses + ' rounded-lg'}>
                  {paymentMethods.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="flex-1">
                {row.method === 'ACH' && (
                  <>
                    <label className={labelClasses}>ACH Processor</label>
                    <select value={row.achProcessor} onChange={e => setCommissionDisbursements(commissionDisbursements.map((r, i) => i === idx ? { ...r, achProcessor: e.target.value } : r))} className={inputClasses + ' rounded-lg'}>
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
  );
};

export default Step5_CommissionStep; 