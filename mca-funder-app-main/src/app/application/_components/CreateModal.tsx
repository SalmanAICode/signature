'use client';

import { Application } from '@/types/application';
import ApplicationCreateForm from './ApplicationCreateForm';
import useAuthStore from '@/lib/store/auth';

interface CreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (application: Application) => void;
}

export function CreateModal({ isOpen, onClose, onSuccess }: CreateModalProps) {
    const funder = useAuthStore(state => state.funder);

    if (!isOpen || !funder) {
        return null;
    }

    return (
        <ApplicationCreateForm
            onCancel={onClose}
            onSuccess={(application) => {
                onSuccess(application);
            }}
            funder={funder}   
        />
    );
}
