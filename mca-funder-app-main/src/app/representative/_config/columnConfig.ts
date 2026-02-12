// Define the columns for the Representative table
import { ColumnConfig } from "@/components/GenericList/types";
import { formatTime, formatPhone } from "@/lib/utils/format";
import { renderStatusBadge } from "@/components/StatusBadge";
import { Representative } from "@/types/representative";

export const columns: ColumnConfig<Representative>[] = [
  { key: "_id", label: "Representative ID" },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "phone_mobile", label: "Mobile Phone", render: formatPhone },
  { key: "phone_work", label: "Work Phone", render: formatPhone },
  { key: "title", label: "Title" },
  { key: "type", label: "Type" },
  {
    key: "address_detail", 
    label: "Address",
    columns: [
      { key: "address_1", label: "Address 1" },
      { key: "address_2", label: "Address 2" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "zip", label: "ZIP" },
    ],
  },
  { key: "birthday", label: "Birthday", render: formatTime },
  { key: "online", label: "Online", render: renderStatusBadge },
  { key: "iso_count", label: "ISO Count" },
  { key: "access_log_count", label: "Access Logs" },
  { key: "last_login", label: "Last Login", render: formatTime },
  { key: "created_date", label: "Created Date", render: formatTime },
  { key: "updated_date", label: "Updated Date", render: formatTime },
  { key: "inactive", label: "Inactive", render: renderStatusBadge },
]; 