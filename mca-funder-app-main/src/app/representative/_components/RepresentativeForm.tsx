import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import clsx from 'clsx';
import Select from 'react-select';
import { getISOList } from '@/lib/api/isos';
import { ISO } from '@/types/iso';
import { RepresentativeType } from '@/types/representative';

type BaseRepresentativeFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone_mobile: string;
  phone_work: string;
  title: string;
  birthday: string;
  address_detail: {
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    zip: string;
  };
  type: RepresentativeType;
  inactive?: boolean;
  iso_list?: string[];
};

type CreateRepresentativeFormValues = BaseRepresentativeFormValues & {
  password: string;
};

type UpdateRepresentativeFormValues = BaseRepresentativeFormValues;

type RepresentativeFormValues = CreateRepresentativeFormValues | UpdateRepresentativeFormValues;

interface RepresentativeFormProps {
  initialValues?: Partial<RepresentativeFormValues>;
  onSubmit: (values: RepresentativeFormValues) => Promise<void> | void;
  onCancel: () => void;
  error?: string;
  isLoading?: boolean;
  mode?: 'create' | 'update';
}

const validationSchema = Yup.object({
  first_name: Yup.string().required('First name is required'),
  last_name: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email format').required('Email is required'),
  password: Yup.string().when('mode', {
    is: 'create',
    then: (schema) => schema.required('Password is required'),
    otherwise: (schema) => schema.optional(),
  }),
  phone_mobile: Yup.string().required('Mobile phone is required'),
  phone_work: Yup.string().required('Work phone is required'),
  title: Yup.string().required('Title is required'),
  birthday: Yup.string().required('Birthday is required'),
  type: Yup.string().required('Type is required'),
  inactive: Yup.boolean(),
  iso_list: Yup.array().of(Yup.string()),
  address_detail: Yup.object({
    address_1: Yup.string().required('Address 1 is required'),
    address_2: Yup.string().required('Address 2 is required'),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    zip: Yup.string().required('ZIP code is required'),
  }).required(),
});

