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

// Syndication Detail Page Card Sections Configuration
export const getSyndicationDetailCardSections = (): CardSection[] => [
    {
        title: 'Basic Information',
        description: 'Core syndication details',
        priority: 'high',
        icon: InformationCircleIcon,
        collapsible: false,
        rows: [
            {
                fields: [
                    {
                        key: '_id',
                        label: 'Syndication ID',
                        type: 'id',
                        priority: 'medium',
                        copyable: true,
                        linkPrefix: '/syndication/',
                        width: 100
                    }
                ]
            },
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
                        key: 'syndication_offer',
                        label: 'Syndication Offer ID',
                        type: 'id',
                        priority: 'medium',
                        copyable: true,
                        linkPrefix: '/syndication-offer/',
                        width: 50
                    },
                    {
                        key: 'funder.name',
                        label: 'Funder',
                        type: 'text',
                        priority: 'high',
                        width: 25
                    },
                    {
                        key: 'funder._id',
                        label: 'Funder ID',
                        type: 'id',
                        priority: 'high',
                        copyable: true,
                        linkPrefix: '/funder/',
                        width: 25
                    }
                ]
            }
        ]
    },
    {
        title: 'Financial Overview',
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
                        key: 'syndicated_amount',
                        label: 'Syndicated Amount',
                        type: 'currency',
                        priority: 'high',
                        width: 33,
                        description: 'Total amount to be deducted from syndicator\'s wallet (Participate Amount + Upfront Fees - Upfront Credits)'
                    },
                    {
                        key: 'payback_amount',
                        label: 'Payback Amount',
                        type: 'currency',
                        priority: 'high',
                        width: 34,
                        description: 'Total amount to be paid back to the syndicator'
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'participate_percent',
                        label: 'Participate Percentage',
                        type: 'number',
                        priority: 'high',
                        width: 33,
                        description: 'Percentage of participation in the funding (Participate Amount / Funding Amount)'
                    },
                    {
                        key: 'factor_rate',
                        label: 'Factor Rate',
                        type: 'number',
                        priority: 'high',
                        width: 33,
                        description: 'Ratio of Payback Amount to Participate Amount (Payback Amount / Participate Amount)'
                    },
                    {
                        key: 'buy_rate',
                        label: 'Buy Rate',
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
        title: 'Fee & Credit Information',
        description: 'Fee and credit details with calculations',
        priority: 'high',
        icon: CurrencyDollarIcon,
        collapsible: true,
        defaultCollapsed: false,
        rows: [
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
                        key: 'total_credit_amount',
                        label: 'Total Credit Amount',
                        type: 'currency',
                        priority: 'high',
                        width: 33,
                        description: 'Sum of all credits (Upfront Credits + Recurring Credits)'
                    },
                    {
                        key: 'remaining_balance',
                        label: 'Remaining Balance',
                        type: 'currency',
                        priority: 'high',
                        width: 34,
                        description: 'Net remaining amount (Remaining Payback - Remaining Fees + Remaining Credits)'
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'upfront_fee_amount',
                        label: 'Upfront Fee',
                        type: 'currency',
                        priority: 'medium',
                        width: 25,
                        description: 'Sum of fees marked as upfront in fee list'
                    },
                    {
                        key: 'recurring_fee_amount',
                        label: 'Recurring Fee',
                        type: 'currency',
                        priority: 'medium',
                        width: 25,
                        description: 'Sum of fees not marked as upfront in fee list'
                    },
                    {
                        key: 'upfront_credit_amount',
                        label: 'Upfront Credit',
                        type: 'currency',
                        priority: 'medium',
                        width: 25,
                        description: 'Sum of credits marked as upfront in credit list'
                    },
                    {
                        key: 'recurring_credit_amount',
                        label: 'Recurring Credit',
                        type: 'currency',
                        priority: 'medium',
                        width: 25,
                        description: 'Sum of credits not marked as upfront in credit list'
                    }
                ]
            }
        ],
        children: [
            {
                title: 'Fees & Credits',
                description: 'Detailed fee and credit items',
                priority: 'medium',
                icon: CurrencyDollarIcon,
                collapsible: true,
                defaultCollapsed: true,
                rows: [
                    {
                        fields: [
                            {
                                key: 'fee_list',
                                label: 'Fee List',
                                type: 'array',
                                priority: 'high',
                                width: 100,
                                collapsible: true,
                                defaultCollapsed: false,
                                rows: [
                                    {
                                        fields: [
                                            {
                                                key: 'name',
                                                label: 'Fee Name',
                                                type: 'text',
                                                width: 30,
                                                priority: 'medium'
                                            },
                                            {
                                                key: 'expense_type',
                                                label: 'Expense Type',
                                                type: 'text',
                                                width: 30,
                                                priority: 'medium'
                                            },
                                            {
                                                key: 'amount',
                                                label: 'Amount',
                                                type: 'currency',
                                                width: 20,
                                                priority: 'medium'
                                            },
                                            {
                                                key: 'upfront',
                                                label: 'Upfront',
                                                type: 'boolean',
                                                width: 20,
                                                priority: 'medium'
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
                                key: 'credit_list',
                                label: 'Credit List',
                                type: 'array',
                                priority: 'high',
                                width: 100,
                                collapsible: true,
                                defaultCollapsed: false,
                                rows: [
                                    {
                                        fields: [
                                            {
                                                key: 'name',
                                                label: 'Credit Name',
                                                type: 'text',
                                                width: 30,
                                                priority: 'medium'
                                            },
                                            {
                                                key: 'fee_type',
                                                label: 'Fee Type',
                                                type: 'text',
                                                width: 30,
                                                priority: 'medium'
                                            },
                                            {
                                                key: 'amount',
                                                label: 'Amount',
                                                type: 'currency',
                                                width: 20,
                                                priority: 'medium'
                                            },
                                            {
                                                key: 'upfront',
                                                label: 'Upfront',
                                                type: 'boolean',
                                                width: 20,
                                                priority: 'medium'
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
        ]
    },
    {
        title: 'Payout Information',
        description: 'Payout history and remaining amounts',
        priority: 'medium',
        icon: CurrencyDollarIcon,
        collapsible: true,
        defaultCollapsed: false,
        rows: [
            {
                fields: [
                    {
                        key: 'payout_amount',
                        label: 'Total Payout',
                        type: 'currency',
                        priority: 'high',
                        width: 33,
                        description: 'Total amount of all payouts for this syndication'
                    },
                    {
                        key: 'payout_count',
                        label: 'Payout Count',
                        type: 'number',
                        priority: 'medium',
                        width: 33,
                        description: 'Total number of payouts made'
                    },
                    {
                        key: 'pending_amount',
                        label: 'Pending Amount',
                        type: 'currency',
                        priority: 'high',
                        width: 34,
                        description: 'Total amount of pending payouts (Payout Amount - Fees + Credits) for pending payouts'
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'payout_fee_amount',
                        label: 'Payout Fee',
                        type: 'currency',
                        priority: 'medium',
                        width: 33,
                        description: 'Total fees deducted from all payouts'
                    },
                    {
                        key: 'payout_credit_amount',
                        label: 'Payout Credit',
                        type: 'currency',
                        priority: 'medium',
                        width: 33,
                        description: 'Total credits applied to all payouts'
                    },
                    {
                        key: 'redeemed_amount',
                        label: 'Redeemed Amount',
                        type: 'currency',
                        priority: 'medium',
                        width: 34,
                        description: 'Net amount redeemed (Payout Amount - Fees + Credits) for completed payouts'
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'remaining_payback_amount',
                        label: 'Remaining Payback',
                        type: 'currency',
                        priority: 'high',
                        width: 50,
                        description: 'Remaining amount to be paid back (Payback Amount - Payout Amount)'
                    },
                    {
                        key: 'remaining_credit_amount',
                        label: 'Remaining Credit',
                        type: 'currency',
                        priority: 'high',
                        width: 50,
                        description: 'Remaining credits to be applied (Total Credits - Upfront Credits - Payout Credits)'
                    }
                ]
            }
        ]
    },
    {
        title: 'Funding Details',
        description: 'Total funding amounts and rates from the original funding',
        priority: 'high',
        icon: ChartBarIcon,
        collapsible: true,
        defaultCollapsed: false,
        rows: [
            {
                fields: [
                    {
                        key: 'total_funded_amount',
                        label: 'Total Funded Amount',
                        type: 'currency',
                        priority: 'high',
                        width: 50,
                        description: 'Original funding amount from the funding source'
                    },
                    {
                        key: 'total_payback_amount',
                        label: 'Total Payback Amount',
                        type: 'currency',
                        priority: 'high',
                        width: 50,
                        description: 'Original payback amount from the funding source'
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'funding.commission_amount',
                        label: 'Funding Commission',
                        type: 'currency',
                        priority: 'medium',
                        width: 100
                    }
                ]
            }
        ]
    },
    {
        title: 'Schedule & Status',
        description: 'Timeline and current status',
        priority: 'medium',
        icon: CalendarIcon,
        collapsible: true,
        defaultCollapsed: false,
        rows: [
            {
                fields: [
                    {
                        key: 'start_date',
                        label: 'Start Date',
                        type: 'date',
                        priority: 'high',
                        width: 33
                    },
                    {
                        key: 'end_date',
                        label: 'End Date',
                        type: 'date',
                        priority: 'high',
                        width: 33
                    },
                    {
                        key: 'status',
                        label: 'Status',
                        type: 'text',
                        priority: 'high',
                        width: 34
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'active',
                        label: 'Active Status',
                        type: 'boolean',
                        priority: 'medium',
                        width: 50
                    },
                    {
                        key: 'inactive',
                        label: 'Inactive Flag',
                        type: 'boolean',
                        priority: 'low',
                        width: 50
                    }
                ]
            }
        ]
    },
    {
        title: 'Contact Information',
        description: 'Connected entity contact details',
        priority: 'medium',
        icon: UserIcon,
        collapsible: true,
        defaultCollapsed: true,
        rows: [
            {
                fields: [
                    {
                        key: 'syndicator.email',
                        label: 'Syndicator Email',
                        type: 'email',
                        priority: 'high',
                        width: 50
                    },
                    {
                        key: 'funder.email',
                        label: 'Funder Email',
                        type: 'email',
                        priority: 'high',
                        width: 50
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'syndicator.first_name',
                        label: 'Syndicator First Name',
                        type: 'text',
                        priority: 'medium',
                        width: 50
                    },
                    {
                        key: 'syndicator.last_name',
                        label: 'Syndicator Last Name',
                        type: 'text',
                        priority: 'medium',
                        width: 50
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'funder.phone',
                        label: 'Funder Phone',
                        type: 'phone',
                        priority: 'medium',
                        width: 100
                    }
                ]
            }
        ]
    },
    {
        title: 'System Information',
        description: 'System metadata and calculations',
        priority: 'low',
        icon: ClockIcon,
        collapsible: true,
        defaultCollapsed: true,
        rows: [
            {
                fields: [
                    {
                        key: 'createdAt',
                        label: 'Created Date',
                        type: 'datetime',
                        priority: 'low',
                        width: 50
                    },
                    {
                        key: 'updatedAt',
                        label: 'Updated Date',
                        type: 'datetime',
                        priority: 'low',
                        width: 50
                    }
                ]
            },
            {
                fields: [
                    {
                        key: '__v',
                        label: 'Version',
                        type: 'number',
                        priority: 'low',
                        width: 50
                    },
                    {
                        key: '_calculatedStatsComplete',
                        label: 'Stats Complete',
                        type: 'boolean',
                        priority: 'low',
                        width: 50
                    }
                ]
            }
        ]
    }
]; 

export const PayoutArrayCardSections = (): CardSection[] => [
    {
        title: 'Payout List',
        description: 'List of all payouts',
        priority: 'high',
        icon: CurrencyDollarIcon,
        collapsible: true,
        defaultCollapsed: false,
        rows: [
            {
                fields: [
                    {
                        key: 'payouts',
                        label: 'Payouts',
                        type: 'array',
                        priority: 'high',
                        width: 100,
                        collapsible: true,
                        defaultCollapsed: false,
                        sections: PayoutDetailCardSections()
                    }
                ]
            }
        ]
    }
];

export const PayoutDetailCardSections = (): CardSection[] => [
    {
        title: 'Basic Information',
        description: 'Core payout details',
        priority: 'high',
        icon: InformationCircleIcon,
        collapsible: false,
        rows: [
            {
                fields: [
                    {
                        key: '_id',
                        label: 'Payout ID',
                        type: 'id',
                        priority: 'high',
                        copyable: true,
                        linkPrefix: '/payout/',
                        width: 100
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'payback._id',
                        label: 'Payback ID',
                        type: 'id',
                        priority: 'high',
                        copyable: true,
                        linkPrefix: '/payback/',
                        width: 33
                    },
                    {
                        key: 'syndication._id',
                        label: 'Syndication ID',
                        type: 'id',
                        priority: 'high',
                        copyable: true,
                        linkPrefix: '/syndication/',
                        width: 33
                    },
                    {
                        key: 'funding._id',
                        label: 'Funding ID',
                        type: 'id',
                        priority: 'high',
                        copyable: true,
                        linkPrefix: '/funding/',
                        width: 34
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'funder._id',
                        label: 'Funder ID',
                        type: 'id',
                        priority: 'high',
                        copyable: true,
                        linkPrefix: '/funder/',
                        width: 50
                    },
                    {
                        key: 'syndicator._id',
                        label: 'Syndicator ID',
                        type: 'id',
                        priority: 'high',
                        copyable: true,
                        linkPrefix: '/syndicator/',
                        width: 50
                    }
                ]
            }
        ]
    },
    {
        title: 'Financial Information',
        description: 'Payout amounts and calculations',
        priority: 'high',
        icon: CurrencyDollarIcon,
        collapsible: true,
        defaultCollapsed: false,
        rows: [
            {
                fields: [
                    {
                        key: 'payout_amount',
                        label: 'Payout Amount',
                        type: 'currency',
                        priority: 'high',
                        width: 33,
                        description: 'Amount of Payout which syndicator received'
                    },
                    {
                        key: 'fee_amount',
                        label: 'Fee Amount',
                        type: 'currency',
                        priority: 'high',
                        width: 33,
                        description: 'Amount that is for the residual fee'
                    },
                    {
                        key: 'credit_amount',
                        label: 'Credit Amount',
                        type: 'currency',
                        priority: 'high',
                        width: 34,
                        description: 'Amount that is for the residual credit'
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'available_amount',
                        label: 'Available Amount',
                        type: 'currency',
                        priority: 'high',
                        width: 100,
                        description: 'Net amount available (Payout Amount - Fee Amount + Credit Amount)'
                    }
                ]
            }
        ]
    },
    {
        title: 'Status & Timeline',
        description: 'Payout status and important dates',
        priority: 'medium',
        icon: CalendarIcon,
        collapsible: true,
        defaultCollapsed: false,
        rows: [
            {
                fields: [
                    {
                        key: 'created_date',
                        label: 'Created Date',
                        type: 'datetime',
                        priority: 'high',
                        width: 50
                    },
                    {
                        key: 'redeemed_date',
                        label: 'Redeemed Date',
                        type: 'datetime',
                        priority: 'high',
                        width: 50
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'pending',
                        label: 'Pending Status',
                        type: 'boolean',
                        priority: 'high',
                        width: 50,
                        description: 'True when created, will become false at payout date of syndicator'
                    },
                    {
                        key: 'inactive',
                        label: 'Inactive Status',
                        type: 'boolean',
                        priority: 'medium',
                        width: 50,
                        description: 'Whether this payout is deleted or not'
                    }
                ]
            }
        ]
    },
    {
        title: 'System Information',
        description: 'System metadata',
        priority: 'low',
        icon: ClockIcon,
        collapsible: true,
        defaultCollapsed: true,
        rows: [
            {
                fields: [
                    {
                        key: 'created_by_user',
                        label: 'Created By',
                        type: 'id',
                        priority: 'low',
                        copyable: true,
                        linkPrefix: '/user/',
                        width: 100,
                        description: 'Null if it is system generated'
                    }
                ]
            }
        ]
    }
];

// Application Detail Page Card Sections Configuration
export const getApplicationDetailCardSections = (): CardSection[] => [
    {
        title: 'Basic Information',
        description: 'Core application details',
        priority: 'high',
        icon: InformationCircleIcon,
        collapsible: false,
        rows: [
            {
                fields: [
                    {
                        key: '_id',
                        label: 'Application ID',
                        type: 'id',
                        priority: 'medium',
                        copyable: true,
                        linkPrefix: '/application/',
                        width: 33
                    },
                    {
                        key: 'name',
                        label: 'Application Name',
                        type: 'text',
                        priority: 'high',
                        width: 33
                    },
                    {
                        key: 'type',
                        label: 'Application Type',
                        type: 'text',
                        priority: 'high',
                        width: 34
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'merchant.id',
                        label: 'Merchant',
                        type: 'id',
                        priority: 'high',
                        copyable: true,
                        linkPrefix: '/merchant/',
                        width: 33
                    },
                    {
                        key: 'funder.id',
                        label: 'Funder',
                        type: 'id',
                        priority: 'high',
                        copyable: true,
                        linkPrefix: '/funder/',
                        width: 33
                    },
                    {
                        key: 'iso.id',
                        label: 'ISO',
                        type: 'id',
                        priority: 'high',
                        copyable: true,
                        linkPrefix: '/iso/',
                        width: 34
                    }
                ]
            }
        ]
    },
    {
        title: 'Financial Information',
        description: 'Financial details and amounts',
        priority: 'high',
        icon: CurrencyDollarIcon,
        collapsible: true,
        defaultCollapsed: false,
        rows: [
            {
                fields: [
                    {
                        key: 'request_amount',
                        label: 'Request Amount',
                        type: 'currency',
                        priority: 'high',
                        width: 50
                    },
                    {
                        key: 'priority',
                        label: 'Priority',
                        type: 'boolean',
                        priority: 'medium',
                        width: 50
                    }
                ]
            }
        ]
    },
    {
        title: 'Status Information',
        description: 'Application status and dates',
        priority: 'high',
        icon: ClipboardDocumentCheckIcon,
        collapsible: true,
        defaultCollapsed: false,
        rows: [
            {
                fields: [
                    {
                        key: 'status.name',
                        label: 'Status',
                        type: 'text',
                        priority: 'high',
                        width: 33
                    },
                    {
                        key: 'request_date',
                        label: 'Request Date',
                        type: 'date',
                        priority: 'high',
                        width: 33
                    },
                    {
                        key: 'status_date',
                        label: 'Status Date',
                        type: 'date',
                        priority: 'high',
                        width: 34
                    }
                ]
            },
            {
                fields: [
                    {
                        key: 'internal',
                        label: 'Internal',
                        type: 'boolean',
                        priority: 'medium',
                        width: 33
                    },
                    {
                        key: 'closed',
                        label: 'Closed',
                        type: 'boolean',
                        priority: 'medium',
                        width: 33
                    },
                    {
                        key: 'active',
                        label: 'Active',
                        type: 'boolean',
                        priority: 'medium',
                        width: 34
                    }
                ]
            }
        ]
    },
    {
        title: 'Document Information',
        description: 'Document and stipulation counts',
        priority: 'medium',
        icon: DocumentTextIcon,
        collapsible: true,
        defaultCollapsed: true,
        rows: [
            {
                fields: [
                    {
                        key: 'document_count',
                        label: 'Total Documents',
                        type: 'number',
                        priority: 'medium',
                        width: 25
                    },
                    {
                        key: 'stipulation_count',
                        label: 'Total Stipulations',
                        type: 'number',
                        priority: 'medium',
                        width: 25
                    },
                    {
                        key: 'checked_stipulation_count',
                        label: 'Checked Stipulations',
                        type: 'number',
                        priority: 'medium',
                        width: 25
                    },
                    {
                        key: 'received_stipulation_count',
                        label: 'Received Stipulations',
                        type: 'number',
                        priority: 'medium',
                        width: 25
                    }
                ]
            }
        ]
    }
];