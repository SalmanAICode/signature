import { Config } from '@/components/Display';

// Enum mappings for better readability with colors
const STATUS_MAPPING = {
    'PENDING': { label: 'Pending', color: 'yellow' },
    'ACCEPTED': { label: 'Accepted', color: 'green' },
    'REJECTED': { label: 'Rejected', color: 'red' },
    'EXPIRED': { label: 'Expired', color: 'gray' },
    'WITHDRAWN': { label: 'Withdrawn', color: 'orange' }
};

const BOOLEAN_MAPPING = {
    'true': { label: 'Yes', color: 'green' },
    'false': { label: 'No', color: 'red' }
};

/**
 * Generate summary configuration for syndication offer data
 * This allows for dynamic configuration that adapts to the actual data structure
 * @param data - The syndication offer data object
 * @returns Config object for the Display component
 */
export const getInformationConfig = (data: any): Config => {
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

    // Offer Information Group - Core offer details and status
    const offerInfoFields = [];
    
    if (hasField('_id')) {
        offerInfoFields.push({
            key: '_id',
            type: 'id' as const,
            title: 'Offer ID'
        });
    }
    
    if (hasField('status')) {
        offerInfoFields.push({
            key: 'status',
            type: 'enum' as const,
            title: 'Status',
            enumMapping: STATUS_MAPPING
        });
    }
    
    if (hasField('status_date')) {
        offerInfoFields.push({
            key: 'status_date',
            type: 'date' as const,
            title: 'Status Date'
        });
    }
    
    if (hasField('created_by_user')) {
        offerInfoFields.push({
            key: 'created_by_user',
            type: 'user' as const,
            title: 'Offered User'
        });
    }
    
    if (hasField('created_by_user._id')) {
        offerInfoFields.push({
            key: 'created_by_user._id',
            type: 'id' as const,
            title: 'Offered User ID'
        });
    }
    
    if (hasField('expired_date')) {
        offerInfoFields.push({
            key: 'expired_date',
            type: 'date' as const,
            title: 'Expire Date'
        });
    }

    if (offerInfoFields.length > 0) {
        groups.push({ fields: offerInfoFields });
    }

    // Financial Details Group - Primary financial amounts and calculations
    const financialFields = [];
    
    if (hasField('participate_amount')) {
        financialFields.push({
            key: 'participate_amount',
            type: 'currency' as const,
            title: 'Participate Amount'
        });
    }
    
    if (hasField('payback_amount')) {
        financialFields.push({
            key: 'payback_amount',
            type: 'currency' as const,
            title: 'Payback Amount'
        });
    }
    
    if (hasField('syndicated_amount')) {
        financialFields.push({
            key: 'syndicated_amount',
            type: 'currency' as const,
            title: 'Syndicated Amount'
        });
    }
    
    if (hasField('participate_percent')) {
        financialFields.push({
            key: 'participate_percent',
            type: 'percent' as const,
            title: 'Participate Percentage'
        });
    }
    
    if (hasField('factor_rate')) {
        financialFields.push({
            key: 'factor_rate',
            type: 'number' as const,
            title: 'Factor Rate'
        });
    }
    
    if (hasField('buy_rate')) {
        financialFields.push({
            key: 'buy_rate',
            type: 'number' as const,
            title: 'Buy Rate'
        });
    }

    if (financialFields.length > 0) {
        groups.push({ fields: financialFields });
    }

    // Fee Information Group - Fee details and calculations
    const feeFields = [];
    
    if (hasField('total_fee_amount')) {
        feeFields.push({
            key: 'total_fee_amount',
            type: 'currency' as const,
            title: 'Total Fee Amount'
        });
    }
    
    if (hasField('upfront_fee_amount')) {
        feeFields.push({
            key: 'upfront_fee_amount',
            type: 'currency' as const,
            title: 'Upfront Fee Amount'
        });
    }
    
    if (hasField('recurring_fee_amount')) {
        feeFields.push({
            key: 'recurring_fee_amount',
            type: 'currency' as const,
            title: 'Recurring Fee Amount'
        });
    }

    if (feeFields.length > 0) {
        groups.push({ fields: feeFields });
    }

    // Fee List Group - Detailed fee items (array)
    const feeListFields = [];
    
    if (hasArrayItems('fee_list')) {
        feeListFields.push({
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

    if (feeListFields.length > 0) {
        groups.push({ fields: feeListFields });
    }

    // Credit Information Group - Credit details and calculations
    const creditFields = [];
    
    if (hasField('total_credit_amount')) {
        creditFields.push({
            key: 'total_credit_amount',
            type: 'currency' as const,
            title: 'Total Credit Amount'
        });
    }
    
    if (hasField('upfront_credit_amount')) {
        creditFields.push({
            key: 'upfront_credit_amount',
            type: 'currency' as const,
            title: 'Upfront Credit Amount'
        });
    }
    
    if (hasField('recurring_credit_amount')) {
        creditFields.push({
            key: 'recurring_credit_amount',
            type: 'currency' as const,
            title: 'Recurring Credit Amount'
        });
    }

    if (creditFields.length > 0) {
        groups.push({ fields: creditFields });
    }

    // Credit List Group - Detailed credit items (array)
    const creditListFields = [];
    
    if (hasArrayItems('credit_list')) {
        creditListFields.push({
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

    if (creditListFields.length > 0) {
        groups.push({ fields: creditListFields });
    }

    // Related Information Group - Connected entities and relationships
    const relatedInfoFields = [];
    
    if (hasField('funding.name')) {
        relatedInfoFields.push({
            key: 'funding.name',
            type: 'text' as const,
            title: 'Funding Source'
        });
    }
    
    if (hasField('funding._id')) {
        relatedInfoFields.push({
            key: 'funding._id',
            type: 'id' as const,
            title: 'Funding ID'
        });
    }

    // Syndicator - use syndicator type for better display
    if (hasEntityField('syndicator')) {
        relatedInfoFields.push({
            key: 'syndicator',
            type: 'syndicator' as const,
            title: 'Syndicator'
        });
    }
    
    // Funder - use funder type for better display
    if (hasEntityField('funder')) {
        relatedInfoFields.push({
            key: 'funder',
            type: 'funder' as const,
            title: 'Funder'
        });
    }

    if (hasEntityField('lender')) {
        relatedInfoFields.push({
            key: 'lender',
            type: 'funder' as const,
            title: 'Lender'
        });
    }

    if (relatedInfoFields.length > 0) {
        groups.push({ fields: relatedInfoFields });
    }

    return { groups };
};
