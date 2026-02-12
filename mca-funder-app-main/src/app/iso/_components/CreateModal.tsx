'use client';

import { useState } from 'react';
import FormModalLayout from '@/components/FormModalLayout';
import ISOForm from './ISOForm';

interface CreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (isoData: any) => Promise<{ success: boolean; error?: string }>;
}

export function CreateModal({ isOpen, onClose, onCreate }: CreateModalProps) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: any) => {
        setLoading(true);
        setError('');

        try {
            const result = await onCreate(values);
            if (result.success) {
                onClose();
            } else {
                setError(result.error || 'Failed to create ISO');
            }
        } catch (err: any) {
            console.error('Error creating ISO:', err);
            setError(err.message || 'Failed to create ISO');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <FormModalLayout
            title="Create ISO"
            subtitle="Please enter ISO details below."
            onCancel={onClose}
            maxWidth={700}
        >
            <ISOForm
                onSubmit={handleSubmit}
                onCancel={onClose}
                error={error}
                loading={loading}
                showBusinessDetails={true}
                mode="create"
            />
        </FormModalLayout>
    );
}
