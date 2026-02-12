/**
 * System-wide constants
 */

// Frontend Portals
const PORTAL_TYPES = {
    ADMIN: 'admin',
    FUNDER: 'funder',
    ISO: 'iso',
    MERCHANT: 'merchant',
    SYNDICATOR: 'syndicator',
    BOOKKEEPER: 'bookkeeper',
};

// Account Types
const ACCOUNT_TYPES = {
    CHECKING: 'CHECKING',
    SAVING: 'SAVING',
    CASH: 'CASH',
    OTHER: 'OTHER'
};

// Syndication offer status
const SYNDICATION_OFFER_STATUS = {
    SUBMITTED: 'SUBMITTED',
    DECLINED: 'DECLINED',
    ACCEPTED: 'ACCEPTED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED'
};

// Syndication status
const SYNDICATION_STATUS = {
    ACTIVE: 'ACTIVE',
    CLOSED: 'CLOSED'
};

// Formula Tier Types
const FORMULA_TIER_TYPES = {
    NONE: 'NONE',
    FUND: 'FUND',
    PAYBACK: 'PAYBACK',
    FACTOR_RATE: 'FACTOR_RATE'
};

// Formula Calculate Types
const FORMULA_CALCULATE_TYPES = {
    AMOUNT: 'AMOUNT',
    PERCENT: 'PERCENT'
};

// Formula Base Items
const FORMULA_BASE_ITEMS = {
    NONE: 'NONE',
    FUND: 'FUND',
    PAYBACK: 'PAYBACK'
};

// Transaction status
const TRANSACTION_STATUS = {
    PENDING: 'PENDING',
    SUCCEED: 'SUCCEED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED'
};

// Portal operations
const PORTAL_OPERATIONS = {
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    SESSION_TIMEOUT: 'SESSION_TIMEOUT'
};

// Payment frequency
const PAYMENT_FREQUENCY = {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY'
};

// Message types
const MESSAGE_TYPES = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    SUCCESS: 'SUCCESS'
};

// Entity types
const ENTITY_TYPES = {
    SOLE_PROP: 'SOLE_PROP',
    GEN_PART: 'GEN_PART',
    LTD_PART: 'LTD_PART',
    LLP: 'LLP',
    LLC: 'LLC',
    PLLC: 'PLLC',
    C_CORP: 'C_CORP',
    S_CORP: 'S_CORP',
    B_CORP: 'B_CORP',
    CLOSE_CORP: 'CLOSE_CORP',
    P_CORP: 'P_CORP',
    NONPROFIT: 'NONPROFIT',
    COOP: 'COOP'
};

// Syndicator Funder Payout Frequency
const SYNDICATOR_PAYOUT_FREQUENCY = {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY'
};

// Application Types
const APPLICATION_TYPES = {
    NEW: 'NEW',
    RENEWAL: 'RENEWAL',
    RESUBMISSION: 'RESUBMISSION',
    RENEWAL_RESUBMISSION: 'RENEWAL_RESUBMISSION'
};

// Fee Types
const APPLICATION_OFFER_STATUS = {
    OFFERED: 'OFFERED',
    ACCEPTED: 'ACCEPTED',
    DECLINED: 'DECLINED',
    CANCELLED: 'CANCELLED'
};

// Application Stipulation Status
const APPLICATION_STIPULATION_STATUS = {
    REQUESTED: 'REQUESTED',
    RECEIVED: 'RECEIVED',
    VERIFIED: 'VERIFIED',
    WAIVED: 'WAIVED',
};

// Application Document Types
const APPLICATION_DOCUMENT_TYPES = {
    UPLOADED: 'UPLOADED',
    GENERATED: 'GENERATED'
};

// Funding Types
const FUNDING_TYPES = {
    NEW: 'NEW',
    RENEWAL: 'RENEWAL',
    REFINANCE: 'REFINANCE',
    BUYOUT: 'BUYOUT',
    OTHER: 'OTHER'
};

// Payment method
const PAYMENT_METHOD = {
    ACH: 'ACH',
    WIRE: 'WIRE',
    CHECK: 'CHECK',
    OTHER: 'OTHER'
};

// Intent status
const INTENT_STATUS = {
    SCHEDULED: 'SCHEDULED',
    SUBMITTED: 'SUBMITTED',
    SUCCEED: 'SUCCEED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED'
};

// Disbursement status
const DISBURSEMENT_STATUS = {
    SUBMITTED: 'SUBMITTED',
    PROCESSING: 'PROCESSING',
    SUCCEED: 'SUCCEED',
    FAILED: 'FAILED'
};

// Commission status
const COMMISSION_STATUS = {
    SUBMITTED: 'SUBMITTED',
    PROCESSING: 'PROCESSING',
    SUCCEED: 'SUCCEED',
    FAILED: 'FAILED'
};

