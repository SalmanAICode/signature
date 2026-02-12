import React from 'react';
import { ColumnConfig } from '@/components/GenericList/types';
import { ApplicationOffer } from '@/types/applicationOffer';
import { formatCurrency, formatNumberFourDecimals, formatNumberTwoDecimals, formatTime } from '@/lib/utils/format';
import { renderStatusBadge } from '@/components/StatusBadge';
import { renderEntity } from '@/components/EntityPreview';
import { renderUser } from '@/components/UserPreview';

export const columns: ColumnConfig<ApplicationOffer>[] = [
  {
    key: 'application.name',
    label: 'Application',
  },
  {
    key: 'funder',
    label: 'Funder',
    render: renderEntity,
  },
  {
    key: 'merchant',
    label: 'Merchant',
    render: renderEntity,
  },
  {
    key: 'iso',
    label: 'ISO',
    render: renderEntity,
  },

  {
    key: 'offered_amount',
    label: 'Offered Amount',
    render: formatCurrency,
  },
  {
    key: 'payback_amount',
    label: 'Payback Amount',
    render: formatCurrency,
  },
  {
    key: 'factor_rate',
    label: 'Factor Rate',
    render: formatNumberFourDecimals,
  },
  {
    key: "buy_rate",
    label: "Buy Rate",
    render: formatNumberFourDecimals,
  },
  {
    key: "term_length",
    label: "Term Length",
    render: formatNumberTwoDecimals,
  },
  {
    key: 'frequency',
    label: 'PaybackFrequency',
    render: renderStatusBadge
  },
  {
    key: "payday_list",
    label: "Payday List",
    visible: false,
  },
  {
    key: "offered_by_user",
    label: "Offered User",
    render: renderUser,
  },

  {
    key: "offered_date",
    label: "Offered At",
    render: formatTime,
  },

  {
    key: "updated_by_user",
    label: "Updated By",
    render: renderUser,
    visible: false,
  },

  {
    key: "decided_by_contact",
    label: "Decided By",
    render: renderUser,
    visible: false,
  },

  {
    key: 'status',
    label: 'Status',
    render: renderStatusBadge,
  },

  {
    key: '_id',
    label: 'ID',
    visible: false,
  },

  {
    key: "installment",
    label: "Installment",
    render: formatNumberTwoDecimals,
    visible: false,
  },

  {
    key: "commission_amount",
    label: "Commission Amount",
    render: formatCurrency,
    visible: false,
  },

  {
    key: "fee_amount",
    label: "Fee Amount",
    render: formatCurrency,
    visible: false,
  },
  {
    key: "fee_list",
    label: "Fee List",
    visible: false,
  },

  {
    key: "payback_count",
    label: "Payback Count",
    visible: false,
  },

  {
    key: "disbursement_amount",
    label: "Disbursement Amount",
    render: formatCurrency,
    visible: false,
  },

  {
    key: "payment_amount",
    label: "Payment Amount",
    render: formatCurrency,
    visible: false,
  },


  {
    key: "inactive",
    label: "Inactive",
    render: renderStatusBadge,
    visible: false,
  },

  {
    key: "createdAt",
    label: "Created At",
    render: formatTime,
    visible: false,
  },
  {
    key: "updatedAt",
    label: "Updated At",
    render: formatTime,
    visible: false,
  },

  // {
  //   key: "__v",
  //   label: "Version",
  //   visible: false,
  // },

]; 