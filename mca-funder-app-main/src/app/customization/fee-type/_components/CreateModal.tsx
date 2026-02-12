'use client';

import { createFeeType, updateFeeType } from '@/lib/api/feeTypes';
import { FeeType, CreateFeeType, UpdateFeeType } from '@/types/feeType';
import { FeeTypeFormValues } from './FeeTypeDataProvider';
import { FeeTypeDataProvider } from './FeeTypeDataProvider';

interface CreateModalProps {
  feeType?: FeeType | null;
  onSuccess: (updatedFeeType?: FeeType) => void;
  onCancel: () => void;
}

const DEFAULT_INITIAL_VALUES: FeeTypeFormValues = {
  funder: '',
  name: '',
  formula: '',
  upfront: false,
  inactive: false,
  default: false,
};

export default function CreateModal({ feeType, onSuccess, onCancel }: CreateModalProps) {
  const mode = feeType ? 'update' : 'create';
  
  // Prepare initial values based on whether we're creating or updating
  const initialValues: FeeTypeFormValues = feeType ? {
    funder: typeof feeType.funder === 'string' ? feeType.funder : feeType.funder._id,
    name: feeType.name,
    formula: typeof feeType.formula === 'string' ? feeType.formula : (feeType.formula?._id || ''),
    upfront: feeType.upfront || false,
    inactive: feeType.inactive || false,
    default: feeType.default || false,
  } : DEFAULT_INITIAL_VALUES;

  const handleSubmit = async (values: FeeTypeFormValues) => {
    if (feeType) {
      // Update existing fee type
      const updateData: UpdateFeeType = {
        name: values.name,
        formula: values.formula || '',
        upfront: values.upfront,
        inactive: values.inactive,
        default: values.default,
      };
      
      const updatedFeeType = await updateFeeType(feeType._id, updateData);
      onSuccess(updatedFeeType);
    } else {
      // Create new fee type
      const createData: CreateFeeType = {
        funder: values.funder,
        name: values.name,
        formula: values.formula && values.formula.trim() ? values.formula : '',
        upfront: values.upfront,
        default: values.default,
      };
      
      await createFeeType(createData);
      onSuccess();
    }
  };

      return (
        <FeeTypeDataProvider
            onClose={onCancel}
            onSubmit={handleSubmit}
            mode={mode}
            initialValues={initialValues}
            title={feeType ? 'Edit Fee Type' : 'Create Fee Type'}
            subtitle={feeType ? 'Update the fee type details below.' : 'Please enter fee type details below.'}
            feeType={feeType}
        />
    );
} 