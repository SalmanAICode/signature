import { CardSection, CardField } from '@/components/Card';
import { Funder } from '@/types/funder';
import { 
  PencilIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// Import custom SVG icons
import Profile from '@/svg/Profile';
import Email from '@/svg/Email';
import Mobile from '@/svg/Mobile';
import User from '@/svg/User';

// Entity Types - matching backend enum values
const ENTITY_TYPES = [
  { value: 'SOLE_PROP', label: 'Sole Proprietorship' },
  { value: 'GEN_PART', label: 'General Partnership' },
  { value: 'LTD_PART', label: 'Limited Partnership (LP)' },
  { value: 'LLP', label: 'Limited Liability Partnership (LLP)' },
  { value: 'LLC', label: 'Limited Liability Company (LLC)' },
  { value: 'PLLC', label: 'Professional Limited Liability Company (PLLC)' },
  { value: 'C_CORP', label: 'C Corporation' },
  { value: 'S_CORP', label: 'S Corporation' },
  { value: 'B_CORP', label: 'Benefit Corporation (B Corp)' },
  { value: 'CLOSE_CORP', label: 'Close Corporation' },
  { value: 'P_CORP', label: 'Professional Corporation (PC)' },
  { value: 'NONPROFIT', label: 'Nonprofit Corporation' },
  { value: 'COOP', label: 'Cooperative' }
];

// Utility function to map funders to select options
export const mapFundersToOptions = (funders: Funder[]) => {
  return funders
    .filter((funder) => funder._id && funder._id.trim())
    .filter((funder, index, self) => index === self.findIndex(f => f._id === funder._id))
    .map((funder) => ({
      value: funder._id,
      label: funder.name,
      title: `ID: ${funder._id}`
    }));
};

// Create Modal Card Sections Configuration
export const getCreateModalCardSections = (
  handleInputChange: (value: any, field: CardField) => void,
  funders: Funder[],
  loadingFunders: boolean
): CardSection[] => [
  {
    title: 'Basic Information',
    priority: 'high',
    rows: [
      {
        fields: [
          {
            key: 'name',
            label: 'Business Name',
            type: 'text-input',
            priority: 'high',
            required: true,
            placeholder: 'Enter syndicator business name',
            onChange: handleInputChange,
            width: 100
          }
        ]
      }
    ]
  },
  {
    title: 'Personal Information',
    priority: 'high',
    rows: [
      {
        fields: [
          {
            key: 'first_name',
            label: 'First Name',
            type: 'text-input',
            priority: 'medium',
            placeholder: 'Enter first name',
            onChange: handleInputChange,
            width: 50
          },
          {
            key: 'last_name',
            label: 'Last Name',
            type: 'text-input',
            priority: 'medium',
            placeholder: 'Enter last name',
            onChange: handleInputChange,
            width: 50
          }
        ]
      }
    ]
  },
  {
    title: 'Contact Information',
    priority: 'high',
    rows: [
      {
        fields: [
          {
            key: 'email',
            label: 'Email Address',
            type: 'email-input',
            priority: 'high',
            placeholder: 'Enter email address',
            onChange: handleInputChange,
            width: 100
          }
        ]
      },
      {
        fields: [
          {
            key: 'phone_mobile',
            label: 'Mobile Phone',
            type: 'tel-input',
            priority: 'medium',
            placeholder: '(555) 123-4567',
            onChange: handleInputChange,
            width: 33
          },
          {
            key: 'phone_work',
            label: 'Work Phone',
            type: 'tel-input',
            priority: 'medium',
            placeholder: '(555) 123-4567',
            onChange: handleInputChange,
            width: 33
          },
          {
            key: 'phone_home',
            label: 'Home Phone',
            type: 'tel-input',
            priority: 'medium',
            placeholder: '(555) 123-4567',
            onChange: handleInputChange,
            width: 34
          }
        ]
      }
    ]
  },
  {
    title: 'Address Information',
    priority: 'medium',
    rows: [
      {
        fields: [
          {
            key: 'address_detail.address_1',
            label: 'Address Line 1',
            type: 'text-input',
            priority: 'medium',
            placeholder: 'Enter street address',
            onChange: handleInputChange,
            width: 100
          }
        ]
      },
      {
        fields: [
          {
            key: 'address_detail.address_2',
            label: 'Address Line 2',
            type: 'text-input',
            priority: 'low',
            placeholder: 'Apartment, suite, etc. (optional)',
            onChange: handleInputChange,
            width: 100
          }
        ]
      },
      {
        fields: [
          {
            key: 'address_detail.city',
            label: 'City',
            type: 'text-input',
            priority: 'medium',
            placeholder: 'Enter city',
            onChange: handleInputChange,
            width: 50
          },
          {
            key: 'address_detail.state',
            label: 'State',
            type: 'text-input',
            priority: 'medium',
            placeholder: 'CA',
            maxLength: 2,
            onChange: handleInputChange,
            width: 25
          },
          {
            key: 'address_detail.zip',
            label: 'ZIP Code',
            type: 'text-input',
            priority: 'medium',
            placeholder: '12345',
            maxLength: 10,
            onChange: handleInputChange,
            width: 25
          }
        ]
      }
    ]
  },
  {
    title: 'Business Details',
    priority: 'low',
    rows: [
      {
        fields: [
          {
            key: 'business_detail.ein',
            label: 'EIN (Employer Identification Number)',
            type: 'text-input',
            priority: 'medium',
            placeholder: 'XX-XXXXXXX',
            onChange: handleInputChange,
            width: 50
          },
          {
            key: 'business_detail.entity_type',
            label: 'Entity Type',
            type: 'select-input',
            priority: 'medium',
            placeholder: 'Select entity type',
            isMultiSelect: false,
            searchable: true,
            options: ENTITY_TYPES,
            onChange: handleInputChange,
            width: 50
          }
        ]
      },
      {
        fields: [
          {
            key: 'business_detail.incorporation_date',
            label: 'Incorporation Date',
            type: 'date-input',
            priority: 'low',
            onChange: handleInputChange,
            width: 50
          },
          {
            key: 'business_detail.incorporation_state',
            label: 'Incorporation State',
            type: 'text-input',
            priority: 'low',
            placeholder: 'CA',
            maxLength: 2,
            onChange: handleInputChange,
            width: 25
          },
          {
            key: 'business_detail.state_of_incorporation',
            label: 'State of Incorporation',
            type: 'text-input',
            priority: 'low',
            placeholder: 'CA',
            maxLength: 2,
            onChange: handleInputChange,
            width: 25
          }
        ]
      }
    ]
  },
  {
    title: 'Personal Details',
    priority: 'medium',
    rows: [
      {
        fields: [
          {
            key: 'birthday',
            label: 'Birthday',
            type: 'date-input',
            priority: 'medium',
            onChange: handleInputChange,
            width: 50
          },
          {
            key: 'ssn',
            label: 'Social Security Number',
            type: 'text-input',
            priority: 'medium',
            placeholder: 'XXX-XX-XXXX',
            onChange: handleInputChange,
            width: 50
          }
        ]
      }
    ]
  },
  {
    title: "Driver's License Information",
    priority: 'low',
    rows: [
      {
        fields: [
          {
            key: 'drivers_license_number',
            label: "Driver's License Number",
            type: 'text-input',
            priority: 'low',
            placeholder: 'Enter license number',
            onChange: handleInputChange,
            width: 100
          }
        ]
      },
      {
        fields: [
          {
            key: 'dln_issue_date',
            label: 'Issue Date',
            type: 'date-input',
            priority: 'low',
            onChange: handleInputChange,
            width: 50
          },
          {
            key: 'dln_issue_state',
            label: 'Issue State',
            type: 'text-input',
            priority: 'low',
            placeholder: 'CA',
            maxLength: 2,
            onChange: handleInputChange,
            width: 50
          }
        ]
      }
    ]
  },
  {
    title: 'Account Information',
    priority: 'high',
    rows: [
      {
        fields: [
          {
            key: 'password',
            label: 'Password',
            type: 'password-input',
            priority: 'high',
            placeholder: 'Enter password',
            onChange: handleInputChange,
            width: 100
          }
        ]
      },
      {
        fields: [
          {
            key: 'funder_list',
            label: 'Select Funders',
            type: 'select-input',
            priority: 'high',
            placeholder: 'Select funders...',
            isMultiSelect: true,
            searchable: true,
            isLoading: loadingFunders,
            disabled: loadingFunders,
            options: mapFundersToOptions(funders),
            onChange: handleInputChange,
            width: 100
          }
        ]
      }
    ]
  }
];

// Detail Modal Card Sections Configuration
export const getDetailModalCardSections = (): CardSection[] => [
  {
    title: 'Basic Information',
    description: 'Core identity and account details',
    priority: 'high',
    icon: Profile,
    collapsible: true,
    defaultCollapsed: false,
    rows: [
      {
        fields: [
          { 
            key: '_id', 
            label: 'Syndicator ID', 
            type: 'text', 
            priority: 'medium', 
            icon: InformationCircleIcon,
            copyable: true,
            width: 100
          }
        ]
      },
      {
        fields: [
          { 
            key: 'name', 
            label: 'Business Name', 
            type: 'text', 
            priority: 'high', 
            required: true,
            icon: InformationCircleIcon,
            copyable: true,
            width: 100
          }
        ]
      },
      {
        fields: [
          {
            key: 'first_name',
            label: 'First Name',
            type: 'text',
            priority: 'high',
            icon: User,
            copyable: true,
            width: 50
          },
          {
            key: 'last_name', 
            label: 'Last Name',
            type: 'text',
            priority: 'high',
            icon: User,
            copyable: true,
            width: 50
          }
        ]
      },
      {
        fields: [
          {
            key: 'email',
            label: 'Email Address',
            type: 'email',
            priority: 'high',
            icon: Email,
            copyable: true,
            width: 100
          }
        ]
      },
      {
        fields: [
          {
            key: 'active',
            label: 'Account Status',
            type: 'boolean',
            priority: 'medium',
            icon: InformationCircleIcon,
            width: 34
          },
          {
            key: 'createdAt',
            label: 'Created Date',
            type: 'date',
            priority: 'medium',
            icon: InformationCircleIcon,
            width: 33
          },
          {
            key: 'updatedAt',
            label: 'Last Updated',
            type: 'date',
            priority: 'medium',
            icon: InformationCircleIcon,
            width: 33
          }
        ]
      }
    ]
  },
  {
    title: 'Contact Information',
    description: 'Phone numbers and communication methods',
    priority: 'high',
    icon: Mobile,
    collapsible: true,
    defaultCollapsed: true,
    rows: [
      {
        fields: [
          {
            key: 'phone_mobile',
            label: 'Mobile Phone',
            type: 'phone',
            priority: 'high',
            icon: Mobile,
            copyable: true,
            width: 50
          },
          {
            key: 'phone_work',
            label: 'Work Phone',
            type: 'phone',
            priority: 'medium',
            icon: Mobile,
            copyable: true,
            width: 50
          }
        ]
      }
    ]
  },
  {
    title: 'Driver License Information',
    description: 'Government identification details',
    priority: 'low',
    icon: InformationCircleIcon,
    collapsible: true,
    defaultCollapsed: true,
    rows: [
      {
        fields: [
          {
            key: 'dln_issue_date',
            label: 'License Issue Date',
            type: 'date',
            priority: 'low',
            icon: InformationCircleIcon,
            width: 100
          }
        ]
      }
    ]
  },
  {
    title: 'Account & Activity Statistics',
    description: 'Key metrics and activity indicators',
    priority: 'medium',
    collapsible: true,
    defaultCollapsed: true,
    icon: InformationCircleIcon,
    rows: [
      {
        fields: [
          {
            key: 'funder_count',
            label: 'Total Funders',
            type: 'number',
            priority: 'high',
            icon: InformationCircleIcon,
            width: 34
          },
          {
            key: 'account_count',
            label: 'Account Count',
            type: 'number',
            priority: 'medium',
            icon: InformationCircleIcon,
            width: 33
          },
          {
            key: 'access_log_count',
            label: 'Access Logs',
            type: 'number',
            priority: 'low',
            icon: InformationCircleIcon,
            width: 33
          }
        ]
      }
    ],
    children: [
      {
        title: 'Syndication Offers',
        description: 'Offer counts and status breakdown',
        priority: 'medium',
        collapsible: true,
        defaultCollapsed: true,
        icon: InformationCircleIcon,
        rows: [
          {
            fields: [
              {
                key: 'syndication_offer_count',
                label: 'Total Offers',
                type: 'number',
                priority: 'medium',
                icon: InformationCircleIcon,
                width: 50
              },
              {
                key: 'pending_syndication_offer_count',
                label: 'Pending',
                type: 'number',
                priority: 'high',
                icon: InformationCircleIcon,
                width: 50
              }
            ]
          },
          {
            fields: [
              {
                key: 'accepted_syndication_offer_count',
                label: 'Accepted',
                type: 'number',
                priority: 'medium',
                icon: InformationCircleIcon,
                width: 34
              },
              {
                key: 'declined_syndication_offer_count',
                label: 'Declined',
                type: 'number',
                priority: 'low',
                icon: InformationCircleIcon,
                width: 33
              },
              {
                key: 'cancelled_syndication_offer_count',
                label: 'Cancelled',
                type: 'number',
                priority: 'low',
                icon: InformationCircleIcon,
                width: 33
              }
            ]
          }
        ]
      },
      {
        title: 'Offer Amounts',
        description: 'Financial values of syndication offers',
        priority: 'medium',
        collapsible: true,
        defaultCollapsed: true,
        icon: InformationCircleIcon,
        rows: [
          {
            fields: [
              {
                key: 'syndication_offer_amount',
                label: 'Total Amount',
                type: 'currency',
                priority: 'medium',
                icon: InformationCircleIcon,
                width: 50
              },
              {
                key: 'pending_syndication_offer_amount',
                label: 'Pending Amount',
                type: 'currency',
                priority: 'high',
                icon: InformationCircleIcon,
                width: 50
              }
            ]
          },
          {
            fields: [
              {
                key: 'accepted_syndication_offer_amount',
                label: 'Accepted Amount',
                type: 'currency',
                priority: 'medium',
                icon: InformationCircleIcon,
                width: 34
              },
              {
                key: 'declined_syndication_offer_amount',
                label: 'Declined Amount',
                type: 'currency',
                priority: 'low',
                icon: InformationCircleIcon,
                width: 33
              },
              {
                key: 'cancelled_syndication_offer_amount',
                label: 'Cancelled Amount',
                type: 'currency',
                priority: 'low',
                icon: InformationCircleIcon,
                width: 33
              }
            ]
          }
        ]
      },
      {
        title: 'Syndication Portfolio',
        description: 'Active and closed syndication summary',
        priority: 'medium',
        collapsible: true,
        defaultCollapsed: true,
        icon: InformationCircleIcon,
        rows: [
          {
            fields: [
              {
                key: 'syndication_count',
                label: 'Total Count',
                type: 'number',
                priority: 'medium',
                icon: InformationCircleIcon,
                width: 34
              },
              {
                key: 'active_syndication_count',
                label: 'Active',
                type: 'number',
                priority: 'high',
                icon: InformationCircleIcon,
                width: 33
              },
              {
                key: 'closed_syndication_count',
                label: 'Closed',
                type: 'number',
                priority: 'medium',
                icon: InformationCircleIcon,
                width: 33
              }
            ]
          },
          {
            fields: [
              {
                key: 'syndication_amount',
                label: 'Total Portfolio Value',
                type: 'currency',
                priority: 'high',
                icon: InformationCircleIcon,
                width: 100
              }
            ]
          },
          {
            fields: [
              {
                key: 'active_syndication_amount',
                label: 'Active Portfolio Value',
                type: 'currency',
                priority: 'high',
                icon: InformationCircleIcon,
                width: 50
              },
              {
                key: 'closed_syndication_amount',
                label: 'Closed Portfolio Value',
                type: 'currency',
                priority: 'medium',
                icon: InformationCircleIcon,
                width: 50
              }
            ]
          }
        ]
      },
      {
        title: 'System Information',
        description: 'Technical metadata and version info',
        priority: 'low',
        collapsible: true,
        defaultCollapsed: true,
        icon: InformationCircleIcon,
        rows: [
          {
            fields: [
              {
                key: '_calculatedStatsComplete',
                label: 'Stats Calculated',
                type: 'boolean',
                priority: 'low',
                icon: InformationCircleIcon,
                width: 70
              },
              {
                key: '__v',
                label: 'Version',
                type: 'number',
                priority: 'low',
                icon: InformationCircleIcon,
                width: 30
              }
            ]
          }
        ]
      }
    ]
  }
];

// Update Modal Card Sections Configuration
export const getUpdateModalCardSections = (
  handleInputChange: (value: any, field: CardField) => void
): CardSection[] => [
  {
    title: 'Basic Information',
    priority: 'high',
    rows: [
      {
        fields: [
          {
            key: 'name',
            label: 'Business Name',
            type: 'text-input',
            priority: 'high',
            required: true,
            placeholder: 'Enter syndicator business name',
            onChange: handleInputChange,
            width: 100
          }
        ]
      },
      {
        fields: [
          {
            key: 'inactive',
            label: 'Account Status',
            type: 'boolean-input',
            priority: 'medium',
            switchLabel: 'Mark as Inactive',
            description: 'Toggle to activate/deactivate this syndicator account',
            onChange: handleInputChange,
            width: 100
          }
        ]
      }
    ]
  },
  {
    title: 'Personal Information',
    priority: 'high',
    rows: [
      {
        fields: [
          {
            key: 'first_name',
            label: 'First Name',
            type: 'text-input',
            priority: 'medium',
            placeholder: 'Enter first name',
            onChange: handleInputChange,
            width: 50
          },
          {
            key: 'last_name',
            label: 'Last Name',
            type: 'text-input',
            priority: 'medium',
            placeholder: 'Enter last name',
            onChange: handleInputChange,
            width: 50
          }
        ]
      }
    ]
  },
  {
    title: 'Contact Information',
    priority: 'high',
    rows: [
      {
        fields: [
          {
            key: 'email',
            label: 'Email Address',
            type: 'email-input',
            priority: 'high',
            placeholder: 'Enter email address',
            onChange: handleInputChange,
            width: 100
          }
        ]
      },
      {
        fields: [
          {
            key: 'phone_mobile',
            label: 'Mobile Phone',
            type: 'tel-input',
            priority: 'medium',
            placeholder: '(555) 123-4567',
            onChange: handleInputChange,
            width: 33
          },
          {
            key: 'phone_work',
            label: 'Work Phone',
            type: 'tel-input',
            priority: 'medium',
            placeholder: '(555) 123-4567',
            onChange: handleInputChange,
            width: 33
          },
          {
            key: 'phone_home',
            label: 'Home Phone',
            type: 'tel-input',
            priority: 'medium',
            placeholder: '(555) 123-4567',
            onChange: handleInputChange,
            width: 34
          }
        ]
      }
    ]
  },
  {
    title: 'Address Information',
    priority: 'medium',
    rows: [
      {
        fields: [
          {
            key: 'address_detail.address_1',
            label: 'Address Line 1',
            type: 'text-input',
            priority: 'medium',
            placeholder: 'Enter street address',
            onChange: handleInputChange,
            width: 100
          }
        ]
      },
      {
        fields: [
          {
            key: 'address_detail.address_2',
            label: 'Address Line 2',
            type: 'text-input',
            priority: 'low',
            placeholder: 'Apartment, suite, etc. (optional)',
            onChange: handleInputChange,
            width: 100
          }
        ]
      },
      {
        fields: [
          {
            key: 'address_detail.city',
            label: 'City',
            type: 'text-input',
            priority: 'medium',
            placeholder: 'Enter city',
            onChange: handleInputChange,
            width: 50
          },
          {
            key: 'address_detail.state',
            label: 'State',
            type: 'text-input',
            priority: 'medium',
            placeholder: 'CA',
            maxLength: 2,
            onChange: handleInputChange,
            width: 25
          },
          {
            key: 'address_detail.zip',
            label: 'ZIP Code',
            type: 'text-input',
            priority: 'medium',
            placeholder: '12345',
            maxLength: 10,
            onChange: handleInputChange,
            width: 25
          }
        ]
      }
    ]
  },
  {
    title: 'Business Details',
    priority: 'medium',
    rows: [
      {
        fields: [
          {
            key: 'business_detail.ein',
            label: 'EIN (Employer Identification Number)',
            type: 'text-input',
            priority: 'medium',
            placeholder: 'XX-XXXXXXX',
            onChange: handleInputChange,
            width: 50
          },
          {
            key: 'business_detail.entity_type',
            label: 'Entity Type',
            type: 'select-input',
            priority: 'medium',
            placeholder: 'Select entity type',
            isMultiSelect: false,
            searchable: true,
            options: ENTITY_TYPES,
            onChange: handleInputChange,
            width: 50
          }
        ]
      },
      {
        fields: [
          {
            key: 'business_detail.incorporation_date',
            label: 'Incorporation Date',
            type: 'date-input',
            priority: 'low',
            onChange: handleInputChange,
            width: 50
          },
          {
            key: 'business_detail.incorporation_state',
            label: 'Incorporation State',
            type: 'text-input',
            priority: 'low',
            placeholder: 'CA',
            maxLength: 2,
            onChange: handleInputChange,
            width: 25
          },
          {
            key: 'business_detail.state_of_incorporation',
            label: 'State of Incorporation',
            type: 'text-input',
            priority: 'low',
            placeholder: 'CA',
            maxLength: 2,
            onChange: handleInputChange,
            width: 25
          }
        ]
      }
    ]
  },
  {
    title: 'Personal Details',
    priority: 'medium',
    rows: [
      {
        fields: [
          {
            key: 'birthday',
            label: 'Birthday',
            type: 'date-input',
            priority: 'medium',
            onChange: handleInputChange,
            width: 50
          },
          {
            key: 'ssn',
            label: 'Social Security Number',
            type: 'text-input',
            priority: 'medium',
            placeholder: 'XXX-XX-XXXX',
            onChange: handleInputChange,
            width: 50
          }
        ]
      }
    ]
  },
  {
    title: "Driver's License Information",
    priority: 'low',
    rows: [
      {
        fields: [
          {
            key: 'drivers_license_number',
            label: "Driver's License Number",
            type: 'text-input',
            priority: 'low',
            placeholder: 'Enter license number',
            onChange: handleInputChange,
            width: 100
          }
        ]
      },
      {
        fields: [
          {
            key: 'dln_issue_date',
            label: 'Issue Date',
            type: 'date-input',
            priority: 'low',
            onChange: handleInputChange,
            width: 50
          },
          {
            key: 'dln_issue_state',
            label: 'Issue State',
            type: 'text-input',
            priority: 'low',
            placeholder: 'CA',
            maxLength: 2,
            onChange: handleInputChange,
            width: 50
          }
        ]
      }
    ]
  }
];

// New configuration for syndicator detail page with stats and funders
export const getSyndicatorDetailCardSections = (): CardSection[] => [
  {
    title: 'Basic Information',
    description: 'Core syndicator details',
    priority: 'high',
    icon: UserIcon,
    collapsible: false,
    rows: [
      {
        fields: [
          {
            key: 'name',
            label: 'Name',
            type: 'text',
            priority: 'high',
            width: 100
          }
        ]
      },
      {
        fields: [
          {
            key: 'first_name',
            label: 'First Name',
            type: 'text',
            priority: 'high',
            width: 33
          },
          {
            key: 'last_name',
            label: 'Last Name',
            type: 'text',
            priority: 'high',
            width: 33
          },
          {
            key: 'active',
            label: 'Status',
            type: 'boolean',
            priority: 'high',
            width: 34
          }
        ]
      },
      {
        fields: [
          {
            key: 'email',
            label: 'Email',
            type: 'email',
            priority: 'high',
            width: 100
          }
        ]
      },
      {
        fields: [
          {
            key: 'phone_mobile',
            label: 'Mobile Phone',
            type: 'phone',
            priority: 'medium',
            width: 50
          },
          {
            key: 'phone_work',
            label: 'Work Phone',
            type: 'phone',
            priority: 'medium',
            width: 50
          }
        ]
      },
      {
        fields: [
          {
            key: 'birthday',
            label: 'Birthday',
            type: 'date',
            priority: 'medium',
            width: 50
          },
          {
            key: 'dln_issue_date',
            label: 'DLN Issue Date',
            type: 'date',
            priority: 'medium',
            width: 50
          }
        ]
      },
      {
        fields: [
          {
            key: 'dln_issue_state',
            label: 'DLN Issue State',
            type: 'text',
            priority: 'medium',
            width: 100
          }
        ]
      }
    ]
  },
  {
    title: 'Address Information',
    description: 'Physical address details',
    priority: 'high',
    icon: InformationCircleIcon,
    collapsible: true,
    defaultCollapsed: false,
    rows: [
      {
        fields: [
          {
            key: 'address_detail.address_1',
            label: 'Address Line 1',
            type: 'text',
            priority: 'high',
            width: 50
          },
          {
            key: 'address_detail.address_2',
            label: 'Address Line 2',
            type: 'text',
            priority: 'medium',
            width: 50
          }
        ]
      },
      {
        fields: [
          {
            key: 'address_detail.city',
            label: 'City',
            type: 'text',
            priority: 'high',
            width: 33
          },
          {
            key: 'address_detail.state',
            label: 'State',
            type: 'text',
            priority: 'high',
            width: 33
          },
          {
            key: 'address_detail.zip',
            label: 'ZIP Code',
            type: 'text',
            priority: 'high',
            width: 34
          }
        ]
      }
    ]
  },
  {
    title: 'Business Information',
    description: 'Corporate and business entity details',
    priority: 'high',
    icon: ChartBarIcon,
    collapsible: true,
    defaultCollapsed: false,
    rows: [
      {
        fields: [
          {
            key: 'business_detail.ein',
            label: 'EIN',
            type: 'text',
            priority: 'high',
            copyable: true,
            width: 50
          },
          {
            key: 'business_detail.entity_type',
            label: 'Entity Type',
            type: 'text',
            priority: 'high',
            width: 50
          }
        ]
      },
      {
        fields: [
          {
            key: 'business_detail.incorporation_date',
            label: 'Incorporation Date',
            type: 'date',
            priority: 'high',
            width: 50
          },
          {
            key: 'business_detail.state_of_incorporation',
            label: 'State of Incorporation',
            type: 'text',
            priority: 'high',
            width: 50
          }
        ]
      }
    ]
  },
  {
    title: 'Statistics Overview',
    description: 'Key metrics and counts',
    priority: 'high',
    icon: ChartBarIcon,
    collapsible: true,
    defaultCollapsed: false,
    rows: [
      {
        fields: [
          {
            key: 'funder_count',
            label: 'Total Funders',
            type: 'number',
            priority: 'high',
            width: 25
          },
          {
            key: 'account_count',
            label: 'Accounts',
            type: 'number',
            priority: 'high',
            width: 25
          },
          {
            key: 'syndication_count',
            label: 'Total Syndications',
            type: 'number',
            priority: 'high',
            width: 25
          },
          {
            key: 'access_log_count',
            label: 'Access Logs',
            type: 'number',
            priority: 'medium',
            width: 25
          }
        ]
      },
      {
        fields: [
          {
            key: 'active_syndication_count',
            label: 'Active Syndications',
            type: 'number',
            priority: 'high',
            width: 50
          },
          {
            key: 'closed_syndication_count',
            label: 'Closed Syndications',
            type: 'number',
            priority: 'high',
            width: 50
          }
        ]
      }
    ]
  },
  {
    title: 'Syndication Offers',
    description: 'Offer statistics and amounts',
    priority: 'medium',
    icon: DocumentTextIcon,
    collapsible: true,
    defaultCollapsed: false,
    rows: [
      {
        fields: [
          {
            key: 'syndication_offer_count',
            label: 'Total Offers',
            type: 'number',
            priority: 'high',
            width: 20
          },
          {
            key: 'pending_syndication_offer_count',
            label: 'Pending',
            type: 'number',
            priority: 'medium',
            width: 20
          },
          {
            key: 'accepted_syndication_offer_count',
            label: 'Accepted',
            type: 'number',
            priority: 'medium',
            width: 20
          },
          {
            key: 'declined_syndication_offer_count',
            label: 'Declined',
            type: 'number',
            priority: 'medium',
            width: 20
          },
          {
            key: 'cancelled_syndication_offer_count',
            label: 'Cancelled',
            type: 'number',
            priority: 'medium',
            width: 20
          }
        ]
      },
      {
        fields: [
          {
            key: 'syndication_offer_amount',
            label: 'Total Amount',
            type: 'currency',
            priority: 'high',
            width: 20
          },
          {
            key: 'pending_syndication_offer_amount',
            label: 'Pending Amount',
            type: 'currency',
            priority: 'medium',
            width: 20
          },
          {
            key: 'accepted_syndication_offer_amount',
            label: 'Accepted Amount',
            type: 'currency',
            priority: 'medium',
            width: 20
          },
          {
            key: 'declined_syndication_offer_amount',
            label: 'Declined Amount',
            type: 'currency',
            priority: 'medium',
            width: 20
          },
          {
            key: 'cancelled_syndication_offer_amount',
            label: 'Cancelled Amount',
            type: 'currency',
            priority: 'medium',
            width: 20
          }
        ]
      }
    ]
  },
  {
    title: 'Syndication Amounts',
    description: 'Financial syndication data',
    priority: 'medium',
    icon: CurrencyDollarIcon,
    collapsible: true,
    defaultCollapsed: false,
    rows: [
      {
        fields: [
          {
            key: 'syndication_amount',
            label: 'Total Syndication Amount',
            type: 'currency',
            priority: 'high',
            width: 33
          },
          {
            key: 'active_syndication_amount',
            label: 'Active Amount',
            type: 'currency',
            priority: 'high',
            width: 33
          },
          {
            key: 'closed_syndication_amount',
            label: 'Closed Amount',
            type: 'currency',
            priority: 'high',
            width: 34
          }
        ]
      }
    ]
  },
  {
    title: 'Associated Funders',
    description: 'Connected funders and their details',
    priority: 'high',
    icon: InformationCircleIcon,
    collapsible: true,
    defaultCollapsed: false,
    rows: [
      {
        fields: [
          {
            key: 'syndicator_funders',
            label: 'Funder Relationships',
            type: 'array',
            priority: 'high',
            collapsible: true,
            defaultCollapsed: false,
            width: 100,
            rows: [
              {
                fields: [
                  {
                    key: 'funder.name',
                    label: 'Funder Name',
                    type: 'text',
                    priority: 'high',
                    width: 30
                  },
                  {
                    key: 'funder.email',
                    label: 'Email',
                    type: 'email',
                    priority: 'medium',
                    width: 30
                  },
                  {
                    key: 'funder.phone',
                    label: 'Phone',
                    type: 'phone',
                    priority: 'medium',
                    width: 20
                  },
                  {
                    key: 'available_balance',
                    label: 'Available Balance',
                    type: 'currency',
                    priority: 'high',
                    width: 20
                  }
                ]
              },
              {
                fields: [
                  {
                    key: 'payout_frequency',
                    label: 'Payout Frequency',
                    type: 'text',
                    priority: 'medium',
                    width: 50
                  },
                  {
                    key: 'active',
                    label: 'Active',
                    type: 'boolean',
                    priority: 'medium',
                    width: 50
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    title: 'System Information',
    description: 'Timestamps and system data',
    priority: 'low',
    icon: ClockIcon,
    collapsible: true,
    defaultCollapsed: true,
    rows: [
      {
        fields: [
          {
            key: '_id',
            label: 'System ID',
            type: 'text',
            priority: 'low',
            copyable: true,
            width: 100
          }
        ]
      },
      {
        fields: [
          {
            key: 'created_date',
            label: 'Created Date',
            type: 'datetime',
            priority: 'low',
            width: 33
          },
          {
            key: 'updated_date',
            label: 'Updated Date',
            type: 'datetime',
            priority: 'low',
            width: 33
          },
          {
            key: 'updatedAt',
            label: 'Last Modified',
            type: 'datetime',
            priority: 'low',
            width: 34
          }
        ]
      },
      {
        fields: [
          {
            key: 'inactive',
            label: 'Inactive',
            type: 'boolean',
            priority: 'low',
            width: 33
          },
          {
            key: '_calculatedStatsComplete',
            label: 'Stats Complete',
            type: 'boolean',
            priority: 'low',
            width: 33
          },
          {
            key: '__v',
            label: 'Version',
            type: 'number',
            priority: 'low',
            width: 34
          }
        ]
      }
    ]
  }
]; 