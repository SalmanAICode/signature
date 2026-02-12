import { ColumnConfig } from "@/components/GenericList/types";
import { FeeType } from "@/types/feeType";
import { formatDate } from "@/lib/utils/format";
import { CheckIcon } from "@heroicons/react/24/solid";

export const columns: ColumnConfig<FeeType>[] = [
  {
    key: 'name',
    label: 'Name'
  },
  {
    key: 'formula',
    label: 'Formula',
    render: (value: any, row?: FeeType) => {
      // Get formula object from row as it's more reliable
      let formulaObj = null;
      
      if (row && row.formula) {
        formulaObj = row.formula;
      } else if (value) {
        // Handle case where value might be a JSON string
        if (typeof value === 'string') {
          try {
            formulaObj = JSON.parse(value);
          } catch (e) {
            formulaObj = null;
          }
        } else if (typeof value === 'object') {
          formulaObj = value;
        }
      }
      
      const hasFormula = formulaObj && formulaObj.name;
      
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          hasFormula
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {hasFormula ? formulaObj.name : 'None'}
        </span>
      );
    },
  },
  {
    key: 'upfront',
    label: 'Upfront',
    render: (value: boolean | undefined) => {
      if (!value) return null;
      
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
          <CheckIcon className="w-4 h-4 text-green-600" />
        </span>
      );
    }
  },
  {
    key: 'default',
    label: 'Default',
    render: (value: boolean | undefined) => {
      if (!value) return null;
      
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
          <CheckIcon className="w-4 h-4 text-green-600" />
        </span>
      );
    }
  },
  {
    key: 'createdAt',
    label: 'Created Date',
    visible: false,
    render: formatDate
  },
  {
    key: 'updatedAt',
    label: 'Updated Date',
    visible: false,
    render: formatDate
  }
]; 