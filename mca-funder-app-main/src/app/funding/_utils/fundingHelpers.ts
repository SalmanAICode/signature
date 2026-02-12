import { Funding } from '@/types/funding';
import { formatCurrency } from '@/lib/utils/format';

export function calculateNetAmount(funding: Funding): number {
  const fundedAmount = funding.funded_amount || 0;
  const upfrontFees = funding.upfront_fee_amount || 0;
  return fundedAmount - upfrontFees;
}

export function calculateSucceedRate(funding: Funding): number {
  const totalPaybacks = funding.payback_succeed_count || 0;
  const totalAttempts = (funding.payback_succeed_count || 0) + 
                       (funding.payback_failed_count || 0) + 
                       (funding.payback_bounced_count || 0) + 
                       (funding.payback_disputed_count || 0);
  
  if (totalAttempts === 0) return 0;
  return (totalPaybacks / totalAttempts) * 100;
}

export function formatFundingAmount(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '-';
  return formatCurrency(amount);
}

export function getFundingStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'CREATED': 'bg-blue-100 text-blue-700',
    'DISBURSED': 'bg-green-100 text-green-700',
    'BEFORE_FIRST_PAYBACK': 'bg-yellow-100 text-yellow-700',
    'ONTIME': 'bg-green-100 text-green-700',
    'DELAYED': 'bg-orange-100 text-orange-700',
    'SLOW_PAYBACK': 'bg-red-100 text-red-700',
    'COMPLETED': 'bg-green-100 text-green-700',
    'DEFAULT': 'bg-red-100 text-red-700',
  };

  return statusColors[status] || 'bg-gray-100 text-gray-700';
}

export function getFundingTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    'NEW': 'New',
    'RENEWAL': 'Renewal',
    'REFINANCE': 'Refinance',
    'OTHER': 'Other',
  };

  return typeLabels[type] || type;
}

export function calculateRemainingBalance(funding: Funding): number {
  const paybackAmount = funding.payback_amount || 0;
  const paidAmount = funding.paid_amount || 0;
  return paybackAmount - paidAmount;
}

export function getFundingSummary(funding: Funding): {
  totalFunded: number;
  totalPaid: number;
  remainingBalance: number;
  successRate: number;
  totalPaybacks: number;
} {
  return {
    totalFunded: funding.funded_amount || 0,
    totalPaid: funding.paid_amount || 0,
    remainingBalance: calculateRemainingBalance(funding),
    successRate: calculateSucceedRate(funding),
    totalPaybacks: funding.payback_succeed_count || 0,
  };
} 