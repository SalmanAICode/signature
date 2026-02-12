import { ColumnConfig } from "@/components/GenericList/types";
import { User } from "@/types/user";
import { formatPhone, formatDate, formatAddress } from "@/lib/utils/format";
import { renderStatusBadge } from "@/components/GenericList/utils";

export const columns: ColumnConfig<User>[] = [
  { key: "_id", label: "User ID", visible: false },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "phone_mobile", label: "Mobile Phone", render: formatPhone },
  {key: "phone_work", label: "Work Phone", render:formatPhone, visible: false},
  {key: "phone_home", label: "Home Phone", render:formatPhone, visible: false},
  {key: "birthday", label: "Birthday", render: formatDate, visible: false},
  // {key: "address_detail", label: "Address", render: formatAddress},
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
  {
    key: "type",
    label: "Type",
    render: (value) => {
      if (value === "funder_user") return "User";
      if (value === "funder_manager") return "Manager";
      return value;
    }
  },

  {key: "online", label: "Online Status", render: (value) => renderStatusBadge(value ? "Online": "Offline" )},
  {key: "inactive", label: "Status", render: (value) => renderStatusBadge(value ? "Inactive" : "Active"), visible: false},
  { key: "last_login", label: "Last Login", render: formatDate, visible: false },




  {key: "permission_list", label: "Permissions", visible: false},



  // virtual fields
  {key: "funder_count", label: "Assigned Funders"},
  {key: "access_log_count", label: "Access Log Count", visible: false},

  // system fields
  {key: "updatedAt", label: "Updated At", render:formatDate, visible: false},
  {key: "createdAt", label: "Created At", render:formatDate},
  // {key: "__v", label: "Version", visible: false},

]; 