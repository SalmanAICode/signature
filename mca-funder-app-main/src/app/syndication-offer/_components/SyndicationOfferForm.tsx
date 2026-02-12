import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';
import { useEffect, useState } from 'react';
import { getFundingList } from '@/lib/api/fundings';
import { getSyndicatorList } from '@/lib/api/syndicators';
import { syndicationOfferStatusList } from '@/types/syndicationOffer';

import { Funding } from '@/types/funding';
import { Syndicator } from '@/types/syndicator';
import clsx from 'clsx';
import { Funder } from '@/types/funder';

// Validation schema
const validationSchema = Yup.object().shape({
    funding: Yup.string().required('Funding is required'),
    syndicator: Yup.string().required('Syndicator is required'),
    participate_amount: Yup.number().required('Participate amount is required').min(0, 'Amount must be positive'),
    management_percent: Yup.number().required('Management percent is required').min(0, 'Percent must be positive').max(100, 'Percent cannot exceed 100'),
    commission_amount: Yup.number().required('Commission amount is required').min(0, 'Amount must be positive'),
    offered_date: Yup.date().required('Offered data is required'),
    expired_date: Yup.string().nullable(),
    status: Yup.string().required('Status is required'),
    inactive: Yup.boolean(),
});

interface SyndicationOfferFormProps {
    initialValues?: {
        funding?: string;
        syndicator?: string;
        participate_amount?: number | string;
        management_percent?: number | string;
        commission_amount?: number | string;
        offered_date?: string;
        expired_date?: string;
        status?: string;
        inactive?: boolean;
        // For update mode, include the names
        funding_name?: string;
        syndicator_name?: string;
    };
    onSubmit: (values: any) => Promise<void>;
    onCancel: () => void;
    error?: string;
    loading?: boolean;
    mode: 'create' | 'update';
}

const defaultInitialValues = {
    funding: '',
    syndicator: '',
    participate_amount: '',
    management_percent: '',
    commission_amount: '',
    offered_date: '',
    expired_date: '',
    status: '',
    inactive: false,
};

