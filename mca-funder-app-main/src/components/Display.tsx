import React, { memo } from 'react';
import { getNestedValue } from '@/components/GenericList/utils';
import CardLayout from '@/components/Cards/CardLayout';
import { safeRender, formatDate } from '@/lib/utils/format';
import { StatusBadge } from "@/components/StatusBadge";
import { SimpleList, Column } from "@/components/SimpleList";
import { 
    DevicePhoneMobileIcon, 
    BuildingOfficeIcon, 
    HomeIcon, 
    PhoneIcon,
    EnvelopeIcon 
} from '@heroicons/react/24/outline';

export type FieldType =
    'id' |
    'enum' |
    'text' |
    'date' |
    'array' |
    'currency' |
    'percent' |
    'number' |
    'funder' |
    'funding' |
    'syndicator' |
    'user'
;

export interface Field {
    type: FieldType;
    key: string;        // Dot-separated path indicating position in data, e.g., 'funder.name'
    title?: string;      // Display title for the field
    enumMapping?: Record<string, { label: string; color?: string }>; // Mapping for enum values to readable labels with colors
    arrayConfig?: {     // Configuration for array display
        columns: Column<any>[];
        emptyMessage?: string;
        title?: string;
    };
}

export interface Group {
    fields: Field[];
}

export interface Config {
    groups: Group[];
}

interface DisplayProps {
    data: any;
    config: Config;
    title?: string;     // Title for the card layout
    className?: string;
}

// Deep comparison function to check if two values are equal
const deepEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    
    if (a == null || b == null) return a === b;
    
    if (typeof a !== typeof b) return false;
    
    if (typeof a !== 'object') return a === b;
    
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!deepEqual(a[key], b[key])) return false;
    }
    
    return true;
};

// Custom comparison function for memo
const arePropsEqual = (prevProps: DisplayProps, nextProps: DisplayProps): boolean => {
    return (
        deepEqual(prevProps.data, nextProps.data) &&
        deepEqual(prevProps.config, nextProps.config) &&
        prevProps.title === nextProps.title &&
        prevProps.className === nextProps.className
    );
};

