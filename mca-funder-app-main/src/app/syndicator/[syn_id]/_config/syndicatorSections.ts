import { Config } from '@/components/Display';

// Enum mappings for better readability with colors
const BOOLEAN_MAPPING = {
    'true': { label: 'Yes', color: 'green' },
    'false': { label: 'No', color: 'red' }
};

const STATUS_MAPPING = {
    'true': { label: 'Active', color: 'green' },
    'false': { label: 'Inactive', color: 'red' }
};

const INACTIVE_MAPPING = {
    'true': { label: 'Inactive', color: 'red' },
    'false': { label: 'Active', color: 'green' }
};

// Helper function to check if a field exists and has a meaningful value
const hasField = (data: any, key: string): boolean => {
    const keys = key.split('.');
    let current = data;
    for (const k of keys) {
        if (current == null || typeof current !== 'object') return false;
        current = current[k];
    }
    return current !== undefined && current !== null && current !== '';
};

// Helper function to check if an array field has items
const hasArrayItems = (data: any, key: string): boolean => {
    const keys = key.split('.');
    let current = data;
    for (const k of keys) {
        if (current == null || typeof current !== 'object') return false;
        current = current[k];
    }
    return Array.isArray(current) && current.length > 0;
};

/**
 * Basic Information Configuration - uses syndicator type for integrated display
 */
export const getBasicInformationConfig = (data: any): Config => {
    const fields = [];
    
    // Syndicator ID as separate field
    if (hasField(data, '_id')) {
        fields.push({
            key: '_id',
            type: 'id' as const,
            title: 'Syndicator ID'
        });
    }
    
    // Use syndicator type to display all syndicator information in one field
    // This will show name, full name, email, and phone numbers in a structured format
    if (data) {
        fields.push({
            key: '',  // Empty string to represent root object
            type: 'syndicator' as const,
            title: 'Syndicator Information'
        });
    }
    
    // Status as separate field for better visibility
    if (hasField(data, 'active')) {
        fields.push({
            key: 'active',
            type: 'enum' as const,
            title: 'Status',
            enumMapping: STATUS_MAPPING
        });
    }

    return { groups: fields.length > 0 ? [{ fields }] : [] };
};

/**
 * Address Information Configuration - matches cardSections.ts Address Information
 */
export const getAddressInformationConfig = (data: any): Config => {
    const fields = [];
    
    if (hasField(data, 'address_detail.address_1')) {
        fields.push({
            key: 'address_detail.address_1',
            type: 'text' as const,
            title: 'Address Line 1'
        });
    }
    
    if (hasField(data, 'address_detail.address_2')) {
        fields.push({
            key: 'address_detail.address_2',
            type: 'text' as const,
            title: 'Address Line 2'
        });
    }
    
    if (hasField(data, 'address_detail.city')) {
        fields.push({
            key: 'address_detail.city',
            type: 'text' as const,
            title: 'City'
        });
    }
    
    if (hasField(data, 'address_detail.state')) {
        fields.push({
            key: 'address_detail.state',
            type: 'text' as const,
            title: 'State'
        });
    }
    
    if (hasField(data, 'address_detail.zip')) {
        fields.push({
            key: 'address_detail.zip',
            type: 'text' as const,
            title: 'ZIP Code'
        });
    }

    return { groups: fields.length > 0 ? [{ fields }] : [] };
};

/**
 * Business Information Configuration - matches cardSections.ts Business Information
 */
export const getBusinessInformationConfig = (data: any): Config => {
    const fields = [];
    
    if (hasField(data, 'business_detail.ein')) {
        fields.push({
            key: 'business_detail.ein',
            type: 'text' as const,
            title: 'EIN'
        });
    }
    
    if (hasField(data, 'business_detail.entity_type')) {
        fields.push({
            key: 'business_detail.entity_type',
            type: 'text' as const,
            title: 'Entity Type'
        });
    }
    
    if (hasField(data, 'business_detail.incorporation_date')) {
        fields.push({
            key: 'business_detail.incorporation_date',
            type: 'date' as const,
            title: 'Incorporation Date'
        });
    }
    
    if (hasField(data, 'business_detail.state_of_incorporation')) {
        fields.push({
            key: 'business_detail.state_of_incorporation',
            type: 'text' as const,
            title: 'State of Incorporation'
        });
    }

    return { groups: fields.length > 0 ? [{ fields }] : [] };
};

