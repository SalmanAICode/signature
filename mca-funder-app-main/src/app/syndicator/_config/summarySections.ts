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

/**
 * Get summary configuration for syndicator detail modal
 * This matches the fields from getDetailModalCardSections in cardSections.ts
 * @param data - The syndicator data object
 * @returns Config object for the Display component
 */
export const getSummaryConfig = (data: any): Config => {
    const groups: Config['groups'] = [];

    // Basic Information Group
    const basicInfoFields = [];

    basicInfoFields.push({
        key: '',
        type: 'syndicator' as const,
        title: 'Syndicator Information'
    });

    
    if (hasField(data, 'active')) {
        basicInfoFields.push({
            key: 'active',
            type: 'enum' as const,
            title: 'Account Status',
            enumMapping: STATUS_MAPPING
        });
    }
    
    if (hasField(data, 'createdAt')) {
        basicInfoFields.push({
            key: 'createdAt',
            type: 'date' as const,
            title: 'Created Date'
        });
    }
    
    if (hasField(data, 'updatedAt')) {
        basicInfoFields.push({
            key: 'updatedAt',
            type: 'date' as const,
            title: 'Last Updated'
        });
    }

    if (basicInfoFields.length > 0) {
        groups.push({ fields: basicInfoFields });
    }

    // Account & Activity Statistics Group
    const statisticsFields = [];
    
    if (hasField(data, 'funder_count')) {
        statisticsFields.push({
            key: 'funder_count',
            type: 'text' as const,
            title: 'Total Funders'
        });
    }
    
    if (hasField(data, 'account_count')) {
        statisticsFields.push({
            key: 'account_count',
            type: 'text' as const,
            title: 'Account Count'
        });
    }
    
    if (hasField(data, 'access_log_count')) {
        statisticsFields.push({
            key: 'access_log_count',
            type: 'text' as const,
            title: 'Access Logs'
        });
    }

    if (statisticsFields.length > 0) {
        groups.push({ fields: statisticsFields });
    }

    // Syndication Offers Group
    const syndicationOffersFields = [];
    
    if (hasField(data, 'syndication_offer_count')) {
        syndicationOffersFields.push({
            key: 'syndication_offer_count',
            type: 'text' as const,
            title: 'Total Offers'
        });
    }
    
    if (hasField(data, 'pending_syndication_offer_count')) {
        syndicationOffersFields.push({
            key: 'pending_syndication_offer_count',
            type: 'text' as const,
            title: 'Pending'
        });
    }
    
    if (hasField(data, 'accepted_syndication_offer_count')) {
        syndicationOffersFields.push({
            key: 'accepted_syndication_offer_count',
            type: 'text' as const,
            title: 'Accepted'
        });
    }
    
    if (hasField(data, 'declined_syndication_offer_count')) {
        syndicationOffersFields.push({
            key: 'declined_syndication_offer_count',
            type: 'text' as const,
            title: 'Declined'
        });
    }
    
    if (hasField(data, 'cancelled_syndication_offer_count')) {
        syndicationOffersFields.push({
            key: 'cancelled_syndication_offer_count',
            type: 'text' as const,
            title: 'Cancelled'
        });
    }

    if (syndicationOffersFields.length > 0) {
        groups.push({ fields: syndicationOffersFields });
    }

    // Offer Amounts Group
    const offerAmountsFields = [];
    
    if (hasField(data, 'syndication_offer_amount')) {
        offerAmountsFields.push({
            key: 'syndication_offer_amount',
            type: 'currency' as const,
            title: 'Total Amount'
        });
    }
    
    if (hasField(data, 'pending_syndication_offer_amount')) {
        offerAmountsFields.push({
            key: 'pending_syndication_offer_amount',
            type: 'currency' as const,
            title: 'Pending Amount'
        });
    }
    
    if (hasField(data, 'accepted_syndication_offer_amount')) {
        offerAmountsFields.push({
            key: 'accepted_syndication_offer_amount',
            type: 'currency' as const,
            title: 'Accepted Amount'
        });
    }
    
    if (hasField(data, 'declined_syndication_offer_amount')) {
        offerAmountsFields.push({
            key: 'declined_syndication_offer_amount',
            type: 'currency' as const,
            title: 'Declined Amount'
        });
    }
    
    if (hasField(data, 'cancelled_syndication_offer_amount')) {
        offerAmountsFields.push({
            key: 'cancelled_syndication_offer_amount',
            type: 'currency' as const,
            title: 'Cancelled Amount'
        });
    }

    if (offerAmountsFields.length > 0) {
        groups.push({ fields: offerAmountsFields });
    }

    // Syndication Portfolio Group
    const portfolioFields = [];
    
    if (hasField(data, 'syndication_count')) {
        portfolioFields.push({
            key: 'syndication_count',
            type: 'text' as const,
            title: 'Total Count'
        });
    }
    
    if (hasField(data, 'active_syndication_count')) {
        portfolioFields.push({
            key: 'active_syndication_count',
            type: 'text' as const,
            title: 'Active'
        });
    }
    
    if (hasField(data, 'closed_syndication_count')) {
        portfolioFields.push({
            key: 'closed_syndication_count',
            type: 'text' as const,
            title: 'Closed'
        });
    }
    
    if (hasField(data, 'syndication_amount')) {
        portfolioFields.push({
            key: 'syndication_amount',
            type: 'currency' as const,
            title: 'Total Portfolio Value'
        });
    }
    
    if (hasField(data, 'active_syndication_amount')) {
        portfolioFields.push({
            key: 'active_syndication_amount',
            type: 'currency' as const,
            title: 'Active Portfolio Value'
        });
    }
    
    if (hasField(data, 'closed_syndication_amount')) {
        portfolioFields.push({
            key: 'closed_syndication_amount',
            type: 'currency' as const,
            title: 'Closed Portfolio Value'
        });
    }

    if (portfolioFields.length > 0) {
        groups.push({ fields: portfolioFields });
    }

    // System Information Group
    const systemFields = [];
    
    if (hasField(data, '_calculatedStatsComplete')) {
        systemFields.push({
            key: '_calculatedStatsComplete',
            type: 'enum' as const,
            title: 'Stats Calculated',
            enumMapping: BOOLEAN_MAPPING
        });
    }

    if (systemFields.length > 0) {
        groups.push({ fields: systemFields });
    }

    return { groups };
};
