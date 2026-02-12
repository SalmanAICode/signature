import { ColumnConfig } from "@/components/GenericList/types";
import { formatCurrency, formatTime, renderStatusBadge } from "@/components/GenericList/utils";
import { User } from "@/types/user"; 

export const columns: ColumnConfig<User>[] = [
    { key: "_id", label: "User ID" },
    {
        key: "profile",
        label: "Profile",
        columns: [
            { key: "first_name", label: "First Name" },
            { key: "last_name", label: "Last Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone", visible: false },
            { key: "address", label: "Address", visible: false },
        ],
    },
    {
        key: "account",
        label: "Account",
        columns: [
            { key: "username", label: "Username" },
            { key: "role", label: "Role", render: renderStatusBadge },
            { key: "status", label: "Status", render: renderStatusBadge },
            { key: "last_login", label: "Last Login", render: formatTime, visible: false },
        ],
    },
    { key: "created_at", label: "Created At", render: formatTime },
    { key: "updated_at", label: "Updated At", render: formatTime, visible: false },
    { key: "is_active", label: "Active", render: renderStatusBadge },
]; 