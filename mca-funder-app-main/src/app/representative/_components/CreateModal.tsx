'use client';

import { useState } from 'react';
import FormModalLayout from '@/components/FormModalLayout';
import { createRepresentative } from '@/lib/api/representatives';
import RepresentativeForm from './RepresentativeForm';

type CreateRepresentativeFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_mobile?: string;
  phone_work?: string;
  title?: string;
  birthday?: string;
  address_detail?: {
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  type?: string;
  iso_list?: string[];
};

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function CreateModal({ isOpen, onClose, onSuccess }: CreateModalProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError('');

    try {
      const representativeData = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password,
        phone_mobile: values.phone_mobile,
        phone_work: values.phone_work,
        title: values.title,
        birthday: values.birthday,
        address_detail: values.address_detail,
        type: values.type,
        iso_list: values.iso_list
      };

      await createRepresentative(representativeData);
      onSuccess('Representative created successfully');
      onClose();
    } catch (err: any) {
      console.error('Error creating representative:', err);
      setError(err.message || 'Failed to create representative');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <FormModalLayout
      title="Create Representative"
      subtitle="Please enter representative details below."
      onCancel={onClose}
      maxWidth={700}
    >
      <RepresentativeForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        isLoading={loading}
        mode="create"
        error={error}
      />
    </FormModalLayout>
  );
} 