/**
 * Statistics Overview Configuration - matches cardSections.ts Statistics Overview
 */
export const getStatisticsConfig = (data: any): Config => {
    const fields = [];
    
    if (hasField(data, 'funder_count')) {
        fields.push({
            key: 'funder_count',
            type: 'text' as const,
            title: 'Total Funders'
        });
    }
    
    if (hasField(data, 'account_count')) {
        fields.push({
            key: 'account_count',
            type: 'text' as const,
            title: 'Accounts'
        });
    }
    
    if (hasField(data, 'syndication_count')) {
        fields.push({
            key: 'syndication_count',
            type: 'text' as const,
            title: 'Total Syndications'
        });
    }
    
    if (hasField(data, 'access_log_count')) {
        fields.push({
            key: 'access_log_count',
            type: 'text' as const,
            title: 'Access Logs'
        });
    }
    
    if (hasField(data, 'active_syndication_count')) {
        fields.push({
            key: 'active_syndication_count',
            type: 'text' as const,
            title: 'Active Syndications'
        });
    }
    
    if (hasField(data, 'closed_syndication_count')) {
        fields.push({
            key: 'closed_syndication_count',
            type: 'text' as const,
            title: 'Closed Syndications'
        });
    }

    return { groups: fields.length > 0 ? [{ fields }] : [] };
};

/**
 * Syndication Offers Configuration - matches cardSections.ts Syndication Offers
 */
export const getSyndicationOffersConfig = (data: any): Config => {
    const fields = [];
    
    // Offer counts
    if (hasField(data, 'syndication_offer_count')) {
        fields.push({
            key: 'syndication_offer_count',
            type: 'text' as const,
            title: 'Total Offers'
        });
    }
    
    if (hasField(data, 'pending_syndication_offer_count')) {
        fields.push({
            key: 'pending_syndication_offer_count',
            type: 'text' as const,
            title: 'Pending'
        });
    }
    
    if (hasField(data, 'accepted_syndication_offer_count')) {
        fields.push({
            key: 'accepted_syndication_offer_count',
            type: 'text' as const,
            title: 'Accepted'
        });
    }
    
    if (hasField(data, 'declined_syndication_offer_count')) {
        fields.push({
            key: 'declined_syndication_offer_count',
            type: 'text' as const,
            title: 'Declined'
        });
    }
    
    if (hasField(data, 'cancelled_syndication_offer_count')) {
        fields.push({
            key: 'cancelled_syndication_offer_count',
            type: 'text' as const,
            title: 'Cancelled'
        });
    }
    
    // Offer amounts
    if (hasField(data, 'syndication_offer_amount')) {
        fields.push({
            key: 'syndication_offer_amount',
            type: 'currency' as const,
            title: 'Total Amount'
        });
    }
    
    if (hasField(data, 'pending_syndication_offer_amount')) {
        fields.push({
            key: 'pending_syndication_offer_amount',
            type: 'currency' as const,
            title: 'Pending Amount'
        });
    }
    
    if (hasField(data, 'accepted_syndication_offer_amount')) {
        fields.push({
            key: 'accepted_syndication_offer_amount',
            type: 'currency' as const,
            title: 'Accepted Amount'
        });
    }
    
    if (hasField(data, 'declined_syndication_offer_amount')) {
        fields.push({
            key: 'declined_syndication_offer_amount',
            type: 'currency' as const,
            title: 'Declined Amount'
        });
    }
    
    if (hasField(data, 'cancelled_syndication_offer_amount')) {
        fields.push({
            key: 'cancelled_syndication_offer_amount',
            type: 'currency' as const,
            title: 'Cancelled Amount'
        });
    }

    return { groups: fields.length > 0 ? [{ fields }] : [] };
};

/**
 * Syndication Amounts Configuration - matches cardSections.ts Syndication Amounts
 */
export const getSyndicationAmountsConfig = (data: any): Config => {
    const fields = [];
    
    if (hasField(data, 'syndication_amount')) {
        fields.push({
            key: 'syndication_amount',
            type: 'currency' as const,
            title: 'Total Syndication Amount'
        });
    }
    
    if (hasField(data, 'active_syndication_amount')) {
        fields.push({
            key: 'active_syndication_amount',
            type: 'currency' as const,
            title: 'Active Amount'
        });
    }
    
    if (hasField(data, 'closed_syndication_amount')) {
        fields.push({
            key: 'closed_syndication_amount',
            type: 'currency' as const,
            title: 'Closed Amount'
        });
    }

    return { groups: fields.length > 0 ? [{ fields }] : [] };
};

