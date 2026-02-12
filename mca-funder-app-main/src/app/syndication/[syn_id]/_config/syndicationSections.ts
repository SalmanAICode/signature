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
    
    if (hasField('funding.name')) {
        basicFields.push({
            key: 'funding.name',
            type: 'text' as const,
            title: 'Funding Source'
        });
    }
    
    if (hasField('funding._id')) {
        basicFields.push({
            key: 'funding._id',
            type: 'id' as const,
            title: 'Funding ID'
        });
    }

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

    // Entity Information Group - Syndicator and Funder details
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

    // Financial Overview Group - Primary financial amounts and calculations
    const financialOverviewFields = [];
    
    if (hasField('participate_amount')) {
        financialOverviewFields.push({
            key: 'participate_amount',
            type: 'currency' as const,
            title: 'Participate Amount'
        });
    }
    
    if (hasField('syndicated_amount')) {
        financialOverviewFields.push({
            key: 'syndicated_amount',
            type: 'currency' as const,
            title: 'Syndicated Amount'
        });
    }
    
    if (hasField('payback_amount')) {
        financialOverviewFields.push({
            key: 'payback_amount',
            type: 'currency' as const,
            title: 'Payback Amount'
        });
    }
    
    if (hasField('participate_percent')) {
        financialOverviewFields.push({
            key: 'participate_percent',
            type: 'percent' as const,
            title: 'Participate Percentage'
        });
    }
    
    if (hasField('factor_rate')) {
        financialOverviewFields.push({
            key: 'factor_rate',
            type: 'number' as const,
            title: 'Factor Rate'
        });
    }
    
    if (hasField('buy_rate')) {
        financialOverviewFields.push({
            key: 'buy_rate',
            type: 'number' as const,
            title: 'Buy Rate'
        });
    }

    if (financialOverviewFields.length > 0) {
        groups.push({ fields: financialOverviewFields });
    }

    // Fee & Credit Information Group - Fee and credit details with calculations
    const feesCreditSummaryFields = [];
    
    if (hasField('total_fee_amount')) {
        feesCreditSummaryFields.push({
            key: 'total_fee_amount',
            type: 'currency' as const,
            title: 'Total Fee Amount'
        });
    }
    
    if (hasField('total_credit_amount')) {
        feesCreditSummaryFields.push({
            key: 'total_credit_amount',
            type: 'currency' as const,
            title: 'Total Credit Amount'
        });
    }
    
    if (hasField('remaining_balance')) {
        feesCreditSummaryFields.push({
            key: 'remaining_balance',
            type: 'currency' as const,
            title: 'Remaining Balance'
        });
    }
    
    if (hasField('upfront_fee_amount')) {
        feesCreditSummaryFields.push({
            key: 'upfront_fee_amount',
            type: 'currency' as const,
            title: 'Upfront Fee'
        });
    }
    
    if (hasField('recurring_fee_amount')) {
        feesCreditSummaryFields.push({
            key: 'recurring_fee_amount',
            type: 'currency' as const,
            title: 'Recurring Fee'
        });
    }
    
    if (hasField('upfront_credit_amount')) {
        feesCreditSummaryFields.push({
            key: 'upfront_credit_amount',
            type: 'currency' as const,
            title: 'Upfront Credit'
        });
    }
    
    if (hasField('recurring_credit_amount')) {
        feesCreditSummaryFields.push({
            key: 'recurring_credit_amount',
            type: 'currency' as const,
            title: 'Recurring Credit'
        });
    }

    if (feesCreditSummaryFields.length > 0) {
        groups.push({ fields: feesCreditSummaryFields });
    }

    // Fees & Credits Detail Group - Detailed fee and credit items (arrays)
    const feesCreditDetailFields = [];
    
    if (hasArrayItems('fee_list')) {
        feesCreditDetailFields.push({
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
        feesCreditDetailFields.push({
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

    if (feesCreditDetailFields.length > 0) {
        groups.push({ fields: feesCreditDetailFields });
    }

    // Payout Information Group - Payout history and remaining amounts
    const payoutFields = [];
    
    if (hasField('payout_amount')) {
        payoutFields.push({
            key: 'payout_amount',
            type: 'currency' as const,
            title: 'Total Payout'
        });
    }
    
    if (hasField('payout_count')) {
        payoutFields.push({
            key: 'payout_count',
            type: 'text' as const,
            title: 'Payout Count'
        });
    }
    
    if (hasField('pending_amount')) {
        payoutFields.push({
            key: 'pending_amount',
            type: 'currency' as const,
            title: 'Pending Amount'
        });
    }
    
    if (hasField('payout_fee_amount')) {
        payoutFields.push({
            key: 'payout_fee_amount',
            type: 'currency' as const,
            title: 'Payout Fee'
        });
    }
    
    if (hasField('payout_credit_amount')) {
        payoutFields.push({
            key: 'payout_credit_amount',
            type: 'currency' as const,
            title: 'Payout Credit'
        });
    }
    
    if (hasField('redeemed_amount')) {
        payoutFields.push({
            key: 'redeemed_amount',
            type: 'currency' as const,
            title: 'Redeemed Amount'
        });
    }
    
    if (hasField('remaining_payback_amount')) {
        payoutFields.push({
            key: 'remaining_payback_amount',
            type: 'currency' as const,
            title: 'Remaining Payback'
        });
    }
    
    if (hasField('remaining_credit_amount')) {
        payoutFields.push({
            key: 'remaining_credit_amount',
            type: 'currency' as const,
            title: 'Remaining Credit'
        });
    }

    if (payoutFields.length > 0) {
        groups.push({ fields: payoutFields });
    }

    // Funding Details Group - Total funding amounts and rates from the original funding
    const fundingDetailsFields = [];
    
    if (hasField('total_funded_amount')) {
        fundingDetailsFields.push({
            key: 'total_funded_amount',
            type: 'currency' as const,
            title: 'Total Funded Amount'
        });
    }
    
    if (hasField('total_payback_amount')) {
        fundingDetailsFields.push({
            key: 'total_payback_amount',
            type: 'currency' as const,
            title: 'Total Payback Amount'
        });
    }
    
    if (hasField('funding.commission_amount')) {
        fundingDetailsFields.push({
            key: 'funding.commission_amount',
            type: 'currency' as const,
            title: 'Funding Commission'
        });
    }

    if (fundingDetailsFields.length > 0) {
        groups.push({ fields: fundingDetailsFields });
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
    
    if (hasField('active')) {
        scheduleFields.push({
            key: 'active',
            type: 'enum' as const,
            title: 'Active Status',
            enumMapping: BOOLEAN_MAPPING
        });
    }
    
    if (hasField('inactive')) {
        scheduleFields.push({
            key: 'inactive',
            type: 'enum' as const,
            title: 'Inactive Flag',
            enumMapping: BOOLEAN_MAPPING
        });
    }

    if (scheduleFields.length > 0) {
        groups.push({ fields: scheduleFields });
    }

    // System Information Group - System metadata and calculations
    const systemFields = [];
    
    if (hasField('createdAt')) {
        systemFields.push({
            key: 'createdAt',
            type: 'date' as const,
            title: 'Created Date'
        });
    }
    
    if (hasField('updatedAt')) {
        systemFields.push({
            key: 'updatedAt',
            type: 'date' as const,
            title: 'Updated Date'
        });
    }
    
    if (hasField('_calculatedStatsComplete')) {
        systemFields.push({
            key: '_calculatedStatsComplete',
            type: 'enum' as const,
            title: 'Stats Complete',
            enumMapping: BOOLEAN_MAPPING
        });
    }

    if (systemFields.length > 0) {
        groups.push({ fields: systemFields });
    }

    return { groups };
};
