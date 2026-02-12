import { ColumnConfig } from "@/components/GenericList/types";
import { Funder } from "@/types/funder";
import { formatPhone } from "@/lib/utils/format";

export const columns: ColumnConfig<Funder>[] = [
  { key: "name", label: "Funder Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone", render: (value) => formatPhone(value) },
  { key: "website", label: "Website", render: (value) => (value ? String(value) : '-') },
  {
    key: "incorporation_detail",
    label: "Incorporation Details",
    columns: [
      {
        key: "combined",
        label: "Incorporation Details",
        render: (value, row) => {
          const state = row?.business_detail?.state_of_incorporation;
          const date = row?.business_detail?.incorporation_date;
          if (!state && !date) return "-";
          let result = "";
          if (state) result += state;
          if (date) {
            const formattedDate = new Date(date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit"
            });
            result += ` (${formattedDate})`;
          }
          return result || "-";
        }
      }
    ]
  },
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
    key: "address",
    label: "Address",
    columns: [
      {
        key: "address.full",
        label: "Address",
        render: (value, row) => {
          const address = row?.address;
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
  { key: "user_count", label: "Users" },
  { key: "iso_count", label: "ISOs" },
  { key: "account_count", label: "Accounts" },
  { key: "application_count", label: "Applications" },
  { key: "available_balance", label: "Balance" },
  { key: "merchant_count", label: "Merchants" },
  { key: "syndicator_count", label: "Syndicators" },
  { key: "pending_application_count", label: "Pending Apps" },
  { key: "created_date", label: "Created Date", visible: false },
  { key: "updated_date", label: "Updated Date", visible: false },
  { key: "inactive", label: "Inactive", visible: false },
  { key: "actions", label: "Actions", visible: false }
]; 