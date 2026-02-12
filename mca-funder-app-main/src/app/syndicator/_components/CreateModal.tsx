'use client';

import React from 'react';
import { Syndicator } from '@/types/syndicator';
import SyndicatorCreateForm from './SyndicatorCreateForm';

// New CreateModal component following application pattern
interface CreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (syndicator: Syndicator) => void;
    onError: (error: string) => void;
}

export function CreateModal({ isOpen, onClose, onSuccess, onError }: CreateModalProps) {
    if (!isOpen) return null;

    return (
        <SyndicatorCreateForm
            onCancel={onClose}
            onSuccess={(syndicator: Syndicator) => {
                onSuccess(syndicator);
            }}
            onError={onError}
        />
    );
}

// Keep old export for compatibility
export function SyndicatorCreateModalContent({ modalData }: { modalData: any }) {
    return (
        <CreateModal
            isOpen={true}
            onClose={modalData.onClose || (() => {})}
            onSuccess={modalData.onSuccess || (() => {})}
            onError={modalData.onError || (() => {})}
        />
    );
}

export default CreateModal;