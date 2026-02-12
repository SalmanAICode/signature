import { ColumnConfig } from "@/components/GenericList/types";
import { renderUser } from "@/components/UserPreview";
import { Merchant } from "@/types/merchant";
import { Contact } from "lucide-react";

export const columns: ColumnConfig<Merchant>[] = [
  { key: "name", label: "Merchant Name" },
  { key: "dba_name", label: "DBA Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  {
    key: "website",
    label: "Website",
  },
  {
    key: "business_detail",
    label: "EIN - Entity Type",
    render: (_: any, row?: Merchant) =>
      row?.business_detail
        ? `${row.business_detail.ein} - ${row.business_detail.entity_type}`
        : "-",
  },
  {
    key: "address_list",
    label: "Address",
    render: (_: any, row?: Merchant) => {
      const addr = row?.address_list?.[0];
      if (!addr) return "";
      return `${addr.address_1}${addr.address_2 ? ", " + addr.address_2 : ""}, ${addr.city}, ${addr.state} ${addr.zip}`;
    },
  },
  { key: "application_count", label: "Application Count" },
  { key: "funding_count", label: "Funding Count" },
  {
    key: "inactive",
    label: "Status",
    render: (value: boolean) => (value ? "Inactive" : "Active"),
  },

 {
  key: "_id",
  label: "ID",
  visible: false,
 },
 
  // System fields


  {
    key: "sic_detail",
    label: "SIC Detail",
    render: (value: any, row?: Merchant) => 
      row?.sic_detail && `${row?.sic_detail?.code} - ${row?.sic_detail?.description}` || "-",
    visible: false,
  },

  {
    key: "naics_detail",
    label: "NAICS Detail",
    render: (value: any, row?: Merchant) => 
      row?.naics_detail && `${row?.naics_detail?.code} - ${row?.naics_detail?.title} - ${row?.naics_detail?.description}` || "-",
    visible: false,
  },


  {
    key: "primary_contact",
    label: "Primary Contact",
    render: renderUser,
    visible: false,
  },

  {
    key: "primary_owner",
    label: "Primary Owner",
    render: renderUser,
    visible: false,
  },

  {
    key: "inactive",
    label: "Status",
    render: (value: boolean) => value ? "Inactive" : "Active",
    visible: false,
  },

  // virtual fields
  {
    key: "contact_count",
    label: "Contact Count",
    visible: false,
  },
  {
    key: "funder_count",
    label: "Funder Count",
    visible: false,
  },
  {
    key: "iso_count",
    label: "ISO Count",
    visible: false,
  },
  {
    key: "account_count",
    label: "Account Count",
    visible: false,
  },
  {
    key: "application_count",
    label: "Application Count",
    visible: false,
  },
  {
    key: "pending_application_count",
    label: "Pending Application Count",
    visible: false,
  },
  {
    key: "funding_count",
    label: "Funding Count",
    visible: false,
  },
  {
    key: "active_funding_count",
    label: "Active Funding Count",
    visible: false,
  },
  {
    key: "application_request_amount",
    label: "Application Request Amount",
    visible: false,
  },
  {
    key: "pending_application_request_amount",
    label: "Pending Application Request Amount",
    visible: false,
  },
  {
    key: "funding_amount",
    label: "Funding Amount",
    visible: false,
  },
  {
    key: "active_funding_amount",
    label: "Active Funding Amount",
    visible: false,
  },
  {
    key: "delayed_funding_amount",
    label: "Delayed Funding Amount",
    visible: false,
  },
  {
    key: "slow_payback_funding_amount",
    label: "Slow Payback Funding Amount",
    visible: false,
  },
  {
    key: "completed_funding_amount",
    label: "Completed Funding Amount",
    visible: false,
  },
  {
    key: "default_funding_amount",
    label: "Default Funding Amount",
    visible: false,
  },


  // System fields
  {
    key: "__v",
    label: "Version",
    visible: false,
  },
  {
    key: "createdAt",
    label: "Created At",
    visible: false,
  },
  {
    key: "updatedAt",
    label: "Updated At",
    visible: false,
  },
]; 