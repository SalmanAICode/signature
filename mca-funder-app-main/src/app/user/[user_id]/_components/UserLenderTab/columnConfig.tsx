import { formatPhone, formatDate } from '@/lib/utils/format';
import { formatCurrency } from '@/components/GenericList/utils';
import { Lender } from '@/types/lender';
import { Column } from '@/components/SimpleList';

export const columns: Column<Lender>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (value: any) => (
      <div className="font-medium text-gray-900">
        {value}
      </div>
    )
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    render: (value: any) => (
      <a 
        href={`mailto:${value}`}
        className="text-blue-600 hover:text-blue-800 hover:underline"
      >
        {value}
      </a>
    )
  },
  {
    key: 'phone',
    label: 'Phone',
    sortable: true,
    render: (value: any) => formatPhone(value)
  },
  {
    key: 'website',
    label: 'Website',
    sortable: true,
    render: (value: any) => {
      if (!value) return '-';
      return (
        <a 
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {value}
        </a>
      );
    }
  },
  {
    key: 'inactive',
    label: 'Status',
    sortable: true,
    render: (value: any) => (
      <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-sm ${
        value 
          ? 'bg-red-100 text-red-800' 
          : 'bg-green-100 text-green-800'
      }`}>
        {value ? 'Inactive' : 'Active'}
      </span>
    )
  },
  {
    key: 'available_balance',
    label: 'Available Balance',
    sortable: true,
    render: (value: any) => formatCurrency(value || 0)
  },
  {
    key: 'createdAt',
    label: 'Created Date',
    sortable: true,
    render: formatDate
  }
]; 