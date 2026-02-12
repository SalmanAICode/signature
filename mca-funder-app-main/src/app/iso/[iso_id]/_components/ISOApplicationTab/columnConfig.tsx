import { renderStatusBadge } from "@/components/GenericList";
import { formatTime, formatCurrency } from "@/lib/utils/format";
import { Application } from "@/types/application";

// Use the SimpleList Column interface
interface Column<T> {
  key: string;
  label: string;
  render?: ((value: any) => React.ReactNode) | ((onUpdate: (item: T) => void, item: T) => React.ReactNode);
  sortable?: boolean;
}

export const columnConfig: Column<Application>[] = [
  {
    key: 'name',
    label: 'Application Name',
    sortable: true
  },
  {
    key: 'request_amount',
    label: 'Request Amount',
    render: formatCurrency,
    sortable: true
  },
  {
    key: 'status',
    label: 'Status',
    render: (value: any) => {
      return value?.name ? renderStatusBadge(value.name) : '-';
    },
    sortable: true
  },
  {
    key: 'status_date',
    label: 'Status At',
    render: formatTime,
    sortable: true
  },
  {
    key: 'createdAt',
    label: 'Created At',
    render: formatTime,
    sortable: true
  },
  {
    key: 'updatedAt',
    label: 'Updated At',
    render: formatTime,
    sortable: true
  },
]; 