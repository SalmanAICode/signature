import { ColumnConfig } from "@/components/GenericList/types";
import { Formula } from "@/types/formula";
import { formatDate } from "@/lib/utils/format";
import { CheckIcon } from "@heroicons/react/24/solid";

export const columns: ColumnConfig<Formula>[] = [
  {
    key: 'name',
    label: 'Name',
    render: (value: string) => (
      <span className="font-medium text-gray-900">{value}</span>
    ),
  },
  {
    key: 'calculate_type',
    label: 'Calculate Type',
    render: (value: string) => (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
        value === 'AMOUNT' 
          ? 'bg-blue-100 text-blue-800' 
          : 'bg-green-100 text-green-800'
      }`}>
        {value}
      </span>
    ),
  },
  {
    key: 'base_item',
    label: 'Base Item',
    render: (value: string | null) => {
      if (!value) return null;
      
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value === 'FUND' 
            ? 'bg-purple-100 text-purple-800' 
            : value === 'PAYBACK'
            ? 'bg-orange-100 text-orange-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      );
    },
  },
  {
    key: 'tier_type',
    label: 'Tier Type',
    render: (value: string | null) => {
      if (!value) return null;
      
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value === 'FACTOR_RATE' 
            ? 'bg-indigo-100 text-indigo-800' 
            : value === 'FUND'
            ? 'bg-purple-100 text-purple-800'
            : value === 'PAYBACK'
            ? 'bg-orange-100 text-orange-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      );
    },
  },
  {
    key: 'shared',
    label: 'Shared',
    render: (value: boolean) => {
      if (!value) return null;
      
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
          <CheckIcon className="w-4 h-4 text-green-600" />
        </span>
      );
    },
  },
  {
    key: 'createdAt',
    label: 'Created Date',
    visible: false,
    render: formatDate,
  },
  {
    key: 'updatedAt',
    label: 'Updated Date',
    visible: false,
    render: formatDate,
  },
]; 