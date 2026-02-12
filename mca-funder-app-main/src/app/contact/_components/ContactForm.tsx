"use client";

import { useState, useEffect, useRef } from "react";
import { Contact } from "@/types/contact";
import { CreateContactData, UpdateContactData, updateContact, createContact } from "@/lib/api/contacts";
import useAuthStore from "@/lib/store/auth";
import { countries } from "@/data/countries";
import { Formik, Form, Field, ErrorMessage, FormikProps } from "formik";
import * as Yup from "yup";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Funder } from "@/types/funder";
import Select, { MultiValue } from "react-select";
import { useFunders } from "@/hooks/useFunders";
import FormModalLayout from "@/components/FormModalLayout";
import clsx from "clsx";
import { normalizePhoneInput } from "@/lib/utils/format";
import { useMerchants } from '@/hooks/useMerchants';

type ContactFormProps = {
  initialData: Contact | null;
  onCancel: () => void;
  onSuccess: () => void;
  onUpdateSuccess?: () => void;
  onSortReset?: () => void;
};

interface SelectOption {
  value: string;
  label: string;
  email: string;
}

interface FormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone_mobile: string;
  phone_work: string;
  phone_home: string;
  birthday: string;
  address_detail: {
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    zip: string;
  };
  title: string;
  fico_score: number;
  dln_issue_date: string;
  dln_issue_state: string;
  ssn: string;
  drivers_license_number: string;
  inactive: boolean;
  merchants: string[];
  password: string;
  confirmPassword: string;
}

const getInitialValues = (
  initialData: Contact | null,
  isEdit: boolean,
): FormValues => ({
  first_name: initialData?.first_name || '',
  last_name: initialData?.last_name || '',
  email: initialData?.email || '',
  phone_mobile: initialData?.phone_mobile || '',
  phone_work: initialData?.phone_work || '',
  phone_home: initialData?.phone_home || '',
  birthday: initialData?.birthday || '',
  address_detail: {
    address_1: initialData?.address_detail?.address_1 || '',
    address_2: initialData?.address_detail?.address_2 || '',
    city: initialData?.address_detail?.city || '',
    state: initialData?.address_detail?.state || '',
    zip: initialData?.address_detail?.zip || '',
  },
  title: initialData?.title || '',
  fico_score: initialData?.fico_score || 0,
  dln_issue_date: initialData?.dln_issue_date || '',
  dln_issue_state: initialData?.dln_issue_state || '',
  ssn: initialData?.ssn || '',
  drivers_license_number: initialData?.drivers_license_number || '',
  inactive: initialData?.inactive || false,
  merchants: initialData?.merchants?.map((m: any) => m._id) || [],
  password: '',
  confirmPassword: '',
});

// Utility function to map funders to select options
const mapFundersToOptions = (funders: Funder[]): SelectOption[] => {
  return funders.map((funder) => ({
    value: funder._id,
    label: funder.name,
    email: funder.email || '',
  }));
};

// Utility function to map merchants to select options
const mapMerchantsToOptions = (merchants: any[]): { value: string; label: string }[] => {
  return (merchants || []).map((merchant) => ({
    value: merchant._id,
    label: merchant.name,
  }));
};

