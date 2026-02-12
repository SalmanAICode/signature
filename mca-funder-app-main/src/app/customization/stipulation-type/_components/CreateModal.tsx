'use client';

import React from 'react';
import { StipulationTypeDataProvider, StipulationTypeFormValues } from './StipulationTypeDataProvider';
import { createStipulationType } from '@/lib/api/stipulationTypes';
import { CreateStipulationType } from '@/types/stipulationType';
import useAuthStore from '@/lib/store/auth';

interface CreateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateModal({ onClose, onSuccess }: CreateModalProps) {
  const { funder } = useAuthStore();

  const handleSubmit = async (values: StipulationTypeFormValues) => {
    try {
      const createData: CreateStipulationType = {
        funder: values.funder,
        name: values.name,
        required: values.required || false,
      };
      
      await createStipulationType(createData);
      onSuccess();
    } catch (error) {
      throw error;
    }
  };

  const initialValues: StipulationTypeFormValues = {
    funder: funder?._id || '',
    name: '',
    required: false,
    inactive: false,
  };

  return (
    <StipulationTypeDataProvider
      onClose={onClose}
      onSubmit={handleSubmit}
      mode="create"
      initialValues={initialValues}
      title="Create Stipulation Type"
      subtitle="Add a new stipulation type for tracking application requirements."
    />
  );
} 