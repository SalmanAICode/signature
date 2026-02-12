import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';
import { User } from '@/types/user';
import clsx from 'clsx';
import { applicationTypeList as APPLICATION_TYPES } from '@/types/application';

// Validation schema for update
const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    type: Yup.string().required('Type is required'),
    assigned_user: Yup.string().required('Assigned user is required'),
    assigned_manager: Yup.string().required('Assigned manager is required'),
    priority: Yup.boolean().required('Priority is required'),
    internal: Yup.boolean(),
});

interface ApplicationUpdateFormProps {
    initialValues: ApplicationUpdateFormValues;
    onSubmit: (values: ApplicationUpdateFormValues) => void;
    onCancel: () => void;
    error?: string;
    loading?: boolean;
    disableRequestAmount?: boolean;
    users: User[];
    loadingLists: {
        users: boolean;
    };
}

export type ApplicationUpdateFormValues = {
    _id: string;
    name: string;
    type: string;
    request_amount: number;
    merchant: string;
    funder: string;
    iso: string;
    contact: string;
    representative: string;
    assigned_user: string;
    assigned_manager: string;
    priority: boolean;
    internal: boolean;
    funder_id: string;
};

export default function ApplicationUpdateForm({
    initialValues,
    onSubmit,
    onCancel,
    error,
    loading,
    disableRequestAmount,
    users,
    loadingLists,
}: ApplicationUpdateFormProps) {
    // Reusable className patterns
    const inputClasses = clsx(
        'w-full px-3 py-2 border rounded-lg focus:outline-none text-sm'
    );
    const labelClasses = clsx('block text-xs font-medium text-gray-700');
    const errorClasses = clsx('text-red-500 text-xs');

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            enableReinitialize
        >
            {({ values, setFieldValue }) => (
                <Form className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className={labelClasses}>
                                Name
                            </label>
                            <Field
                                id="name"
                                name="name"
                                className={inputClasses}
                                placeholder="Application Name"
                            />
                            <ErrorMessage name="name" component="div" className={errorClasses} />
                        </div>

                        <div>
                            <label htmlFor="type" className={labelClasses}>
                                Type
                            </label>
                            <Select
                                name="type"
                                options={APPLICATION_TYPES.map(type => ({
                                    value: type,
                                    label: type,
                                }))}
                                onChange={(selected) => {
                                    setFieldValue('type', selected?.value || '');
                                }}
                                value={values.type ? {
                                    value: values.type,
                                    label: values.type
                                } : null}
                                className="text-sm"
                                classNamePrefix="select"
                                placeholder="Select type..."
                                isSearchable
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
                            <ErrorMessage name="type" component="div" className={errorClasses} />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="request_amount" className={labelClasses}>
                            Request Amount
                        </label>
                        <Field
                            id="request_amount"
                            name="request_amount"
                            type="number"
                            className={clsx(inputClasses, disableRequestAmount && 'bg-gray-100 cursor-not-allowed')}
                            placeholder="0.00"
                            disabled={disableRequestAmount}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Merchant</label>
                            <div className="px-3 py-2 bg-gray-100 border rounded-lg text-gray-700 text-sm">
                                {values.merchant}
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Contact</label>
                            <div className="px-3 py-2 bg-gray-100 border rounded-lg text-gray-700 text-sm">
                                {values.contact}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>ISO</label>
                            <div className="px-3 py-2 bg-gray-100 border rounded-lg text-gray-700 text-sm">
                                {values.iso || '-'}
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Representative</label>
                            <div className="px-3 py-2 bg-gray-100 border rounded-lg text-gray-700 text-sm">
                                {values.representative || '-'}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Funder</label>
                            <div className="px-3 py-2 bg-gray-100 border rounded-lg text-gray-700 text-sm">
                                {values.funder}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                    <div>
                            <label className={labelClasses}>Assigned Manager</label>
                            <Select
                                name="assigned_manager"
                                options={users.map(u => ({
                                    value: u._id || u.id,
                                    label: `${u.first_name} ${u.last_name}`,
                                }))}
                                onChange={(selected) => {
                                    setFieldValue('assigned_manager', selected?.value || '');
                                }}
                                value={values.assigned_manager ? {
                                    value: values.assigned_manager,
                                    label: users.find(u => (u._id === values.assigned_manager))
                                        ? `${users.find(u => (u._id === values.assigned_manager))?.first_name} ${users.find(u => (u._id === values.assigned_manager))?.last_name}`
                                        : ''
                                } : null}
                                className="text-sm"
                                classNamePrefix="select"
                                placeholder="Select user..."
                                isSearchable
                                isClearable
                                isLoading={loadingLists.users}
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
                            <ErrorMessage name="assigned_manager" component="div" className={errorClasses} />
                        </div>

                        <div>
                            <label className={labelClasses}>Assigned User</label>
                            <Select
                                name="assigned_user"
                                options={users.map(u => ({
                                    value: u._id || u.id,
                                    label: `${u.first_name} ${u.last_name}`,
                                }))}
                                onChange={(selected) => {
                                    setFieldValue('assigned_user', selected?.value || '');
                                }}
                                value={values.assigned_user ? {
                                    value: values.assigned_user,
                                    label: users.find(u => (u._id === values.assigned_user))
                                        ? `${users.find(u => (u._id === values.assigned_user))?.first_name} ${users.find(u => (u._id === values.assigned_user))?.last_name}`
                                        : ''
                                } : null}
                                className="text-sm"
                                classNamePrefix="select"
                                placeholder="Select user..."
                                isSearchable
                                isClearable
                                isLoading={loadingLists.users}
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
                            <ErrorMessage name="assigned_user" component="div" className={errorClasses} />
                        </div>
                    </div>

                    {/* Status Checkboxes */}
                    <div className="space-y-3">
                        <div className="flex gap-6">
                            <div className="flex items-center">
                                <Field
                                    type="checkbox"
                                    name="priority"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="priority" className="ml-2 block text-sm text-gray-900">
                                    High Priority
                                </label>
                            </div>

                            <div className="flex items-center">
                                <Field
                                    type="checkbox"
                                    name="internal"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="internal" className="ml-2 block text-sm text-gray-900">
                                    Internal
                                </label>
                            </div>
                        </div>
                    </div>


                    {error && (
                        <div className={clsx(errorClasses, 'text-sm text-center')}>
                            {error}
                        </div>
                    )}

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-1 sm:text-sm"
                            disabled={loading}
                        >
                            Update Application
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-2 sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
} 