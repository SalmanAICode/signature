// Define the columns for the ISO table
import { ColumnConfig } from "@/components/GenericList/types";
import { formatTime, formatPhone, formatAddress, formatCurrency, formatBusinessDetail } from "@/lib/utils/format";
import { renderStatusBadge } from "@/components/StatusBadge";
import { ISO } from "@/types/iso";
import { renderUser } from "@/components/UserPreview";
import { Address } from "@/types/address";

export const columns: ColumnConfig<ISO>[] = [
  {
    key: 'name',
    label: 'Name',
  },
  {
    key: 'email',
    label: 'Email',
  },
  {
    key: 'phone',
    label: 'Phone',
    render: formatPhone
  },
  {
    key: 'website',
    label: 'Website',
  },
  {
    key: 'business_detail',
    label: 'Business Detail',
    render: formatBusinessDetail,
  },

  {
    key: 'address_list',
    label: 'Address List',
    render: (value, row) => {
      if (!row?.address_list || !Array.isArray(row.address_list) || row.address_list.length === 0) {
        return '-';
      }
      return formatAddress(row.address_list[0] as Address);
    }
  },
    {
    key: 'primary_representative',
    label: 'Primary Representative',
    render: renderUser
  },

  {
    key: 'application_request_amount',
    label: 'Application Request Amount',
    render: formatCurrency
  },
  {
    key: 'pending_application_request_amount',
    label: 'Pending Application Request Amount',
    render: formatCurrency
  },
  {
    key: 'funding_amount',
    label: 'Funding Amount',
    render: formatCurrency
  },

  {
    key: 'active_funding_amount',
    label: 'Active Funding Amount',
    render: formatCurrency
  },

    {
    key: 'delayed_funding_amount',
    label: 'Delayed Funding Amount',
    render: formatCurrency
  },
  {
    key: 'slow_payback_funding_amount',
    label: 'Slow Payback Funding Amount',
    render: formatCurrency
  },
  {
    key: 'completed_funding_amount',
    label: 'Completed Funding Amount',
    render: formatCurrency
  },
  {
    key: 'default_funding_amount',
    label: 'Default Funding Amount',
    render: formatCurrency
  },
  {
    key: 'commission_count',
    label: 'Commission Count',
  },
  {
    key: 'pending_commission_count',
    label: 'Pending Commission Count',
  },
  {
    key: 'paid_commission_count',
    label: 'Paid Commission Count',
  },
  {
    key: 'cancelled_commission_count',
    label: 'Cancelled Commission Count',
  },
  {
    key: 'commission_amount',
    label: 'Commission Amount',
    render: formatCurrency
  },
  {
    key: 'pending_commission_amount',
    label: 'Pending Commission Amount',
    render: formatCurrency
  },
  {
    key: 'paid_commission_amount',
    label: 'Paid Commission Amount',
    render: formatCurrency
  },
  {
    key: 'cancelled_commission_amount',
    label: 'Cancelled Commission Amount',
    render: formatCurrency
  },
  {
    key: 'created_date',
    label: 'Created Date',
    render: formatTime
  },
  {
    key: 'updated_date',
    label: 'Updated Date',
    render: formatTime
  },
];