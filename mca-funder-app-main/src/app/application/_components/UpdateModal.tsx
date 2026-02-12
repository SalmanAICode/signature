'use client';

import { useState, useEffect } from 'react';
import FormModalLayout from '@/components/FormModalLayout';
import { Application } from '@/types/application';
import { User } from '@/types/user';
import { getUserList } from '@/lib/api/users';
import { toast } from 'react-hot-toast';
import ApplicationUpdateForm, { ApplicationUpdateFormValues } from './ApplicationUpdateForm';

interface UpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (values: ApplicationUpdateFormValues) => Promise<{ success: boolean; error?: string }>;
    application: Application;
}

export function UpdateModal({ isOpen, onClose, onUpdate, application }: UpdateModalProps) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [loadingLists, setLoadingLists] = useState({
        users: false,
    });

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                // Fetch users
                try {
                    setLoadingLists(prev => ({ ...prev, users: true }));
                    const usersData = await getUserList({
                        funder: application.funder?.id,
                    });
                    setUsers(usersData);
                } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Error fetching users');
                } finally {
                    setLoadingLists(prev => ({ ...prev, users: false }));
                }
            };

            fetchData();
        }
    }, [isOpen, application.funder?.id]);

    const handleSubmit = async (values: ApplicationUpdateFormValues) => {
        setLoading(true);
        setError('');

        const result = await onUpdate(values);
        if (result.success) {
            onClose();
        } else {
            setError(result.error || 'Failed to update application');
        }
        
        setLoading(false);
    };

    if (!isOpen) return null;

    const formInitialValues: ApplicationUpdateFormValues = {
        _id: application._id,
        name: application.name || '',
        type: application.type || 'NEW',
        request_amount: application.request_amount || 0,
        funder: application.funder?.name || '',
        funder_id: application.funder?.id || '',
        merchant: application.merchant?.name || '',
        contact: application.contact
        ? `${application.contact.first_name || ''} ${application.contact.last_name || ''}`.trim()
        : '-',
        iso: application.iso?.name || '',
        representative: application.representative
        ? `${application.representative.first_name || ''} ${application.representative.last_name || ''}`.trim()
        : '-',
        assigned_user: application.assigned_user?.id || '',
        assigned_manager: application.assigned_manager?.id || '',
        priority: Boolean(application.priority),
        internal: Boolean(application.internal),
    };

    return (
        <FormModalLayout
            title="Update Application"
            subtitle="Update application details below."
            onCancel={onClose}
            maxWidth={700}
            error={error}
        >
            <ApplicationUpdateForm
                initialValues={formInitialValues}
                onSubmit={handleSubmit}
                onCancel={onClose}
                loading={loading}
                disableRequestAmount={true}
                users={users}
                loadingLists={loadingLists}
            />
        </FormModalLayout>
    );
} 