'use client';

import React from 'react';
import { Funding } from '@/types/funding';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { getFundingTypeLabel } from '../../_utils/fundingHelpers';
import { StatusBadge } from '@/components/StatusBadge';
import SyndicationPieChart from '@/components/SyndicationPieChart';
import { 
  formatFundingAmount, 
  getFundingStatusColor,
  calculateNetAmount,
  calculateSucceedRate,
  calculateRemainingBalance,
  getFundingSummary
} from '../../_utils/fundingHelpers';

interface FundingInformationProps {
  data: Funding;
}

// Helper for formatting percent
const formatPercent = (value: number | undefined) =>
  typeof value === 'number' ? `${value}%` : '-';

// FundedAmountDisplay component
const FundedAmountDisplay = ({ fundedAmount, succeedCount, netAmount }: { fundedAmount?: number, succeedCount?: number, netAmount?: number }) => {
  const paidPercentage =
    !succeedCount || !netAmount || netAmount === 0
      ? 0
      : Math.round((succeedCount / netAmount) * 100);
  const isFull = paidPercentage >= 100;
  return (
    <span>
      <span className={`font-bold ${isFull ? 'text-green-700' : 'text-red-700'}`}>{formatFundingAmount(fundedAmount)}</span>
      <span className="font-normal text-xs text-gray-400 ml-1">
        {isFull ? '(Paid in full)' : `(Paid ${paidPercentage}%)`}
      </span>
    </span>
  );
};

// PaybackAmountDisplay component
const PaybackAmountDisplay = ({ payback_amount, paid_payback_funded_amount }: { payback_amount?: number; paid_payback_funded_amount?: number; }) => {
  const total = payback_amount ?? 0;
  const paid = paid_payback_funded_amount ?? 0;
  const percentage = total === 0 ? 0 : Math.round((paid / total) * 100);
  const isFull = percentage >= 100;
  return (
    <span>
      <span className={`font-bold ${isFull ? "text-green-700" : "text-red-700"}`}>{formatFundingAmount(total)}</span>
      <span className="font-normal text-xs text-gray-400 ml-1">
        {isFull ? "(Paid in full)" : `(Paid ${percentage}%)`}
      </span>
    </span>
  );
};

// CommissionAmountDisplay component
const CommissionAmountDisplay = ({ commission_amount, commission_paid_amount }: { commission_amount?: number; commission_paid_amount?: number; }) => {
  const total = commission_amount ?? 0;
  const paid = commission_paid_amount ?? 0;
  const percentage = total === 0 ? 0 : Math.round((paid / total) * 100);
  const isFull = percentage >= 100;
  return (
    <span>
      <span className={`font-bold ${isFull ? "text-green-700" : "text-red-700"}`}>{formatFundingAmount(total)}</span>
      <span className="font-normal text-xs text-gray-400 ml-1">
        {isFull ? "(Paid in full)" : `(Paid ${percentage}%)`}
      </span>
    </span>
  );
};

// FeeAmountDisplay component
const FeeAmountDisplay = ({ fee_amount, paid_payback_fee_amount }: { fee_amount?: number; paid_payback_fee_amount?: number; }) => {
  const total = fee_amount ?? 0;
  const paid = paid_payback_fee_amount ?? 0;
  const percentage = total === 0 ? 0 : Math.round((paid / total) * 100);
  const isFull = percentage >= 100;
  return (
    <span>
      <span className={`font-bold ${isFull ? "text-green-700" : "text-red-700"}`}>{formatFundingAmount(total)}</span>
      <span className="font-normal text-xs text-gray-400 ml-1">
        {isFull ? "(Paid in full)" : `(Paid ${percentage}%)`}
      </span>
    </span>
  );
};

