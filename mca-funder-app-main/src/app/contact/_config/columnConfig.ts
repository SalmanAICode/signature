import { ColumnConfig } from "@/components/GenericList/types";
import { Contact } from "@/types/contact";
import { formatPhone, formatDate } from "@/lib/utils/format";
import { renderStatusBadge } from "@/components/GenericList/utils";

export const columns: ColumnConfig<Contact>[] = [
  { key: "_id", label: "Contact ID", visible: false },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "phone_mobile", label: "Phone (Mobile)", render: (value) => formatPhone(value) },
  {
    key: "address",
    label: "Address",
    columns: [{
      key: "address.full",
      label: "Address",
      render: (value, row) => {
        if (!row || !row.address_detail) return "";
        const a = row.address_detail;
        const parts = [a.address_1, a.address_2, a.city, a.state, a.zip].filter(Boolean);
        return parts.join(", ");
      }
    }]
  },
  { key: "merchant_count", label: "Assigned Merchants", render: (value) => value ?? 0 },
  { key: "access_log_count", label: "Access Log Count", render: (value) => value ?? 0 },
  { 
    key: "online", 
    label: "Online Status", 
    columns: [{
      key: "online.status",
      label: "Online Status",
      render: (value) => renderStatusBadge(value ? "Offline": "Online")
    }]
  },
  {
    key: "inactive",
    label: "Status",
    columns: [{
      key: "inactive.status",
      label: "Status",
      render: (value) => renderStatusBadge(value ? "Inactive" : "Active")
    }]
  },
  { key: "last_login", label: "Last Login", render: (value) => value ? formatDate(value) : "N/A" },
]; 