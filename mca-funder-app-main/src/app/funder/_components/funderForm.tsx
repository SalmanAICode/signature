"use client";

import { useState, useEffect, useRef } from "react";
import { Funder, CreateFunderData, UpdateFunderData } from "@/types/funder";
import { User } from "@/types/user";
import { ISO } from "@/types/iso";
import {
  createFunder,
  updateFunder,
} from "@/lib/api/funders";
import useAuthStore from "@/lib/store/auth";
import { countries } from "@/data/countries";
import { Formik, Form, Field, ErrorMessage, FormikProps } from "formik";
import * as Yup from "yup";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Select, { MultiValue } from "react-select";
import { useUsers, useISOs } from "@/hooks/useFunders";
import { useFunderUsers } from "@/hooks/useFunderUsers";
import { useFunderIsos } from "@/hooks/useFunderIsos";
import FormModalLayout from "@/components/FormModalLayout";
import clsx from "clsx";
import { normalizePhoneInput } from "@/lib/utils/format";

type Props = {
  initialData: Funder | null;
  onCancel: () => void;
  onSuccess: () => void;
  onUpdateSuccess?: () => void;
  onSortReset?: () => void;
};

interface SelectOption {
  value: string;
  label: string;
}

// Validation schema
const validationSchema = Yup.object().shape({
  name: Yup.string().required("Company name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  website: Yup.string().url("Invalid website URL").optional(),
  business_detail: Yup.object().shape({
    ein: Yup.string().optional(),
    entity_type: Yup.string().optional(),
    incorporation_date: Yup.string().optional(),
    state_of_incorporation: Yup.string().optional(),
  }).optional(),
  address: Yup.object().shape({
    address_1: Yup.string().optional(),
    address_2: Yup.string().optional(),
    city: Yup.string().optional(),
    state: Yup.string().optional(),
    zip: Yup.string().optional(),
  }).optional(),
});

// Add a reverse mapping for initial values
const entityTypeReverseMap: Record<string, string> = {
  'Corporation': 'C_CORP',
  'S Corporation': 'S_CORP',
  'B Corporation': 'B_CORP',
  'Close Corporation': 'CLOSE_CORP',
  'Professional Corporation': 'P_CORP',
  'LLC': 'LLC',
  'LLP': 'LLP',
  'Partnership': 'GEN_PART',
  'Sole Proprietorship': 'SOLE_PROP',
  'Other': 'OTHER',
  // Also allow backend values to pass through (no duplicates)
  'C_CORP': 'C_CORP',
  'S_CORP': 'S_CORP',
  'B_CORP': 'B_CORP',
  'CLOSE_CORP': 'CLOSE_CORP',
  'P_CORP': 'P_CORP',
  'GEN_PART': 'GEN_PART',
  'SOLE_PROP': 'SOLE_PROP',
  'OTHER': 'OTHER',
};

// Initial values function
const getInitialValues = (
  initialData: Funder | null,
  isEdit: boolean,
) => ({
  name: initialData?.name || "",
  email: initialData?.email || "",
  phone: initialData?.phone || "",
  website: initialData?.website || "",
  business_detail: {
    ein: initialData?.business_detail?.ein || "",
    entity_type: initialData?.business_detail?.entity_type ? (entityTypeReverseMap[initialData.business_detail.entity_type] || "") : "",
    incorporation_date: initialData?.business_detail?.incorporation_date || "",
    state_of_incorporation: initialData?.business_detail?.state_of_incorporation || "",
  },
  address: {
    address_1: initialData?.address?.address_1 || "",
    address_2: initialData?.address?.address_2 || "",
    city: initialData?.address?.city || "",
    state: initialData?.address?.state || "",
    zip: initialData?.address?.zip || "",
  },
  isEdit,
});

// Utility functions to map data to select options
const mapUsersToOptions = (users: User[]): SelectOption[] => {
  return users.map((user) => ({
    value: user._id,
    label: `${user.first_name} ${user.last_name} (${user.email})`,
  }));
};

const mapISOsToOptions = (isos: ISO[]): SelectOption[] => {
  return isos.map((iso) => ({
    value: iso._id,
    label: `${iso.name} (${iso.email})`,
  }));
};

// Add this mapping at the top of the file or before the submit handler
const entityTypeMap: Record<string, string> = {
  'Corporation': 'C_CORP',
  'S Corporation': 'S_CORP',
  'B Corporation': 'B_CORP',
  'Close Corporation': 'CLOSE_CORP',
  'Professional Corporation': 'P_CORP',
  'LLC': 'LLC',
  'LLP': 'LLP',
  'Partnership': 'GEN_PART',
  'Sole Proprietorship': 'SOLE_PROP',
  'Other': 'OTHER', // fallback if needed
};

const FunderForm = ({
  initialData,
  onCancel,
  onSuccess,
  onUpdateSuccess,
  onSortReset,
}: Props) => {
  const isEdit = Boolean(initialData);

  // Zustand state
  const { user: authUser } = useAuthStore();

  // UI state
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);

  // Data fetching state
  const { users, usersLoading, usersError } = useUsers();
  const { isos, isosLoading, isosError } = useISOs();

  // Existing funder data for edit mode
  const [existingUsers, setExistingUsers] = useState<User[]>([]);
  const [existingISOs, setExistingISOs] = useState<ISO[]>([]);
  
  // Fetch existing funder users and ISOs when editing
  const funderUsers = isEdit && initialData?._id ? useFunderUsers(initialData._id) : { users: [], loading: false, error: '' };
  const funderISOs = isEdit && initialData?._id ? useFunderIsos(initialData._id) : { isos: [], loading: false, error: '' };

  // Update existing data when hooks return data
  useEffect(() => {
    if (isEdit && funderUsers.users) {
      setExistingUsers(funderUsers.users);
    }
  }, [isEdit, funderUsers.users]);

  useEffect(() => {
    if (isEdit && funderISOs.isos) {
      setExistingISOs(funderISOs.isos);
    }
  }, [isEdit, funderISOs.isos]);

  // Reusable className patterns using clsx
  const inputClasses = clsx(
    "w-full px-3 py-2 border rounded-lg focus:outline-none text-sm",
  );

  const labelClasses = clsx("block text-xs font-medium text-gray-700");

  const errorClasses = clsx("text-red-500 text-xs");

  const buttonClasses = (
    variant: "primary" | "secondary",
    disabled?: boolean,
  ) =>
    clsx(
      "w-full py-3 text-base font-semibold text-white rounded-lg shadow-sm transition",
      {
        "bg-[#3B5BFE] hover:bg-[#2446d7]": variant === "primary" && !disabled,
        "bg-red-500 hover:bg-red-600": variant === "secondary" && !disabled,
        "opacity-50 cursor-not-allowed": disabled,
      },
    );

  const initialValues = getInitialValues(initialData, isEdit);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError("");

    try {
      let response;
      
      if (isEdit && initialData?._id) {
        const updateData: UpdateFunderData = {
          name: values.name,
          email: values.email,
          phone: normalizePhoneInput(values.phone),
          website: values.website?.trim() || undefined,
          business_detail: {
            ein: values.business_detail.ein?.trim() || undefined,
            entity_type: values.business_detail.entity_type?.trim() || undefined,
            incorporation_date: values.business_detail.incorporation_date?.trim() || undefined,
            state_of_incorporation: values.business_detail.state_of_incorporation?.trim() || undefined,
          },
          address: {
            address_1: values.address.address_1?.trim() || undefined,
            address_2: values.address.address_2?.trim() || undefined,
            city: values.address.city?.trim() || undefined,
            state: values.address.state?.trim() || undefined,
            zip: values.address.zip?.trim() || undefined,
          },
        };
        
        const submitData = { ...updateData };
        if (submitData.business_detail && submitData.business_detail.entity_type) {
          const raw = submitData.business_detail.entity_type.trim();
          submitData.business_detail.entity_type = entityTypeMap[raw] || raw;
        }

        // Filter out empty strings and undefined values
        const cleanSubmitData = Object.fromEntries(
          Object.entries(submitData).map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              const cleanObject = Object.fromEntries(
                Object.entries(value).filter(([_, val]) => val !== undefined && val !== '' && val !== null)
              );
              return [key, Object.keys(cleanObject).length > 0 ? cleanObject : undefined];
            }
            return [key, value];
          }).filter(([_, value]) => value !== undefined && value !== '' && value !== null)
        );

        response = await updateFunder(initialData._id, cleanSubmitData);
      } else {
        const createData: CreateFunderData = {
          name: values.name,
          email: values.email,
          phone: normalizePhoneInput(values.phone),
          website: values.website?.trim() || undefined,
          business_detail: {
            ein: values.business_detail.ein?.trim() || undefined,
            entity_type: values.business_detail.entity_type?.trim() || undefined,
            incorporation_date: values.business_detail.incorporation_date?.trim() || undefined,
            state_of_incorporation: values.business_detail.state_of_incorporation?.trim() || undefined,
          },
          address: {
            address_1: values.address.address_1?.trim() || undefined,
            address_2: values.address.address_2?.trim() || undefined,
            city: values.address.city?.trim() || undefined,
            state: values.address.state?.trim() || undefined,
            zip: values.address.zip?.trim() || undefined,
          },
        };

        // In your form submission handler, before sending data to the backend:
        const submitData = { ...createData };
        if (submitData.business_detail && submitData.business_detail.entity_type) {
          const raw = submitData.business_detail.entity_type.trim();
          submitData.business_detail.entity_type = entityTypeMap[raw] || raw;
        }

        // Filter out empty strings and undefined values
        const cleanSubmitData = Object.fromEntries(
          Object.entries(submitData).map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              const cleanObject = Object.fromEntries(
                Object.entries(value).filter(([_, val]) => val !== undefined && val !== '' && val !== null)
              );
              return [key, Object.keys(cleanObject).length > 0 ? cleanObject : undefined];
            }
            return [key, value];
          }).filter(([_, value]) => value !== undefined && value !== '' && value !== null)
        );

        response = await createFunder(cleanSubmitData);
      }
      
      if (response.success) {
        if (!isEdit && onSortReset) {
          onSortReset();
        }
        if (isEdit && onUpdateSuccess) {
          onUpdateSuccess();
        } else {
          onSuccess();
        }
        onCancel();
      } else {
        setError(response.message || `Failed to ${isEdit ? 'update' : 'create'} funder`);
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? "update" : "create"} funder`);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (phone: string, setFieldValue: any) => {
    setFieldValue("phone", phone);
  };

  return (
    <FormModalLayout
      title={isEdit ? "Update" : "Create"}
      subtitle={isEdit ? "Please update details below." : "Please enter details below."}
      onCancel={onCancel}
      maxWidth={700}
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue, errors, touched }: FormikProps<any>) => (
          <Form className="space-y-6">
            {/* Company Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="w-full">
                <label htmlFor="name" className={labelClasses}>Company Name</label>
                <Field id="name" name="name" className={inputClasses} placeholder="Company Name" />
                <ErrorMessage name="name" component="div" className={errorClasses} />
              </div>
              <div className="w-full">
                <label htmlFor="email" className={labelClasses}>Email</label>
                <Field id="email" name="email" type="email" className={inputClasses} placeholder="Email" />
                <ErrorMessage name="email" component="div" className={errorClasses} />
              </div>
            </div>
            {/* Phone */}
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
            {/* Website */}
            <div className="w-full">
              <label htmlFor="website" className={labelClasses}>Website</label>
              <Field id="website" name="website" className={inputClasses} placeholder="https://www.example.com" />
              <ErrorMessage name="website" component="div" className={errorClasses} />
            </div>
            {/* Business Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Details</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4">
                <div className="w-full">
                  <label htmlFor="business_detail.incorporation_date" className={labelClasses}>Incorporation Date</label>
                  <Field id="business_detail.incorporation_date" name="business_detail.incorporation_date" type="date" className={inputClasses} />
                  <ErrorMessage name="business_detail.incorporation_date" component="div" className={errorClasses} />
                </div>
                <div className="w-full">
                  <label htmlFor="business_detail.state_of_incorporation" className={labelClasses}>State of Incorporation</label>
                  <Field id="business_detail.state_of_incorporation" name="business_detail.state_of_incorporation" className={inputClasses} placeholder="New York" />
                  <ErrorMessage name="business_detail.state_of_incorporation" component="div" className={errorClasses} />
                </div>
              </div>
            </div>
            {/* Address */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="w-full">
                  <label htmlFor="address.address_1" className={labelClasses}>Address Line 1</label>
                  <Field id="address.address_1" name="address.address_1" className={inputClasses} placeholder="350 5th Avenue" />
                  <ErrorMessage name="address.address_1" component="div" className={errorClasses} />
                </div>
                <div className="w-full">
                  <label htmlFor="address.address_2" className={labelClasses}>Address Line 2</label>
                  <Field id="address.address_2" name="address.address_2" className={inputClasses} placeholder="Suite 2100" />
                  <ErrorMessage name="address.address_2" component="div" className={errorClasses} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4">
                <div className="w-full">
                  <label htmlFor="address.city" className={labelClasses}>City</label>
                  <Field id="address.city" name="address.city" className={inputClasses} placeholder="New York" />
                  <ErrorMessage name="address.city" component="div" className={errorClasses} />
                </div>
                <div className="w-full">
                  <label htmlFor="address.state" className={labelClasses}>State</label>
                  <Field id="address.state" name="address.state" className={inputClasses} placeholder="NY" />
                  <ErrorMessage name="address.state" component="div" className={errorClasses} />
                </div>
                <div className="w-full">
                  <label htmlFor="address.zip" className={labelClasses}>ZIP Code</label>
                  <Field id="address.zip" name="address.zip" className={inputClasses} placeholder="10118" />
                  <ErrorMessage name="address.zip" component="div" className={errorClasses} />
                </div>
              </div>
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

export default FunderForm; 