import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { getFunderList } from '@/lib/api/funders';
import { getMerchantList } from '@/lib/api/merchants';
import { getISOList } from '@/lib/api/isos';
import { getISOFunders } from '@/lib/api/isoFunders';
import { getUserList } from '@/lib/api/users';
import { Funder } from '@/types/funder';
import { ISO } from '@/types/iso';
import { User } from '@/types/user';

// Funding types and status enums
const FUNDING_TYPES = [
  { value: 'NEW', label: 'New' },
  { value: 'RENEWAL', label: 'Renewal' },
  { value: 'REFINANCE', label: 'Refinance' },
  { value: 'OTHER', label: 'Other' },
];
const FUNDING_STATUS = [
  { value: 'CREATED', label: 'Created' },
  { value: 'DISBURSED', label: 'Disbursed' },
  { value: 'BEFORE_FIRST_PAYBACK', label: 'Before First Payback' },
  { value: 'ONTIME', label: 'Ontime' },
  { value: 'DELAYED', label: 'Delayed' },
  { value: 'SLOW_PAYBACK', label: 'Slow Payback' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DEFAULT', label: 'Default' },
];

// Validation schema for update
const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  type: Yup.string().required('Type is required'),
  status: Yup.string().required('Status is required'),
  internal: Yup.boolean(),
  position: Yup.number().nullable(),
  inactive: Yup.boolean(),
});

export interface FundingUpdateFormValues {
  name: string;
  type: string;
  status: string;
  internal: boolean;
  position?: number;
  inactive: boolean;
  assigned_manager?: string;
  assigned_user?: string;
}

interface FundingUpdateFormProps {
  initialValues: FundingUpdateFormValues;
  onSubmit: (values: FundingUpdateFormValues) => Promise<void>;
  onCancel: () => void;
  error?: string;
  loading?: boolean;
}

export default function FundingUpdateForm({
  initialValues,
  onSubmit,
  onCancel,
  error,
  loading,
}: FundingUpdateFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const usersData = await getUserList({
          include_inactive: false
        });
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const inputClasses = clsx('w-full px-3 py-2 border rounded-lg focus:outline-none text-sm');
  const labelClasses = clsx('block text-xs font-medium text-gray-700');
  const errorClasses = clsx('text-red-500 text-xs');

  // Common select styles
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: '34px',
      backgroundColor: 'white',
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999
    })
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ setFieldValue }) => (
        <Form className="space-y-6">
          {/* Hidden fields for assigned manager and assigned user */}
          <Field type="hidden" name="assigned_manager" />
          <Field type="hidden" name="assigned_user" />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className={labelClasses}>Name</label>
              <Field id="name" name="name" className={inputClasses} placeholder="Funding Name" />
              <ErrorMessage name="name" component="div" className={errorClasses} />
            </div>
            <div>
              <label htmlFor="type" className={labelClasses}>Type</label>
              <Select
                name="type"
                options={FUNDING_TYPES}
                value={FUNDING_TYPES.find(type => type.value === initialValues.type)}
                onChange={(selected) => setFieldValue('type', selected?.value || '')}
                className="text-sm"
                classNamePrefix="select"
                placeholder="Select type..."
                styles={selectStyles}
                menuPortalTarget={document.body}
              />
              <ErrorMessage name="type" component="div" className={errorClasses} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className={labelClasses}>Status</label>
              <Select
                name="status"
                options={FUNDING_STATUS}
                value={FUNDING_STATUS.find(status => status.value === initialValues.status)}
                onChange={(selected) => setFieldValue('status', selected?.value || '')}
                className="text-sm"
                classNamePrefix="select"
                placeholder="Select status..."
                styles={selectStyles}
                menuPortalTarget={document.body}
              />
              <ErrorMessage name="status" component="div" className={errorClasses} />
            </div>
            <div>
              <label htmlFor="position" className={labelClasses}>Position</label>
              <Field id="position" name="position" type="number" className={inputClasses} placeholder="Position (optional)" />
              <ErrorMessage name="position" component="div" className={errorClasses} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="assigned_manager" className={labelClasses}>Assigned Manager</label>
              <Select
                name="assigned_manager"
                options={users.map(user => ({
                  value: user._id,
                  label: `${user.first_name} ${user.last_name}`
                }))}
                value={initialValues.assigned_manager ? {
                  value: initialValues.assigned_manager,
                  label: users.find(u => u._id === initialValues.assigned_manager)
                    ? `${users.find(u => u._id === initialValues.assigned_manager)?.first_name} ${users.find(u => u._id === initialValues.assigned_manager)?.last_name}`
                    : ''
                } : null}
                onChange={(selected) => setFieldValue('assigned_manager', selected?.value || '')}
                className="text-sm"
                classNamePrefix="select"
                placeholder="Select manager..."
                isSearchable
                isLoading={loadingUsers}
                styles={selectStyles}
                menuPortalTarget={document.body}
              />
            </div>
            <div>
              <label htmlFor="assigned_user" className={labelClasses}>Assigned User</label>
              <Select
                name="assigned_user"
                options={users.map(user => ({
                  value: user._id,
                  label: `${user.first_name} ${user.last_name}`
                }))}
                value={initialValues.assigned_user ? {
                  value: initialValues.assigned_user,
                  label: users.find(u => u._id === initialValues.assigned_user)
                    ? `${users.find(u => u._id === initialValues.assigned_user)?.first_name} ${users.find(u => u._id === initialValues.assigned_user)?.last_name}`
                    : ''
                } : null}
                onChange={(selected) => setFieldValue('assigned_user', selected?.value || '')}
                className="text-sm"
                classNamePrefix="select"
                placeholder="Select user..."
                isSearchable
                isLoading={loadingUsers}
                styles={selectStyles}
                menuPortalTarget={document.body}
              />
            </div>
          </div>

          <div className="flex gap-4 items-center mt-6">
            <Field type="checkbox" name="internal" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <label htmlFor="internal" className="block text-sm text-gray-900">Internal</label>
            <Field type="checkbox" name="inactive" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ml-6" />
            <label htmlFor="inactive" className="block text-sm text-gray-900">Inactive</label>
          </div>

          {error && (
            <div className={clsx(errorClasses, 'text-sm text-center')}>{error}</div>
          )}

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <button
              type="submit"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-1 sm:text-sm"
              disabled={loading}
            >
              Update Funding
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