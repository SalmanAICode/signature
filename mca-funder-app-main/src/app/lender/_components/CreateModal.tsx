'use client';

import { Lender } from '@/types/lender';
import LenderForm from './LenderForm';

interface CreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (lender: Lender) => void;
}

export function CreateModal({ isOpen, onClose, onSuccess }: CreateModalProps) {
    if (!isOpen) return null;

    return (
        <LenderForm
            onCancel={onClose}
            onSuccess={(lender) => {
                onSuccess(lender);
            }}
        />
    );
} 