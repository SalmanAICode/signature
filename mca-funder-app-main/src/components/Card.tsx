import React, { useState, useRef, useEffect, memo } from 'react';
import {
  // Base icons
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
  // Field type icons
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  HashtagIcon,
  CheckIcon,
  XMarkIcon,
  LinkIcon,
  DocumentTextIcon,
  UserIcon,
  GlobeAltIcon,
  LockClosedIcon,
  QueueListIcon,
  Bars3Icon,
  ListBulletIcon,
  FlagIcon,
  CalendarIcon,
  HomeIcon,
  IdentificationIcon,
  TrashIcon,
  // UI icons
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeSlashIcon,
  FolderIcon,
  FolderOpenIcon,
  PencilIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// Import custom SVG icons
import Email from '../svg/Email';
import Mobile from '../svg/Mobile';
import Profile from '../svg/Profile';
import Funder from '../svg/Funder';
import Syndicator from '../svg/Syndicator';

// Import reusable collapse transition component
import CollapseTransition from './CollapseTransition';

// Import formatting utilities
import {
  formatPhone,
  formatDate,
  formatBirthday,
  formatCurrency,
  formatTime,
  getUserTypeLabel,
  formatAddress,
  getNestedValue as getNestedValueFromUtils
} from '@/lib/utils/format';

// Supported field types for different data formatting
export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'date'
  | 'datetime'
  | 'time'
  | 'country'
  | 'currency'
  | 'number'
  | 'boolean'
  | 'url'
  | 'address'
  | 'user'
  | 'object' // New type for nested objects
  | 'array'  // New type for arrays
  | 'id'     // New type for ID with link
  | 'funder' // New type for funder information
  | 'syndicator' // New type for syndicator information
  | 'user' // New type for user information
  // Input field types
  | 'date-input'
  | 'text-input'
  | 'email-input'
  | 'tel-input'
  | 'password-input'
  | 'select-input'
  | 'boolean-input'
  | 'number-input'
  | 'array-input';

// Priority levels for information display
export type Priority = 'high' | 'medium' | 'low';

// Visual styles for cards
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';

// Select option interface for select inputs
export interface SelectOption {
  value: string;
  label: string;
  title?: string;
  disabled?: boolean;
}

// Field configuration interface - now supports nesting and inputs
export interface CardField {
  key: string;           // Data key to extract value
  label: string;         // Display label
  type: FieldType;       // Field type for formatting
  priority: Priority;    // Display priority
  required?: boolean;    // Whether field is required
  className?: string;    // Custom CSS classes
  icon?: React.ComponentType<{ className?: string }>; // Custom icon
  copyable?: boolean;    // Whether field value can be copied
  sensitive?: boolean;   // Whether field should be hidden by default
  collapsible?: boolean; // Whether this field can be collapsed (for object/array types)
  defaultCollapsed?: boolean; // Default collapsed state for object/array fields
  children?: CardField[]; // Nested fields for object/array types
  sections?: CardSection[]; // Alternative to children - nested sections
  rows?: CardRow[];      // Row-based layout for array types (alternative to children)
  width?: number;        // Field width percentage (1-100) for row layout
  linkPrefix?: string;   // Link prefix for id type (e.g. '/dashboard/syndication/')

  // Input-specific properties
  placeholder?: string;  // Placeholder text for inputs
  disabled?: boolean;    // Whether input is disabled
  onChange?: (value: any, field: CardField) => void; // Change handler for inputs
  options?: SelectOption[]; // Options for select inputs
  min?: string | number; // Min value for date/number inputs
  max?: string | number; // Max value for date/number inputs
  step?: string | number; // Step value for number inputs
  maxLength?: number;    // Max length for text inputs

  // Select-specific properties
  isMultiSelect?: boolean; // Whether select allows multiple selections
  searchable?: boolean;    // Whether select has search functionality
  isLoading?: boolean;     // Whether select is in loading state

  // Switch-specific properties
  switchLabel?: string;    // Label for switch input
  description?: string;    // Description text for switch

  // Array-specific properties
  onAddItem?: () => void;         // Add item callback for array inputs
  onRemoveItem?: (index: number) => void; // Remove item callback for array inputs
  arrayItemFields?: CardField[];  // Field configuration for each array item
  arrayData?: any[];              // Array data for array inputs
}

// Row configuration interface - contains multiple fields with widths
export interface CardRow {
  fields: CardField[];   // Fields in this row
  className?: string;    // Custom CSS classes for the row
}

// Card section configuration - now supports row-based layout
export interface CardSection {
  title: string;         // Section title
  priority: Priority;    // Section priority
  rows: CardRow[];       // Row-based layout instead of flat fields
  className?: string;    // Custom CSS classes
  collapsible?: boolean; // Whether section can be collapsed
  defaultCollapsed?: boolean; // Default collapsed state
  icon?: React.ComponentType<{ className?: string }>; // Section icon
  description?: string;  // Optional section description
  children?: CardSection[]; // Nested sections
}

// Main Card component props
export interface CardProps {
  data: Record<string, any>; // Data object
  sections: CardSection[]; // Section configurations
  className?: string;    // Custom CSS classes
  showEmptyFields?: boolean; // Show fields even if empty
  compact?: boolean;     // Compact display mode
  variant?: CardVariant; // Visual variant
  animated?: boolean;    // Enable animations
  interactive?: boolean; // Enable hover effects
  maxDepth?: number;     // Maximum nesting depth to prevent infinite recursion
}

// Get icon for field type
const getFieldIcon = (type: FieldType): React.ComponentType<{ className?: string }> => {
  switch (type) {
    // Email types
    case 'email':
    case 'email-input':
      return Email;

    // Phone types
    case 'phone':
    case 'tel-input':
      return Mobile;

    // Date types
    case 'date':
    case 'date-input':
      return CalendarIcon;
    case 'datetime':
      return CalendarDaysIcon;
    case 'time':
      return ClockIcon;

    // Location types
    case 'country':
      return FlagIcon;
    case 'address':
      return MapPinIcon;

    // Financial types
    case 'currency':
      return CurrencyDollarIcon;

    // Number types
    case 'number':
    case 'number-input':
      return HashtagIcon;

    // Boolean types
    case 'boolean':
    case 'boolean-input':
      return CheckCircleIcon;

    // URL types
    case 'url':
      return GlobeAltIcon;

    // User types
    case 'user':
      return Profile;

    // Data structure types
    case 'object':
      return FolderIcon;
    case 'array':
      return ListBulletIcon;

    // Input types
    case 'password-input':
      return LockClosedIcon;
    case 'select-input':
      return QueueListIcon;
    case 'array-input':
      return Bars3Icon;

    // Text types
    case 'text':
    case 'text-input':
      return DocumentTextIcon;

    // ID type
    case 'id':
      return LinkIcon;

    // New types
    case 'funder':
      return Funder;

    case 'syndicator':
      return Syndicator;

    // Default
    default:
      return DocumentTextIcon;
  }
};

// Get priority icon
const getPriorityIcon = (priority: Priority): React.ComponentType<{ className?: string }> => {
  switch (priority) {
    case 'high':
      return SparklesIcon;
    case 'medium':
      return InformationCircleIcon;
    case 'low':
      return CheckCircleIcon;
    default:
      return InformationCircleIcon;
  }
};

// Use getNestedValue from format utils
const getNestedValue = getNestedValueFromUtils;

// Deep comparison utility for complex objects
const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;

  if (obj1 == null || obj2 == null) return obj1 === obj2;

  if (typeof obj1 !== typeof obj2) return false;

  if (typeof obj1 !== 'object') return obj1 === obj2;

  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false;
    }
    return true;
  }

  // Handle Date objects
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }

  // Handle regular objects
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
};

