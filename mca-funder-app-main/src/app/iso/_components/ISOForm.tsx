import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import clsx from 'clsx';
import { normalizePhoneInput } from '@/lib/utils/format';
import { ISO } from '@/types/iso';
import { Representative } from '@/types/representative';
import { useEffect, useState } from 'react';
import { getISORepresentativeList } from '@/lib/api/isos';
import { getRepresentativeList } from '@/lib/api/representatives';
import Select, { MultiValue } from 'react-select';

interface SelectOption {
  value: string;
  label: string;
  email: string;
}

interface ISOFormData {
    name: string;
    email: string;
    phone?: string;
    website?: string;
    address_list?: Array<{
        address_1: string;
        address_2?: string;
        city: string;
        state: string;
        zip: string;
    }>;
    iso_detail?: {
        ein: string;
        entity_type: string;
        incorporation_date: string;
        state_of_incorporation: string;
    };
    representative_list?: Array<{
        representative: {
            _id: string;
            first_name: string;
            last_name: string;
            email: string;
        };
        inactive: boolean;
    }>;
}

interface ISOFormProps {
    initialValues?: Partial<ISOFormData>;
    onSubmit: (values: ISOFormData) => Promise<void>;
    error?: string;
    loading?: boolean;
    onCancel: () => void;
    showBusinessDetails?: boolean;
    mode: 'create' | 'update';
    isoId?: string;
}

// Initial values
const defaultInitialValues: ISOFormData = {
    name: '',
    email: '',
    phone: '',
    website: '',
    address_list: [],
    iso_detail: {
        ein: '',
        entity_type: 'C_CORP',
        incorporation_date: '',
        state_of_incorporation: '',
    },
    representative_list: []
};

// Utility function to map representatives to select options
const mapRepresentativesToOptions = (representatives: Representative[]): SelectOption[] => {
    return representatives.map((rep) => ({
        value: rep._id,
        label: `${rep.first_name} ${rep.last_name}`,
        email: rep.email || '',
    }));
};

export const ENTITY_TYPES = [
    { value: 'C_CORP', label: 'C Corporation' },
    { value: 'S_CORP', label: 'S Corporation' },
    { value: 'LLC', label: 'Limited Liability Company' },
    { value: 'PARTNERSHIP', label: 'Partnership' },
];

export const US_STATES = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'DC', label: 'District of Columbia' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' }
];

