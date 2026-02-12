import React from 'react';
import { ColumnConfig } from '@/components/GenericList/types';
import { SyndicationOffer } from '@/types/syndicationOffer';
import { formatCurrency, formatTime, formatNumberFourDecimals, formatFunder, formatSyndicator } from '@/lib/utils/format';
import { renderStatusBadge } from '@/components/StatusBadge';
import { Funder } from '@/types/funder';
import { Syndicator } from '@/types/syndicator';

/**
 * Column configuration for Syndication Offers list
 * Default visible columns: Funder, Syndicator, Participate Amount, Payback Amount, 
 * Participate Percentage, Funding, Funding Amount, Offered Date, Expire Date, Status
 * 
 * Hidden by default: Fee Details, Credit Details, Factor Rate, Buy Rate, Syndicated Amount,
 * Total Funded Amount, Total Payback Amount, and other calculated fields
 */
export const columns: ColumnConfig<SyndicationOffer>[] = [
  // Default visible columns
  {
    key: 'funder',
    label: 'Funder',
    visible: true,
    render: (value) => formatFunder(value),
  },
  {
    key: 'syndicator',
    label: 'Syndicator',
    visible: true,
    render: (value) => formatSyndicator(value),
  },
  {
    key: 'participate_amount',
    label: 'Participate Amount',
    visible: true,
    render: (value) => formatCurrency(value as number),
  },
  {
    key: 'payback_amount',
    label: 'Payback Amount',
    visible: true,
    render: (value) => formatCurrency(value as number),
  },
  {
    key: 'participate_percent',
    label: 'Participate Percentage',
    visible: true,
    render: (value) => `${value}%`,
  },
  {
    key: 'funding.name',
    label: 'Funding',
    visible: true,
  },
  {
    key: 'total_funded_amount',
    label: 'Funding Amount',
    visible: true,
    render: (value) => formatCurrency(value as number),
  },
  {
    key: 'offered_date',
    label: 'Offered Date',
    visible: true,
    render: (value) => formatTime(value as string),
  },
  {
    key: 'expired_date',
    label: 'Expire Date',
    visible: true,
    render: (value) => formatTime(value as string),
  },
  {
    key: 'status',
    label: 'Status',
    visible: true,
    render: (value) => renderStatusBadge(value),
  },

  // Hidden by default - Fee and Credit Details
  {
    key: 'upfront_fee_amount',
    label: 'Upfront Fee Amount',
    visible: false,
    render: (value) => formatCurrency(value as number),
  },
  {
    key: 'upfront_credit_amount',
    label: 'Upfront Credit Amount',
    visible: false,
    render: (value) => formatCurrency(value as number),
  },
  {
    key: 'recurring_fee_amount',
    label: 'Recurring Fee Amount',
    visible: false,
    render: (value) => formatCurrency(value as number),
  },
  {
    key: 'recurring_credit_amount',
    label: 'Recurring Credit Amount',
    visible: false,
    render: (value) => formatCurrency(value as number),
  },
  {
    key: 'total_fee_amount',
    label: 'Total Fee Amount',
    visible: false,
    render: (value) => formatCurrency(value as number),
  },
  {
    key: 'total_credit_amount',
    label: 'Total Credit Amount',
    visible: false,
    render: (value) => formatCurrency(value as number),
  },

  // Hidden by default - Calculated Fields
  {
    key: 'factor_rate',
    label: 'Factor Rate',
    visible: false,
    render: (value) => formatNumberFourDecimals(value as number),
  },
  {
    key: 'buy_rate',
    label: 'Buy Rate',
    visible: false,
    render: (value) => formatNumberFourDecimals(value as number),
  },
  {
    key: 'syndicated_amount',
    label: 'Syndicated Amount',
    visible: false,
    render: (value) => formatCurrency(value as number),
  },
  {
    key: 'total_funded_amount',
    label: 'Total Funded Amount',
    visible: false,
    render: (value) => formatCurrency(value as number),
  },
  {
    key: 'total_payback_amount',
    label: 'Total Payback Amount',
    visible: false,
    render: (value) => formatCurrency(value as number),
  },

  // Hidden by default - System Fields
  {
    key: 'createdAt',
    label: 'Created At',
    visible: false,
    render: (value) => formatTime(value as string),
  },
  {
    key: 'updatedAt',
    label: 'Updated At',
    visible: false,
    render: (value) => formatTime(value as string),
  },
  {
    key: 'status_date',
    label: 'Status Date',
    visible: false,
    render: (value) => formatTime(value as string),
  },
];

/**
 * Default sorting configuration
 * Sort by Offered Date in descending order
 */
export const defaultSort = {
  sortBy: 'offered_date',
  sortOrder: 'desc' as const,
}; 