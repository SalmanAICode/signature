import { renderStatusBadge } from "@/components/GenericList";
import { formatTime, formatPhone } from "@/lib/utils/format";
import { Representative } from "@/types/representative";

// Use the SimpleList Column interface
interface Column<T> {
  key: string;
  label: string;
  render?: ((value: any) => React.ReactNode) | ((onUpdate: (item: T) => void, item: T) => React.ReactNode);
  sortable?: boolean;
}

export const columnConfig: Column<Representative>[] = [
  {
    key: 'first_name',
    label: 'First Name',
    sortable: true
  },
  {
    key: 'last_name',
    label: 'Last Name',
    sortable: true
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true
  },
  {
    key: 'phone_mobile',
    label: 'Mobile Phone',
    render: formatPhone,
    sortable: true
  },
  {
    key: 'type',
    label: 'Type',
    render: (value: any) => {
      return value ? renderStatusBadge(value) : '-';
    },
    sortable: true
  },
  {
    key: 'inactive',
    label: 'Status',
    render: (value: any) => {
      return value ? renderStatusBadge('Inactive') : renderStatusBadge('Active');
    },
    sortable: true
  },
  {
    key: 'created_date',
    label: 'Created Date',
    render: formatTime,
    sortable: true
  },
  {
    key: 'updated_date',
    label: 'Updated Date',
    render: formatTime,
    sortable: true
  },
]; 