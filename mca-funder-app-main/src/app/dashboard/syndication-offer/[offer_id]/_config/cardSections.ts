import { CardSection } from '@/components/Card';
import {
    InformationCircleIcon,
    UserIcon,
    CurrencyDollarIcon,
    CalendarIcon,
    ClockIcon,
    ChartBarIcon,
    DocumentTextIcon,
    ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

// Syndication Offer Detail Page Card Sections Configuration
export const getSyndicationOfferDetailCardSections = (): CardSection[] => [
    {
        title: 'Offer Information',
        description: 'Core offer details and status',
        priority: 'high',
        icon: InformationCircleIcon,
        collapsible: false,
        rows: [
            {
                fields: [
                    {
                        key: '_id',
                        label: 'Offer ID',
                        type: 'id',
                        priority: 'high',
                        copyable: true,
                        linkPrefix: '/syndication-offer/',
                        width: 100
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'status',
                        label: 'Status',
                        type: 'text',
                        priority: 'high',
                        width: 50
                    },
                    {
                        key: 'status_date',
                        label: 'Status Date',
                        type: 'date',
                        priority: 'medium',
                        width: 50
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'created_by_user',
                        label: 'Offered User',
                        type: 'user',
                        priority: 'medium',
                        width: 33
                    },
                    {
                        key: 'created_by_user._id',
                        label: 'Offered User ID',
                        type: 'id',
                        priority: 'medium',
                        width: 33,
                        copyable: true,
                        linkPrefix: '/user/'
                    },
                    {
                        key: 'expired_date',
                        label: 'Expire Date',
                        type: 'date',
                        priority: 'medium',
                        width: 34
                    }
                ]
            }
        ]
    },
    {
        title: 'Financial Details',
        description: 'Primary financial amounts and calculations',
        priority: 'high',
        icon: CurrencyDollarIcon,
        collapsible: true,
        defaultCollapsed: false,
        rows: [
            {
                fields: [
                    {
                        key: 'participate_amount',
                        label: 'Participate Amount',
                        type: 'currency',
                        priority: 'high',
                        width: 33,
                        description: 'The amount that the syndicator participates in the funding'
                    },
                    {
                        key: 'payback_amount',
                        label: 'Payback Amount',
                        type: 'currency',
                        priority: 'high',
                        width: 33,
                        description: 'Total amount to be paid back to the syndicator'
                    },
                    {
                        key: 'syndicated_amount',
                        label: 'Syndicated Amount',
                        type: 'currency',
                        priority: 'high',
                        width: 34,
                        description: 'Total amount to be deducted from syndicator\'s wallet (Participate Amount + Upfront Fees - Upfront Credits)'
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'total_fee_amount',
                        label: 'Total Fee Amount',
                        type: 'currency',
                        priority: 'high',
                        width: 33,
                        description: 'Sum of all fees (Upfront Fees + Recurring Fees)'
                    },
                    {
                        key: 'upfront_fee_amount',
                        label: 'Upfront Fee Amount',
                        type: 'currency',
                        priority: 'medium',
                        width: 33,
                        description: 'Sum of fees marked as upfront in fee list'
                    },
                    {
                        key: 'recurring_fee_amount',
                        label: 'Recurring Fee Amount',
                        type: 'currency',
                        priority: 'medium',
                        width: 34,
                        description: 'Sum of fees not marked as upfront in fee list'
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'fee_list',
                        label: 'Fee List',
                        type: 'array',
                        priority: 'medium',
                        collapsible: true,
                        defaultCollapsed: true,
                        width: 100,
                        description: 'List of all fees associated with this offer',
                        rows: [
                            {
                                fields: [
                                    {
                                        key: 'name',
                                        label: 'Fee Name',
                                        type: 'text',
                                        priority: 'medium',
                                        width: 30
                                    },
                                    {
                                        key: 'expense_type.name',
                                        label: 'Expense Type',
                                        type: 'text',
                                        priority: 'medium',
                                        width: 25
                                    },
                                    {
                                        key: 'amount',
                                        label: 'Amount',
                                        type: 'currency',
                                        priority: 'high',
                                        width: 25
                                    },
                                    {
                                        key: 'upfront',
                                        label: 'Upfront',
                                        type: 'boolean',
                                        priority: 'medium',
                                        width: 20
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'total_credit_amount',
                        label: 'Total Credit Amount',
                        type: 'currency',
                        priority: 'high',
                        width: 33,
                        description: 'Sum of all credits (Upfront Credits + Recurring Credits)'
                    },
                    {
                        key: 'upfront_credit_amount',
                        label: 'Upfront Credit Amount',
                        type: 'currency',
                        priority: 'medium',
                        width: 33,
                        description: 'Sum of credits marked as upfront in credit list'
                    },
                    {
                        key: 'recurring_credit_amount',
                        label: 'Recurring Credit Amount',
                        type: 'currency',
                        priority: 'medium',
                        width: 34,
                        description: 'Sum of credits not marked as upfront in credit list'
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'credit_list',
                        label: 'Credit List',
                        type: 'array',
                        priority: 'medium',
                        collapsible: true,
                        defaultCollapsed: true,
                        width: 100,
                        description: 'List of all credits associated with this offer',
                        rows: [
                            {
                                fields: [
                                    {
                                        key: 'name',
                                        label: 'Credit Name',
                                        type: 'text',
                                        priority: 'medium',
                                        width: 30
                                    },
                                    {
                                        key: 'fee_type.name',
                                        label: 'Fee Type',
                                        type: 'text',
                                        priority: 'medium',
                                        width: 25
                                    },
                                    {
                                        key: 'amount',
                                        label: 'Amount',
                                        type: 'currency',
                                        priority: 'high',
                                        width: 25
                                    },
                                    {
                                        key: 'upfront',
                                        label: 'Upfront',
                                        type: 'boolean',
                                        priority: 'medium',
                                        width: 20
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'participate_percent',
                        label: 'Participate Percentage (%)',
                        type: 'number',
                        priority: 'high',
                        width: 33,
                        description: 'Percentage of participation in the funding (Participate Amount / Funding Amount)'
                    },
                    {
                        key: 'factor_rate',
                        label: 'Factor Rate (%)',
                        type: 'number',
                        priority: 'high',
                        width: 33,
                        description: 'Ratio of Payback Amount to Participate Amount (Payback Amount / Participate Amount)'
                    },
                    {
                        key: 'buy_rate',
                        label: 'Buy Rate (%)',
                        type: 'number',
                        priority: 'high',
                        width: 34,
                        description: 'Net return rate after fees and credits ((Payback Amount - Total Fees + Total Credits) / Participate Amount)'
                    }
                ]
            }
        ]
    },
    {
        title: 'Related Information',
        description: 'Connected entities and relationships',
        priority: 'medium',
        icon: UserIcon,
        collapsible: true,
        defaultCollapsed: true,
        rows: [
            {
                fields: [
                    {
                        key: 'funding.name',
                        label: 'Funding Source',
                        type: 'text',
                        priority: 'high',
                        width: 25
                    },
                    {
                        key: 'funding._id',
                        label: 'Funding ID',
                        type: 'id',
                        priority: 'high',
                        copyable: true,
                        linkPrefix: '/funding/',
                        width: 25
                    },
                    {
                        key: 'syndicator.name',
                        label: 'Syndicator',
                        type: 'text',
                        priority: 'high',
                        width: 25
                    },
                    {
                        key: 'syndicator._id',
                        label: 'Syndicator ID',
                        type: 'id',
                        priority: 'high',
                        copyable: true,
                        linkPrefix: '/syndicator/',
                        width: 25
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'funder.name',
                        label: 'Funder',
                        type: 'text',
                        priority: 'high',
                        width: 50
                    },
                    {
                        key: 'funder._id',
                        label: 'Funder ID',
                        type: 'id',
                        priority: 'high',
                        copyable: true,
                        linkPrefix: '/funder/',
                        width: 50
                    }
                ]
            }
        ]
    }
];
