import { format, differenceInCalendarDays, isValid } from 'date-fns';
import { StatusBadge } from '@/components/StatusBadge';
import { Funder } from '@/types/funder';
import { Syndicator } from '@/types/syndicator';
import { BusinessDetail } from '@/types/businessDetail';


export const safeRender = (value: any): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object' && value.name) return String(value.name);
  return '-';
};


/**
 * Formats a phone number value for display
 * @param value - The phone number string to format
 * @returns Formatted phone number or 'N/A' for empty/invalid values
 */
export const formatPhone = (value: string | null | undefined): string => {
  if (!value) return '-';
  
  const trimmed = value.trim().toLowerCase();
  
  // Check for empty or placeholder values
  if (!trimmed || 
      trimmed === '+' || 
      trimmed === '-' || 
      trimmed === '+-' || 
      trimmed.replace('+', '') === 'n/a') {
    return '-';
  }
  
  // Add + prefix if not present
  return trimmed.startsWith('+') ? value.trim() : `+${value.trim()}`;
};

/**
 * Normalizes a phone number input for API submission
 * @param value - The phone number string to normalize
 * @returns Normalized phone number with + prefix or empty string
 */
export const normalizePhoneInput = (value: string | null | undefined): string => {
  if (!value || !value.trim()) return '';
  
  const trimmed = value.trim();
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
};

/**
 * Formats a date string for display
 * @param dateString - The date string to format
 * @returns Formatted date string or 'N/A' for empty/invalid dates
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '-';
    }
    return format(date, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * Formats a birthday date string for display
 * @param dateString - The date string to format
 * @returns Formatted birthday string or 'N/A' for empty/invalid dates
 */
export const formatBirthday = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'MMM d, yyyy');
};

/**
 * Gets a user-friendly label for user types
 * @param type - The user type string
 * @returns User-friendly type label
 */
export const getUserTypeLabel = (type: string | null | undefined): string => {
  if (!type) return '-';
  
  switch (type) {
    case 'admin': return 'Administrator';
    case 'user': return 'Standard User';
    case 'funder': return 'Funder';
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

/**
 * Formats an address object for display
 * @param address - The address object to format
 * @returns Formatted address string or 'N/A' for empty addresses
 */
export const formatAddress = (address?: {
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  zip?: string;
}): string => {
  if (!address) return '-';
  
  const parts = [];
  
  // Add address_1 if it exists
  if (address.address_1?.trim()) {
    parts.push(address.address_1.trim());
  }
  
  // Add address_2 if it exists
  if (address.address_2?.trim()) {
    parts.push(address.address_2.trim());
  }
  
  // Build city, state, zip part
  const cityStateZip = [];
  if (address.city?.trim()) {
    cityStateZip.push(address.city.trim());
  }
  if (address.state?.trim()) {
    cityStateZip.push(address.state.trim());
  }
  if (address.zip?.trim()) {
    cityStateZip.push(address.zip.trim());
  }
  
  // Only add city, state, zip if at least one exists
  if (cityStateZip.length > 0) {
    parts.push(cityStateZip.join(', '));
  }
  
  return parts.length > 0 ? parts.join(', ') : '-';
};

/**
 * Formats a full address object for display (stricter typing for required fields)
 * @param address - The address object to format
 * @returns Formatted address string or 'N/A' for empty addresses
 */
export const formatFullAddress = (address?: {
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  zip: string;
}): string => {
  if (!address) return '-';
  const parts = [
    address.address_1,
    address.address_2,
    `${address.city}, ${address.state} ${address.zip}`,
  ].filter(Boolean);
  return parts.join(', ');
}; 

export const formatCurrency = (value: number) => {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const formatCurrencyNoDecimals = (value: number) => {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format date/time values
export const formatTime = (value: string | Date | null | undefined): string => {
  if (!value) return '-';

  const date = typeof value === 'string' || typeof value === 'number'
    ? new Date(value)
    : value;

  if (isNaN(date.getTime())) return 'Invalid date';

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',  // e.g., Jun
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Get nested value from object using dot notation
export const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : undefined;
  }, obj);
};


export const formatNumberTwoDecimals = (value: number | string): string => {
  if (value === null || value === undefined || value === '') return '-';

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '-';

  return num.toFixed(2);
};

export const formatNumberFourDecimals = (value: number | string): string => {
  if (value === null || value === undefined || value === '') return '-';

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '-';

  return num.toFixed(4);
};


export const formatDateShort = (dateString?: string): string => { 
  let dateStr = '-';
  if (dateString) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }); // e.g. Mar
      const year = `'${date.getFullYear().toString().slice(-2)}`; // e.g. '24
      dateStr = `${month} ${year}`; // "Mar '24"
    }
  }
  return dateStr;
};

export const formatFunder = (funder: string | null | undefined) => {
  if (!funder) return '-';
  const funderObj = JSON.parse(funder) as Funder;
  const funderName = funderObj.name || '';
  const funderEmail = funderObj.email || '';
  const funderPhone = funderObj.phone || '';
  return `${funderName}\n📧 ${funderEmail}\n📞 ${funderPhone}`;
};

export const formatSyndicator = (syndicator: string | null | undefined) => {
  if (!syndicator) return '-';
  const syndicatorObj = JSON.parse(syndicator) as Syndicator;
  const syndicatorName = syndicatorObj.name || (syndicatorObj.first_name && syndicatorObj.last_name ? `${syndicatorObj.first_name} ${syndicatorObj.last_name}` : '');
  const syndicatorEmail = syndicatorObj.email || '';
  const syndicatorMobile = syndicatorObj.phone_mobile || '';
  const syndicatorWork = syndicatorObj.phone_work || '';
  const syndicatorHome = syndicatorObj.phone_home || '';
  return `${syndicatorName} (${syndicatorObj.first_name || ''} ${syndicatorObj.last_name || ''})\n📧 ${syndicatorEmail}\n📱 ${syndicatorMobile}\n📞 ${syndicatorWork}\n🏠 ${syndicatorHome}`;
};

export const formatBusinessDetail = (businessDetail: string | null | undefined) => {
  if (!businessDetail) return '-';
  
  try {
    const businessDetailObj = JSON.parse(businessDetail) as BusinessDetail;
    return `EIN: ${businessDetailObj.ein}\nEntity Type: ${businessDetailObj.entity_type}\nIncorporation Date: ${businessDetailObj.incorporation_date}\nState of Incorporation: ${businessDetailObj.state_of_incorporation}`;
  } catch (error) {
    // If it's not valid JSON, return the original string or a fallback
    return businessDetail || '-';
  }
};

export const formatExpireDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (!isValid(date)) return '-';
  const now = new Date();
  const days = differenceInCalendarDays(date, now);
  let daysText = '';
  if (days > 0) {
    daysText = `${days} days later`;
  } else if (days === 0) {
    daysText = 'today';
  } else {
    daysText = `${Math.abs(days)} days ago`;
  }
  return `${format(date, 'MMM d, yyyy')}\n${daysText}`;
};