// Format field value
const formatFieldValue = (value: any, field: Field): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
        return <span className="text-gray-400 italic">N/A</span>;
    }

    // Special handling for booleans - convert to string for enum mapping
    if (typeof value === 'boolean') {
        value = value.toString();
    }

    switch (field.type) {
        case 'id':
            return <span className="font-mono text-sm">{safeRender(value)}</span>;
        
        case 'enum':
            const mapping = field.enumMapping?.[value];
            return <StatusBadge status={mapping?.label || value} color={mapping?.color} size="sm" />;
        
        case 'text':
            return <span className="text-md font-semibold text-gray-800">{safeRender(value)}</span>;
        
        case 'date':
            return <span className="text-md font-semibold text-gray-800">{formatDate(value)}</span>;
        
        case 'currency':
            // Format currency values with proper formatting including decimals
            const numericValue = typeof value === 'string' ? parseFloat(value) : value;
            if (isNaN(numericValue)) {
                return <span className="text-gray-400 italic">Invalid amount</span>;
            }
            return <span className="text-md font-semibold text-green-700">${numericValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
        
        case 'percent':
            // Format percentage values with proper formatting
            const percentValue = typeof value === 'string' ? parseFloat(value) : value;
            if (isNaN(percentValue)) {
                return <span className="text-gray-400 italic">Invalid percentage</span>;
            }
            return <span className="text-md font-semibold text-blue-700">{percentValue.toFixed(4)}%</span>;
        
        case 'number':
            // Format number values with 4 decimal places
            const numberValue = typeof value === 'string' ? parseFloat(value) : value;
            if (isNaN(numberValue)) {
                return <span className="text-gray-400 italic">Invalid number</span>;
            }
            return <span className="text-md font-semibold text-gray-800">{numberValue.toFixed(4)}</span>;
        
        case 'funder':
        case 'funding':
        case 'syndicator':
        case 'user':
            // Format entity information with name and contact details
            if (!value) {
                return <span className="text-gray-400 italic">N/A</span>;
            }

            let entityData: any = null;

            // Handle different value types - similar to array case
            if (typeof value === 'object' && value !== null) {
                entityData = value;
            } else if (typeof value === 'string') {
                // If it's a simple ID string (not JSON), display as ID
                try {
                    // Try to parse as JSON
                    const parsed = JSON.parse(value);
                    if (typeof parsed === 'object' && parsed !== null) {
                        entityData = parsed;
                    } else {
                        return <span className="font-mono text-sm">{safeRender(value)}</span>;
                    }
                } catch (error) {
                    // If JSON parsing fails, treat as simple ID string
                    return <span className="font-mono text-sm">{safeRender(value)}</span>;
                }
            } else {
                return <span className="text-gray-400 italic">Invalid data type</span>;
            }

            // Handle object case with entity details
            const entityName = entityData.name;
            const fullName = `${entityData.first_name || ''} ${entityData.last_name || ''}`.trim();
            const entityEmail = entityData.email;
            
            // Collect all phone types
            const phoneTypes = [
                { type: 'mobile', number: entityData.phone_mobile, icon: DevicePhoneMobileIcon, label: 'Mobile' },
                { type: 'work', number: entityData.phone_work, icon: BuildingOfficeIcon, label: 'Work' },
                { type: 'home', number: entityData.phone_home, icon: HomeIcon, label: 'Home' },
                { type: 'phone', number: entityData.phone, icon: PhoneIcon, label: 'Phone' }
            ].filter(phone => phone.number); // Only keep phones that have numbers

            return (
                <div className="flex flex-col gap-1">
                    {entityName && (
                        <div className="text-md font-semibold text-gray-800">
                            <span className="text-xs text-gray-500 mr-1">Name:</span>
                            {safeRender(entityName)}
                        </div>
                    )}
                    {fullName && (
                        <div className="text-md font-semibold text-gray-800">
                            <span className="text-xs text-gray-500 mr-1">Full Name:</span>
                            {safeRender(fullName)}
                        </div>
                    )}
                    {!entityName && !fullName && (
                        <div className="text-md font-semibold text-gray-800">
                            Unknown
                        </div>
                    )}
                    {entityEmail && (
                        <div className="text-sm flex items-center gap-1">
                            <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                            <a 
                                href={`mailto:${entityEmail}`} 
                                className="hover:underline"
                                title="Email"
                            >
                                {entityEmail}
                            </a>
                        </div>
                    )}
                    {phoneTypes.map((phone, index) => {
                        const IconComponent = phone.icon;
                        return (
                            <div key={`${phone.type}-${index}`} className="text-sm flex items-center gap-1">
                                <IconComponent className="w-4 h-4 text-gray-500" />
                                <a 
                                    href={`tel:${phone.number}`} 
                                    className="hover:underline"
                                    title={phone.label}
                                >
                                    {phone.number}
                                </a>
                            </div>
                        );
                    })}
                </div>
            );
        
        case 'array':
            if (!field.arrayConfig) {
                return <span className="text-gray-400 italic">No configuration</span>;
            }

            let arrayData: any[] = [];

            // Handle different value types
            if (Array.isArray(value)) {
                arrayData = value;
            } else if (typeof value === 'string') {
                try {
                    // Try to parse as JSON
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) {
                        arrayData = parsed;
                    } else {
                        return <span className="text-gray-400 italic">Invalid array format</span>;
                    }
                } catch (error) {
                    return <span className="text-gray-400 italic">Invalid JSON format</span>;
                }
            } else {
                return <span className="text-gray-400 italic">Invalid data type</span>;
            }

            if (arrayData.length === 0) {
                return <span className="text-gray-400 italic">No data</span>;
            }
            
            // Ensure each item has an _id for SimpleList requirement
            const processedData = arrayData.map((item, index) => ({
                ...item,
                _id: item._id || item.id || `item-${index}`
            }));

            return (
                <div className="w-full">
                    <SimpleList
                        data={processedData}
                        columns={field.arrayConfig.columns}
                        title={field.arrayConfig.title}
                        emptyMessage={field.arrayConfig.emptyMessage || "No items found"}
                    />
                </div>
            );
        
        default:
            return <span className="font-mono text-sm">{safeRender(value)}</span>;
    }
};

// Individual field component with memo for performance optimization
const FieldComponent: React.FC<{ field: Field; data: any }> = memo(({ field, data }) => {
    // Handle empty key (root object) specially
    const value = field.key === '' ? data : getNestedValue(data, field.key);
    const formattedValue = formatFieldValue(value, field);

    // For array type, we want full width display
    if (field.type === 'array') {
        return (
            <div className="col-span-2 flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500">{field.title}</p>
                <div className="w-full">
                    {formattedValue}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1 break-words whitespace-normal">
            <p className="text-xs font-medium text-gray-500">{field.title}</p>
            <h3 className="text-md font-semibold text-gray-800">
                {formattedValue}
            </h3>
        </div>
    );
}, (prevProps, nextProps) => {
    // Deep comparison for FieldComponent props
    return deepEqual(prevProps.field, nextProps.field) && 
           deepEqual(prevProps.data, nextProps.data);
});

// Main Display component
const Display: React.FC<DisplayProps> = ({
    data,
    config,
    title = 'Information',
    className = ''
}) => {
    if (!data || !config || !config.groups || config.groups.length === 0) {
        return (
            <CardLayout title={title}>
                <div className="text-center py-8 text-gray-500">
                    No data to display
                </div>
            </CardLayout>
        );
    }

    return (
        <CardLayout title={title}>
            <div className={`gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full ${className}`}>
                {config.groups.map((group, groupIndex) => (
                    <React.Fragment key={groupIndex}>
                        {/* Render all fields in current group */}
                        {group.fields.map((field) => (
                            <FieldComponent
                                key={field.key}
                                field={field}
                                data={data}
                            />
                        ))}

                        {/* Add divider between groups, except for the last one */}
                        {groupIndex < config.groups.length - 1 && (
                            <div className="col-span-2 border-b border-gray-300" />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </CardLayout>
    );
};

// Export component with memo and deep comparison
export default memo(Display, arePropsEqual);