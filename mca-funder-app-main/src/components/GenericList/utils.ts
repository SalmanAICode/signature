import { ColumnConfig } from './types';

// Format currency values
export const formatCurrency = (value: number) => {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

// Format date/time values
export const formatTime = (value: string | Date) => {
  if (!value) return '-';
  return new Date(value).toLocaleString();
};

// Format phone numbers
export const formatPhone = (value: string) => {
  const v = (value || '').trim().toLowerCase();
  if (!v || v === '+' || v === '-' || v === '+-' || v.replace('+', '') === 'n/a') {
    return 'N/A';
  }
  return v.startsWith('+') ? value : `+${value.trim()}`;
};

// Render status badge (simplified version for .ts file)
export const renderStatusBadge = (value: string) => {
  return value || '-';
};

// Get nested value from object using dot notation
export const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : undefined;
  }, obj);
};

// Flatten nested column configuration
export const flattenColumnConfig = <T>(columns: ColumnConfig<T>[]): ColumnConfig<T>[] => {
  return columns.reduce<ColumnConfig<T>[]>((acc, col) => {
    if ('columns' in col) {
      return [...acc, ...flattenColumnConfig(col.columns)];
    }
    return [...acc, col];
  }, []);
}; 