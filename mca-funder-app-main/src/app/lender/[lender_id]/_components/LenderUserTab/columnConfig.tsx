import { formatPhone, formatDate } from '@/lib/utils/format';
import { User } from '@/types/user';
import { Column } from '@/components/SimpleList';

export interface LenderUserItem extends User {
  role_list: string[];
}

export const columns: Column<LenderUserItem>[] = [
  {
    key: 'first_name',
    label: 'First Name',
    sortable: true,
    render: (value: any, row: any) => (
      <div className="font-medium text-gray-900">
        {value} {row.last_name}
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
    key: 'phone_mobile',
    label: 'Phone',
    sortable: true,
    render: (value: any) => formatPhone(value)
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
    key: 'online',
    label: 'Online Status',
    sortable: true,
    render: (value: any) => (
      <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-sm ${
        value 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {value ? 'Online' : 'Offline'}
      </span>
    )
  },
  {
    key: 'role_list',
    label: 'Roles',
    sortable: false,
    render: (value: any) => {
      if (!value || value.length === 0) return '-';
      return (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 2).map((role: string, index: number) => (
            <span
              key={index}
              className="inline-flex px-2 py-1 text-xs font-semibold rounded-sm bg-blue-100 text-blue-800"
            >
              {role}
            </span>
          ))}
          {value.length > 2 && (
            <span className="text-xs text-gray-500">+{value.length - 2} more</span>
          )}
        </div>
      );
    }
  },
  {
    key: 'last_login',
    label: 'Last Login',
    sortable: true,
    render: (value: any) => value ? formatDate(value) : 'Never'
  },
  {
    key: 'createdAt',
    label: 'Created Date',
    sortable: true,
    render: (value: any) => formatDate(value)
  }
]; 