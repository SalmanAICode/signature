import { Config } from '@/components/Display';

// Enum mappings for better readability with colors
const CALCULATE_TYPE_MAPPING = {
    'AMOUNT': { label: 'Amount', color: 'blue' },
    'PERCENT': { label: 'Percent', color: 'green' }
};

const TIER_TYPE_MAPPING = {
    'FACTOR_RATE': { label: 'Factor Rate', color: 'purple' },
    'FUND': { label: 'Fund', color: 'blue' },
    'PAYBACK': { label: 'Payback', color: 'orange' },
    'NONE': { label: 'None', color: 'gray' }
};

const BOOLEAN_MAPPING = {
    'true': { label: 'Yes', color: 'green' },
    'false': { label: 'No', color: 'red' }
};

const BASE_ITEM_MAPPING = {
    'FUND': { label: 'Fund', color: 'blue' },
    'PAYBACK': { label: 'Payback', color: 'orange' },
    'NONE': { label: 'None', color: 'gray' }
};

/**
 * Generate summary configuration based on the provided data
 * This allows for dynamic configuration that adapts to the actual data structure
 * @param data - The formula data object
 * @returns Config object for the Display component
 */
export const getSummaryConfig = (data: any): Config => {
    // Helper function to check if a field exists and has a meaningful value
    const hasField = (key: string): boolean => {
        const keys = key.split('.');
        let current = data;
        for (const k of keys) {
            if (current == null || typeof current !== 'object') return false;
            current = current[k];
        }
        return current !== undefined && current !== null && current !== '';
    };

    // Helper function to check if an array field has items
    const hasArrayItems = (key: string): boolean => {
        const keys = key.split('.');
        let current = data;
        for (const k of keys) {
            if (current == null || typeof current !== 'object') return false;
            current = current[k];
        }
        return Array.isArray(current) && current.length > 0;
    };

    const groups: Config['groups'] = [];

    // Basic Information Group - Core formula details
    const basicFields = [];
    
    if (hasField('_id')) {
        basicFields.push({
            key: '_id',
            type: 'id' as const,
            title: 'Formula ID'
        });
    }
    
    if (hasField('name')) {
        basicFields.push({
            key: 'name',
            type: 'text' as const,
            title: 'Formula Name'
        });
    }

    if (hasField('funder')) {
        basicFields.push({
            key: 'funder',
            type: 'id' as const,
            title: 'Funder ID'
        });
    }
    
    if (hasField('calculate_type')) {
        basicFields.push({
            key: 'calculate_type',
            type: 'enum' as const,
            title: 'Calculate Type',
            enumMapping: CALCULATE_TYPE_MAPPING
        });
    }
    
    if (hasField('tier_type')) {
        basicFields.push({
            key: 'tier_type',
            type: 'enum' as const,
            title: 'Tier Type',
            enumMapping: TIER_TYPE_MAPPING
        });
    }

    if (basicFields.length > 0) {
        groups.push({ fields: basicFields });
    }

    // Configuration Group - Formula settings
    const configFields = [];
    
    // Only show base_item if calculate_type is not AMOUNT
    if (hasField('base_item') && data?.calculate_type !== 'AMOUNT') {
        configFields.push({
            key: 'base_item',
            type: 'enum' as const,
            title: 'Base Item',
            enumMapping: BASE_ITEM_MAPPING
        });
    }
    
    if (hasField('shared')) {
        configFields.push({
            key: 'shared',
            type: 'enum' as const,
            title: 'Shared',
            enumMapping: BOOLEAN_MAPPING
        });
    }
    
    if (hasField('inactive')) {
        configFields.push({
            key: 'inactive',
            type: 'enum' as const,
            title: 'Inactive',
            enumMapping: BOOLEAN_MAPPING
        });
    }

    if (configFields.length > 0) {
        groups.push({ fields: configFields });
    }

    // Value Configuration Group - Tier list or single values
    if (hasArrayItems('tier_list')) {
        const calculateType = data?.calculate_type;
        const tierType = data?.tier_type;
        
        // Only show simplified single field when tier_type is NONE/null/undefined
        if ((tierType === 'NONE' || tierType === null || tierType === undefined)) {
            if (calculateType === 'AMOUNT') {
                // For AMOUNT type with NONE tier, only show the first tier's amount as a simple field
                const firstTierAmount = data.tier_list?.[0]?.amount;
                if (firstTierAmount !== undefined && firstTierAmount !== null) {
                    groups.push({
                        fields: [
                            {
                                key: 'tier_list.0.amount',
                                type: 'currency' as const,
                                title: 'Amount'
                            }
                        ]
                    });
                }
            } else if (calculateType === 'PERCENT') {
                // For PERCENT type with NONE tier, only show the first tier's percent as a simple field
                const firstTierPercent = data.tier_list?.[0]?.percent;
                if (firstTierPercent !== undefined && firstTierPercent !== null) {
                    groups.push({
                        fields: [
                            {
                                key: 'tier_list.0.percent',
                                type: 'percent' as const,
                                title: 'Percent'
                            }
                        ]
                    });
                }
            }
        } else {
            // For all other tier types, show the full tier list table
            // Dynamically build columns based on calculate_type
            const baseColumns = [
                {
                    key: 'min_number',
                    label: 'Min Number',
                    sortable: false,
                    render: (value: any) => {
                        if (value === undefined || value === null) return 'N/A';
                        return value === Number.MAX_SAFE_INTEGER ? '∞' : `${value.toLocaleString()}`;
                    }
                },
                {
                    key: 'max_number',
                    label: 'Max Number',
                    sortable: false,
                    render: (value: any) => {
                        if (value === undefined || value === null) return 'N/A';
                        return value === Number.MAX_SAFE_INTEGER ? '∞' : `${value.toLocaleString()}`;
                    }
                }
            ];

            // Add appropriate value column based on calculate_type
            if (calculateType === 'AMOUNT') {
                baseColumns.push({
                    key: 'amount',
                    label: 'Amount',
                    sortable: false,
                    render: (value: any) => {
                        if (value === undefined || value === null || isNaN(value)) return 'N/A';
                        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    }
                });
            } else if (calculateType === 'PERCENT') {
                baseColumns.push({
                    key: 'percent',
                    label: 'Percent',
                    sortable: false,
                    render: (value: any) => {
                        if (value === undefined || value === null || isNaN(value)) return 'N/A';
                        return `${value.toFixed(4)}%`;
                    }
                });
            }

            groups.push({
                fields: [
                    {
                        key: 'tier_list',
                        type: 'array' as const,
                        arrayConfig: {
                            columns: baseColumns,
                            title: 'Tier List',
                            emptyMessage: 'No tier configurations found'
                        }
                    }
                ]
            });
        }
    }

    // System Information Group - Timestamps (only if needed)
    const systemFields = [];
    
    if (hasField('createdAt')) {
        systemFields.push({
            key: 'createdAt',
            type: 'date' as const,
            title: 'Created At'
        });
    }
    
    if (hasField('updatedAt')) {
        systemFields.push({
            key: 'updatedAt',
            type: 'date' as const,
            title: 'Updated At'
        });
    }

    if (systemFields.length > 0) {
        groups.push({ fields: systemFields });
    }

    return { groups };
}; 