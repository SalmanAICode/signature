import { formatPhone, formatDate, formatCurrency } from '@/lib/utils/format';
import { Funder } from '@/types/funder';
import { Column } from '@/components/SimpleList';
import { renderStatusBadge } from '@/components/StatusBadge';

export interface UserFunderItem extends Funder {
  role_list: string[];
}

export const columns: Column<UserFunderItem>[] = [
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
        renderStatusBadge(value? 'Inactive' : 'Active')
    )
  },
  {
    key: 'available_balance',
    label: 'Available Balance',
    sortable: true,
    render: (value: any) => formatCurrency(value || 0)
  },
//   {
//     key: 'role_list',
//     label: 'Roles',
//     sortable: false,
//     render: (value: any) => {
//       if (!value || value.length === 0) return '-';
//       return (
//         <div className="flex flex-wrap gap-1">
//           {value.slice(0, 2).map((role: string, index: number) => (
//             <span
//               key={index}
//               className="inline-flex px-2 py-1 text-xs font-semibold rounded-sm bg-blue-100 text-blue-800"
//             >
//               {role}
//             </span>
//           ))}
//           {value.length > 2 && (
//             <span className="text-xs text-gray-500">+{value.length - 2} more</span>
//           )}
//         </div>
//       );
//     }
//   },
  {
    key: 'created_date',
    label: 'Created Date',
    sortable: true,
    render  : (value: any) => {
      if (!value) return '-';
      return formatDate(value);
    }
  }
]; 