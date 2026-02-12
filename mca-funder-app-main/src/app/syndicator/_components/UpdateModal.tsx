'use client';

import React from 'react';
import { Syndicator } from '@/types/syndicator';
import SyndicatorUpdateForm from './SyndicatorUpdateForm';

// New UpdateModal component following application pattern
interface UpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (values: any) => Promise<{ success: boolean; error?: string }>;
    data: Syndicator;
}

export function UpdateModal({ isOpen, onClose, onUpdate, data }: UpdateModalProps) {
    if (!isOpen) return null;

    return (
        <SyndicatorUpdateForm
            onCancel={onClose}
            onUpdate={onUpdate}
            onError={() => {}} // Empty callback since toast is handled in parent
            data={data}
        />
    );
}

export default UpdateModal;