const RepresentativeForm: React.FC<RepresentativeFormProps> = ({
  initialValues = {},
  onSubmit,
  onCancel,
  error,
  isLoading = false,
  mode = 'create',
}) => {
  const [isos, setISOs] = useState<ISO[]>([]);
  const [loadingISOs, setLoadingISOs] = useState(false);

  useEffect(() => {
    const fetchISOs = async () => {
      setLoadingISOs(true);
      try {
        const isosData = await getISOList();
        setISOs(isosData);
      } catch (error) {
        console.error('Error fetching ISOs:', error);
      } finally {
        setLoadingISOs(false);
      }
    };

    fetchISOs();
  }, []);

  const defaultValues: RepresentativeFormValues = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone_mobile: '',
    phone_work: '',
    title: '',
    birthday: '',
    address_detail: {
      address_1: '',
      address_2: '',
      city: '',
      state: '',
      zip: '',
    },
    type: 'iso_manager',
    inactive: false,
    iso_list: [],
    ...initialValues,
  };

  // Reusable className patterns
  const inputClasses = clsx(
    'w-full px-3 py-2 border rounded-lg focus:outline-none text-sm'
  );
  const labelClasses = clsx('block text-xs font-medium text-gray-700');
  const errorClasses = clsx('text-red-500 text-xs');

  return (
    <Formik
      initialValues={defaultValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ values, setFieldValue }) => (
        <Form className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label htmlFor="first_name" className={labelClasses}>
                First Name *
              </label>
              <Field
                name="first_name"
                type="text"
                className={inputClasses}
                placeholder="First Name"
              />
              <ErrorMessage name="first_name" component="div" className={errorClasses} />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="last_name" className={labelClasses}>
                Last Name *
              </label>
              <Field
                name="last_name"
                type="text"
                className={inputClasses}
                placeholder="Last Name"
              />
              <ErrorMessage name="last_name" component="div" className={errorClasses} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClasses}>
                Email *
              </label>
              <Field
                name="email"
                type="email"
                className={inputClasses}
                placeholder="Email Address"
              />
              <ErrorMessage name="email" component="div" className={errorClasses} />
            </div>

            {/* Password - Only show in create mode */}
            {mode === 'create' ? (
              <div>
                <label htmlFor="password" className={labelClasses}>
                  Password *
                </label>
                <Field
                  name="password"
                  type="password"
                  className={inputClasses}
                  placeholder="Password"
                />
                <ErrorMessage name="password" component="div" className={errorClasses} />
              </div>
            ) : (
              /* Title - Show in update mode when password is not shown */
              <div>
                <label htmlFor="title" className={labelClasses}>
                  Title *
                </label>
                <Field
                  name="title"
                  type="text"
                  className={inputClasses}
                  placeholder="Job Title"
                />
                <ErrorMessage name="title" component="div" className={errorClasses} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Mobile Phone */}
            <div>
              <label htmlFor="phone_mobile" className={labelClasses}>
                Mobile Phone *
              </label>
              <Field
                name="phone_mobile"
                type="tel"
                className={inputClasses}
                placeholder="Mobile Phone"
              />
              <ErrorMessage name="phone_mobile" component="div" className={errorClasses} />
            </div>

            {/* Work Phone */}
            <div>
              <label htmlFor="phone_work" className={labelClasses}>
                Work Phone *
              </label>
              <Field
                name="phone_work"
                type="tel"
                className={inputClasses}
                placeholder="Work Phone"
              />
              <ErrorMessage name="phone_work" component="div" className={errorClasses} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Title - Show in create mode */}
            {mode === 'create' && (
              <div>
                <label htmlFor="title" className={labelClasses}>
                  Title *
                </label>
                <Field
                  name="title"
                  type="text"
                  className={inputClasses}
                  placeholder="Job Title"
                />
                <ErrorMessage name="title" component="div" className={errorClasses} />
              </div>
            )}

            {/* Birthday */}
            <div>
              <label htmlFor="birthday" className={labelClasses}>
                Birthday *
              </label>
              <Field
                name="birthday"
                type="date"
                className={inputClasses}
              />
              <ErrorMessage name="birthday" component="div" className={errorClasses} />
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className={labelClasses}>
                Type *
              </label>
              <Field
                as="select"
                name="type"
                className={inputClasses}
              >
                <option value="">Select Type</option>
                <option value="iso_manager">ISO Manager</option>
                <option value="iso_sales">ISO Sales</option>
              </Field>
              <ErrorMessage name="type" component="div" className={errorClasses} />
            </div>
          </div>

          {/* ISO List */}
          <div>
            <label className={labelClasses}>ISOs</label>
            <Select
              isMulti
              name="iso_list"
              options={isos.map(i => ({
                value: i._id,
                label: i.name,
              }))}
              onChange={(selected) => {
                setFieldValue('iso_list', selected ? selected.map(s => s.value) : []);
              }}
              value={isos
                .filter(i => values.iso_list?.includes(i._id))
                .map(i => ({
                  value: i._id,
                  label: i.name,
                }))}
              className="text-sm"
              classNamePrefix="select"
              placeholder="Select ISOs (optional)..."
              isClearable={true}
              isSearchable
              isLoading={loadingISOs}
              isDisabled={loadingISOs}
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
            <ErrorMessage name="iso_list" component="div" className={errorClasses} />
          </div>

          {/* Address Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Address 1 */}
              <div>
                <label htmlFor="address_detail.address_1" className={labelClasses}>
                  Address 1 *
                </label>
                <Field
                  name="address_detail.address_1"
                  type="text"
                  className={inputClasses}
                  placeholder="Street Address"
                />
                <ErrorMessage name="address_detail.address_1" component="div" className={errorClasses} />
              </div>

              {/* Address 2 */}
              <div>
                <label htmlFor="address_detail.address_2" className={labelClasses}>
                  Address 2 *
                </label>
                <Field
                  name="address_detail.address_2"
                  type="text"
                  className={inputClasses}
                  placeholder="Apt, Suite, etc."
                />
                <ErrorMessage name="address_detail.address_2" component="div" className={errorClasses} />
              </div>

              {/* City */}
              <div>
                <label htmlFor="address_detail.city" className={labelClasses}>
                  City *
                </label>
                <Field
                  name="address_detail.city"
                  type="text"
                  className={inputClasses}
                  placeholder="City"
                />
                <ErrorMessage name="address_detail.city" component="div" className={errorClasses} />
              </div>

              {/* State */}
              <div>
                <label htmlFor="address_detail.state" className={labelClasses}>
                  State *
                </label>
                <Field
                  name="address_detail.state"
                  type="text"
                  className={inputClasses}
                  placeholder="State"
                />
                <ErrorMessage name="address_detail.state" component="div" className={errorClasses} />
              </div>

              {/* ZIP */}
              <div>
                <label htmlFor="address_detail.zip" className={labelClasses}>
                  ZIP Code *
                </label>
                <Field
                  name="address_detail.zip"
                  type="text"
                  className={inputClasses}
                  placeholder="ZIP Code"
                />
                <ErrorMessage name="address_detail.zip" component="div" className={errorClasses} />
              </div>
            </div>
          </div>

          {/* Status Section - Only show inactive in update mode */}
          {mode === 'update' && (
            <div className="flex gap-4">
              {/* Inactive Status */}
              <div className="flex items-center">
                <Field
                  name="inactive"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="inactive" className="ml-2 block text-sm text-gray-900">
                  Inactive
                </label>
              </div>
            </div>
          )}

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <button
              type="submit"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-1 sm:text-sm"
              disabled={isLoading}
            >
              {mode === 'create' ? 'Create' : 'Update'}
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
};

export default RepresentativeForm; 