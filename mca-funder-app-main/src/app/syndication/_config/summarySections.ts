import { Config } from '@/components/Display';

// Enum mappings for better readability with colors
const STATUS_MAPPING = {
    'ACTIVE': { label: 'Active', color: 'green' },
    'CLOSED': { label: 'Closed', color: 'red' },
    'PENDING': { label: 'Pending', color: 'yellow' },
    'SUSPENDED': { label: 'Suspended', color: 'orange' }
};

const BOOLEAN_MAPPING = {
    'true': { label: 'Yes', color: 'green' },
    'false': { label: 'No', color: 'red' }
};

/**
 * Generate summary configuration for syndication data
 * This allows for dynamic configuration that adapts to the actual data structure
 * @param data - The syndication data object
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

    // Helper function to check if entity/user object exists
    const hasEntityField = (key: string): boolean => {
        const keys = key.split('.');
        let current = data;
        for (const k of keys) {
            if (current == null || typeof current !== 'object') return false;
            current = current[k];
        }
        return current !== undefined && current !== null && 
               (typeof current === 'object' || typeof current === 'string');
    };

    const groups: Config['groups'] = [];

    // Basic Information Group - Core syndication details
    const basicFields = [];
    
    if (hasField('_id')) {
        basicFields.push({
            key: '_id',
            type: 'id' as const,
            title: 'Syndication ID'
        });
    }
    
    // Funding - use funding type for better display
    if (hasEntityField('funding')) {
        basicFields.push({
            key: 'funding',
            type: 'funding' as const,
            title: 'Funding'
        });
    }

    // Syndication Offer
    if (hasField('syndication_offer')) {
        basicFields.push({
            key: 'syndication_offer',
            type: 'id' as const,
            title: 'Syndication Offer ID'
        });
    }

    if (basicFields.length > 0) {
        groups.push({ fields: basicFields });
    }

    const entityFields = [];

    // Syndicator - use syndicator type for better display
    if (hasEntityField('syndicator')) {
        entityFields.push({
            key: 'syndicator',
            type: 'syndicator' as const,
            title: 'Syndicator'
        });
    }
    
    // Funder - use funder type for better display
    if (hasEntityField('funder')) {
        entityFields.push({
            key: 'funder',
            type: 'funder' as const,
            title: 'Funder'
        });
    }

    if (hasEntityField('lender')) {
        entityFields.push({
            key: 'lender',
            type: 'funder' as const,
            title: 'Lender'
        });
    }

    if (entityFields.length > 0) {
        groups.push({ fields: entityFields });
    }

    // Financial Information Group - Financial amounts and calculations
    const financialFields = [];
    
    if (hasField('participate_amount')) {
        financialFields.push({
            key: 'participate_amount',
            type: 'currency' as const,
            title: 'Participate Amount'
        });
    }
    
    if (hasField('participate_percent')) {
        financialFields.push({
            key: 'participate_percent',
            type: 'percent' as const,
            title: 'Participate Percentage'
        });
    }
    
    if (hasField('payback_amount')) {
        financialFields.push({
            key: 'payback_amount',
            type: 'currency' as const,
            title: 'Payback Amount'
        });
    }
    
    if (hasField('commission_amount')) {
        financialFields.push({
            key: 'commission_amount',
            type: 'currency' as const,
            title: 'Commission Amount'
        });
    }
    
    if (hasField('management_percent')) {
        financialFields.push({
            key: 'management_percent',
            type: 'percent' as const,
            title: 'Management Percentage'
        });
    }

    // Additional financial fields that might exist
    if (hasField('total_fee_amount')) {
        financialFields.push({
            key: 'total_fee_amount',
            type: 'currency' as const,
            title: 'Total Fee Amount'
        });
    }

    if (hasField('total_credit_amount')) {
        financialFields.push({
            key: 'total_credit_amount',
            type: 'currency' as const,
            title: 'Total Credit Amount'
        });
    }

    if (financialFields.length > 0) {
        groups.push({ fields: financialFields });
    }

    // Fees & Credits Group - Only show if there are items
    const feesCreditFields = [];
    
    if (hasArrayItems('fee_list')) {
        feesCreditFields.push({
            key: 'fee_list',
            type: 'array' as const,
            arrayConfig: {
                columns: [
                    {
                        key: 'name',
                        label: 'Fee Name',
                        sortable: false,
                        render: (value: any) => value || 'N/A'
                    },
                    {
                        key: 'expense_type.name',
                        label: 'Expense Type',
                        sortable: false,
                        render: (value: any) => value || 'N/A'
                    },
                    {
                        key: 'amount',
                        label: 'Amount',
                        sortable: false,
                        render: (value: any) => {
                            if (value === undefined || value === null || isNaN(value)) return 'N/A';
                            return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                    },
                    {
                        key: 'upfront',
                        label: 'Upfront',
                        sortable: false,
                        render: (value: any) => value ? 'Yes' : 'No'
                    }
                ],
                title: 'Fee List',
                emptyMessage: 'No fees found'
            }
        });
    }
    
    if (hasArrayItems('credit_list')) {
        feesCreditFields.push({
            key: 'credit_list',
            type: 'array' as const,
            arrayConfig: {
                columns: [
                    {
                        key: 'name',
                        label: 'Credit Name',
                        sortable: false,
                        render: (value: any) => value || 'N/A'
                    },
                    {
                        key: 'fee_type.name',
                        label: 'Fee Type',
                        sortable: false,
                        render: (value: any) => value || 'N/A'
                    },
                    {
                        key: 'amount',
                        label: 'Amount',
                        sortable: false,
                        render: (value: any) => {
                            if (value === undefined || value === null || isNaN(value)) return 'N/A';
                            return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                    },
                    {
                        key: 'upfront',
                        label: 'Upfront',
                        sortable: false,
                        render: (value: any) => value ? 'Yes' : 'No'
                    }
                ],
                title: 'Credit List',
                emptyMessage: 'No credits found'
            }
        });
    }

    if (feesCreditFields.length > 0) {
        groups.push({ fields: feesCreditFields });
    }

    // Schedule & Status Group - Timeline and current status
    const scheduleFields = [];
    
    if (hasField('start_date')) {
        scheduleFields.push({
            key: 'start_date',
            type: 'date' as const,
            title: 'Start Date'
        });
    }
    
    if (hasField('end_date')) {
        scheduleFields.push({
            key: 'end_date',
            type: 'date' as const,
            title: 'End Date'
        });
    }
    
    if (hasField('status')) {
        scheduleFields.push({
            key: 'status',
            type: 'enum' as const,
            title: 'Status',
            enumMapping: STATUS_MAPPING
        });
    }

    // Additional schedule fields
    if (hasField('completion_date')) {
        scheduleFields.push({
            key: 'completion_date',
            type: 'date' as const,
            title: 'Completion Date'
        });
    }

    if (hasField('next_payment_date')) {
        scheduleFields.push({
            key: 'next_payment_date',
            type: 'date' as const,
            title: 'Next Payment Date'
        });
    }

    if (scheduleFields.length > 0) {
        groups.push({ fields: scheduleFields });
    }

    // Additional Information Group - Other relevant fields
    const additionalFields = [];

    if (hasField('notes')) {
        additionalFields.push({
            key: 'notes',
            type: 'text' as const,
            title: 'Notes'
        });
    }

    if (hasField('priority')) {
        additionalFields.push({
            key: 'priority',
            type: 'enum' as const,
            title: 'Priority',
            enumMapping: BOOLEAN_MAPPING
        });
    }

    if (hasField('internal')) {
        additionalFields.push({
            key: 'internal',
            type: 'enum' as const,
            title: 'Internal',
            enumMapping: BOOLEAN_MAPPING
        });
    }

    if (additionalFields.length > 0) {
        groups.push({ fields: additionalFields });
    }

    // System Information Group - System metadata (only if needed)
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

    if (hasField('created_by.name')) {
        systemFields.push({
            key: 'created_by.name',
            type: 'text' as const,
            title: 'Created By'
        });
    } else if (hasField('created_by')) {
        systemFields.push({
            key: 'created_by',
            type: 'id' as const,
            title: 'Created By ID'
        });
    }

    if (hasField('updated_by.name')) {
        systemFields.push({
            key: 'updated_by.name',
            type: 'text' as const,
            title: 'Updated By'
        });
    } else if (hasField('updated_by')) {
        systemFields.push({
            key: 'updated_by',
            type: 'id' as const,
            title: 'Updated By ID'
        });
    }

    if (systemFields.length > 0) {
        groups.push({ fields: systemFields });
    }

    return { groups };
};
