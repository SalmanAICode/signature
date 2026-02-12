'use client';

import { useState } from 'react';
import FormModalLayout from '@/components/FormModalLayout';
import { updateISO } from '@/lib/api/isos';
import { normalizePhoneInput } from '@/lib/utils/format';
import ISOForm from './ISOForm';
import { ISO } from '@/types/iso';

interface UpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    iso: ISO;
    onUpdate?: (isoId: string, updateData: any) => Promise<{ success: boolean; error?: string }>;
}

export function UpdateModal({ isOpen, onClose, onSuccess, iso, onUpdate }: UpdateModalProps) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: any) => {
        console.log('Update handler called with values:', values);
        setLoading(true);
        setError('');

        try {
            // Extract system fields that shouldn't be in the update payload
            const { 
                _id, 
                id,
                __v,
                account_count,
                funder_count,
                merchant_count,
                representative_count,
                created_date,
                updated_date,
                ...isoWithoutSystemFields 
            } = iso;
            
            // Preserve required fields and update editable fields
            const updatedISO = {
                ...isoWithoutSystemFields,
                name: values.name,
                email: values.email,
                phone: normalizePhoneInput(values.phone),
                website: values.website,
                address_list: values.address_list,
                // Only update primary_representative if a value is selected
                ...(values.primary_representative_id && {
                    primary_representative: values.primary_representative_id
                })
            };

            if (onUpdate) {
                // Use the passed onUpdate handler
                const result = await onUpdate(_id, updatedISO);
                if (result.success) {
                    console.log('Update successful');
                    onSuccess();
                    onClose();
                } else {
                    setError(result.error || 'Failed to update ISO');
                }
            } else {
                // Fallback to direct API call
                console.log('Calling updateISO with:', updatedISO);
                await updateISO({ ...updatedISO, id: _id });
                console.log('Update successful');
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            console.error('Error updating ISO:', err);
            setError(err.message || 'Failed to update ISO');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Extract initial values for the form
    const formInitialValues = {
        name: iso.name,
        email: iso.email,
        phone: iso.phone,
        website: iso.website,
        address_list: iso.address_list,
        primary_representative_id: iso.primary_representative?._id
    };

    return (
        <FormModalLayout
            title="Update ISO"
            subtitle="Update ISO details below."
            onCancel={onClose}
            maxWidth={700}
        >
            <ISOForm
                initialValues={formInitialValues}
                onSubmit={handleSubmit}
                onCancel={onClose}
                error={error}
                loading={loading}
                showBusinessDetails={true}
                mode="update"
                isoId={iso._id}
            />
        </FormModalLayout>
    );
} 