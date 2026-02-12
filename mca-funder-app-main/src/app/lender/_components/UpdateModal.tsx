'use client';

import { useState } from 'react';
import { Lender } from '@/types/lender';
import LenderForm from './LenderForm';

interface UpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (values: Partial<Lender>) => Promise<{ success: boolean; error?: string }>;
    lender: Lender;
}

export function UpdateModal({ isOpen, onClose, onUpdate, lender }: UpdateModalProps) {
    const [error, setError] = useState('');

    const handleSubmit = async (updatedLender: Lender) => {
        const result = await onUpdate(updatedLender);
        if (result.success) {
            onClose();
        } else {
            setError(result.error || 'Failed to update lender');
        }
    };

    if (!isOpen) return null;

    return (
        <LenderForm
            initialData={lender}
            onCancel={onClose}
            onSuccess={handleSubmit}
            onUpdateSuccess={onClose}
        />
    );
} 