import { renderStatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatNumberFourDecimals, formatTime } from "@/lib/utils/format";
import { Column } from "@/components/SimpleList";
import { ApplicationOffer } from "@/types/applicationOffer";

export const columns: Column<ApplicationOffer>[] = [
  {
    key: 'status',
    label: 'Status',
    render: renderStatusBadge
  },
  {
    key: 'offered_amount',
    label: 'Offered Amount',
    render: formatCurrency
  },
  {
    key: 'payback_amount',
    label: 'Payback Amount',
    render: formatCurrency
  },
  {
    key: 'payment_amount',
    label: 'Payment',
    render: formatCurrency
  },
  {
    key: 'frequency',
    label: 'Frequency'
  },
  {
    key: 'term_length',
    label: 'Term',
    render: formatNumberFourDecimals  
  },
  {
    key: 'factor_rate',
    label: 'Factor Rate',
    render: formatNumberFourDecimals
  },
  {
    key: 'buy_rate',
    label: 'Buy Rate',
    render: formatNumberFourDecimals
  },
  {
    key: "commission_amount",
    label: "Commission",
    render: formatCurrency
  },

  {
    key: "fee_amount",
    label: "Total Fees",
    render: formatCurrency
  },
  {
    key: 'offered_date',
    label: 'Offered Date',
    render: formatTime
  },
  {
    key: "offered_by_user.name",
    label: "Offered By"
  }

];