/**
 * Associated Funders Configuration - matches cardSections.ts Associated Funders
 */
export const getAssociatedFundersConfig = (data: any): Config => {
    const fields = [];
    
    if (hasArrayItems(data, 'syndicator_funders')) {
        fields.push({
            key: 'syndicator_funders',
            type: 'array' as const,
            arrayConfig: {
                columns: [
                    {
                        key: 'funder.name',
                        label: 'Funder Name',
                        sortable: false,
                        render: (value: any, row: any) => {
                            if (typeof row.funder === 'object' && row.funder?.name) {
                                return row.funder.name;
                            }
                            return value || 'N/A';
                        }
                    },
                    {
                        key: 'funder.email',
                        label: 'Email',
                        sortable: false,
                        render: (value: any, row: any) => {
                            if (typeof row.funder === 'object' && row.funder?.email) {
                                return row.funder.email;
                            }
                            return value || 'N/A';
                        }
                    },
                    {
                        key: 'funder.phone',
                        label: 'Phone',
                        sortable: false,
                        render: (value: any, row: any) => {
                            if (typeof row.funder === 'object' && row.funder?.phone) {
                                return row.funder.phone;
                            }
                            return value || 'N/A';
                        }
                    },
                    {
                        key: 'available_balance',
                        label: 'Available Balance',
                        sortable: false,
                        render: (value: any) => {
                            if (value === undefined || value === null || isNaN(value)) return 'N/A';
                            return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                    },
                    {
                        key: 'payout_frequency',
                        label: 'Payout Frequency',
                        sortable: false,
                        render: (value: any) => value || 'N/A'
                    },
                    {
                        key: 'active',
                        label: 'Active',
                        sortable: false,
                        render: (value: any) => value ? 'Yes' : 'No'
                    }
                ],
                title: 'Associated Funders',
                emptyMessage: 'No funder relationships found'
            }
        });
    }

    return { groups: fields.length > 0 ? [{ fields }] : [] };
};

/**
 * System Information Configuration - matches cardSections.ts System Information
 */
export const getSystemInformationConfig = (data: any): Config => {
    const fields = [];
    
    // Dates
    if (hasField(data, 'created_date')) {
        fields.push({
            key: 'created_date',
            type: 'date' as const,
            title: 'Created Date'
        });
    }
    
    if (hasField(data, 'updated_date')) {
        fields.push({
            key: 'updated_date',
            type: 'date' as const,
            title: 'Updated Date'
        });
    }
    
    if (hasField(data, 'updatedAt')) {
        fields.push({
            key: 'updatedAt',
            type: 'date' as const,
            title: 'Last Modified'
        });
    }
    
    // Boolean fields
    if (hasField(data, 'inactive')) {
        fields.push({
            key: 'inactive',
            type: 'enum' as const,
            title: 'Inactive',
            enumMapping: INACTIVE_MAPPING
        });
    }
    
    if (hasField(data, '_calculatedStatsComplete')) {
        fields.push({
            key: '_calculatedStatsComplete',
            type: 'enum' as const,
            title: 'Stats Complete',
            enumMapping: BOOLEAN_MAPPING
        });
    }
    
    if (hasField(data, '__v')) {
        fields.push({
            key: '__v',
            type: 'text' as const,
            title: 'Version'
        });
    }

    return { groups: fields.length > 0 ? [{ fields }] : [] };
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use individual configuration functions instead
 */
export const getSyndicatorInformationConfig = (data: any): Config => {
    // Combine all sections for backward compatibility
    const basicConfig = getBasicInformationConfig(data);
    const addressConfig = getAddressInformationConfig(data);
    const businessConfig = getBusinessInformationConfig(data);
    const statsConfig = getStatisticsConfig(data);
    const synOffersConfig = getSyndicationOffersConfig(data);
    const synAmountsConfig = getSyndicationAmountsConfig(data);
    const fundersConfig = getAssociatedFundersConfig(data);
    const systemConfig = getSystemInformationConfig(data);

    return {
        groups: [
            ...basicConfig.groups,
            ...addressConfig.groups,
            ...businessConfig.groups,
            ...statsConfig.groups,
            ...synOffersConfig.groups,
            ...synAmountsConfig.groups,
            ...fundersConfig.groups,
            ...systemConfig.groups
        ]
    };
}; 