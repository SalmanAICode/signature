"use client";

import { useState, useEffect, useRef } from "react";
import { User, CreateUserData, UpdateUserData } from "@/types/user";
import { getUserFunders } from "@/lib/api/userFunders";
import { getFunderList } from "@/lib/api/funders";

import useAuthStore from "@/lib/store/auth";
import { countries } from "@/data/countries";
import ShowPassword from "@/svg/ShowPassword";
import HidePassword from "@/svg/HidePassword";
import { Formik, Form, Field, ErrorMessage, FormikProps } from "formik";
import * as Yup from "yup";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Funder } from "@/types/funder";
import Select, { MultiValue } from "react-select";
import FormModalLayout from "@/components/FormModalLayout";
import clsx from "clsx";
import { normalizePhoneInput } from "@/lib/utils/format";
import { toast } from 'react-hot-toast';
import { getUserTypeLabel } from '@/lib/utils/format';
import { getUserFunderList } from '@/lib/api/userFunders';
import { getUserLenderList } from '@/lib/api/userLenders';
import { Lender } from '@/types/lender';

type Props = {
  initialData: User | null;
  onCancel: () => void;
  onCreate?: (values: any) => Promise<{ success: boolean; error?: string }>;
  onUpdate?: (userId: string, values: any) => Promise<{ success: boolean; error?: string }>;
  onSortReset?: () => void;
};

interface SelectOption {
  value: string;
  label: string;
  email: string;
}

interface FormValues {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_mobile: string;
  phone_work: string;
  phone_home: string;
  // birthday: string;
  address_detail: {
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    zip: string;
  };
  type: string;
  password: string;
  confirmPassword: string;
  funder_list: any[];
  isEdit: boolean;
}

// Validation schema
const validationSchema = Yup.object().shape({
  first_name: Yup.string().required("First name is required"),
  last_name: Yup.string().required("Last name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().when("isEdit", {
    is: false,
    then: () =>
      Yup.string()
        .required("Password is required")
        .min(6, "Password must be at least 6 characters"),
    otherwise: () => Yup.string(),
  }),
  confirmPassword: Yup.string().when("isEdit", {
    is: false,
    then: () =>
      Yup.string()
        .required("Confirm password is required")
        .oneOf([Yup.ref('password')], 'Passwords must match'),
    otherwise: () => Yup.string(),
  }),
  phone_mobile: Yup.string().required("Mobile phone is required"),
  phone_work: Yup.string().optional(),
  phone_home: Yup.string().optional(),
  // birthday: Yup.string().optional(),
  type: Yup.string().required("User type is required"),
  funder_list: Yup.array().of(
    Yup.object().shape({
      funder: Yup.object().shape({
        _id: Yup.string().required(),
        name: Yup.string().required(),
      }),
      role_list: Yup.array().of(
        Yup.object().shape({
          _id: Yup.string().required(),
          name: Yup.string().required(),
        }),
      ),
      inactive: Yup.boolean(),
    }),
  ).min(1, "At least one funder is required"),
});

// Initial values function
const getInitialValues = (
  initialData: User | null,
  userFunders: any[],
  isEdit: boolean,
) => ({
  _id: initialData?._id || "",
  first_name: initialData?.first_name || "",
  last_name: initialData?.last_name || "",
  email: initialData?.email || "",
  phone_mobile: initialData?.phone_mobile || "",
  phone_work: initialData?.phone_work || "",
  phone_home: initialData?.phone_home || "",
  // birthday: initialData?.birthday || "",
  address_detail: {
    address_1: initialData?.address_detail?.address_1 || "",
    address_2: initialData?.address_detail?.address_2 || "",
    city: initialData?.address_detail?.city || "",
    state: initialData?.address_detail?.state || "",
    zip: initialData?.address_detail?.zip || "",
  },
  type: initialData?.type || "funder_user",
  password: "",
  confirmPassword: "",
  funder_list: userFunders || [],
  isEdit,
});

// Utility function to map funders to select options
const mapFundersToOptions = (funders: Funder[]): SelectOption[] => {
  return funders.map((funder) => ({
    value: funder._id,
    label: funder.name,
    email: funder.email || '',
  }));
};

