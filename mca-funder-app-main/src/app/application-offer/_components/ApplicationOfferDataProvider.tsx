'use client';

import { useState, useEffect } from 'react';
import FormModalLayout from '@/components/FormModalLayout';
import ApplicationOfferForm from './ApplicationOfferForm';
import { getFeeTypeList } from '@/lib/api/feeTypes';
import { getExpenseTypeList } from '@/lib/api/expenseTypes';
import { getUserList } from '@/lib/api/users';
import { getApplicationList } from '@/lib/api/applications';
import { getLenderList } from '@/lib/api/lenders';
import { FeeType } from '@/types/feeType';
import { ExpenseType } from '@/types/expenseType';
import { User } from '@/types/user';
import { Application } from '@/types/application';
import { Lender } from '@/types/lender';
import { ApplicationOfferFormValues } from './ApplicationOfferForm';
import useAuthStore from '@/lib/store/auth';

interface ApplicationOfferDataProviderProps {
    onClose: () => void;
    onSubmit: (values: ApplicationOfferFormValues) => void;
    application?: Application;
    mode: 'create' | 'update';
    initialValues: ApplicationOfferFormValues;
    title: string;
    subtitle: string;
    includeExpenseTypes?: boolean;
    offeredByUser?: User;
    lender?: Lender;
}

export function ApplicationOfferDataProvider({
    onClose,
    onSubmit,
    application,
    mode,
    initialValues,
    title,
    subtitle,
    includeExpenseTypes = true,
    offeredByUser,
    lender
}: ApplicationOfferDataProviderProps) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
    const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [lenders, setLenders] = useState<Lender[]>([]);
    const [loadingLists, setLoadingLists] = useState({
        applications: false,
        feeTypes: false,
        expenseTypes: false,
        users: false,
        lenders: false
    });
    const [loadingApplication, setLoadingApplication] = useState(false);

    // Get current funder and user from auth store
    const { funder, user } = useAuthStore();
    const currentFunderId = funder?._id;
    const currentUser = user;

    // Set selected application when prop changes and handle single application case
    useEffect(() => {
        if (application) {
            setLoadingApplication(true);
            setSelectedApplication(application);
            // If a specific application is provided, set it as the only application in the list
            setApplications([application]);
            setLoadingApplication(false);
        }
    }, [application]);

    // Prefetch fee types, expense types, users, and applications when funder is available
    useEffect(() => {
        if (!currentFunderId) return;

        const fetchRelatedData = async () => {
            setLoadingLists(prev => ({
                ...prev,
                applications: !application, // Only fetch applications if no specific application is provided
                feeTypes: true,
                expenseTypes: includeExpenseTypes,
                users: mode === 'create', // Only fetch users in create mode
                lenders: mode === 'create' // Only fetch lenders in create mode
            }));

            try {
                // Always fetch fee types
                const feeTypesData = await getFeeTypeList({
                    include_inactive: false,
                    funder: currentFunderId
                });

                setFeeTypes(feeTypesData);

                // Only fetch lenders in create mode
                if (mode === 'create') {
                    try {
                        const lendersData = await getLenderList();
                        setLenders(lendersData);
                    } catch (err) {
                        console.error('Error fetching lenders:', err);
                        setError('Failed to fetch lenders');
                    }
                } else if (mode === 'update' && lender) {
                    // In update mode, include the lender in the lenders array for display
                    setLenders([lender]);
                }

                // Only fetch users in create mode
                if (mode === 'create') {
                    try {
                        const usersData = await getUserList({
                            funder: currentFunderId
                        });
                        setUsers(usersData);
                    } catch (err) {
                        console.error('Error fetching users:', err);
                        setError('Failed to fetch users');
                    }
                } else if (mode === 'update' && offeredByUser) {
                    // In update mode, include the offeredByUser in the users array for display
                    setUsers([offeredByUser]);
                }

                // Conditionally fetch expense types
                if (includeExpenseTypes) {
                    try {
                        const expenseTypesData = await getExpenseTypeList({
                            include_inactive: false,
                            funder: currentFunderId
                        });
                        setExpenseTypes(expenseTypesData);
                    } catch (err) {
                        console.error('Error fetching expense types:', err);
                        setError('Failed to fetch expense types');
                    }
                }

                // Only fetch applications if no specific application is provided (CreateModal case)
                if (!application) {
                    try {
                        const applicationsData = await getApplicationList({ include_inactive: false });
                        setApplications(applicationsData);
                    } catch (err) {
                        console.error('Error fetching applications:', err);
                        setError('Failed to fetch applications');
                    }
                }
            } catch (err) {
                console.error('Error fetching fee types and users:', err);
                setError('Failed to fetch fee types and users');
            } finally {
                setLoadingLists(prev => ({
                    ...prev,
                    applications: false,
                    feeTypes: false,
                    expenseTypes: false,
                    users: false,
                    lenders: false
                }));
            }
        };

        fetchRelatedData();
    }, [currentFunderId, includeExpenseTypes, application, mode, offeredByUser, lender]);

    // Handle form submission
    const handleSubmit = async (values: ApplicationOfferFormValues) => {
        setLoading(true);
        try {
            await onSubmit(values);
            onClose();
            setError('');
        } catch (err: any) {
            setError(err.message || `Failed to ${mode} application offer`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormModalLayout
            title={title}
            subtitle={subtitle}
            onCancel={onClose}
            maxWidth={850}
        >
            {!currentUser ? (
                <div className="flex justify-center items-center py-8">
                    <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                        </svg>
                        <span className="text-gray-600">Loading user data...</span>
                    </div>
                </div>
            ) : (
                <ApplicationOfferForm
                    key={currentUser._id}
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setError('');
                        onClose();
                    }}
                    error={error}
                    loading={loading || loadingLists.applications || loadingLists.feeTypes || loadingLists.expenseTypes || loadingLists.users || loadingLists.lenders || loadingApplication}
                    mode={mode}
                    applications={applications}
                    feeTypes={feeTypes}
                    expenseTypes={expenseTypes}
                    users={users}
                    lenders={lenders}
                    setSelectedApplication={setSelectedApplication}
                    lockApplication={!!application}
                    selectedApplication={selectedApplication}
                    currentUser={currentUser}
                    currentLender={lender}
                />
            )}
        </FormModalLayout>
    );
} 