// Payback Frequency
const PAYBACK_FREQUENCY = {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY'
};

// Payback Status
const PAYBACK_STATUS = {
    SUBMITTED: 'SUBMITTED',
    PROCESSING: 'PROCESSING',
    BOUNCED: 'BOUNCED',
    SUCCEED: 'SUCCEED',
    FAILED: 'FAILED',
    DISPUTED: 'DISPUTED'
};

// Payback Plan Status
const PAYBACK_PLAN_STATUS = {
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    STOPPED: 'STOPPED'
};

// Payback Plan Distribution Priority
const PAYBACK_DISTRIBUTION_PRIORITY = {
    FUND: 'FUND',
    FEE: 'FEE',
    BOTH: 'BOTH'
};

// Payback Plan Details Status
const PAYBACK_PLAN_DETAILS_STATUS = {
    SCHEDULED: 'scheduled',
    NOT_PAID: 'not_paid',
    PARTIALLY_PAID: 'partially_paid',
    PAID_IN_FULL: 'paid_in_full'
};

// Payout Schedule Status
const PAYOUT_SCHEDULE_STATUS = {
    SCHEDULED: 'scheduled',
    OVERDUE: 'overdue',
    PARTIALLY_PAID: 'partially_paid',
    FULLY_PAID: 'fully_paid'
};

// Payout Timeline Status
const PAYOUT_TIMELINE_STATUS = {
    UPCOMING: 'upcoming',
    PAST_DUE: 'past_due'
};

// Transaction Types
const TRANSACTION_TYPES = {
    DISBURSEMENT: 'DISBURSEMENT',               // funder -> merchant [funding, upfront fees]
    COMMISSION: 'COMMISSION',                   // funder -> iso [expense]
    EXPENSE: 'EXPENSE',                         // funder -> other [expense]
    CREDIT: 'CREDIT',                           // funder -> merchant [funding-credit]
    PAYOUT: 'PAYOUT',                           // funder -> syndicator (VIRTUAL, no account) [payout, credit...]
    PAYBACK: 'PAYBACK',                         // merchant -> funder [fund, fee]
    SYNDICATION: 'SYNDICATION',                 // syndicator -> funder (VIRTUAL, no account) [syndication, syndication fees]
    FUNDER_DEPOSIT: 'FUNDER_DEPOSIT',           // other -> funder (no funding)
    FUNDER_WITHDRAW: 'FUNDER_WITHDRAW',         // funder -> other (no funding)
    SYNDICATOR_DEPOSIT: 'SYNDICATOR_DEPOSIT',   // syndicator -> funder (no funding)
    SYNDICATOR_WITHDRAW: 'SYNDICATOR_WITHDRAW'  // funder -> syndicator (no funding)
};

// Transaction Sender Types
const TRANSACTION_SENDER_TYPES = {
    FUNDER: 'FUNDER',
    LENDER: 'LENDER',
    MERCHANT: 'MERCHANT',
    ISO: 'ISO',
    SYNDICATOR: 'SYNDICATOR',
    OTHER: 'OTHER'
};

// Transaction Receiver Types
const TRANSACTION_RECEIVER_TYPES = {
    FUNDER: 'FUNDER',
    LENDER: 'LENDER',
    MERCHANT: 'MERCHANT',
    ISO: 'ISO',
    SYNDICATOR: 'SYNDICATOR',
    OTHER: 'OTHER'
};

// Export all constants
module.exports = {
    PORTAL_TYPES,
    ACCOUNT_TYPES,
    SYNDICATION_OFFER_STATUS,
    SYNDICATION_STATUS,
    FORMULA_TIER_TYPES,
    FORMULA_CALCULATE_TYPES,
    FORMULA_BASE_ITEMS,
    TRANSACTION_STATUS,
    PORTAL_OPERATIONS,
    PAYMENT_FREQUENCY,
    MESSAGE_TYPES,
    ENTITY_TYPES,
    SYNDICATOR_PAYOUT_FREQUENCY,
    APPLICATION_TYPES,
    APPLICATION_OFFER_STATUS,
    APPLICATION_STIPULATION_STATUS,
    APPLICATION_DOCUMENT_TYPES,
    FUNDING_TYPES,
    PAYMENT_METHOD,
    INTENT_STATUS,
    DISBURSEMENT_STATUS,
    COMMISSION_STATUS,
    PAYBACK_FREQUENCY,
    PAYBACK_STATUS,
    PAYBACK_PLAN_STATUS,
    PAYBACK_DISTRIBUTION_PRIORITY,
    PAYBACK_PLAN_DETAILS_STATUS,
    PAYOUT_SCHEDULE_STATUS,
    PAYOUT_TIMELINE_STATUS,
    TRANSACTION_TYPES,
    TRANSACTION_SENDER_TYPES,
    TRANSACTION_RECEIVER_TYPES
}; 