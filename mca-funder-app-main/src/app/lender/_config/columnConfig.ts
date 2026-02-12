import { ColumnConfig } from "@/components/GenericList/types";
import { Lender } from "@/types/lender";
import { formatCurrency, formatPhone } from "@/lib/utils/format";
import { renderStatusBadge } from '@/components/StatusBadge';

export const columns: ColumnConfig<Lender>[] = [
  { key: "funder", label: "Funder ID", visible: false },
  { key: "name", label: "Lender Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone", render: (value) => formatPhone(value) },
  { key: "type", label: "Type", render:renderStatusBadge },
  { key: "website", label: "Website", render: (value) => (value ? String(value) : '-') },
  {
    key: "business_detail",
    label: "Business Info",
    columns: [
      {
        key: "business_detail.combined",
        label: "Business Info",
        render: (value, row) => {
          const entityType = row?.business_detail?.entity_type;
          const ein = row?.business_detail?.ein;
          if (!entityType && !ein) return "-";
          if (entityType && ein) return `${entityType} - ${ein}`;
          return entityType || ein || "-";
        }
      }
    ]
  },
  {
    key: "address_detail",
    label: "Address",
    columns: [
      {
        key: "address_detail.full",
        label: "Address",
        render: (value, row) => {
          const address = row?.address_detail;
          if (!address) return "-";
          const parts = [];
          if (address.address_1) parts.push(address.address_1);
          if (address.address_2) parts.push(address.address_2);
          if (address.city) parts.push(address.city);
          if (address.state) parts.push(address.state);
          if (address.zip) parts.push(address.zip);
          return parts.length > 0 ? parts.join(", ") : "-";
        }
      }
    ]
  },

  { key: "inactive", label: "Inactive", visible: false },


   // virtual fields

  { key: "application_offer_count", label: "Application Offer Count", visible: false },
  { key: "funding_count", label: "Funding Count", visible: false },
  { key: "user_count", label: "Users", visible: false },
  { key: "account_count", label: "Accounts", visible: false },
  { key: "available_balance", label: "Total Available Balance", render: formatCurrency },


  // system fields

  { key: "createdAt", label: "Created Date", visible: false },
  { key: "updatedAt", label: "Updated Date", visible: false },

  { key: "_id", label: "Lender ID", visible: false }
]; 