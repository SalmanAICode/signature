"use client";

import { useState, useEffect } from "react";
import { Lender, LenderTypeList } from "@/types/lender";
import { User } from "@/types/user";
import { createLender, updateLender } from "@/lib/api/lenders";
import { getUserList } from "@/lib/api/users";
import { Formik, Form, Field, ErrorMessage, FormikProps } from "formik";
import * as Yup from "yup";
import FormModalLayout from "@/components/FormModalLayout";
import clsx from "clsx";
import Select from "react-select";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { normalizePhoneInput } from "@/lib/utils/format";
import useAuthStore from "@/lib/store/auth";

// Helper function to format ISO date string to yyyy-MM-dd
const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

interface Props {
  initialData?: Lender | null;
  onCancel: () => void;
  onSuccess: (lender: Lender) => void;
  onUpdateSuccess?: () => void;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Lender name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  type: Yup.string().oneOf(LenderTypeList, "Type is required").required("Type is required"),
  website: Yup.string().url("Invalid website URL").optional(),
  user_list: Yup.array().of(Yup.string()).optional(),
  business_detail: Yup.object().shape({
    ein: Yup.string().optional(),
    entity_type: Yup.string().optional(),
    incorporation_date: Yup.string().optional(),
    incorporation_state: Yup.string().optional(),
    state_of_incorporation: Yup.string().optional(),
  }).optional(),
  address_detail: Yup.object().shape({
    address_1: Yup.string().optional(),
    address_2: Yup.string().optional(),
    city: Yup.string().optional(),
    state: Yup.string().optional(),
    zip: Yup.string().optional(),
  }).optional(),
});