const ContactForm = ({
  initialData,
  onCancel,
  onSuccess,
  onUpdateSuccess,
  onSortReset,
}: ContactFormProps) => {
  const { user: authUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const { merchants, merchantsLoading, merchantsError } = useMerchants();

  // Refs
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const funderDropdownRef = useRef<HTMLDivElement>(null);

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

  // useEffect(() => {
  //   function handleClickOutside(event: MouseEvent) {
  //     if (
  //       typeDropdownRef.current &&
  //       !typeDropdownRef.current.contains(event.target as Node)
  //     ) {
  //       setShowTypeDropdown(false);
  //     }
  //     if (
  //       funderDropdownRef.current &&
  //       !funderDropdownRef.current.contains(event.target as Node)
  //     ) {
  //       setShowFunderDropdown(false);
  //     }
  //   }

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  const handleSubmit = async (values: FormValues) => {
    let response;
    if (initialData?._id) {
      const updateData: UpdateContactData = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone_mobile: values.phone_mobile,
        phone_work: values.phone_work,
        phone_home: values.phone_home,
        birthday: values.birthday,
        address_detail: {
          ...values.address_detail,
          address_2: values.address_detail.address_2 || '',
        },
        title: values.title,
        fico_score: values.fico_score,
        dln_issue_date: values.dln_issue_date,
        dln_issue_state: values.dln_issue_state,
        ssn: values.ssn,
        drivers_license_number: values.drivers_license_number,
        inactive: values.inactive,
        merchants: values.merchants,
      };
      response = await updateContact(initialData._id, updateData);
    } else {
      const createData: CreateContactData = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone_mobile: values.phone_mobile,
        phone_work: values.phone_work,
        phone_home: values.phone_home,
        birthday: values.birthday,
        address_detail: {
          ...values.address_detail,
          address_2: values.address_detail.address_2 || '',
        },
        title: values.title,
        fico_score: values.fico_score,
        dln_issue_date: values.dln_issue_date,
        dln_issue_state: values.dln_issue_state,
        ssn: values.ssn,
        drivers_license_number: values.drivers_license_number,
        merchants: values.merchants,
        password: values.password,
      };
      response = await createContact(createData);
    }
    if (response && response.success) {
      onSuccess();
    }
  };

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  const handlePhoneMobileChange = (phone: string, setFieldValue: any) => {
    setFieldValue("phone_mobile", phone);
  };

  const handlePhoneWorkChange = (phone: string, setFieldValue: any) => {
    setFieldValue("phone_work", phone);
  };

  const handlePhoneHomeChange = (phone: string, setFieldValue: any) => {
    setFieldValue("phone_home", phone);
  };

  return (
    <FormModalLayout
      title={initialData ? "Update Contact" : "Create Contact"}
      subtitle={initialData ? "Please update details below." : "Please enter contact details below."}
      onCancel={onCancel}
      maxWidth={700}
    >
      <Formik<FormValues>
        initialValues={getInitialValues(initialData, Boolean(initialData))}
        validationSchema={Yup.object().shape({
          first_name: Yup.string().required("First name is required"),
          last_name: Yup.string().required("Last name is required"),
          email: Yup.string().email("Invalid email").required("Email is required"),
          phone_mobile: Yup.string().required("Mobile phone is required"),
          phone_work: Yup.string().optional(),
          phone_home: Yup.string().optional(),
          birthday: Yup.string().optional(),
          ssn: Yup.string().optional(),
          drivers_license_number: Yup.string().optional(),
          address_detail: Yup.object().shape({
            address_1: Yup.string().required("Address 1 is required"),
            address_2: Yup.string().optional(),
            city: Yup.string().required("City is required"),
            state: Yup.string().required("State is required"),
            zip: Yup.string().required("ZIP is required"),
          }),
          inactive: Yup.boolean().required("Inactive status is required"),
          password: Yup.string().when([], {
            is: () => !Boolean(initialData),
            then: (schema) => schema.required("Password is required"),
            otherwise: (schema) => schema.optional(),
          }),
          confirmPassword: Yup.string().when([], {
            is: () => !Boolean(initialData),
            then: (schema) => schema
              .required("Confirm password is required")
              .oneOf([Yup.ref('password')], 'Passwords must match'),
            otherwise: (schema) => schema.optional(),
          }),
        })}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue, errors, touched }) => {
          const isEdit = Boolean(initialData);
          return (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="w-full">
                  <label htmlFor="first_name" className={labelClasses}>First Name</label>
                  <Field id="first_name" name="first_name" className={inputClasses} placeholder="First Name" />
                  <ErrorMessage name="first_name" component="div" className={errorClasses} />
                </div>
                <div className="w-full">
                  <label htmlFor="last_name" className={labelClasses}>Last Name</label>
                  <Field id="last_name" name="last_name" className={inputClasses} placeholder="Last Name" />
                  <ErrorMessage name="last_name" component="div" className={errorClasses} />
                </div>
              </div>
              <div className="w-full">
                <label htmlFor="email" className={labelClasses}>Email</label>
                <Field id="email" name="email" type="email" className={inputClasses} placeholder="Email" />
                <ErrorMessage name="email" component="div" className={errorClasses} />
              </div>
              <div className="w-full">
                <label htmlFor="phone_mobile" className={labelClasses}>Mobile Phone</label>
                <div className="phone-input-wrapper">
                  <PhoneInput
                    country={"us"}
                    value={values.phone_mobile}
                    onChange={(phone) => setFieldValue("phone_mobile", phone)}
                    inputClass="px-3 py-2 border rounded-lg focus:outline-none text-sm"
                    inputProps={{ name: "phone_mobile", required: true, autoFocus: false }}
                  />
                </div>
                {errors.phone_mobile && touched.phone_mobile && (
                  <div className={errorClasses}>{errors.phone_mobile}</div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="w-full">
                  <label htmlFor="phone_work" className={labelClasses}>Work Phone <span className="text-gray-500 text-xs">(Optional)</span></label>
                  <div className="phone-input-wrapper">
                    <PhoneInput
                      country={"us"}
                      value={values.phone_work}
                      onChange={(phone) => setFieldValue("phone_work", phone)}
                      inputClass="px-3 py-2 border rounded-lg focus:outline-none text-sm"
                      inputProps={{ name: "phone_work", autoFocus: false }}
                    />
                  </div>
                </div>
                <div className="w-full">
                  <label htmlFor="phone_home" className={labelClasses}>Home Phone <span className="text-gray-500 text-xs">(Optional)</span></label>
                  <div className="phone-input-wrapper">
                    <PhoneInput
                      country={"us"}
                      value={values.phone_home}
                      onChange={(phone) => setFieldValue("phone_home", phone)}
                      inputClass="px-3 py-2 border rounded-lg focus:outline-none text-sm"
                      inputProps={{ name: "phone_home", autoFocus: false }}
                    />
                  </div>
                </div>
              </div>
              <div className="w-full">
                <label className={labelClasses}>Select Merchants</label>
                <Select
                  isMulti
                  name="merchants"
                  options={mapMerchantsToOptions(merchants)}
                  value={values.merchants
                    .map((id: any) => {
                      const merchant = (merchants || []).find((m) => m._id === (id.value || id));
                      return merchant ? { value: merchant._id, label: merchant.name } : null;
                    })
                    .filter((option): option is { value: string; label: string } => option !== null)
                  }
                  onChange={(selected) => {
                    const selectedValues = (selected as { value: string; label: string }[]).map(option => option.value);
                    setFieldValue('merchants', selectedValues);
                  }}
                  className="text-sm"
                  classNamePrefix="select"
                  placeholder="Select merchants..."
                  isSearchable
                  isDisabled={merchantsLoading}
                  styles={{
                    menu: (base) => ({ ...base, zIndex: 100, position: 'relative' }),
                    menuPortal: (base) => ({ ...base, zIndex: 100 }),
                    container: (base) => ({ ...base, zIndex: 100 }),
                    option: (base) => ({ ...base, fontSize: '14px' }),
                    control: (base) => ({ ...base, fontSize: '14px' }),
                    singleValue: (base) => ({ ...base, fontSize: '14px' }),
                    multiValueLabel: (base) => ({ ...base, fontSize: '14px' }),
                  }}
                  menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                  menuPosition="fixed"
                />
                {merchantsError && <div className={errorClasses}>{merchantsError}</div>}
              </div>
              {error && <div className={clsx(errorClasses, 'text-sm text-center')}>{error}</div>}
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
          );
        }}
      </Formik>
    </FormModalLayout>
  );
};

export default ContactForm;