export default function FundingInformation({ data }: FundingInformationProps) {
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object' && value.name) return String(value.name);
    return '-';
  };

  const getUserName = (user: any): string => {
    if (!user) return '-';
    if (typeof user === 'object') {
      if ('name' in user && user.name) return user.name;
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) return fullName;
      if (user.email) return user.email;
      if (user.id) return user.id;
    }
    return '-';
  };

  const fundingSummary = getFundingSummary(data);

  console.log('FundingInformation status:', data.status);

  // Prepare syndication data for pie chart
  const prepareSyndicationData = () => {
    if (!data.syndication_list || data.syndication_list.length === 0) {
      return [];
    }

    return data.syndication_list
      .filter((syndication: any) => syndication && syndication.percentage && syndication.percentage > 0)
      .map((syndication: any) => ({
        _id: syndication._id || syndication.id || Math.random().toString(),
        name: syndication.name || syndication.syndicator?.name || 'Unknown Syndicator',
        percentage: syndication.percentage || 0,
        amount: syndication.amount || (data.syndication_amount ? (data.syndication_amount * (syndication.percentage / 100)) : 0)
      }))
      .sort((a, b) => b.percentage - a.percentage); // Sort by percentage descending
  };

  const syndicationData = prepareSyndicationData();

  return (
    <div className="p-4 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Funding Information */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Funding Information</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Funding ID</p>
                <h3 className="text-md font-semibold text-gray-800">{data._id}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Created At</p>
                <h3 className="text-md font-semibold text-gray-800">{data.createdAt ? formatDate(data.createdAt) : '-'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Created By</p>
                <h3 className="text-md font-semibold text-gray-800">{getUserName(data.created_by_user)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Assigned Manager</p>
                <h3 className="text-md font-semibold text-gray-800">{getUserName(data.assigned_manager)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Assigned User</p>
                <h3 className="text-md font-semibold text-gray-800">{getUserName(data.assigned_user)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Status</p>
                <h3 className="text-md font-semibold">
                  <StatusBadge 
                    status={typeof data.status === 'object' && data.status !== null ? data.status.name : data.status ?? 'UNKNOWN'} 
                    color={typeof data.status === 'object' && data.status !== null ? data.status.bgcolor : undefined} 
                    size="xs" 
                  />
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Type</p>
                <h3 className="text-md font-semibold text-gray-800">
                  <StatusBadge status={data.type} size="xs" />
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Internal</p>
                <h3 className="text-md font-semibold text-gray-800">
                  <StatusBadge status={data.internal ? 'YES' : 'NO'} size="xs" />
                </h3>
              </div>

              {(data.follower_list && data.follower_list.length > 0) && (
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left sm:col-span-2">
                  <p className="text-xs font-medium text-gray-500">Followers</p>
                  <div className="flex flex-wrap gap-1">
                    {data.follower_list.map((follower: any, index: number) => (
                      <span key={follower._id || index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {getUserName(follower)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Details */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Financial Details</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Funded Amount</p>
                <h3 className="text-md font-semibold text-gray-800">
                  <FundedAmountDisplay
                    fundedAmount={data.funded_amount ? data.funded_amount / 100 : undefined}
                    succeedCount={data.disbursement_succeed_count}
                    netAmount={data.net_amount}
                  />
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Payback Amount</p>
                <h3 className="text-md font-semibold text-gray-800">
                  <PaybackAmountDisplay
                    payback_amount={data.payback_amount ? data.payback_amount / 100 : undefined}
                    paid_payback_funded_amount={data.paid_payback_funded_amount ? data.paid_payback_funded_amount / 100 : undefined}
                  />
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Factor Rate</p>
                <h3 className="text-md font-semibold text-gray-800">{data.factor_rate?.toFixed(2) ?? '-'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Upfront Fee Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{formatFundingAmount(data.upfront_fee_amount ? data.upfront_fee_amount / 100 : undefined)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Commission Amount</p>
                <h3 className="text-md font-semibold text-gray-800">
                  <CommissionAmountDisplay
                    commission_amount={data.commission_amount ? data.commission_amount / 100 : undefined}
                    commission_paid_amount={data.commission_paid_amount ? data.commission_paid_amount / 100 : undefined}
                  />
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Buy Rate</p>
                <h3 className="text-md font-semibold text-gray-800">{data.buy_rate?.toFixed(2) ?? '-'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Net Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{formatFundingAmount(calculateNetAmount(data) ? calculateNetAmount(data) / 100 : undefined)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Disbursed Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{formatFundingAmount(data.disbursement_paid_amount ? data.disbursement_paid_amount / 100 : undefined)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Fee Amount</p>
                <h3 className="text-md font-semibold text-gray-800">
                  <FeeAmountDisplay
                    fee_amount={data.fee_amount ? data.fee_amount / 100 : undefined}
                    paid_payback_fee_amount={data.paid_payback_fee_amount ? data.paid_payback_fee_amount / 100 : undefined}
                  />
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Credit Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{formatFundingAmount(data.credit_amount ? data.credit_amount / 100 : undefined)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Residual Fee Amount</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {formatFundingAmount((data as any).residual_fee_amount ? (data as any).residual_fee_amount / 100 : undefined)}
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Total Fee Amount</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {formatFundingAmount((data as any).total_fee_amount ? (data as any).total_fee_amount / 100 : undefined)}
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Total Expense Amount</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {formatFundingAmount((data as any).total_expense_amount ? (data as any).total_expense_amount / 100 : undefined)}
                </h3>
              </div>
            </div>
          </div>

          {/* Payback Statistics */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Payback Statistics</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Success Rate</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {typeof data.succeed_rate === 'number' ? `${(data.succeed_rate * 100).toFixed(1)}%` : '-'}
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Total Paybacks</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {(data as any).payback_succeed_count || 0} / {(data as any).payback_plan_count || 0}
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Pending Paybacks</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {(data as any).pending_count || 0}
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Failed Paybacks</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {(data as any).payback_failed_count || 0}
                </h3>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Performance Metrics</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Paid Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{formatFundingAmount(data.paid_amount ? data.paid_amount / 100 : undefined)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Paid Payback</p>
                <h3 className="text-md font-semibold text-gray-800">{formatFundingAmount(data.paid_payback_funded_amount ? data.paid_payback_funded_amount / 100 : undefined)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Paid Fee</p>
                <h3 className="text-md font-semibold text-gray-800">{formatFundingAmount(data.paid_payback_fee_amount ? data.paid_payback_fee_amount / 100 : undefined)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Remaining Balance</p>
                <h3 className="text-md font-semibold text-gray-800">{formatFundingAmount(fundingSummary.remainingBalance)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Remaining Payback</p>
                <h3 className="text-md font-semibold text-gray-800">{formatFundingAmount(data.payback_remaining_amount ? data.payback_remaining_amount / 100 : undefined)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Remaining Fee</p>
                <h3 className="text-md font-semibold text-gray-800">{formatFundingAmount(data.remaining_balance ? data.remaining_balance / 100 : undefined)}</h3>
              </div>
            </div>
          </div>

          {/* Syndication Card with Pie Chart */}
          <div className="w-full">
            <SyndicationPieChart 
              data={syndicationData}
              totalAmount={data.syndication_amount || 0}
              className="w-full"
            />
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Syndication Amount</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {formatFundingAmount((data as any).syndication_amount ? (data as any).syndication_amount / 100 : undefined)}
                </h3>
              </div>
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Syndication %</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {typeof (data as any).syndication_percent === 'number' ? `${((data as any).syndication_percent * 100).toFixed(1)}%` : '-'}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Lender Information */}
          {data.lender && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Lender Information</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Name</p>
                  <h3 className="text-md font-semibold text-gray-800">{safeRender(data.lender.name)}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {data.lender.email ? (
                      <a href={`mailto:${data.lender.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {data.lender.email}
                      </a>
                    ) : '-'}
                  </h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Phone</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {data.lender.phone ? (
                      <a href={`tel:${data.lender.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {data.lender.phone}
                      </a>
                    ) : '-'}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Merchant Information */}
          {data.merchant && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Merchant Information</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Name</p>
                  <h3 className="text-md font-semibold text-gray-800">{safeRender(data.merchant.name)}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {data.merchant.email ? (
                      <a href={`mailto:${data.merchant.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {data.merchant.email}
                      </a>
                    ) : '-'}
                  </h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Phone</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {data.merchant.phone ? (
                      <a href={`tel:${data.merchant.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {data.merchant.phone}
                      </a>
                    ) : '-'}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Funder Information */}
          {data.funder && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Funder Information</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Name</p>
                  <h3 className="text-md font-semibold text-gray-800">{safeRender(data.funder.name)}</h3>
                </div>
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {data.funder.email ? (
                      <a href={`mailto:${data.funder.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {data.funder.email}
                      </a>
                    ) : '-'}
                  </h3>
                </div>
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Phone</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {data.funder.phone ? (
                      <a href={`tel:${data.funder.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {data.funder.phone}
                      </a>
                    ) : '-'}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* ISO Information */}
          {data.iso && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">ISO Information</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Name</p>
                  <h3 className="text-md font-semibold text-gray-800">{safeRender(data.iso.name)}</h3>
                </div>
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {data.iso.email ? (
                      <a href={`mailto:${data.iso.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {data.iso.email}
                      </a>
                    ) : '-'}
                  </h3>
                </div>
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Phone</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {data.iso.phone ? (
                      <a href={`tel:${data.iso.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {data.iso.phone}
                      </a>
                    ) : '-'}
                  </h3>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 