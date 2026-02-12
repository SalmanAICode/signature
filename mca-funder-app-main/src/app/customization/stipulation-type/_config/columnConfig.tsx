import { ColumnConfig } from "@/components/GenericList/types";
import { StipulationType } from "@/types/stipulationType";
import { formatDate } from "@/lib/utils/format";
import { CheckIcon } from "@heroicons/react/24/solid";

export const columns: ColumnConfig<StipulationType>[] = [
  {
    key: 'name',
    label: 'Name',
    render: (value: string) => (
      <span className="font-medium text-gray-900">{value}</span>
    ),
  },
  {
    key: 'required',
    label: 'Required',
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