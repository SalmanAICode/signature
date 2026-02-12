'use client';

import { CreateModal } from '../../application-offer/_components/CreateModal';
import { Application } from '@/types/application';

interface CreateOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    application: Application;
}

export function CreateOfferModal({ isOpen, onClose, onSuccess, application }: CreateOfferModalProps) {
    if (!isOpen) return null;

    return (
        <CreateModal
            onClose={onClose}
            onSuccess={onSuccess}
            application={application}
        />
    );
} 