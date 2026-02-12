import { ColumnConfig } from '@/components/GenericList/types';
import { Payout } from '@/types/payout';
import { formatCurrency, formatTime } from '@/lib/utils/format';
import { renderEntity } from '@/components/EntityPreview';
import { renderSyndicator } from '@/components/SyndicatorPreview';
import { renderStatusBadge } from '@/components/StatusBadge';

/**
 * Column configuration for Payout list
 * Default visible columns: Basic information and financial details
 * Hidden by default: System fields and detailed information
 */
export const columns: ColumnConfig<Payout>[] = [
  {
    key: 'payback._id',
    label: 'Payback ID',
    visible: true,
    render: (value: string) => value?.substring(0, 8) + '...' || '-',
  },
  {
    key: 'syndication._id',
    label: 'Syndication ID',
    visible: true,
    render: (value: string) => value?.substring(0, 8) + '...' || '-',
  },
  {
    key: 'funding.name',
    label: 'Funding Name',
    visible: true,
    render: (value: string) => value || '-',
  },
  {
    key: 'funder',
    label: 'Funder',
    visible: true,
    render: (value) => renderEntity(value),
  },
  {
    key: 'lender',
    label: 'Lender',
    visible: true,
    render: (value) => renderEntity(value),
  },
  {
    key: 'syndicator',
    label: 'Syndicator',
    visible: true,
    render: (value) => renderSyndicator(value),
  },
  {
    key: 'payout_amount',
    label: 'Payout Amount',
    visible: true,
    render: (value: number) => formatCurrency(value),
  },
  {
    key: 'fee_amount',
    label: 'Fee Amount',
    visible: true,
    render: (value: number) => formatCurrency(value),
  },
  {
    key: 'credit_amount',
    label: 'Credit Amount',
    visible: true,
    render: (value: number) => formatCurrency(value),
  },
  {
    key: 'available_amount',
    label: 'Available Amount',
    visible: true,
    render: (value: number) => formatCurrency(value),
  },
  {
    key: 'created_date',
    label: 'Created Date',
    visible: true,
    render: (value: string) => formatTime(value),
  },
  {
    key: 'redeemed_date',
    label: 'Redeemed Date',
    visible: true,
    render: (value: string) => value ? formatTime(value) : 'Not Redeemed',
  },
  {
    key: 'pending',
    label: 'Pending',
    visible: true,
    render: (value: boolean) => renderStatusBadge(value ? 'pending' : 'completed'),
  },
  {
    key: 'created_by_user',
    label: 'Created By',
    visible: false,
    render: (value: any) => value?.name || 'System',
  },
  {
    key: 'createdAt',
    label: 'Created At',
    visible: false,
    render: (value: string) => formatTime(value),
  },
  {
    key: 'updatedAt',
    label: 'Updated At',
    visible: false,
    render: (value: string) => formatTime(value),
  },
]; 