// Format value based on field type using format utilities
const formatValue = (value: any, type: FieldType): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  // Special handling for Number.MAX_SAFE_INTEGER
  if (typeof value === 'number' && value === Number.MAX_SAFE_INTEGER) {
    return '∞';
  }

  switch (type) {
    case 'email':
    case 'email-input':
      return value.toString();

    case 'phone':
    case 'tel-input':
      return formatPhone(value);

    case 'date':
    case 'date-input':
      return formatDate(value);

    case 'datetime':
      return formatTime(value);

    case 'time':
      return formatTime(value);

    case 'country':
      return value.toString().toUpperCase();

    case 'currency':
      const num = parseFloat(value);
      return isNaN(num) ? value.toString() : formatCurrency(num);

    case 'number':
    case 'number-input':
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return value.toString();
      if (numValue === Number.MAX_SAFE_INTEGER) return '∞';
      return numValue.toLocaleString();

    case 'boolean':
      return value ? 'Yes' : 'No';

    case 'url':
      return value.toString();

    case 'object':
      if (typeof value === 'object' && value !== null) {
        return `Object (${Object.keys(value).length} properties)`;
      }
      return value.toString();

    case 'address':
      if (typeof value === 'object' && value !== null) {
        return formatAddress(value);
      }
      return value.toString();

    case 'password-input':
      return value ? '••••••••' : '';

    case 'select-input':
      return value.toString();

    case 'text':
    case 'text-input':
    default:
      return value.toString();

    case 'funder':
      if (!value) return 'N/A';
      const funderName = value.name || 'N/A';
      const funderEmail = value.email || 'N/A';
      const funderPhone = value.phone || 'N/A';
      return `${funderName}\n📧 ${funderEmail}\n📞 ${funderPhone}`;

    case 'syndicator':
      if (!value) return 'N/A';
      const syndicatorName = value.name || (value.first_name && value.last_name ? `${value.first_name} ${value.last_name}` : 'N/A');
      const syndicatorEmail = value.email || 'N/A';
      const syndicatorMobile = value.phone_mobile || 'N/A';
      const syndicatorWork = value.phone_work || 'N/A';
      const syndicatorHome = value.phone_home || 'N/A';
      return `${syndicatorName} (${value.first_name || ''} ${value.last_name || ''})\n📧 ${syndicatorEmail}\n📱 ${syndicatorMobile}\n📞 ${syndicatorWork}\n🏠 ${syndicatorHome}`;

    case 'user':
      if (!value) return 'N/A';
      const userName = value.first_name && value.last_name ? `${value.first_name} ${value.last_name}` : 'N/A';
      const userEmail = value.email || 'N/A';
      return `${userName}\n📧 ${userEmail}`;
  }
};

// Get priority styles using theme system
const getPriorityStyles = (priority: Priority) => {
  switch (priority) {
    case 'high':
      return {
        accent: 'bg-gradient-to-r from-red-50/80 to-pink-50/80 border-red-200/60',
        icon: 'text-error',
        badge: 'bg-error/10 text-error border-error/20',
        header: 'bg-error/5 border-error/20'
      };
    case 'medium':
      return {
        accent: 'bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-blue-200/60',
        icon: 'text-theme-primary',
        badge: 'bg-theme-primary/10 text-theme-primary border-theme-primary/20',
        header: 'bg-theme-primary/5 border-theme-primary/20'
      };
    case 'low':
      return {
        accent: 'bg-gradient-to-r from-green-50/80 to-emerald-50/80 border-green-200/60',
        icon: 'text-success',
        badge: 'bg-success/10 text-success border-success/20',
        header: 'bg-success/5 border-success/20'
      };
    default:
      return {
        accent: 'bg-gradient-to-r from-theme-muted/20 to-theme-muted/10 border-theme-border',
        icon: 'text-theme-muted',
        badge: 'bg-theme-muted/10 text-theme-muted border-theme-border',
        header: 'bg-theme-muted/5 border-theme-border'
      };
  }
};

// Get card variant styles
const getCardVariant = (variant: CardVariant) => {
  switch (variant) {
    case 'elevated':
      return 'bg-theme-background border-theme-border shadow-theme-lg hover:shadow-theme-xl';
    case 'outlined':
      return 'bg-theme-background border-2 border-theme-border shadow-none hover:border-theme-primary/50';
    case 'filled':
      return 'bg-theme-secondary/50 border-theme-border shadow-theme-sm hover:shadow-theme-md';
    case 'default':
    default:
      return 'bg-theme-background border-theme-border shadow-theme-sm hover:shadow-theme-md';
  }
};

// Copy to clipboard utility - improved error handling
const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text || text.trim() === '') {
    return false;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (err) {
    console.warn('Failed to copy text to clipboard:', err);
    return false;
  }
};