const UserForm = ({
  initialData,
  onCancel,
  onCreate,
  onUpdate,
  onSortReset,
}: Props) => {
  const isEdit = Boolean(initialData);

  const { user: authUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showFunderDropdown, setShowFunderDropdown] = useState(false);
  const [expandedFunders, setExpandedFunders] = useState<string[]>([]);

  // Data fetching state
  const [funders, setFunders] = useState<Funder[]>([]);
  const [fundersLoading, setFundersLoading] = useState(false);
  const [selectedFunders, setSelectedFunders] = useState<any[]>([]);

  // Funder list state
  const [funderList, setFunderList] = useState<any[]>([]);

  // Refs
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const funderDropdownRef = useRef<HTMLDivElement>(null);

  // Reusable className patterns using clsx
  const inputClasses = clsx(
    "w-full px-3 py-2 border rounded-lg focus:outline-none text-sm",
  );

  const labelClasses = clsx("block text-xs font-medium text-gray-700");

  const errorClasses = clsx("text-red-500 text-xs");

  // const buttonClasses = (
  //   variant: "primary" | "secondary",
  //   disabled?: boolean,
  // ) =>
  //   clsx(
  //     "w-full py-3 text-base font-semibold text-white rounded-lg shadow-sm transition",
  //     {
  //       "bg-[#3B5BFE] hover:bg-[#2446d7]": variant === "primary" && !disabled,
  //       "bg-red-500 hover:bg-red-600": variant === "secondary" && !disabled,
  //       "opacity-50 cursor-not-allowed": disabled,
  //     },
  //   );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTypeDropdown(false);
      }
      if (
        funderDropdownRef.current &&
        !funderDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFunderDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch funders on component mount
  useEffect(() => {
    const fetchFunders = async () => {
      setFundersLoading(true);
      try {
        const fundersData = await getFunderList();
        setFunders(fundersData || []);
      } catch (err) {
        console.error('Failed to fetch funders:', err);
        setFunders([]);
      } finally {
        setFundersLoading(false);
      }
    };

    fetchFunders();
  }, []);

  useEffect(() => {
    const fetchUserFunders = async () => {
      if (isEdit && initialData?._id) {
        try {
          const fundersData = await getUserFunderList(initialData._id);
          if (fundersData) {
            // Ensure we have the correct structure for the form
            const funderList = fundersData.map((funder: any) => ({
              funder: { _id: funder._id, name: funder.name },
              role_list: funder.role_list || [],
              inactive: funder.inactive || false,
            }));
            setSelectedFunders(funderList);
          }
        } catch (error) {
          console.error('Error fetching user funders:', error);
        }
      }
    };

    fetchUserFunders();
  }, [isEdit, initialData?._id]);

  const initialValues = getInitialValues(initialData, selectedFunders, isEdit);

  const handleSubmit = async (values: FormValues) => {

    setLoading(true);
    setError("");

    try {
      // Do not send confirmPassword and isEdit to backend, but preserve funder_list
      const { confirmPassword, isEdit, password, _id, ...rest } = values;

      // For updates, exclude password field completely
      const submitData = isEdit
        ? {
          ...rest,
          funder_list: values.funder_list,
        }
        : {
          ...rest,
          password,
          funder_list: values.funder_list,
        };


      // Pass the user ID separately for updates
      const result = isEdit
        ? await (() => {
          if (!initialData?._id) {
            throw new Error('User ID is required for updates');
          }
          if (!onUpdate) {
            throw new Error('onUpdate function is required for updating users');
          }
          return onUpdate(initialData._id, submitData);
        })()
        : await (() => {
          if (!onCreate) {
            throw new Error('onCreate function is required for creating users');
          }
          return onCreate(submitData);
        })();

      if (result.success) {
        if (!isEdit && onSortReset) {
          onSortReset();
        }
        onCancel();
      } else {
        setError(result.error || `Failed to ${isEdit ? 'update' : 'create'} user`);
      }
    } catch (err: any) {
      const errorMessage = err.message || `Failed to ${isEdit ? 'update' : 'create'} user`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleFunderExpand = (funderId: string) => {
    setExpandedFunders((prev) =>
      prev.includes(funderId)
        ? prev.filter((id) => id !== funderId)
        : [...prev, funderId],
    );
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

  const handleFunderSelectChange = (
    selectedOptions: MultiValue<SelectOption>,
    setFieldValue: any,
  ) => {
    const selectedValues = (selectedOptions as SelectOption[]).map(option => {
      const funder = funders?.find((f) => f._id === option.value);
      return funder ? {
        funder: { _id: funder._id, name: funder.name },
        role_list: [],
        inactive: false,
      } : null;
    }).filter(Boolean);
    setFieldValue('funder_list', selectedValues);
  };

  return (
    <FormModalLayout
      title={isEdit ? "Update User" : "Create User"}
      subtitle={isEdit ? "Please update details below." : "Please enter user details below."}
      onCancel={onCancel}
      maxWidth={700}
    >
      <Formik<FormValues>
        initialValues={initialValues}
        validationSchema={Yup.object().shape({
          first_name: Yup.string().required("First name is required"),
          last_name: Yup.string().required("Last name is required"),
          email: Yup.string().email("Invalid email").required("Email is required"),
          password: Yup.string().when("isEdit", {
            is: false,
            then: () =>
              Yup.string()
                .required("Password is required")
                .min(6, "Password must be at least 6 characters"),
            otherwise: () => Yup.string(),
          }),
          confirmPassword: Yup.string().when("isEdit", {
            is: false,
            then: () =>
              Yup.string()
                .required("Confirm password is required")
                .oneOf([Yup.ref('password')], 'Passwords must match'),
            otherwise: () => Yup.string(),
          }),
          phone_mobile: Yup.string().required("Mobile phone is required"),
          funder_list: Yup.array().of(
            Yup.object().shape({
              funder: Yup.object().shape({
                _id: Yup.string().required(),
                name: Yup.string().required(),
              }),
              role_list: Yup.array().of(
                Yup.object().shape({
                  _id: Yup.string().required(),
                  name: Yup.string().required(),
                }),
              ),
              inactive: Yup.boolean(),
            }),
          ).min(1, "At least one funder is required"),
        })}
        onSubmit={async (values, formikHelpers) => {
          await handleSubmit(values);
        }}
        enableReinitialize
      >
        {({ values, setFieldValue, errors, touched }: FormikProps<FormValues>) => (
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
            {!isEdit && (
              <>
                <div className="w-full">
                  <label htmlFor="password" className={labelClasses}>Password</label>
                  <div className="relative">
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className={inputClasses}
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <HidePassword /> : <ShowPassword />}
                    </button>
                  </div>
                  <ErrorMessage name="password" component="div" className={errorClasses} />
                </div>
                <div className="w-full">
                  <label htmlFor="confirmPassword" className={labelClasses}>Confirm Password</label>
                  <div className="relative">
                    <Field
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className={inputClasses}
                      placeholder="Confirm Password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <HidePassword /> : <ShowPassword />}
                    </button>
                  </div>
                  <ErrorMessage name="confirmPassword" component="div" className={errorClasses} />
                </div>
              </>
            )}
            <div className="w-full">
              <label htmlFor="phone_mobile" className={labelClasses}>Mobile Phone</label>
              <div className="phone-input-wrapper">
                <PhoneInput
                  country={"us"}
                  value={values.phone_mobile}
                  onChange={(phone) => setFieldValue("phone_mobile", phone)}
                  inputClass="px-3 py-2 border rounded-lg focus:outline-none text-sm"
                  inputProps={{ name: "phone_mobile", required: true, autoFocus: false }}
                  dropdownStyle={{ zIndex: 999999 }}
                  containerStyle={{ zIndex: 999999 }}
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
                    dropdownStyle={{ zIndex: 99999 }}
                    containerStyle={{ zIndex: 99999 }}
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
                    dropdownStyle={{ zIndex: 99999 }}
                    containerStyle={{ zIndex: 99999 }}
                  />
                </div>
              </div>
            </div>
            <div className="w-full">
              <label className={labelClasses}>Select Funders</label>
              <Select
                isMulti
                name="funder_list"
                options={mapFundersToOptions(funders || [])}
                value={values.funder_list
                  .map((item: any) => {
                    // Handle different possible structures
                    let funderId: string;
                    if (item.funder && item.funder._id) {
                      funderId = item.funder._id;
                    } else if (item.value) {
                      funderId = item.value;
                    } else if (typeof item === 'string') {
                      funderId = item;
                    } else {
                      return null; // Skip invalid items
                    }
                    
                    const funder = funders?.find((f) => f._id === funderId);
                    return funder ? { value: funder._id, label: funder.name, email: funder.email || '' } : null;
                  })
                  .filter((option): option is SelectOption => option !== null)
                }
                onChange={(selected) => {
                  const selectedValues = (selected as SelectOption[]).map(option => {
                    const funder = funders?.find((f) => f._id === option.value);
                    return funder ? {
                      funder: { _id: funder._id, name: funder.name },
                      role_list: [],
                      inactive: false,
                    } : null;
                  }).filter(Boolean);
                  setFieldValue('funder_list', selectedValues);
                }}
                className="text-sm"
                classNamePrefix="select"
                placeholder="Select funders..."
                isSearchable
                isDisabled={fundersLoading}
                formatOptionLabel={(option: SelectOption) => (
                  <div title={option.email ? `Email: ${option.email}` : undefined}>{option.label}</div>
                )}
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
              <ErrorMessage name="funder_list" component="div" className={errorClasses} />
            </div>
            <div className="w-full">
              <label htmlFor="type" className={labelClasses}>User Type</label>
              <Field as="select" name="type" className={inputClasses}>
                <option value="funder_user">Funder User</option>
                <option value="funder_manager">Funder Manager</option>
              </Field>
              <ErrorMessage name="type" component="div" className={errorClasses} />
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
        )}
      </Formik>
    </FormModalLayout>
  );
};

export default UserForm;

