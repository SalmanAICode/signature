'use client';

import React from 'react';
import { StipulationType, UpdateStipulationType } from '@/types/stipulationType';
import { StipulationTypeDataProvider, StipulationTypeFormValues } from './StipulationTypeDataProvider';
import { updateStipulationType } from '@/lib/api/stipulationTypes';

interface UpdateModalProps {
  stipulationType: StipulationType;
  onClose: () => void;
  onSuccess: (updatedStipulationType: StipulationType) => void;
}

export default function UpdateModal({ stipulationType, onClose, onSuccess }: UpdateModalProps) {
  const handleSubmit = async (values: StipulationTypeFormValues) => {
    try {
      const updateData: UpdateStipulationType = {
        name: values.name,
        required: values.required,
        inactive: values.inactive,
      };
      
      const updatedStipulationType = await updateStipulationType(stipulationType._id, updateData);
      onSuccess(updatedStipulationType);
    } catch (error) {
      throw error;
    }
  };

  const initialValues: StipulationTypeFormValues = {
    funder: stipulationType.funder._id,
    name: stipulationType.name,
    required: stipulationType.required || false,
    inactive: stipulationType.inactive || false,
  };

  return (
    <StipulationTypeDataProvider
      onClose={onClose}
      onSubmit={handleSubmit}
      mode="update"
      initialValues={initialValues}
      title="Update Stipulation Type"
      subtitle="Edit the stipulation type details."
      stipulationType={stipulationType}
    />
  );
} 