export default function SyndicationOfferForm({
    initialValues = defaultInitialValues,
    onSubmit,
    onCancel,
    error,
    loading,
    mode,
}: SyndicationOfferFormProps) {
    const [fundingList, setFundingList] = useState<Funding[]>([]);
    const [syndicatorList, setSyndicatorList] = useState<Syndicator[]>([]);
    const [loadingFundings, setLoadingFundings] = useState(false);
    const [loadingSyndicators, setLoadingSyndicators] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (mode === 'create') {
                // Fetch fundings
                setLoadingFundings(true);
                try {
                    const response = await getFundingList();
                    setFundingList(response.data);
                } catch (err) {
                    console.error('Error fetching funding list:', err);
                } finally {
                    setLoadingFundings(false);
                }

                // Fetch syndicators
                setLoadingSyndicators(true);
                try {
                    const syndicators = await getSyndicatorList();
                    setSyndicatorList(syndicators);
                } catch (err) {
                    console.error('Error fetching syndicator list:', err);
                } finally {
                    setLoadingSyndicators(false);
                }

            }
        };

        fetchData();
    }, [mode]);

    // Reusable className patterns
    const inputClasses = clsx(
        'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
    );
    const labelClasses = clsx('block text-sm font-medium text-gray-700 mb-2');
    const errorClasses = clsx('text-red-500 text-xs mt-1');

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
        >
            {({ values, setFieldValue, setFieldTouched, errors, touched }) => (
                <Form className="space-y-6">

                    {error && (
                        <div className={clsx(errorClasses, 'text-sm text-center bg-red-50 border border-red-200 p-4 rounded-lg')}>
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClasses}>
                                Funding <span className="text-red-500">*</span>
                            </label>
                            {mode === 'update' ? (
                                <Field
                                    name="funding"
                                    className={clsx(inputClasses, 'bg-gray-100 cursor-not-allowed')}
                                    value={initialValues.funding_name || 'No funding name'}
                                    readOnly
                                    disabled
                                />
                            ) : (
                                <Select
                                    name="funding"
                                    options={fundingList.map(funding => ({
                                        value: funding._id,
                                        label: funding.name,
                                        // label: `${funding.name} - $${funding.funded_amount.toLocaleString()}`,
                                    }))}
                                    onChange={(selected) => {
                                        setFieldValue('funding', selected?.value || '');
                                    }}
                                    value={values.funding ? {
                                        value: values.funding,
                                        label: fundingList.find(f => f._id === values.funding)?.name || ''
                                    } : null}
                                    className="text-sm"
                                    classNamePrefix="select"
                                    placeholder={loadingFundings ? 'Loading fundings...' : 'Select funding...'}
                                    isSearchable
                                    isLoading={loadingFundings}
                                    isDisabled={loadingFundings}
                                    styles={{
                                        menuPortal: (base) => ({
                                            ...base,
                                            zIndex: 99999
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            zIndex: 99999
                                        })
                                    }}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                            )}
                            <ErrorMessage name="funding" component="div" className={errorClasses} />
                        </div>

                        <div>
                            <label className={labelClasses}>
                                Syndicator <span className="text-red-500">*</span>
                            </label>
                            {mode === 'update' ? (
                                <Field
                                    name="syndicator"
                                    className={clsx(inputClasses, 'bg-gray-100 cursor-not-allowed')}
                                    value={initialValues.syndicator_name || 'No syndicator name'}
                                    readOnly
                                    disabled
                                />
                            ) : (
                                <Select
                                    name="syndicator"
                                    options={syndicatorList.map(syndicator => ({
                                        value: syndicator._id,
                                        label: syndicator.name || `${syndicator.first_name} ${syndicator.last_name}`,
                                    }))}
                                    onChange={(selected) => {
                                        setFieldValue('syndicator', selected?.value || '');
                                    }}
                                    value={values.syndicator ? {
                                        value: values.syndicator,
                                        label: (() => {
                                            const syndicator = syndicatorList.find(s => s._id === values.syndicator);
                                            return syndicator ? (syndicator.name || `${syndicator.first_name} ${syndicator.last_name}`) : '';
                                        })()
                                    } : null}
                                    className="text-sm"
                                    classNamePrefix="select"
                                    placeholder={loadingSyndicators ? 'Loading syndicators...' : 'Select syndicator ...'}
                                    isSearchable
                                    isLoading={loadingSyndicators}
                                    isDisabled={loadingSyndicators}
                                    styles={{
                                        menuPortal: (base) => ({
                                            ...base,
                                            zIndex: 99999
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            zIndex: 99999
                                        })
                                    }}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                            )}
                            <ErrorMessage name="syndicator" component="div" className={errorClasses} />
                        </div>

                        <div>
                            <label htmlFor="participate_amount" className={labelClasses}>
                                Participate Amount <span className="text-red-500">*</span>
                            </label>
                            <Field
                                id="participate_amount"
                                name="participate_amount"
                                type="number"
                                min="0"
                                step="0.01"
                                className={inputClasses}
                                placeholder="0.00"
                            />
                            <ErrorMessage name="participate_amount" component="div" className={errorClasses} />
                        </div>

                        <div>
                            <label htmlFor="commission_amount" className={labelClasses}>
                                Commission Amount <span className="text-red-500">*</span>
                            </label>
                            <Field
                                id="commission_amount"
                                name="commission_amount"
                                type="number"
                                min="0"
                                step="0.01"
                                className={inputClasses}
                                placeholder="0.00"
                            />
                            <ErrorMessage name="commission_amount" component="div" className={errorClasses} />
                        </div>

                        <div>
                            <label htmlFor="management_percent" className={labelClasses}>
                                Management Percent <span className="text-red-500">*</span>
                            </label>
                            <Field
                                id="management_percent"
                                name="management_percent"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className={inputClasses}
                                placeholder="0.00"
                            />
                            <ErrorMessage name="management_percent" component="div" className={errorClasses} />
                        </div>

                        <div>
                            <label htmlFor="offered_date" className={labelClasses}>
                                Offered Date <span className="text-red-500">*</span>
                            </label>
                            <Field
                                id="offered_date"
                                name="offered_date"
                                type="date"
                                className={inputClasses}
                                placeholder="YYYY-MM-DD"
                            />
                            <ErrorMessage name="offered_date" component="div" className="text-red-500 text-xs mt-1" />
                        </div>

                        <div>
                            <label htmlFor="expired_date" className={labelClasses}>
                                Expired Date
                            </label>
                            <Field
                                id="expired_date"
                                name="expired_date"
                                type="date"
                                className={inputClasses}
                                placeholder="YYYY-MM-DD"
                            />
                        </div>

                        <div>
                            <label htmlFor="status" className={labelClasses}>
                                Status <span className="text-red-500">*</span>
                            </label>
                            <Select
                                name="status"
                                options={syndicationOfferStatusList.map(status => ({
                                    value: status,
                                    label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
                                }))}
                                onChange={(selected) => {
                                    setFieldValue('status', selected?.value || '');
                                }}
                                onBlur={() => {
                                    setFieldTouched('status', true);
                                }}
                                value={values.status ? {
                                    value: values.status,
                                    label: values.status.charAt(0).toUpperCase() + values.status.slice(1).toLowerCase()
                                } : null}
                                className="text-sm"
                                classNamePrefix="select"
                                placeholder="Select status..."
                                isSearchable
                                isLoading={loading}
                                isDisabled={loading}
                                styles={{
                                    menuPortal: (base) => ({
                                        ...base,
                                        zIndex: 99999
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        zIndex: 99999
                                    })
                                }}
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                            />
                            <ErrorMessage name="status" component="div" className={errorClasses} />
                        </div>

                        {mode === 'update' && (
                            <div>
                                <label className={labelClasses}>
                                    Inactive
                                </label>
                                <div className="flex items-center">
                                    <Field
                                        type="checkbox"
                                        name="inactive"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">
                                        Mark as inactive
                                    </span>
                                </div>
                                <ErrorMessage name="inactive" component="div" className={errorClasses} />
                            </div>
                        )}
                    </div>



                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : mode === 'create' ? 'Create Syndication Offer' : 'Update Syndication Offer'}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
} 