export default function ISOForm({ 
    initialValues,
    onSubmit, 
    error, 
    loading, 
    onCancel,
    showBusinessDetails = true,
    mode = 'create',
    isoId
}: ISOFormProps) {
    const [representatives, setRepresentatives] = useState<Representative[]>([]);
    const [loadingRepresentatives, setLoadingRepresentatives] = useState(false);
    const [representativesError, setRepresentativesError] = useState<string | null>(null);
    const [showBusinessDetailsSection, setShowBusinessDetailsSection] = useState(showBusinessDetails);
    const [showAddressSection, setShowAddressSection] = useState(true);

    // Fetch representatives when form is mounted
    useEffect(() => {
        const fetchRepresentatives = async () => {
            setLoadingRepresentatives(true);
            setRepresentativesError(null);
            try {
                const reps = await getRepresentativeList({ include_inactive: false });
                setRepresentatives(reps);
            } catch (err) {
                console.error('Error fetching representatives:', err);
                setRepresentativesError(err instanceof Error ? err.message : 'Failed to load representatives');
            } finally {
                setLoadingRepresentatives(false);
            }
        };
        fetchRepresentatives();
    }, [isoId, mode]);

    // Reusable className patterns
    const inputClasses = clsx(
        'w-full px-3 py-2 border rounded-lg focus:outline-none text-sm'
    );
    const labelClasses = clsx('block text-xs font-medium text-gray-700');
    const errorClasses = clsx('text-red-500 text-xs');

    // Create validation schema based on mode
    const validationSchema = Yup.object().shape({
        name: Yup.string().required('Name is required'),
        email: Yup.string().email('Invalid email').required('Email is required'),
        phone: Yup.string().required('Phone number is required'),
        website: Yup.string().url('Invalid website URL'),
        ...(mode === 'create' ? {
            iso_detail: Yup.object().shape({
                ein: Yup.string(),
                entity_type: Yup.string(),
                incorporation_date: Yup.string(),
                state_of_incorporation: Yup.string(),
            })
        } : {}),
        address_list: Yup.array().of(
            Yup.object().shape({
                address_1: Yup.string(),
                address_2: Yup.string(),
                city: Yup.string(),
                state: Yup.string(),
                zip: Yup.string(),
            })
        ),
        representative_list: Yup.array().of(
            Yup.object().shape({
                representative: Yup.object().shape({
                    _id: Yup.string().required(),
                    first_name: Yup.string().required(),
                    last_name: Yup.string().required(),
                    email: Yup.string().required(),
                }),
                inactive: Yup.boolean(),
            })
        ),
    });

    // Merge initial values with defaults
    const formInitialValues = {
        ...defaultInitialValues,
        ...initialValues,
    };

    return (
        <Formik
            initialValues={formInitialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
        >
            {({ values, setFieldValue, errors, touched }) => (
                <Form className="space-y-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium text-red-800">{error}</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className={labelClasses}>
                                Name
                            </label>
                            <Field
                                id="name"
                                name="name"
                                className={inputClasses}
                                placeholder="ISO Name"
                            />
                            <ErrorMessage name="name" component="div" className={errorClasses} />
                        </div>

                        <div>
                            <label htmlFor="email" className={labelClasses}>
                                Email
                            </label>
                            <Field
                                id="email"
                                name="email"
                                type="email"
                                className={inputClasses}
                                placeholder="Email"
                            />
                            <ErrorMessage name="email" component="div" className={errorClasses} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="phone" className={labelClasses}>
                                Phone
                            </label>
                            <div className="phone-input-wrapper">
                                <PhoneInput
                                    country={'us'}
                                    value={values.phone}
                                    onChange={(phone) => setFieldValue('phone', phone)}
                                    inputClass="px-3 py-2 border rounded-lg focus:outline-none text-sm"
                                    inputProps={{
                                        name: 'phone',
                                        required: true,
                                        autoFocus: false,
                                    }}
                                />
                            </div>
                            {errors.phone && touched.phone && (
                                <div className={errorClasses}>{errors.phone}</div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="website" className={labelClasses}>
                                Website
                            </label>
                            <Field
                                id="website"
                                name="website"
                                className={inputClasses}
                                placeholder="https://www.example.com"
                            />
                            <ErrorMessage name="website" component="div" className={errorClasses} />
                        </div>
                    </div>

                    {showBusinessDetails && (
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium">Business Details (Optional)</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowBusinessDetailsSection(!showBusinessDetailsSection)}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    {showBusinessDetailsSection ? 'Hide' : 'Show'} Business Details
                                </button>
                            </div>

                            {showBusinessDetailsSection && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="iso_detail.ein" className={labelClasses}>
                                            EIN
                                        </label>
                                        <Field
                                            id="iso_detail.ein"
                                            name="iso_detail.ein"
                                            className={inputClasses}
                                            placeholder="XX-XXXXXXX"
                                        />
                                        <ErrorMessage name="iso_detail.ein" component="div" className={errorClasses} />
                                    </div>

                                    <div>
                                        <label htmlFor="iso_detail.entity_type" className={labelClasses}>
                                            Entity Type
                                        </label>
                                        <Field
                                            as="select"
                                            id="iso_detail.entity_type"
                                            name="iso_detail.entity_type"
                                            className={inputClasses}
                                        >
                                            <option value="">Select entity type</option>
                                            {ENTITY_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </Field>
                                        <ErrorMessage name="iso_detail.entity_type" component="div" className={errorClasses} />
                                    </div>

                                    <div>
                                        <label htmlFor="iso_detail.incorporation_date" className={labelClasses}>
                                            Incorporation Date
                                        </label>
                                        <Field
                                            type="date"
                                            id="iso_detail.incorporation_date"
                                            name="iso_detail.incorporation_date"
                                            className={inputClasses}
                                        />
                                        <ErrorMessage name="iso_detail.incorporation_date" component="div" className={errorClasses} />
                                    </div>

                                    <div>
                                        <label htmlFor="iso_detail.state_of_incorporation" className={labelClasses}>
                                            State of Incorporation
                                        </label>
                                        <Field
                                            as="select"
                                            id="iso_detail.state_of_incorporation"
                                            name="iso_detail.state_of_incorporation"
                                            className={inputClasses}
                                        >
                                            <option value="">Select a state</option>
                                            {US_STATES.map(state => (
                                                <option key={state.value} value={state.value}>
                                                    {state.label}
                                                </option>
                                            ))}
                                        </Field>
                                        <ErrorMessage name="iso_detail.state_of_incorporation" component="div" className={errorClasses} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium">Address (Optional)</h3>
                            <button
                                type="button"
                                onClick={() => setShowAddressSection(!showAddressSection)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                {showAddressSection ? 'Hide' : 'Show'} Address
                            </button>
                        </div>

                        {showAddressSection && (
                            <div className="space-y-4">
                                {values.address_list && values.address_list.length > 0 ? (
                                    values.address_list.map((address, index) => (
                                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-sm font-medium">Address {index + 1}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newAddressList = values.address_list?.filter((_, i) => i !== index) || [];
                                                        setFieldValue('address_list', newAddressList);
                                                    }}
                                                    className="text-sm text-red-600 hover:text-red-800"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <div>
                                                <label htmlFor={`address_list.${index}.address_1`} className={labelClasses}>
                                                    Address Line 1
                                                </label>
                                                <Field
                                                    id={`address_list.${index}.address_1`}
                                                    name={`address_list.${index}.address_1`}
                                                    className={inputClasses}
                                                    placeholder="Street address"
                                                />
                                                <ErrorMessage name={`address_list.${index}.address_1`} component="div" className={errorClasses} />
                                            </div>

                                            <div className="mt-3">
                                                <label htmlFor={`address_list.${index}.address_2`} className={labelClasses}>
                                                    Address Line 2
                                                </label>
                                                <Field
                                                    id={`address_list.${index}.address_2`}
                                                    name={`address_list.${index}.address_2`}
                                                    className={inputClasses}
                                                    placeholder="Suite, unit, etc."
                                                />
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 mt-3">
                                                <div>
                                                    <label htmlFor={`address_list.${index}.city`} className={labelClasses}>
                                                        City
                                                    </label>
                                                    <Field
                                                        id={`address_list.${index}.city`}
                                                        name={`address_list.${index}.city`}
                                                        className={inputClasses}
                                                    />
                                                    <ErrorMessage name={`address_list.${index}.city`} component="div" className={errorClasses} />
                                                </div>

                                                <div>
                                                    <label htmlFor={`address_list.${index}.state`} className={labelClasses}>
                                                        State
                                                    </label>
                                                    <Field
                                                        as="select"
                                                        id={`address_list.${index}.state`}
                                                        name={`address_list.${index}.state`}
                                                        className={inputClasses}
                                                    >
                                                        <option value="">Select a state</option>
                                                        {US_STATES.map(state => (
                                                            <option key={state.value} value={state.value}>
                                                                {state.label}
                                                            </option>
                                                        ))}
                                                    </Field>
                                                    <ErrorMessage name={`address_list.${index}.state`} component="div" className={errorClasses} />
                                                </div>

                                                <div>
                                                    <label htmlFor={`address_list.${index}.zip`} className={labelClasses}>
                                                        ZIP Code
                                                    </label>
                                                    <Field
                                                        id={`address_list.${index}.zip`}
                                                        name={`address_list.${index}.zip`}
                                                        className={inputClasses}
                                                    />
                                                    <ErrorMessage name={`address_list.${index}.zip`} component="div" className={errorClasses} />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-gray-500">
                                        No addresses added yet.
                                    </div>
                                )}
                                
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newAddress = {
                                            address_1: '',
                                            address_2: '',
                                            city: '',
                                            state: '',
                                            zip: '',
                                        };
                                        const newAddressList = [...(values.address_list || []), newAddress];
                                        setFieldValue('address_list', newAddressList);
                                    }}
                                    className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
                                >
                                    + Add Address
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-medium mb-3">Representatives</h3>
                        <div>
                            <label className={labelClasses}>
                                Select Representatives
                            </label>
                            {loadingRepresentatives ? (
                                <div className="text-sm text-gray-500">Loading representatives...</div>
                            ) : representativesError ? (
                                <div className="text-sm text-red-500">
                                    Error loading representatives: {representativesError}
                                </div>
                            ) : representatives.length > 0 ? (
                                <Select
                                    isMulti
                                    name="representative_list"
                                    options={mapRepresentativesToOptions(representatives)}
                                    value={values.representative_list
                                        ?.map((item: any) => {
                                            // Handle different possible structures
                                            let repId: string;
                                            if (item.representative && item.representative._id) {
                                                repId = item.representative._id;
                                            } else if (item.value) {
                                                repId = item.value;
                                            } else if (typeof item === 'string') {
                                                repId = item;
                                            } else {
                                                return null; // Skip invalid items
                                            }
                                            
                                            const rep = representatives?.find((r) => r._id === repId);
                                            return rep ? { 
                                                value: rep._id, 
                                                label: `${rep.first_name} ${rep.last_name}`, 
                                                email: rep.email || '' 
                                            } : null;
                                        })
                                        .filter((option): option is SelectOption => option !== null) || []
                                    }
                                    onChange={(selected) => {
                                        const selectedValues = (selected as SelectOption[]).map(option => {
                                            const rep = representatives?.find((r) => r._id === option.value);
                                            return rep ? {
                                                representative: { 
                                                    _id: rep._id, 
                                                    first_name: rep.first_name, 
                                                    last_name: rep.last_name, 
                                                    email: rep.email 
                                                },
                                                inactive: false,
                                            } : null;
                                        }).filter(Boolean);
                                        setFieldValue('representative_list', selectedValues);
                                    }}
                                    className="text-sm"
                                    classNamePrefix="select"
                                    placeholder="Select representatives..."
                                    isSearchable
                                    isDisabled={loadingRepresentatives}
                                    formatOptionLabel={(option: SelectOption) => (
                                        <div title={option.email ? `Email: ${option.email}` : undefined}>
                                            {option.label}
                                        </div>
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
                            ) : (
                                <div className="text-sm text-red-500">
                                    No representatives available. Please add representatives first.
                                </div>
                            )}
                            <ErrorMessage name="representative_list" component="div" className={errorClasses} />
                        </div>
                    </div>

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-1 sm:text-sm"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
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