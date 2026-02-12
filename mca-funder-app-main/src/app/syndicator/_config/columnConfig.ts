// Define the columns for the Syndicator table
import { ColumnConfig } from "@/components/GenericList/types";
import { Syndicator } from "@/types/syndicator";
import { formatTime, formatPhone, renderStatusBadge } from "@/components/GenericList/utils";

export const columns: ColumnConfig<Syndicator>[] = [
  { key: "_id", label: "Syndicator ID" },
  { key: "name", label: "Name" },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "phone_mobile", label: "Mobile Phone", render: formatPhone },
  { key: "phone_work", label: "Work Phone", render: formatPhone },
  { 
    key: "address_detail", 
    label: "Address",
    columns: [
      { key: "street_address", label: "Street Address" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "zip_code", label: "Zip Code" },
    ],
  },
  { key: "birthday", label: "Birthday", render: formatTime },
  { key: "dln_issue_date", label: "DLN Issue Date", render: formatTime },
  { key: "dln_issue_state", label: "DLN Issue State" },
  { 
    key: "business_detail", 
    label: "Business Details",
    columns: [
      { key: "business_name", label: "Business Name" },
      { key: "business_type", label: "Business Type" },
      { key: "tax_id", label: "Tax ID" },
    ],
  },
  { key: "active_syndication_count", label: "Active Syndications" },
  { key: "syndication_count", label: "Total Syndications" },
  { key: "pending_syndication_offer_count", label: "Pending Offers" },
  { key: "syndication_offer_count", label: "Total Offers" },
  { key: "inactive", label: "Status", render: (value: boolean) => renderStatusBadge(value ? 'Inactive' : 'Active') },
  { key: "created_date", label: "Created Date", render: formatTime },
  { key: "updated_date", label: "Updated Date", render: formatTime },
];