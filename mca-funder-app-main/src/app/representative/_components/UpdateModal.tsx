'use client';

import { useState } from 'react';
import FormModalLayout from '@/components/FormModalLayout';
import { updateRepresentative } from '@/lib/api/representatives';
import { Representative } from '@/types/representative';
import RepresentativeForm from './RepresentativeForm';

interface UpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    representative: Representative;
}

export function UpdateModal({ isOpen, onClose, onSuccess, representative }: UpdateModalProps) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: any) => {
        setLoading(true);
        setError('');

        try {
            const updateParams = {
                first_name: values.first_name,
                last_name: values.last_name,
                email: values.email,
                phone_mobile: values.phone_mobile,
                phone_work: values.phone_work,
                title: values.title,
                birthday: values.birthday,
                address_detail: values.address_detail,
                type: values.type,
                inactive: values.inactive,
                iso_list: values.iso_list
            };

            await updateRepresentative(representative._id, updateParams);
            onSuccess(`Representative "${representative.first_name} ${representative.last_name}" has been successfully updated`);
        } catch (err: any) {
            console.error('Error updating representative:', err);
            setError(err.message || 'Failed to update representative');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // console.log(representative);


    const formInitialValues = {
        first_name: representative.first_name || '',
        last_name: representative.last_name || '',
        email: representative.email || '',
        phone_mobile: representative.phone_mobile || '',
        phone_work: representative.phone_work || '',
        title: representative.title || '',
        birthday: representative.birthday ? representative.birthday.split('T')[0] : '', // Convert to YYYY-MM-DD format
        address_detail: {
            address_1: representative.address_detail?.address_1 || '',
            address_2: representative.address_detail?.address_2 || '',
            city: representative.address_detail?.city || '',
            state: representative.address_detail?.state || '',
            zip: representative.address_detail?.zip || '',
        },
        type: representative.type || 'iso_manager',
        inactive: Boolean(representative.inactive),
        iso_list: Array.isArray(representative.iso_list) ? representative.iso_list : []
    };

    // console.log(formInitialValues);

    return (
        <FormModalLayout
            title="Update Representative"
            subtitle="Update representative details below."
            onCancel={onClose}
            maxWidth={700}
        >
            <RepresentativeForm
                initialValues={formInitialValues}
                onSubmit={handleSubmit}
                onCancel={onClose}
                error={error}
                isLoading={loading}
                mode="update"
            />
        </FormModalLayout>
    );
} 