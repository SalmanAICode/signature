import React from 'react';
import { ColumnConfig } from "./types";
import { StatusBadge } from '../StatusBadge';

export function getNestedValue<T>(obj: T, key: string): React.ReactNode {
    const keys = key.split('.');  // Split the key string into parts
    let value: any = obj;
    for (let i = 0; i < keys.length; i++) {
        if (value && value[keys[i]] !== undefined) {
            value = value[keys[i]];
        } else {
            return '-';  // Return a default fallback value
        }
    }
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);  // Convert object to string
    }
    return value;  // Return the value as is (assuming it's already a valid React node)
}

// helper function to flatten columns
// the global unique key is created appending the column key to the parent key as nested key structure
// all other columns properties are copied to the global key
export function flattenColumnConfig<T>(cols: ColumnConfig<T>[], prefix = ''): ColumnConfig<T>[] {
    return cols.flatMap(col => {
        if ('columns' in col) {
            const groupPrefix = col.key ? `${prefix}${col.key}.` : prefix;
            return flattenColumnConfig(col.columns, groupPrefix);
        }
        return [{ ...col, key: `${prefix}${col.key}` }];
    });
}

export function formatCurrency(amount: number): string {
    if (typeof amount !== 'number') {
      return '-';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
}

export function renderStatusBadge(value: string) {
    return <StatusBadge status={value} />;
};

export function formatTime(value: string) {
    return new Date(value).toLocaleString();
}; 


// export function formatPhone(value: string) {
//     if (!value) return '-';
//     const cleaned = value.replace(/\D/g, '');
//     const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
//     if (match) {
//         return `(${match[1]}) ${match[2]}-${match[3]}`;
//     }
//     return value;
// }

export function formatPhone(value: string) {
    const v = (value || '').trim().toLowerCase();
    if (!v || v === '+' || v === '-' || v === '+-' || v.replace('+', '') === 'n/a') {
      return 'N/A';
    }
    return v.startsWith('+') ? value : `+${value.trim()}`;
}