const LenderForm = ({ initialData, onCancel, onSuccess, onUpdateSuccess }: Props) => {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Get current user from auth store
  const { user: currentUser } = useAuthStore();

  const isEdit = Boolean(initialData);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const usersData = await getUserList({ include_inactive: false });
        setUsers(usersData || []);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Set initial values with current user pre-selected for create mode
  const getInitialValues = () => {
    if (isEdit && initialData) {
      return {
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        type: initialData.type || "internal",
        website: initialData.website || "",
        user_list: initialData.user_list || [],
        business_detail: {
          ein: initialData.business_detail?.ein || "",
          entity_type: initialData.business_detail?.entity_type || "",
          incorporation_date: formatDateForInput(initialData.business_detail?.incorporation_date),
          incorporation_state: initialData.business_detail?.incorporation_state || "",
          state_of_incorporation: initialData.business_detail?.state_of_incorporation || "",
        },
        address_detail: {
          address_1: initialData.address_detail?.address_1 || "",
          address_2: initialData.address_detail?.address_2 || "",
          city: initialData.address_detail?.city || "",
          state: initialData.address_detail?.state || "",
          zip: initialData.address_detail?.zip || "",
        },
      };
    }

    return {
      name: "",
      email: "",
      phone: "",
      type: "internal",
      website: "",
      user_list: currentUser?._id ? [currentUser._id] : [],
      business_detail: {
        ein: "",
        entity_type: "",
        incorporation_date: "",
        incorporation_state: "",
        state_of_incorporation: "",
      },
      address_detail: {
        address_1: "",
        address_2: "",
        city: "",
        state: "",
        zip: "",
      },
    };
  };

  const typeOptions = LenderTypeList.map(type => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1)
  }));

  // Reusable className patterns using clsx
  const inputClasses = clsx(
    "w-full px-3 py-2 border rounded-lg focus:outline-none text-sm",
  );
  const labelClasses = clsx("block text-xs font-medium text-gray-700");
  const errorClasses = clsx("text-red-500 text-xs");

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError("");

    try {
      let lender;
      
      if (isEdit && initialData?._id) {
        lender = await updateLender(initialData._id, {
          ...values,
          type: values.type as "internal" | "external",
          phone: normalizePhoneInput(values.phone),
        });
        if (onUpdateSuccess) {
          onUpdateSuccess();
        }
      } else {
        lender = await createLender({
          ...values,
          type: values.type as "internal" | "external",
          phone: normalizePhoneInput(values.phone),
        });
      }
      
      onSuccess(lender);
      onCancel();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} lender`);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (phone: string, setFieldValue: any) => {
    setFieldValue("phone", phone);
  };

  // Map users to select options
  const userOptions = users.map(user => ({
    value: user._id,
    label: `${user.first_name} ${user.last_name} (${user.email})`
  }));

  return (
    <FormModalLayout
      title={isEdit ? "Update Lender" : "Create Lender"}
      subtitle={isEdit ? "Please update details below." : "Please enter details below."}
      onCancel={onCancel}
      maxWidth={700}
    >
      <Formik
        initialValues={getInitialValues()}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue, errors, touched }: FormikProps<any>) => (
          <Form className="space-y-6">
            {/* Lender Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="w-full">
                <label htmlFor="name" className={labelClasses}>Lender Name</label>
                <Field id="name" name="name" className={inputClasses} placeholder="Lender Name" />
                <ErrorMessage name="name" component="div" className={errorClasses} />
              </div>
              <div className="w-full">
                <label htmlFor="email" className={labelClasses}>Email</label>
                <Field id="email" name="email" type="email" className={inputClasses} placeholder="Email" />
                <ErrorMessage name="email" component="div" className={errorClasses} />
              </div>
            </div>

            {/* Type & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="w-full">
                <label htmlFor="type" className={labelClasses}>Type</label>
                <Select
                  options={typeOptions}
                  value={typeOptions.find(option => option.value === values.type) || null}
                  onChange={(option) => setFieldValue('type', option?.value || '')}
                  placeholder="Select type..."
                  className="text-sm"
                  classNamePrefix="react-select"
                />
                <ErrorMessage name="type" component="div" className={errorClasses} />
              </div>
              <div className="w-full">
                <label htmlFor="phone" className={labelClasses}>Phone</label>
                <div className="phone-input-wrapper">
                  <PhoneInput
                    country={"us"}
                    value={values.phone}
                    onChange={(phone) => handlePhoneChange(phone, setFieldValue)}
                    inputClass="px-3 py-2 border rounded-lg focus:outline-none text-sm"
                    inputProps={{ name: "phone", required: true, autoFocus: false }}
                  />
                </div>
                {errors.phone && touched.phone && (
                  <div className={errorClasses}>{errors.phone as string}</div>
                )}
              </div>
            </div>

            {/* Website */}
            <div className="w-full">
              <label htmlFor="website" className={labelClasses}>Website</label>
              <Field id="website" name="website" className={inputClasses} placeholder="https://www.example.com" />
              <ErrorMessage name="website" component="div" className={errorClasses} />
            </div>

            {/* Business Details */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Business Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="w-full">
                  <label htmlFor="business_detail.ein" className={labelClasses}>EIN</label>
                  <Field id="business_detail.ein" name="business_detail.ein" className={inputClasses} placeholder="12-3456789" />
                  <ErrorMessage name="business_detail.ein" component="div" className={errorClasses} />
                </div>
                <div className="w-full">
                  <label htmlFor="business_detail.entity_type" className={labelClasses}>Entity Type</label>
                  <Field as="select" id="business_detail.entity_type" name="business_detail.entity_type" className={inputClasses}>
                    <option value="">Select entity type</option>
                    <option value="C_CORP">Corporation</option>
                    <option value="S_CORP">S Corporation</option>
                    <option value="B_CORP">B Corporation</option>
                    <option value="CLOSE_CORP">Close Corporation</option>
                    <option value="P_CORP">Professional Corporation</option>
                    <option value="LLC">LLC</option>
                    <option value="LLP">LLP</option>
                    <option value="GEN_PART">Partnership</option>
                    <option value="SOLE_PROP">Sole Proprietorship</option>
                    <option value="OTHER">Other</option>
                  </Field>
                  <ErrorMessage name="business_detail.entity_type" component="div" className={errorClasses} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4">
                <div className="w-full">
                  <label htmlFor="business_detail.incorporation_date" className={labelClasses}>Incorporation Date</label>
                  <Field id="business_detail.incorporation_date" name="business_detail.incorporation_date" type="date" className={inputClasses} />
                  <ErrorMessage name="business_detail.incorporation_date" component="div" className={errorClasses} />
                </div>
                <div className="w-full">
                  <label htmlFor="business_detail.incorporation_state" className={labelClasses}>Incorporation State</label>
                  <Field id="business_detail.incorporation_state" name="business_detail.incorporation_state" className={inputClasses} placeholder="NY" />
                  <ErrorMessage name="business_detail.incorporation_state" component="div" className={errorClasses} />
                </div>
                <div className="w-full">
                  <label htmlFor="business_detail.state_of_incorporation" className={labelClasses}>State of Incorporation</label>
                  <Field id="business_detail.state_of_incorporation" name="business_detail.state_of_incorporation" className={inputClasses} placeholder="New York" />
                  <ErrorMessage name="business_detail.state_of_incorporation" component="div" className={errorClasses} />
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Address Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="w-full">
                  <label htmlFor="address_detail.address_1" className={labelClasses}>Address Line 1</label>
                  <Field id="address_detail.address_1" name="address_detail.address_1" className={inputClasses} placeholder="350 5th Avenue" />
                  <ErrorMessage name="address_detail.address_1" component="div" className={errorClasses} />
                </div>
                <div className="w-full">
                  <label htmlFor="address_detail.address_2" className={labelClasses}>Address Line 2</label>
                  <Field id="address_detail.address_2" name="address_detail.address_2" className={inputClasses} placeholder="Suite 2100" />
                  <ErrorMessage name="address_detail.address_2" component="div" className={errorClasses} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4">
                <div className="w-full">
                  <label htmlFor="address_detail.city" className={labelClasses}>City</label>
                  <Field id="address_detail.city" name="address_detail.city" className={inputClasses} placeholder="New York" />
                  <ErrorMessage name="address_detail.city" component="div" className={errorClasses} />
                </div>
                <div className="w-full">
                  <label htmlFor="address_detail.state" className={labelClasses}>State</label>
                  <Field id="address_detail.state" name="address_detail.state" className={inputClasses} placeholder="NY" />
                  <ErrorMessage name="address_detail.state" component="div" className={errorClasses} />
                </div>
                <div className="w-full">
                  <label htmlFor="address_detail.zip" className={labelClasses}>ZIP Code</label>
                  <Field id="address_detail.zip" name="address_detail.zip" className={inputClasses} placeholder="10118" />
                  <ErrorMessage name="address_detail.zip" component="div" className={errorClasses} />
                </div>
              </div>
            </div>

            {/* Users */}
            <div className="w-full">
              <label htmlFor="user_list" className={labelClasses}>Assigned Users</label>
              <Select
                isMulti
                options={userOptions}
                value={userOptions.filter(option => values.user_list.includes(option.value))}
                onChange={(selectedOptions) => {
                  const selectedValues = Array.isArray(selectedOptions) 
                    ? selectedOptions.map(option => option.value)
                    : [];
                  setFieldValue('user_list', selectedValues);
                }}
                isLoading={usersLoading}
                placeholder="Select users..."
                classNamePrefix="select"
                menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                styles={{
                  input: base => ({ ...base, fontSize: '0.875rem' }),
                  option: base => ({ ...base, fontSize: '0.875rem' }),
                  singleValue: base => ({ ...base, fontSize: '0.875rem' }),
                  multiValueLabel: base => ({ ...base, fontSize: '0.875rem' }),
                  menuPortal: base => ({ 
                    ...base, 
                    zIndex: 99999
                  }),
                  menu: base => ({ 
                    ...base, 
                    zIndex: 99999
                  }),
                  control: base => ({
                    ...base,
                    minHeight: '38px'
                  }),
                }}
              />
              <ErrorMessage name="user_list" component="div" className={errorClasses} />
            </div>

            {/* Error message */}
            {error && (
              <div className={clsx(errorClasses, 'text-sm text-center')}>{String(error)}</div>
            )}

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3 w-full">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-1 sm:text-sm"
                disabled={loading}
              >
                {isEdit ? 'Update' : 'Create'}
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
    </FormModalLayout>
  );
};

export default LenderForm; 