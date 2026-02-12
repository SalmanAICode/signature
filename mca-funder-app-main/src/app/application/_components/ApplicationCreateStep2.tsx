import { useEffect, useState } from 'react';
import { Field, ErrorMessage } from 'formik';
import Select from 'react-select';
import { applicationTypeList } from '@/types/application';
import { FunderMerchant } from '@/types/merchantFunder';
import { User } from '@/types/user';
import { ApplicationStatus } from '@/types/applicationStatus';
import { formatCurrencyNoDecimals, formatDateShort } from '@/lib/utils/format';

interface ApplicationCreateStep2Props {
  values: {
    funder: string;
    name: string;
    type: string;
    request_amount: number;
    assigned_user: string;
    assigned_manager: string;
    priority: boolean;
    internal: boolean;
    status?: string;
    request_date: string;
    newMerchantName: string;
  };
  funderMerchant: FunderMerchant | null;
  users: User[];
  statusList: ApplicationStatus[];
  setFieldValue: (field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

const inputClasses = 'w-full px-3 py-2 border rounded-lg focus:outline-none text-sm';
const labelClasses = 'block text-xs font-medium text-gray-700';
const errorClasses = 'text-red-500 text-xs';

export default function ApplicationCreateStep2({
  values,
  setFieldValue,
  onNext,
  onBack,
  loading,
  funderMerchant,
  users,
  statusList,
}: ApplicationCreateStep2Props) {
  const setDefaultName = () => {
    const merchantName = funderMerchant?.merchant?.name?.trim() || values.newMerchantName || 'Unknown Merchant';

    const dateStr = formatDateShort(values.request_date);
  
    const amount = values.request_amount || 0;
    const formattedAmount = formatCurrencyNoDecimals(amount);
  
    const defaultName = `${merchantName} | ${dateStr} | ${formattedAmount}`;
    setFieldValue('name', defaultName);
  };

  useEffect(() => {

    if (values.name === '') {
      setDefaultName();
    }

    if (funderMerchant) {
      // console.log('funderMerchant', funderMerchant);
      const initialAssignedUser = users.find(user => user._id === funderMerchant?.assigned_user?._id);
      setFieldValue('assigned_user', initialAssignedUser?._id || '');
      
      const initialAssignedManager = users.find(user => user._id === funderMerchant?.assigned_manager?._id);
      // If no assigned manager, use assigned user as default assigned manager
      const managerToSet = initialAssignedManager?._id || initialAssignedUser?._id || '';
      setFieldValue('assigned_manager', managerToSet);
    }

    if (statusList.length > 0 && values.status === '') {
      const initialStatus = statusList.find(status => status.initial === true);
      setFieldValue('status', initialStatus?._id || '');
    }
  }, []);

  // Update name when request amount or date changes
  useEffect(() => {
    setDefaultName();
  }, [values.request_amount, values.request_date]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={labelClasses}>
            Name *
          </label>
          <Field
            id="name"
            name="name"
            className={inputClasses}
            placeholder="Application Name"
          />
          <button
            type="button"
            onClick={setDefaultName}
            className="mt-1 text-xs text-blue-600 hover:underline"
          >
            Use default name
          </button>
          <ErrorMessage name="name" component="div" className={errorClasses} />
        </div>

        <div>
          <label htmlFor="type" className={labelClasses}>
            Type *
          </label>
          <Select
            name="type"
            options={applicationTypeList.map(type => ({
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
            isClearable
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="request_amount" className={labelClasses}>
            Request Amount *
          </label>
          <Field
            id="request_amount"
            name="request_amount"
            type="number"
            className={inputClasses}
            placeholder="0.00"
          />
          <ErrorMessage name="request_amount" component="div" className={errorClasses} />
        </div>

        <div>
          <label htmlFor="request_date" className={labelClasses}>
            Request Date *
          </label>
          <Field
            id="request_date"
            name="request_date"
            type="date"
            className={inputClasses}
          />
          <ErrorMessage name="request_date" component="div" className={errorClasses} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Assigned User *</label>
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
            isLoading={loading}
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
            isLoading={loading}
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
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className={labelClasses}>
            Status *
          </label>
          <Select
            name="status"
            options={statusList.map(status => ({
              value: status._id,
              label: status.name,
            }))}
            onChange={(selected) => {
              setFieldValue('status', selected?.value || '');
            }}
            value={values.status ? {
              value: values.status,
              label: statusList.find(s => s._id === values.status)?.name || ''
            } : null}
            className="text-sm"
            classNamePrefix="select"
            placeholder="Select status..."
            isSearchable
            isClearable
            isLoading={loading}
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
        <div className="flex gap-2 justify-evenly">
          <div className="flex items-center">
            <Field
              type="checkbox"
              name="priority"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="priority" className="ml-2 block text-sm text-gray-900">
              Priority
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




      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <button
          type="button"
          onClick={onNext}
          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-1 sm:text-sm"
          disabled={loading}
        >
          Create Application
        </button>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-2 sm:text-sm"
          disabled={loading}
        >
          Back
        </button>
      </div>
    </div >
  );
} 