// MultiSelectDropdown Component
interface MultiSelectDropdownProps {
  options: SelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  searchable?: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options...",
  isDisabled = false,
  isLoading = false,
  searchable = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchable
    ? options.filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  const selectedOptions = options.filter(option => selectedValues.includes(option.value));

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const removeOption = (value: string) => {
    onChange(selectedValues.filter(v => v !== value));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected items display */}
      <div
        className={`min-h-[48px] w-full px-4 py-2 border border-theme-border rounded-md bg-theme-background text-theme-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-theme-primary focus-within:border-transparent shadow-theme-sm cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-2">
          {selectedOptions.length > 0 ? (
            selectedOptions.map(option => (
              <span
                key={option.value}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-theme-secondary text-theme-foreground border border-theme-border"
                title={option.title}
              >
                {option.label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(option.value);
                  }}
                  className="ml-1 text-theme-muted-foreground hover:text-theme-destructive focus:outline-none"
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="text-theme-muted-foreground text-sm py-2">{placeholder}</span>
          )}
        </div>

        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <ChevronDownIcon
            className={`w-4 h-4 text-theme-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown menu */}
      <div className="z-[9999] mt-1 w-full">
        <CollapseTransition
          isOpen={isOpen}
          duration={200}
          easing="ease-out"
          expandedPadding="p-0"
          collapsedPadding="p-0"
          animateContent={true}
        >
          <div className="bg-theme-background border border-theme-border rounded-md shadow-lg max-h-60 overflow-auto">
            {/* Search input */}
            {searchable && (
              <div className="p-2 border-b border-theme-border">
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-theme-border rounded bg-theme-background text-theme-foreground focus:outline-none focus:ring-1 focus:ring-theme-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Clear button - only show when there are selections */}
            {selectedValues.length > 0 && (
              <div className="p-2 border-b border-theme-border">
                <button
                  onClick={() => onChange([])}
                  className="w-full px-3 py-2 text-sm bg-theme-accent hover:bg-theme-muted text-theme-foreground hover:text-theme-primary transition-all duration-150 rounded-md border border-theme-border flex items-center justify-center space-x-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              </div>
            )}

            {/* Options list */}
            <div className="max-h-48 overflow-auto">
              {isLoading ? (
                <div className="p-4 text-center text-theme-muted-foreground text-sm">
                  Loading options...
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-theme-muted-foreground text-sm">
                  No options found
                </div>
              ) : (
                filteredOptions.map(option => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      className={`
                        px-4 py-2 cursor-pointer text-sm transition-all duration-150
                        ${isSelected
                          ? 'bg-theme-secondary text-theme-primary border-l-4 border-theme-primary font-medium'
                          : 'text-theme-foreground hover:bg-theme-accent hover:text-theme-foreground hover:border-l-4 hover:border-theme-border'
                        }
                      `}
                      title={option.title}
                      onClick={() => toggleOption(option.value)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {isSelected && (
                          <CheckIcon className="w-4 h-4 text-theme-primary" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CollapseTransition>
      </div>
    </div>
  );
};

// SingleSelectDropdown Component
interface SingleSelectDropdownProps {
  options: SelectOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  searchable?: boolean;
}

const SingleSelectDropdown: React.FC<SingleSelectDropdownProps> = ({
  options,
  selectedValue,
  onChange,
  placeholder = "Select option...",
  isDisabled = false,
  isLoading = false,
  searchable = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchable
    ? options.filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  const selectedOption = options.find(option => option.value === selectedValue);

  const selectOption = (value: string) => {
    onChange(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected item display */}
      <div
        className={`min-h-[48px] w-full px-4 py-2 border border-theme-border rounded-md bg-theme-background text-theme-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-theme-primary focus-within:border-transparent shadow-theme-sm cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className={`text-sm py-2 ${selectedOption ? 'text-theme-foreground' : 'text-theme-muted-foreground'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          {/* Dropdown arrow */}
          <ChevronDownIcon
            className={`w-4 h-4 text-theme-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown menu */}
      <div className="z-[9999] mt-1 w-full">
        <CollapseTransition
          isOpen={isOpen}
          duration={200}
          easing="ease-out"
          expandedPadding="p-0"
          collapsedPadding="p-0"
          animateContent={true}
        >
          <div className="bg-theme-background border border-theme-border rounded-md shadow-lg max-h-60 overflow-auto">
            {/* Search input */}
            {searchable && (
              <div className="p-2 border-b border-theme-border">
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-theme-border rounded bg-theme-background text-theme-foreground focus:outline-none focus:ring-1 focus:ring-theme-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Clear button - only show when there is a selection */}
            {selectedValue && selectedValue !== '' && (
              <div className="p-2 border-b border-theme-border">
                <button
                  onClick={() => onChange('')}
                  className="w-full px-3 py-2 text-sm bg-theme-accent hover:bg-theme-muted text-theme-foreground hover:text-theme-primary transition-all duration-150 rounded-md border border-theme-border flex items-center justify-center space-x-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                  <span>Clear Selection</span>
                </button>
              </div>
            )}

            {/* Options list */}
            <div className="max-h-48 overflow-auto">
              {isLoading ? (
                <div className="p-4 text-center text-theme-muted-foreground text-sm">
                  Loading options...
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-theme-muted-foreground text-sm">
                  No options found
                </div>
              ) : (
                filteredOptions.map(option => {
                  const isSelected = selectedValue === option.value;
                  return (
                    <div
                      key={option.value}
                      className={`
                        px-4 py-2 cursor-pointer text-sm transition-all duration-150
                        ${isSelected
                          ? 'bg-theme-secondary text-theme-primary border-l-4 border-theme-primary font-medium'
                          : 'text-theme-foreground hover:bg-theme-accent hover:text-theme-foreground hover:border-l-4 hover:border-theme-border'
                        }
                      `}
                      title={option.title}
                      onClick={() => selectOption(option.value)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {isSelected && (
                          <CheckIcon className="w-4 h-4 text-theme-primary" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CollapseTransition>
      </div>
    </div>
  );
};

// ArrayInputComponent - Collapsible array input with improved layout
interface ArrayInputComponentProps {
  field: CardField;
  animated?: boolean;
}

// Helper functions for number input
const adjustToNearestStep = (value: number, min?: number, max?: number, step?: number): number => {
  let result = value;

  // Apply min/max constraints
  if (min !== undefined && !isNaN(min)) result = Math.max(min, result);
  if (max !== undefined && !isNaN(max)) result = Math.min(max, result);

  // Apply step constraint if provided
  if (step !== undefined && !isNaN(step) && step > 0) {
    const stepDecimals = step.toString().includes('.') ? step.toString().split('.')[1].length : 0;
    const rounded = Math.round(result / step) * step;
    result = parseFloat(rounded.toFixed(stepDecimals));
  }

  return result;
};

// Utility function to determine if a field should be displayed
const shouldDisplayField = (value: any, showEmptyFields: boolean): boolean => {
  // Always show field if showEmptyFields is true
  if (showEmptyFields) return true;

  // Handle different types of values
  switch (typeof value) {
    case 'number':
      // Always show numbers, including 0
      return true;
    case 'boolean':
      // Always show booleans, including false
      return true;
    case 'string':
      // Don't show empty strings
      return value.trim() !== '';
    case 'object':
      if (value === null) return false;
      if (Array.isArray(value)) {
        // Don't show empty arrays
        return value.length > 0;
      }
      // Don't show empty objects
      return Object.keys(value).length > 0;
    default:
      // Don't show undefined or other types
      return false;
  }
};

// Row Component for consistent row layout
interface RowComponentProps {
  row: CardRow;
  data: Record<string, any>;
  showEmptyFields?: boolean;
  compact?: boolean;
  animated?: boolean;
  depth?: number;
  maxDepth?: number;
  className?: string;
}

const RowComponent: React.FC<RowComponentProps> = ({
  row,
  data,
  showEmptyFields = false,
  compact = false,
  animated = true,
  depth = 0,
  maxDepth = 3,
  className = ''
}) => {
  // Filter out empty fields using the utility function
  const visibleFields = row.fields.filter(field => {
    const value = field.key.includes('.') ? getNestedValue(data, field.key) : data[field.key];
    return shouldDisplayField(value, showEmptyFields);
  });

  // Don't render if no visible fields
  if (visibleFields.length === 0) {
    return null;
  }

  // Calculate total width of all fields that have width specified
  const totalSpecifiedWidth = visibleFields.reduce((sum, field) => sum + (field.width || 0), 0);

  // Calculate grid template columns based on field widths
  const gridTemplateColumns = visibleFields.map(field => {
    // If field has width specified, use it as percentage
    if (field.width) {
      return `${field.width}fr`;
    }
    // If no width specified, distribute remaining space equally
    const remainingFields = visibleFields.filter(f => !f.width).length;
    const equalWidth = remainingFields > 0 ? (100 - totalSpecifiedWidth) / remainingFields : 0;
    return `${equalWidth}fr`;
  }).join(' ');

  return (
    <div
      className={`grid gap-4 overflow-x-auto ${className}`}
      style={{
        gridTemplateColumns,
        alignItems: 'stretch'
      }}
    >
      {visibleFields.map((field, fieldIndex) => (
        <div key={`${field.key}-${fieldIndex}`} className="flex flex-col h-full">
          <CardFieldComponent
            field={field}
            value={field.key.includes('.') ? getNestedValue(data, field.key) : data[field.key]}
            data={data}
            compact={compact}
            animated={animated}
            depth={depth}
            maxDepth={maxDepth}
          />
        </div>
      ))}
    </div>
  );
};

// NumberInputComponent - Internal state management for number inputs
interface NumberInputComponentProps {
  field: CardField;
  value: any;
}

const NumberInputComponent: React.FC<NumberInputComponentProps> = ({ field, value }) => {
  // Internal state to manage the input display value
  const [internalValue, setInternalValue] = useState(value?.toString() || '');

  // Update internal value when external value changes
  useEffect(() => {
    setInternalValue(value?.toString() || '');
  }, [value]);

  // Handle input change - only update internal state
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const inputValue = target.value.trim();
    if (inputValue === '') {
      return;
    }
    setInternalValue(inputValue); // Directly update internal state without validation
  };

  // Handle mouse leave - validate and call field.onChange with final value
  const handleMouseLeave = (e: React.MouseEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const inputValue = target.value.trim();

    // If empty, don't call field.onChange
    if (inputValue === '') {
      return;
    }

    // Parse the number value
    const numValue = parseFloat(inputValue);

    // If invalid number, don't call field.onChange
    if (isNaN(numValue)) {
      return;
    }

    // Apply constraints and get final adjusted value
    const adjustedValue = adjustToNearestStep(
      numValue,
      Number(field.min),
      Number(field.max),
      Number(field.step)
    );

    // Update internal state to reflect the adjusted value
    setInternalValue(adjustedValue.toString());

    // Call field.onChange with final processed value
    field.onChange && field.onChange(adjustedValue, field);
  };

  // Handle increment button click
  const handleIncrement = () => {
    const currentValue = Number(internalValue) || 0;
    const step = Number(field.step) || 1;
    const newValue = currentValue + step;

    const adjustedValue = adjustToNearestStep(
      newValue,
      field.min ? Number(field.min) : undefined,
      field.max ? Number(field.max) : undefined,
      field.step ? Number(field.step) : undefined
    );

    setInternalValue(adjustedValue.toString());
    field.onChange && field.onChange(adjustedValue, field);
  };

  // Handle decrement button click
  const handleDecrement = () => {
    const currentValue = Number(internalValue) || 0;
    const step = Number(field.step) || 1;
    const newValue = currentValue - step;

    const adjustedValue = adjustToNearestStep(
      newValue,
      field.min ? Number(field.min) : undefined,
      field.max ? Number(field.max) : undefined,
      field.step ? Number(field.step) : undefined
    );

    setInternalValue(adjustedValue.toString());
    field.onChange && field.onChange(adjustedValue, field);
  };

  return (
    <div className="relative flex items-center">
      <input
        type="number"
        value={internalValue}
        placeholder={field.placeholder}
        disabled={field.disabled}
        min={field.min?.toString()}
        max={field.max?.toString()}
        step={field.step?.toString()}
        onChange={handleInputChange}
        onMouseLeave={handleMouseLeave}
        className="w-full px-4 py-3 pr-16 border border-theme-border rounded-md bg-theme-background text-theme-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent placeholder-theme-muted-foreground shadow-theme-sm disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <div className="absolute right-3 flex items-center space-x-1">
        <div className="flex flex-col">
          <button
            type="button"
            disabled={field.disabled}
            onClick={handleIncrement}
            className="w-4 h-4 flex items-center justify-center text-theme-muted hover:text-theme-foreground transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronUpIcon className="w-3 h-3" />
          </button>
          <button
            type="button"
            disabled={field.disabled}
            onClick={handleDecrement}
            className="w-4 h-4 flex items-center justify-center text-theme-muted hover:text-theme-foreground transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronDownIcon className="w-3 h-3" />
          </button>
        </div>
        <PencilIcon className="w-5 h-5 text-theme-muted pointer-events-none ml-1" />
      </div>
    </div>
  );
};

// Card Field Component with nesting support
const CardFieldComponent = memo<{
  field: CardField;
  value: any;
  data: Record<string, any>;
  compact?: boolean;
  animated?: boolean;
  depth?: number;
  maxDepth?: number;
}>(({
  field,
  value,
  data,
  compact = false,
  animated = true,
  depth = 0,
  maxDepth = 3
}) => {
  const [isRevealed, setIsRevealed] = useState(!field.sensitive);
  const [isCopied, setIsCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(field.defaultCollapsed ?? false);

  // Get nested value if needed
  const fieldValue = field.key.includes('.') ? getNestedValue(data, field.key) : value;
  const formattedValue = formatValue(fieldValue, field.type);

  // Improved isEmpty logic that handles boolean false values correctly
  const isEmpty = (fieldValue === null || fieldValue === undefined) ||
    (typeof fieldValue === 'string' && fieldValue.trim() === '') ||
    (Array.isArray(fieldValue) && fieldValue.length === 0) ||
    (typeof fieldValue === 'object' && fieldValue !== null && Object.keys(fieldValue).length === 0);

  // Prevent infinite nesting
  if (depth >= maxDepth) {
    return null;
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isEmpty || !isRevealed) return;

    // For id type fields, copy the full link if linkPrefix is provided
    let textToCopy = field.sensitive && !isRevealed ? '' : formattedValue;

    if (field.type === 'id' && field.linkPrefix && fieldValue) {
      // Get the current window location to construct the full URL
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      textToCopy = `${baseUrl}${field.linkPrefix}${fieldValue}`;
    }

    const success = await copyToClipboard(textToCopy);

    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const toggleReveal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRevealed(!isRevealed);
  };

  const toggleCollapse = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  // Helper function to handle field changes
  const handleFieldChange = (value: any, itemField: CardField, itemIndex: number) => {
    if (itemField.onChange) {
      // Create a new field object with the correct key format
      const fieldWithIndex = {
        ...itemField,
        key: `${itemIndex}.${itemField.key}`
      };
      itemField.onChange(value, fieldWithIndex);
    }
  };

  // Helper function to create row with proper onChange handlers
  const createRowWithHandlers = (row: CardRow, itemIndex: number) => ({
    ...row,
    fields: row.fields.map(f => ({
      ...f,
      onChange: (value: any, changedField: CardField) => {
        handleFieldChange(value, f, itemIndex);
      }
    }))
  });

  const FieldIcon = field.icon || getFieldIcon(field.type);
  const priorityStyles = getPriorityStyles(field.priority);

  return (
    <div className={`card-field-wrapper h-full flex flex-col ${animated ? 'animate-fade-in' : ''} ${field.className || ''}`}>
      {/* Field Header */}
      <div className={`
        flex items-center justify-between border transition-all duration-200 flex-1
        ${compact ? 'px-3 py-2' : 'px-4 py-3'}
        ${priorityStyles.accent}
        hover:shadow-theme-sm
        ${(field.type === 'object' || field.type === 'array' || field.type === 'array-input') && field.collapsible ? 'cursor-pointer' : ''}
      `}
        onClick={(field.type === 'object' || field.type === 'array' || field.type === 'array-input') && field.collapsible ? toggleCollapse : undefined}
      >
        <div className="flex items-center flex-1 min-w-0">
          {/* Collapse Button for object/array types */}
          {(field.type === 'object' || field.type === 'array' || field.type === 'array-input') && field.collapsible && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent double-click when clicking the button
                toggleCollapse(e);
              }}
              className="flex-shrink-0 mr-2 p-1 rounded-theme-sm hover:bg-theme-accent/50 transition-colors duration-200"
              type="button"
            >
              {isCollapsed ? (
                <ChevronRightIcon className="w-4 h-4 text-theme-muted" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-theme-muted" />
              )}
            </button>
          )}

          {/* Field Icon */}
          <div className="flex-shrink-0 mr-3">
            <FieldIcon className={`w-5 h-5 ${priorityStyles.icon}`} />
          </div>

          {/* Field Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-theme-foreground truncate">
                {field.label}
                {field.required && <span className="text-error ml-1">*</span>}
              </label>
            </div>

            {/* Field Description */}
            {field.description && field.type !== 'object' && field.type !== 'array' && field.type !== 'array-input' && !['date-input', 'text-input', 'email-input', 'tel-input', 'password-input', 'select-input', 'boolean-input', 'number-input', 'array-input'].includes(field.type) && (
              <div className="mt-0.5 text-[10px] leading-tight text-theme-muted">
                {field.description}
              </div>
            )}

            {/* Field Value or Input */}
            {field.type !== 'object' && field.type !== 'array' && field.type !== 'array-input' && (
              <div className="mt-1 flex items-center space-x-2">
                {/* Render input fields */}
                {['date-input', 'text-input', 'email-input', 'tel-input', 'password-input', 'select-input', 'boolean-input', 'number-input', 'array-input'].includes(field.type) ? (
                  <div className="w-full">
                    {field.type === 'text-input' && (
                      <div className="relative">
                        <input
                          type="text"
                          value={fieldValue || ''}
                          placeholder={field.placeholder}
                          disabled={field.disabled}
                          maxLength={field.maxLength}
                          onChange={(e) => field.onChange && field.onChange(e.target.value, field)}
                          className="w-full px-4 py-3 pr-12 border border-theme-border rounded-md bg-theme-background text-theme-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent placeholder-theme-muted-foreground shadow-theme-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <PencilIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-muted pointer-events-none" />
                      </div>
                    )}

                    {field.type === 'email-input' && (
                      <div className="relative">
                        <input
                          type="email"
                          value={fieldValue || ''}
                          placeholder={field.placeholder}
                          disabled={field.disabled}
                          onChange={(e) => field.onChange && field.onChange(e.target.value, field)}
                          className="w-full px-4 py-3 pr-12 border border-theme-border rounded-md bg-theme-background text-theme-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent placeholder-theme-muted-foreground shadow-theme-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <PencilIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-muted pointer-events-none" />
                      </div>
                    )}

                    {field.type === 'tel-input' && (
                      <div className="relative">
                        <input
                          type="tel"
                          value={fieldValue || ''}
                          placeholder={field.placeholder}
                          disabled={field.disabled}
                          onChange={(e) => field.onChange && field.onChange(e.target.value, field)}
                          className="w-full px-4 py-3 pr-12 border border-theme-border rounded-md bg-theme-background text-theme-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent placeholder-theme-muted-foreground shadow-theme-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <PencilIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-muted pointer-events-none" />
                      </div>
                    )}

                    {field.type === 'password-input' && (
                      <div className="relative">
                        <input
                          type="password"
                          value={fieldValue || ''}
                          placeholder={field.placeholder}
                          disabled={field.disabled}
                          onChange={(e) => field.onChange && field.onChange(e.target.value, field)}
                          className="w-full px-4 py-3 pr-12 border border-theme-border rounded-md bg-theme-background text-theme-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent placeholder-theme-muted-foreground shadow-theme-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <PencilIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-muted pointer-events-none" />
                      </div>
                    )}

                    {field.type === 'date-input' && (
                      <div className="relative">
                        <input
                          type="date"
                          value={fieldValue || ''}
                          disabled={field.disabled}
                          min={field.min?.toString()}
                          max={field.max?.toString()}
                          onChange={(e) => field.onChange && field.onChange(e.target.value, field)}
                          className="w-full px-4 py-3 pr-12 border border-theme-border rounded-md bg-theme-background text-theme-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent shadow-theme-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <PencilIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-muted pointer-events-none" />
                      </div>
                    )}

                    {field.type === 'select-input' && (
                      <div className="w-full">
                        {field.isMultiSelect ? (
                          <MultiSelectDropdown
                            options={field.options || []}
                            selectedValues={Array.isArray(fieldValue) ? fieldValue : (fieldValue ? [fieldValue] : [])}
                            onChange={(values) => field.onChange && field.onChange(values, field)}
                            placeholder={field.placeholder}
                            isDisabled={field.disabled}
                            isLoading={field.isLoading}
                            searchable={field.searchable}
                          />
                        ) : (
                          <SingleSelectDropdown
                            options={field.options || []}
                            selectedValue={fieldValue || ''}
                            onChange={(value) => field.onChange && field.onChange(value, field)}
                            placeholder={field.placeholder}
                            isDisabled={field.disabled}
                            isLoading={field.isLoading}
                            searchable={field.searchable || false}
                          />
                        )}
                      </div>
                    )}

                    {field.type === 'boolean-input' && (
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {field.switchLabel && (
                              <div className="text-sm font-medium text-theme-foreground mb-0.5">
                                {field.switchLabel}
                              </div>
                            )}
                            {field.description && (
                              <div className="text-[10px] leading-tight text-theme-muted">
                                {field.description}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 ml-4">
                            <button
                              type="button"
                              disabled={field.disabled}
                              onClick={() => field.onChange && field.onChange(!fieldValue, field)}
                              className={`
                                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2
                                disabled:opacity-50 disabled:cursor-not-allowed
                                ${fieldValue ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
                              `}
                            >
                              <span
                                className={`
                                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                                  transition duration-200 ease-in-out
                                  ${fieldValue ? 'translate-x-5' : 'translate-x-0'}
                                `}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {field.type === 'number-input' && (
                      <div className="w-full">
                        <NumberInputComponent field={field} value={fieldValue} />
                      </div>
                    )}

                  </div>
                ) : field.sensitive && !isRevealed ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-theme-muted">••••••••</span>
                    <button
                      onClick={toggleReveal}
                      className="text-theme-primary hover:text-theme-primary/80 transition-colors duration-200"
                      type="button"
                      title="Show value"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Value display with special handling for different types */}
                    {field.type === 'id' && !isEmpty ? (
                      <Link
                        href={`${field.linkPrefix || ''}${fieldValue}`}
                        className="text-sm text-theme-primary hover:text-theme-primary/80 underline decoration-1 underline-offset-2 transition-colors duration-200 flex items-center space-x-1"
                      >
                        <span>{formattedValue}</span>
                        <LinkIcon className="w-3 h-3" />
                      </Link>
                    ) : field.type === 'email' && !isEmpty ? (
                      <a
                        href={`mailto:${fieldValue}`}
                        className="text-sm text-theme-primary hover:text-theme-primary/80 underline decoration-1 underline-offset-2 transition-colors duration-200"
                      >
                        {formattedValue}
                      </a>
                    ) : field.type === 'phone' && !isEmpty ? (
                      <a
                        href={`tel:${fieldValue}`}
                        className="text-sm text-theme-primary hover:text-theme-primary/80 underline decoration-1 underline-offset-2 transition-colors duration-200"
                      >
                        {formattedValue}
                      </a>
                    ) : field.type === 'url' && !isEmpty ? (
                      <a
                        href={fieldValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-theme-primary hover:text-theme-primary/80 underline decoration-1 underline-offset-2 transition-colors duration-200 flex items-center space-x-1"
                      >
                        <span>{formattedValue}</span>
                        <GlobeAltIcon className="w-3 h-3" />
                      </a>
                    ) : field.type === 'boolean' && !isEmpty ? (
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${isEmpty ? 'text-theme-muted italic' : 'text-theme-foreground'}`}>
                          {formattedValue}
                        </span>
                        {fieldValue ? (
                          <CheckIcon className="w-4 h-4 text-success" />
                        ) : (
                          <XMarkIcon className="w-4 h-4 text-error" />
                        )}
                      </div>
                    ) : field.type === 'funder' || field.type === 'syndicator' ? (
                      <div className="text-sm whitespace-pre-line">
                        {formattedValue.split('\n').map((line, index) => (
                          <div key={index} className={index === 0 ? 'font-medium' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className={`text-sm ${isEmpty ? 'text-theme-muted italic' : 'text-theme-foreground'}`}>
                        {isEmpty ? 'No data' : formattedValue}
                      </span>
                    )}

                    {field.sensitive && (
                      <button
                        onClick={toggleReveal}
                        className="text-theme-primary hover:text-theme-primary/80 transition-colors duration-200"
                        type="button"
                        title="Hide value"
                      >
                        <EyeSlashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 ml-2">
            {field.copyable && !isEmpty && isRevealed && (
              <button
                onClick={handleCopy}
                className={`
                  p-1.5 rounded-theme-sm transition-all duration-200 flex-shrink-0
                  ${isCopied
                    ? 'bg-success/20 text-success hover:bg-success/30'
                    : 'hover:bg-theme-accent/50 text-theme-muted hover:text-theme-foreground'
                  }
                `}
                title={isCopied ? 'Copied!' : 'Copy to clipboard'}
                type="button"
              >
                {isCopied ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <DocumentTextIcon className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested Content for Object Types */}
      {field.type === 'object' && fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue) && (
        <CollapseTransition
          isOpen={!isCollapsed}
          animateContent={animated}
          maxHeight="auto"
          duration={300}
          easing="ease-linear"
          expandedPadding="pt-3"
          collapsedPadding="p-0"
          className='overflow-y-hidden'
        >
          <div className="ml-4 pl-4 border-l-2 border-theme-border/50 space-y-3">
            {/* Render nested fields */}
            {field.children?.map((childField, index) => (
              <CardFieldComponent
                key={`${childField.key}-${index}`}
                field={childField}
                value={fieldValue[childField.key]}
                data={fieldValue}
                compact={compact}
                animated={animated}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            ))}

            {/* Render nested sections */}
            {field.sections?.map((section, index) => (
              <CardSectionComponent
                key={`${section.title}-${index}`}
                section={section}
                data={fieldValue}
                showEmptyFields={true}
                compact={compact}
                animated={animated}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            ))}
          </div>
        </CollapseTransition>
      )}

      {/* Nested Content for Array Types */}
      {field.type === 'array' && fieldValue && Array.isArray(fieldValue) && fieldValue.length > 0 && (
        <CollapseTransition
          isOpen={!isCollapsed}
          animateContent={animated}
          maxHeight="auto"
          duration={300}
          easing="ease-linear"
          expandedPadding="pt-3"
          collapsedPadding="p-0"
          className='overflow-y-hidden'
        >
          <div className="ml-4 pl-4 border-l-2 border-theme-border/50 space-y-4">
            {fieldValue.map((item: any, itemIndex: number) => (
              <div key={`array-item-${itemIndex}`} className="relative">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                    {itemIndex + 1}
                  </div>
                  <div className="flex-1 space-y-3 overflow-x-auto">
                    {field.rows ? (
                      field.rows.map((row, rowIndex) => (
                        <RowComponent
                          key={`row-${itemIndex}-${rowIndex}`}
                          row={row}
                          data={item}
                          showEmptyFields={false}
                          compact={compact}
                          animated={animated}
                          depth={depth + 1}
                          maxDepth={maxDepth}
                          className={row.className}
                        />
                      ))
                    ) : (
                      <>
                        {field.children?.map((childField, fieldIndex) => (
                          <CardFieldComponent
                            key={`${childField.key}-${itemIndex}-${fieldIndex}`}
                            field={childField}
                            value={childField.key.includes('.') ? getNestedValue(item, childField.key) : item[childField.key]}
                            data={item}
                            compact={compact}
                            animated={animated}
                            depth={depth + 1}
                            maxDepth={maxDepth}
                          />
                        ))}

                        {field.sections?.map((section, sectionIndex) => (
                          <CardSectionComponent
                            key={`${section.title}-${itemIndex}-${sectionIndex}`}
                            section={section}
                            data={item}
                            showEmptyFields={true}
                            compact={compact}
                            animated={animated}
                            depth={depth + 1}
                            maxDepth={maxDepth}
                          />
                        ))}
                      </>
                    )}
                  </div>
                </div>
                {itemIndex < fieldValue.length - 1 && (
                  <div className="mt-4 border-b border-theme-border/30"></div>
                )}
              </div>
            ))}
          </div>
        </CollapseTransition>
      )}

      {/* Array Input Type */}
      {field.type === 'array-input' && (
        <CollapseTransition
          isOpen={!isCollapsed}
          animateContent={animated}
          maxHeight="auto"
          duration={300}
          easing="ease-linear"
          expandedPadding="pt-3"
          collapsedPadding="p-0"
          className='overflow-y-hidden'
        >
          <div className="ml-4 pl-4 border-l-2 border-theme-border/50 space-y-4">
            {/* Array Items */}
            {(field.arrayData || []).map((item: any, itemIndex: number) => (
              <div key={itemIndex} className="relative">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                    {itemIndex + 1}
                  </div>
                  <div className="flex-1 space-y-3">
                    {field.rows ? (
                      field.rows.map((row, rowIndex) => (
                        <RowComponent
                          key={`row-${itemIndex}-${rowIndex}`}
                          row={createRowWithHandlers(row, itemIndex)}
                          data={item}
                          showEmptyFields={true} // Always show fields in array items
                          compact={true}
                          animated={animated}
                          depth={0}
                          maxDepth={3}
                          className={row.className}
                        />
                      ))
                    ) : (
                      field.arrayItemFields && (
                        <div className="grid gap-4" style={{
                          gridTemplateColumns: field.arrayItemFields.map(f => {
                            const totalWidth = field.arrayItemFields!.reduce((sum, af) => sum + (af.width || 0), 0);
                            const fieldWidth = f.width || (totalWidth > 0 ? 0 : Math.floor(100 / field.arrayItemFields!.length));
                            const finalWidth = totalWidth > 0 ? fieldWidth : Math.floor(100 / field.arrayItemFields!.length);
                            return `minmax(200px, ${finalWidth}fr)`;
                          }).join(' '),
                          alignItems: 'stretch'
                        }}>
                          {field.arrayItemFields.map((itemField: CardField, fieldIndex: number) => (
                            <div key={`${itemField.key}-${fieldIndex}`} className="flex flex-col h-full">
                              <CardFieldComponent
                                field={{
                                  ...itemField,
                                  onChange: (value: any, changedField: CardField) => {
                                    handleFieldChange(value, itemField, itemIndex);
                                  }
                                }}
                                value={item[itemField.key]}
                                data={item}
                                compact={true}
                                animated={animated}
                                depth={0}
                                maxDepth={3}
                              />
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>

                  {/* Delete button */}
                  {field.onRemoveItem && (
                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => field.onRemoveItem!(itemIndex)}
                        disabled={field.disabled}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete item"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {/* Separator line between items (except for the last item) */}
                {itemIndex < (field.arrayData?.length || 0) - 1 && (
                  <div className="mt-4 border-b border-theme-border/30"></div>
                )}
              </div>
            ))}

            {/* Add Item Button */}
            {field.onAddItem && (
              <button
                type="button"
                onClick={() => field.onAddItem!()}
                disabled={field.disabled}
                className="w-full px-4 py-3 border border-dashed border-theme-border rounded-md text-sm font-medium text-theme-muted hover:text-theme-foreground hover:border-theme-primary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>{field.placeholder || 'Add Item'}</span>
              </button>
            )}
          </div>
        </CollapseTransition>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for CardFieldComponent
  return (
    deepEqual(prevProps.field, nextProps.field) &&
    deepEqual(prevProps.value, nextProps.value) &&
    deepEqual(prevProps.data, nextProps.data) &&
    prevProps.compact === nextProps.compact &&
    prevProps.animated === nextProps.animated &&
    prevProps.depth === nextProps.depth &&
    prevProps.maxDepth === nextProps.maxDepth
  );
});

// Card Section Component with nesting support
const CardSectionComponent = memo<{
  section: CardSection;
  data: Record<string, any>;
  showEmptyFields?: boolean;
  compact?: boolean;
  animated?: boolean;
  depth?: number;
  maxDepth?: number;
}>(({
  section,
  data,
  showEmptyFields = false,
  compact = false,
  animated = true,
  depth = 0,
  maxDepth = 3
}) => {
  const [isCollapsed, setIsCollapsed] = useState(section.defaultCollapsed ?? false);

  // Prevent infinite nesting
  if (depth >= maxDepth) {
    return null;
  }

  // Filter visible rows (and their fields)
  const visibleRows = section.rows.map(row => ({
    ...row,
    fields: row.fields.filter(field => {
      if (showEmptyFields) return true;
      const value = field.key.includes('.') ? getNestedValue(data, field.key) : data[field.key];
      // Improved logic that handles boolean false and number 0 correctly
      return (value !== null && value !== undefined) &&
        !(typeof value === 'string' && value.trim() === '') &&
        !(Array.isArray(value) && value.length === 0) &&
        !(typeof value === 'object' && value !== null && Object.keys(value).length === 0);
    })
  })).filter(row => row.fields.length > 0);

  // Calculate total visible fields count
  const totalVisibleFields = visibleRows.reduce((count, row) => count + row.fields.length, 0);

  // Don't render empty sections
  if (totalVisibleFields === 0 && !showEmptyFields && (!section.children || section.children.length === 0)) {
    return null;
  }

  const toggleCollapse = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  const SectionIcon = section.icon || getPriorityIcon(section.priority);
  const priorityStyles = getPriorityStyles(section.priority);

  return (
    <div className={`
      card-section border-theme-border transition-all duration-300
      ${animated ? 'animate-scale-in' : ''}
      priority-${section.priority}
      ${isCollapsed ? 'collapsed' : ''}
      ${section.className || ''}
    `}>
      {/* Section Header */}
      <div
        className={`
          section-header p-4 border-b border-theme-border/50 transition-all duration-200
          ${section.collapsible ? 'cursor-pointer' : ''}
        `}
        onClick={section.collapsible ? toggleCollapse : undefined}
      >
        <div className="flex items-center space-x-3">
          {section.collapsible && (
            <div className="flex-shrink-0">
              {isCollapsed ? (
                <ChevronRightIcon className="w-5 h-5 text-theme-muted" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-theme-muted" />
              )}
            </div>
          )}

          <div className="flex-shrink-0">
            <SectionIcon className={`w-6 h-6 ${priorityStyles.icon}`} />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-theme-foreground">
              {section.title}
            </h3>
            {section.description && (
              <p className="text-sm text-theme-muted mt-1">{section.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section Content */}
      <CollapseTransition
        isOpen={!isCollapsed}
        animateContent={animated}
        maxHeight="auto"
        expandedPadding="pt-4"
        collapsedPadding="p-0"
        className='overflow-y-hidden'
        duration={300}
        easing="ease-linear"
      >
        <div className="section-content space-y-4">
          {/* Use RowComponent for section rows */}
          {visibleRows.map((row, rowIndex) => (
            <RowComponent
              key={`row-${rowIndex}`}
              row={row}
              data={data}
              showEmptyFields={showEmptyFields}
              compact={compact}
              animated={animated}
              depth={depth}
              maxDepth={maxDepth}
              className={row.className}
            />
          ))}

          {/* Nested Sections */}
          {section.children?.map((childSection, index) => (
            <CardSectionComponent
              key={`${childSection.title}-${index}`}
              section={childSection}
              data={data}
              showEmptyFields={showEmptyFields}
              compact={compact}
              animated={animated}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}

          {/* Empty State */}
          {totalVisibleFields === 0 && showEmptyFields && (!section.children || section.children.length === 0) && (
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="w-12 h-12 text-theme-muted mx-auto mb-3" />
              <p className="text-theme-muted">No data available in this section</p>
            </div>
          )}
        </div>
      </CollapseTransition>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for CardSectionComponent
  return (
    deepEqual(prevProps.section, nextProps.section) &&
    deepEqual(prevProps.data, nextProps.data) &&
    prevProps.showEmptyFields === nextProps.showEmptyFields &&
    prevProps.compact === nextProps.compact &&
    prevProps.animated === nextProps.animated &&
    prevProps.depth === nextProps.depth &&
    prevProps.maxDepth === nextProps.maxDepth
  );
});

// Main Card Component
const Card = memo<CardProps>(({
  data,
  sections,
  className = '',
  showEmptyFields = false,
  compact = false,
  variant = 'default',
  animated = true,
  interactive = true,
  maxDepth = 3
}) => {
  const cardVariantStyles = getCardVariant(variant);

  const visibleSections = sections.filter(section => {
    if (showEmptyFields) return true;
    return section.rows.some(row =>
      row.fields.some(field => {
        const value = field.key.includes('.') ? getNestedValue(data, field.key) : data[field.key];
        // Improved logic that handles boolean false and number 0 correctly
        return (value !== null && value !== undefined) &&
          !(typeof value === 'string' && value.trim() === '') &&
          !(Array.isArray(value) && value.length === 0) &&
          !(typeof value === 'object' && value !== null && Object.keys(value).length === 0);
      })
    ) || (section.children && section.children.length > 0);
  });

  return (
    <div className={`
      card-container rounded-theme-xl transition-all duration-300 overflow-hidden
      ${cardVariantStyles}
      ${interactive ? 'hover:scale-[1.01]' : ''}
      ${animated ? 'animate-scale-in' : ''}
      ${className}
    `}>
      {/* Card Content */}
      <div className="card-content space-y-6 p-6">
        {visibleSections.map((section, index) => (
          <CardSectionComponent
            key={`${section.title}-${index}`}
            section={section}
            data={data}
            showEmptyFields={showEmptyFields}
            compact={compact}
            animated={animated}
            depth={0}
            maxDepth={maxDepth}
          />
        ))}

        {/* Empty State */}
        {visibleSections.length === 0 && (
          <div className="text-center py-12">
            <InformationCircleIcon className="w-16 h-16 text-theme-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-theme-foreground mb-2">No Data Available</h3>
            <p className="text-theme-muted">
              {showEmptyFields ? 'All sections are empty.' : 'No sections have data to display.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for main Card component
  return (
    deepEqual(prevProps.data, nextProps.data) &&
    deepEqual(prevProps.sections, nextProps.sections) &&
    prevProps.className === nextProps.className &&
    prevProps.showEmptyFields === nextProps.showEmptyFields &&
    prevProps.compact === nextProps.compact &&
    prevProps.variant === nextProps.variant &&
    prevProps.animated === nextProps.animated &&
    prevProps.interactive === nextProps.interactive &&
    prevProps.maxDepth === nextProps.maxDepth
  );
});

export default Card;