/**
 * Permission system definitions
 * 
 * Defines resources, actions, and permission combinations for the application
 */

// Define all resource types in the system
const RESOURCES = {
    ADMIN: 'admin',                             // The admin resource is used to manage the admin users, includes tables: admin, admin-access-log
    BOOKKEEPER: 'bookkeeper',                   // The bookkeeper resource is used to manage the bookkeepers, includes tables: bookkeeper, bookkeeper-access-log, bookkeeper-funder
    
    USER: 'user',                               // The user resource is used to manage the users, includes tables: user, user-access-log
    USER_FUNDER: 'user_funder',                 // The funder user resource is used to manage the funder users, includes tables: funder-user
    USER_LENDER: 'user_lender',                 // The lender user resource is used to manage the lender users, includes tables: lender-user
    FUNDER: 'funder',                           // The funder resource is used to manage the funders, includes tables: funder
    FUNDER_ACCOUNT: 'funder_account',           // The funder account resource is used to manage the funder accounts, includes tables: funder-account
    FUNDER_SETTING: 'funder_setting',           // The funder setting resource is used to manage the funder settings, includes tables: funder-setting
    FUNDER_ROLE: 'funder_role',                 // The funder role resource is used to manage the funder roles, includes tables: funder-role
    LENDER: 'lender',                           // The lender resource is used to manage the lenders, includes tables: lender
    LENDER_ACCOUNT: 'lender_account',           // The lender account resource is used to manage the lender accounts, includes tables: lender-account
    FEE_TYPE: 'fee_type',                       // The fee type resource is used to manage the fee types, includes tables: fee-type
    EXPENSE_TYPE: 'expense_type',               // The expense type resource is used to manage the expense types, includes tables: expense-type
    FORMULA: 'formula',                         // The formula resource is used to manage the formulas, includes tables: formula
    STIPULATION_TYPE: 'stipulation_type',       // The stipulation type resource is used to manage the stipulation types, includes tables: stipulation-type
    APPLICATION_STATUS: 'application_status',   // The application status resource is used to manage the application statuses, includes tables: application-status
    FUNDING_STATUS: 'funding_status',           // The funding status resource is used to manage the funding statuses, includes tables: funding-status

    ISO: 'iso',                                 // The iso resource is used to manage the isos, includes tables: iso
    REPRESENTATIVE: 'representative',           // The representative resource is used to manage the representatives, includes tables: representative, representative-access-log
    ISO_FUNDER: 'iso_funder',                   // The iso funder resource is used to manage the iso funders, includes tables: iso-funder
    ISO_MERCHANT: 'iso_merchant',               // The iso merchant resource is used to manage the iso merchants, includes tables: iso-merchant
    ISO_ACCOUNT: 'iso_account',                 // The iso account resource is used to manage the iso accounts, includes tables: iso-account
    REPRESENTATIVE_ISO: 'representative_iso',   // The representative iso resource is used to manage the representative isos, includes tables: representative-iso

    MERCHANT: 'merchant',                       // The merchant resource is used to manage the merchants, includes tables: merchant
    CONTACT: 'contact',                         // The contact resource is used to manage the contacts, includes tables: contact, contact-access-log
    MERCHANT_FUNDER: 'merchant_funder',         // The merchant funder resource is used to manage the merchant funders, includes tables: merchant-funder
    MERCHANT_ACCOUNT: 'merchant_account',       // The merchant account resource is used to manage the merchant accounts, includes tables: merchant-account
    MERCHANT_CONTACT: 'merchant_contact',       // The merchant contact resource is used to manage the merchant contacts, includes tables: contact-merchant
    
    SYNDICATOR: 'syndicator',                   // The syndicator resource is used to manage the syndicators, includes tables: syndicator, syndicator-access-log
    SYNDICATOR_FUNDER: 'syndicator_funder',     // The funder syndicator resource is used to manage the funder syndicators, includes tables: funder-syndicator
    SYNDICATOR_ACCOUNT: 'syndicator_account',   // The syndicator account resource is used to manage the syndicator accounts, includes tables: syndicator-account
    SYNDICATOR_TRANSACTION: 'syndicator_transaction', // The syndicator transaction resource is used to manage the syndicator transactions, includes tables: syndicator-transaction

    TRANSACTION: 'transaction',                   // The transaction resource is used to manage the transactions, includes tables: transaction
    TRANSACTION_BREAKDOWN: 'transaction_breakdown', // The transaction breakdown resource is used to manage the transaction breakdowns, includes tables: transaction-breakdown

    APPLICATION: 'application',                 // The application resource is used to manage the applications, includes tables: application, application-history
    APPLICATION_DOCUMENT: 'application_document', // The application document resource is used to manage the application documents, includes tables: application-document
    APPLICATION_OFFER: 'application_offer',     // The application offer resource is used to manage the application offers, includes tables: application-offer

    FUNDING: 'funding',                         // The funding resource is used to manage the funding, includes tables: funding, funding-balance-history
    FUNDING_FEE: 'funding_fee',                 // The funding fee resource is used to manage the funding fees, includes tables: funding-fee
    FUNDING_EXPENSE: 'funding_expense',         // The funding expense resource is used to manage the funding expenses, includes tables: funding-expense
    FUNDING_CREDIT: 'funding_credit',           // The funding credit resource is used to manage the funding credits, includes tables: funding-credit
    PARTICIPATION: 'participation',             // The participation resource is used to manage the participations, includes tables: participation

    DISBURSEMENT_INTENT: 'disbursement_intent', // The disbursement intent resource is used to manage the disbursement intents, includes tables: disbursement-intent
    DISBURSEMENT: 'disbursement',               // The disbursement resource is used to manage the disbursements, includes tables: disbursement

    PAYBACK_PLAN: 'payback_plan',               // The payback plan resource is used to manage the payback plans, includes tables: payback-plan
    PAYBACK: 'payback',                         // The payback resource is used to manage the paybacks, includes tables: payback, payback-log
    
    SYNDICATION_OFFER: 'syndication_offer',     // The syndication offer resource is used to manage the syndication offers, includes tables: syndication-offer  
    SYNDICATION: 'syndication',                 // The syndication resource is used to manage the syndications, includes tables: syndication, syndication-access-log

    PAYOUT: 'payout',                           // The payout resource is used to manage the payouts, includes tables: payout

    COMMISSION_INTENT: 'commission_intent',     // The commission intent resource is used to manage the commission intents, includes tables: commission-intent
    COMMISSION: 'commission',                   // The commission resource is used to manage the commissions, includes tables: commission
    
    DOCUMENT: 'document',                       // The document resource is used to manage the documents, includes tables: document
    
    REPORT: 'report',                           // The report resource is used to manage the reports, includes tables: TODO: not implemented yet
};

// Define all possible actions on resources
const ACTIONS = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    SELF: 'self',
    APPROVE: 'approve',
    REJECT: 'reject',
    EXPORT: 'export',
    IMPORT: 'import',
    ASSIGN: 'assign'
};

// Define all possible roles in the system
const ROLES = {
    ADMIN: 'admin',
    BOOKKEEPER: 'bookkeeper',
    FUNDER_MANAGER: 'funder_manager',
    FUNDER_USER: 'funder_user',
    ISO_MANAGER: 'iso_manager',
    ISO_SALES: 'iso_sales',
    SYNDICATOR: 'syndicator',
    MERCHANT: 'merchant',
    PENDING_USER: 'pending_user',
};

// Define permission format: resource:action
const createPermission = (resource, action) => `${resource}:${action}`;

// Create all possible permissions for each resource
const generateResourcePermissions = (resource) => {
    return {
        CREATE: createPermission(resource, ACTIONS.CREATE),
        READ: createPermission(resource, ACTIONS.READ),
        UPDATE: createPermission(resource, ACTIONS.UPDATE),
        DELETE: createPermission(resource, ACTIONS.DELETE),
        SELF: createPermission(resource, ACTIONS.SELF),
        APPROVE: createPermission(resource, ACTIONS.APPROVE),
        REJECT: createPermission(resource, ACTIONS.REJECT),
        EXPORT: createPermission(resource, ACTIONS.EXPORT),
        IMPORT: createPermission(resource, ACTIONS.IMPORT),
        ASSIGN: createPermission(resource, ACTIONS.ASSIGN)
    };
};

// Generate permissions for all resources
const PERMISSIONS = Object.entries(RESOURCES).reduce((acc, [key, resource]) => {
    acc[key] = generateResourcePermissions(resource);
    return acc;
}, {});

// Define role-based permission sets
const ROLE_PERMISSIONS = {
    // Admin has all permissions
    ADMIN: Object.values(PERMISSIONS).flatMap(resourcePermissions => 
        Object.values(resourcePermissions)
    ),
    
    // Bookkeeper permissions
    BOOKKEEPER: [
        // All bookkeeper related permissions
        PERMISSIONS.BOOKKEEPER.SELF,

        // All funder related permissions
        PERMISSIONS.USER.READ,
        PERMISSIONS.FUNDER_ROLE.READ,
        PERMISSIONS.FUNDER.READ,
        PERMISSIONS.FUNDER_ACCOUNT.READ,
        PERMISSIONS.FUNDER_SETTING.READ,
        PERMISSIONS.LENDER.READ,
        PERMISSIONS.LENDER_ACCOUNT.READ,
        PERMISSIONS.USER_FUNDER.READ,
        PERMISSIONS.FEE_TYPE.READ,
        PERMISSIONS.FORMULA.READ,
        PERMISSIONS.STIPULATION_TYPE.READ,
        PERMISSIONS.APPLICATION_STATUS.READ,

        // All ISO related permissions
        PERMISSIONS.ISO.READ,
        PERMISSIONS.ISO_FUNDER.READ,
        PERMISSIONS.ISO_MERCHANT.READ,
        PERMISSIONS.ISO_ACCOUNT.READ,

        // All merchant related permissions
        PERMISSIONS.MERCHANT.READ,
        PERMISSIONS.CONTACT.READ,
        PERMISSIONS.MERCHANT_ACCOUNT.READ,
        PERMISSIONS.MERCHANT_CONTACT.READ,

        // All syndicator related permissions
        PERMISSIONS.SYNDICATOR.READ,
        PERMISSIONS.SYNDICATOR_FUNDER.READ,
        PERMISSIONS.SYNDICATOR_ACCOUNT.READ,
        PERMISSIONS.SYNDICATOR_TRANSACTION.READ,

        // All transaction related permissions
        ...Object.values(PERMISSIONS.TRANSACTION),
        ...Object.values(PERMISSIONS.TRANSACTION_BREAKDOWN),

        // All funding related permissions
        PERMISSIONS.FUNDING.READ,
        PERMISSIONS.FUNDING_FEE.READ,
        PERMISSIONS.FUNDING_CREDIT.READ,
        PERMISSIONS.PARTICIPATION.READ,

        // All disbursement related permissions
        PERMISSIONS.DISBURSEMENT_INTENT.READ,
        PERMISSIONS.DISBURSEMENT.READ,

        // All payback related permissions
        PERMISSIONS.PAYBACK_PLAN.READ,
        PERMISSIONS.PAYBACK.READ,

        // All syndication related permissions
        PERMISSIONS.SYNDICATION.READ,
        
        // All payout related permissions
        PERMISSIONS.PAYOUT.READ,

        // All commission related permissions
        PERMISSIONS.COMMISSION_INTENT.READ,
        PERMISSIONS.COMMISSION.READ,

        // All document related permissions
        ...Object.values(PERMISSIONS.DOCUMENT),
        
        // Reports
        ...Object.values(PERMISSIONS.REPORT),
    ],

    // Funder Manager permissions - has all application permissions plus other specific ones
    FUNDER_MANAGER: [
        // All funder related permissions
        ...Object.values(PERMISSIONS.USER),
        ...Object.values(PERMISSIONS.USER_FUNDER),
        ...Object.values(PERMISSIONS.USER_LENDER),
        ...Object.values(PERMISSIONS.FUNDER),
        ...Object.values(PERMISSIONS.FUNDER_ROLE),
        ...Object.values(PERMISSIONS.FUNDER_ACCOUNT),
        ...Object.values(PERMISSIONS.FUNDER_SETTING),
        ...Object.values(PERMISSIONS.LENDER),
        ...Object.values(PERMISSIONS.LENDER_ACCOUNT),
        ...Object.values(PERMISSIONS.FEE_TYPE),
        ...Object.values(PERMISSIONS.EXPENSE_TYPE),
        ...Object.values(PERMISSIONS.FORMULA),
        ...Object.values(PERMISSIONS.STIPULATION_TYPE),
        ...Object.values(PERMISSIONS.APPLICATION_STATUS),
        ...Object.values(PERMISSIONS.FUNDING_STATUS),

        // ISO related permissions
        PERMISSIONS.ISO.CREATE,
        PERMISSIONS.ISO.READ,
        PERMISSIONS.ISO.UPDATE,
        PERMISSIONS.REPRESENTATIVE.CREATE,
        PERMISSIONS.REPRESENTATIVE.READ,
        PERMISSIONS.REPRESENTATIVE.UPDATE,
        ...Object.values(PERMISSIONS.ISO_FUNDER),
        ...Object.values(PERMISSIONS.ISO_MERCHANT),
        ...Object.values(PERMISSIONS.REPRESENTATIVE_ISO),
        PERMISSIONS.ISO_ACCOUNT.CREATE,
        PERMISSIONS.ISO_ACCOUNT.READ,
        PERMISSIONS.ISO_ACCOUNT.UPDATE,

        // Merchant related permissions
        PERMISSIONS.MERCHANT.CREATE,
        PERMISSIONS.MERCHANT.READ,
        PERMISSIONS.MERCHANT.UPDATE,
        PERMISSIONS.CONTACT.CREATE,
        PERMISSIONS.CONTACT.READ,
        PERMISSIONS.CONTACT.UPDATE,
        ...Object.values(PERMISSIONS.MERCHANT_CONTACT),
        ...Object.values(PERMISSIONS.MERCHANT_FUNDER),
        PERMISSIONS.MERCHANT_ACCOUNT.CREATE,
        PERMISSIONS.MERCHANT_ACCOUNT.READ,
        PERMISSIONS.MERCHANT_ACCOUNT.UPDATE,

        // Syndicator related permissions
        PERMISSIONS.SYNDICATOR.READ,
        PERMISSIONS.SYNDICATOR.CREATE,
        PERMISSIONS.SYNDICATOR.UPDATE,
        ...Object.values(PERMISSIONS.SYNDICATOR_FUNDER),
        PERMISSIONS.SYNDICATOR_ACCOUNT.CREATE,
        PERMISSIONS.SYNDICATOR_ACCOUNT.READ,
        PERMISSIONS.SYNDICATOR_ACCOUNT.UPDATE,
        ...Object.values(PERMISSIONS.SYNDICATOR_TRANSACTION),

        // Application related permissions
        ...Object.values(PERMISSIONS.APPLICATION),
        ...Object.values(PERMISSIONS.APPLICATION_DOCUMENT),
        PERMISSIONS.APPLICATION_OFFER.READ,
        PERMISSIONS.APPLICATION_OFFER.CREATE,
        PERMISSIONS.APPLICATION_OFFER.UPDATE,
        PERMISSIONS.APPLICATION_OFFER.DELETE,
        PERMISSIONS.APPLICATION_OFFER.APPROVE,

        // Funding related permissions
        ...Object.values(PERMISSIONS.FUNDING),
        ...Object.values(PERMISSIONS.FUNDING_FEE),
        ...Object.values(PERMISSIONS.FUNDING_EXPENSE),
        ...Object.values(PERMISSIONS.FUNDING_CREDIT),

        // Disbursement related permissions
        ...Object.values(PERMISSIONS.DISBURSEMENT_INTENT),
        ...Object.values(PERMISSIONS.DISBURSEMENT),

        // Payback related permissions
        ...Object.values(PERMISSIONS.PAYBACK_PLAN),
        ...Object.values(PERMISSIONS.PAYBACK),

        // Syndication related permissions
        ...Object.values(PERMISSIONS.SYNDICATION_OFFER),
        ...Object.values(PERMISSIONS.SYNDICATION),

        // Participation related permissions
        ...Object.values(PERMISSIONS.PARTICIPATION),
        
        // Payout related permissions
        ...Object.values(PERMISSIONS.PAYOUT),

        // Commission related permissions
        ...Object.values(PERMISSIONS.COMMISSION_INTENT),
        ...Object.values(PERMISSIONS.COMMISSION),

        // Transaction related permissions
        ...Object.values(PERMISSIONS.TRANSACTION),
        ...Object.values(PERMISSIONS.TRANSACTION_BREAKDOWN),

        // Document related permissions
        ...Object.values(PERMISSIONS.DOCUMENT),

        // Reports
        ...Object.values(PERMISSIONS.REPORT),
    ],

    // Funder user permissions
    FUNDER_USER: [
        // All funder related permissions
        PERMISSIONS.USER.SELF,
        PERMISSIONS.USER.READ,
        PERMISSIONS.USER_FUNDER.READ,
        PERMISSIONS.USER_LENDER.READ,
        PERMISSIONS.FUNDER.READ,
        PERMISSIONS.FUNDER_ACCOUNT.READ,
        PERMISSIONS.FUNDER_SETTING.READ,
        PERMISSIONS.LENDER.READ,
        PERMISSIONS.LENDER_ACCOUNT.READ,
        PERMISSIONS.FEE_TYPE.READ,
        PERMISSIONS.EXPENSE_TYPE.READ,
        PERMISSIONS.FORMULA.READ,
        PERMISSIONS.STIPULATION_TYPE.READ,
        PERMISSIONS.APPLICATION_STATUS.READ,
        PERMISSIONS.FUNDING_STATUS.READ,
        
        // ISO related permissions
        PERMISSIONS.ISO.READ,
        PERMISSIONS.ISO_FUNDER.READ,

        // Merchant related permissions
        PERMISSIONS.MERCHANT.READ,
        PERMISSIONS.CONTACT.READ,
        PERMISSIONS.MERCHANT_ACCOUNT.READ,
        PERMISSIONS.MERCHANT_CONTACT.READ,
        PERMISSIONS.MERCHANT_FUNDER.READ,

        // Syndicator related permissions
        PERMISSIONS.SYNDICATOR.READ,
        PERMISSIONS.SYNDICATOR_FUNDER.READ,
        PERMISSIONS.SYNDICATOR_ACCOUNT.READ,
        PERMISSIONS.SYNDICATOR_TRANSACTION.READ,

        // Application related permissions
        PERMISSIONS.APPLICATION.READ,
        PERMISSIONS.APPLICATION.CREATE,
        PERMISSIONS.APPLICATION.UPDATE,
        ...Object.values(PERMISSIONS.APPLICATION_DOCUMENT),
        PERMISSIONS.APPLICATION_OFFER.READ,
        PERMISSIONS.APPLICATION_OFFER.CREATE,
        PERMISSIONS.APPLICATION_OFFER.UPDATE,
        PERMISSIONS.APPLICATION_OFFER.DELETE,

        // Funding related permissions
        PERMISSIONS.FUNDING.READ,
        PERMISSIONS.FUNDING.UPDATE,
        ...Object.values(PERMISSIONS.FUNDING_FEE),
        ...Object.values(PERMISSIONS.FUNDING_EXPENSE),
        ...Object.values(PERMISSIONS.FUNDING_CREDIT),
        ...Object.values(PERMISSIONS.PARTICIPATION),

        // Disbursement related permissions
        ...Object.values(PERMISSIONS.DISBURSEMENT_INTENT),
        ...Object.values(PERMISSIONS.DISBURSEMENT),

        // Participation related permissions
        ...Object.values(PERMISSIONS.PARTICIPATION),

        // Payback related permissions
        ...Object.values(PERMISSIONS.PAYBACK_PLAN),
        ...Object.values(PERMISSIONS.PAYBACK),

        // Syndication related permissions
        PERMISSIONS.SYNDICATION_OFFER.READ,
        PERMISSIONS.SYNDICATION.READ,
        
        // Payout related permissions
        PERMISSIONS.PAYOUT.READ,

        // Commission related permissions
        PERMISSIONS.COMMISSION_INTENT.READ,
        PERMISSIONS.COMMISSION.READ,

        // Transaction related permissions
        ...Object.values(PERMISSIONS.TRANSACTION),
        ...Object.values(PERMISSIONS.TRANSACTION_BREAKDOWN),

        // Document related permissions
        ...Object.values(PERMISSIONS.DOCUMENT),

        // Reports
        PERMISSIONS.REPORT.READ,
    ],

    // ISO permissions
    ISO_MANAGER: [
        // All funder related permissions
        PERMISSIONS.FUNDER.READ,
        PERMISSIONS.LENDER.READ,
        PERMISSIONS.USER.READ,

        // All ISO related permissions
        ...Object.values(PERMISSIONS.ISO),
        ...Object.values(PERMISSIONS.REPRESENTATIVE),
        ...Object.values(PERMISSIONS.ISO_FUNDER),
        ...Object.values(PERMISSIONS.ISO_MERCHANT),
        ...Object.values(PERMISSIONS.ISO_ACCOUNT),
        ...Object.values(PERMISSIONS.REPRESENTATIVE_ISO),

        // All merchant related permissions
        PERMISSIONS.MERCHANT.READ,
        PERMISSIONS.CONTACT.READ,
        PERMISSIONS.MERCHANT_CONTACT.READ,

        // All application related permissions
        ...Object.values(PERMISSIONS.APPLICATION),
        ...Object.values(PERMISSIONS.APPLICATION_DOCUMENT),
        PERMISSIONS.APPLICATION_OFFER.READ,

        // All funding related permissions
        PERMISSIONS.FUNDING.READ,
        PERMISSIONS.FUNDING_FEE.READ,
        PERMISSIONS.FUNDING_CREDIT.READ,
        PERMISSIONS.PARTICIPATION.READ,

        // All disbursement related permissions
        PERMISSIONS.DISBURSEMENT_INTENT.READ,
        PERMISSIONS.DISBURSEMENT.READ,

        // All payback related permissions
        PERMISSIONS.PAYBACK_PLAN.READ,
        PERMISSIONS.PAYBACK.READ,

        // All commission related permissions
        PERMISSIONS.COMMISSION_INTENT.READ,
        PERMISSIONS.COMMISSION.READ,

        // Transaction related permissions
        ...Object.values(PERMISSIONS.TRANSACTION),
        ...Object.values(PERMISSIONS.TRANSACTION_BREAKDOWN),

        // Document related permissions
        ...Object.values(PERMISSIONS.DOCUMENT),
    ],

    // ISO permissions
    ISO_SALES: [
        // All funder related permissions
        PERMISSIONS.FUNDER.READ,
        PERMISSIONS.LENDER.READ,
        PERMISSIONS.USER.READ,

        // All ISO related permissions
        PERMISSIONS.ISO.READ,
        PERMISSIONS.REPRESENTATIVE.READ,
        PERMISSIONS.REPRESENTATIVE.SELF,
        PERMISSIONS.ISO_FUNDER.READ,
        PERMISSIONS.ISO_MERCHANT.READ,
        PERMISSIONS.ISO_ACCOUNT.READ,

        // All merchant related permissions
        PERMISSIONS.MERCHANT.READ,
        PERMISSIONS.CONTACT.READ,
        PERMISSIONS.MERCHANT_CONTACT.READ,

        // All application related permissions
        ...Object.values(PERMISSIONS.APPLICATION),
        ...Object.values(PERMISSIONS.APPLICATION_DOCUMENT),
        PERMISSIONS.APPLICATION_OFFER.READ,

        // All funding related permissions
        PERMISSIONS.FUNDING.READ,
        PERMISSIONS.FUNDING_FEE.READ,
        PERMISSIONS.FUNDING_CREDIT.READ,
        PERMISSIONS.PARTICIPATION.READ,

        // All disbursement related permissions
        PERMISSIONS.DISBURSEMENT_INTENT.READ,
        PERMISSIONS.DISBURSEMENT.READ,

        // All payback related permissions
        PERMISSIONS.PAYBACK_PLAN.READ,
        PERMISSIONS.PAYBACK.READ,

        // All commission related permissions
        PERMISSIONS.COMMISSION_INTENT.READ,
        PERMISSIONS.COMMISSION.READ,

        // Transaction related permissions
        ...Object.values(PERMISSIONS.TRANSACTION),
        ...Object.values(PERMISSIONS.TRANSACTION_BREAKDOWN),

        // Document related permissions
        ...Object.values(PERMISSIONS.DOCUMENT),
    ],

    // Syndicator permissions
    SYNDICATOR: [
        // All funder related permissions
        PERMISSIONS.FUNDER.READ,
        PERMISSIONS.LENDER.READ,
        PERMISSIONS.USER.READ,

        // All merchant related permissions
        PERMISSIONS.MERCHANT.READ,
        PERMISSIONS.CONTACT.READ,
        PERMISSIONS.MERCHANT_CONTACT.READ,

        // All syndicator related permissions
        ...Object.values(PERMISSIONS.SYNDICATOR),
        ...Object.values(PERMISSIONS.SYNDICATOR_FUNDER),
        ...Object.values(PERMISSIONS.SYNDICATOR_ACCOUNT),
        ...Object.values(PERMISSIONS.SYNDICATOR_TRANSACTION),

        // All funding related permissions
        PERMISSIONS.FUNDING.READ,
        PERMISSIONS.FUNDING_FEE.READ,
        PERMISSIONS.PARTICIPATION.READ,

        // All disbursement related permissions
        PERMISSIONS.DISBURSEMENT_INTENT.READ,
        PERMISSIONS.DISBURSEMENT.READ,

        // All payback related permissions
        PERMISSIONS.PAYBACK_PLAN.READ,
        PERMISSIONS.PAYBACK.READ,

        // All syndication related permissions
        PERMISSIONS.SYNDICATION.READ,
        PERMISSIONS.SYNDICATION.UPDATE,
        PERMISSIONS.SYNDICATION_OFFER.READ,
        PERMISSIONS.SYNDICATION_OFFER.UPDATE,

        // All payout related permissions
        PERMISSIONS.PAYOUT.READ,

        // All commission related permissions
        PERMISSIONS.COMMISSION_INTENT.READ,
        PERMISSIONS.COMMISSION.READ,
        
        // Transaction related permissions
        ...Object.values(PERMISSIONS.TRANSACTION),
        ...Object.values(PERMISSIONS.TRANSACTION_BREAKDOWN),

        // Document related permissions
        ...Object.values(PERMISSIONS.DOCUMENT),

        // Reports
        PERMISSIONS.REPORT.READ,
    ],

    // Merchant permissions
    MERCHANT: [
        // All funder related permissions
        PERMISSIONS.FUNDER.READ,
        PERMISSIONS.LENDER.READ,
        PERMISSIONS.USER.READ,

        // All ISO related permissions
        PERMISSIONS.ISO.READ,
        PERMISSIONS.REPRESENTATIVE.READ,
        PERMISSIONS.ISO_FUNDER.READ,
        ...Object.values(PERMISSIONS.ISO_MERCHANT),

        // All merchant related permissions
        ...Object.values(PERMISSIONS.MERCHANT),
        ...Object.values(PERMISSIONS.CONTACT),
        ...Object.values(PERMISSIONS.MERCHANT_ACCOUNT),
        ...Object.values(PERMISSIONS.MERCHANT_CONTACT),
        PERMISSIONS.MERCHANT_FUNDER.READ,

        // All application related permissions
        PERMISSIONS.APPLICATION.READ,
        PERMISSIONS.APPLICATION.CREATE,
        PERMISSIONS.APPLICATION.UPDATE,
        PERMISSIONS.APPLICATION.DELETE,
        ...Object.values(PERMISSIONS.APPLICATION_DOCUMENT),
        PERMISSIONS.APPLICATION_OFFER.READ,
        PERMISSIONS.APPLICATION_OFFER.APPROVE,
        PERMISSIONS.APPLICATION_OFFER.REJECT,

        // All funding related permissions
        PERMISSIONS.FUNDING.READ,
        PERMISSIONS.FUNDING_FEE.READ,
        PERMISSIONS.FUNDING_CREDIT.READ,
        PERMISSIONS.PARTICIPATION.READ,

        // All disbursement related permissions
        PERMISSIONS.DISBURSEMENT_INTENT.READ,
        PERMISSIONS.DISBURSEMENT.READ,
        
        // All payback related permissions
        PERMISSIONS.PAYBACK_PLAN.READ,
        PERMISSIONS.PAYBACK_PLAN.UPDATE,
        PERMISSIONS.PAYBACK.READ,

        // Transaction related permissions
        ...Object.values(PERMISSIONS.TRANSACTION),
        ...Object.values(PERMISSIONS.TRANSACTION_BREAKDOWN),

        // Document related permissions
        ...Object.values(PERMISSIONS.DOCUMENT),
    ]
};

/**
 * Check if user has required permissions
 * @param {string} role - The user's role
 * @param {Object} user - The user object
 * @param {string|string[]} requiredPermissions - Single permission or array of permissions to check
 * @param {boolean} requireAll - If true, user must have all permissions. If false, returns results for each permission
 * @returns {boolean|Object} - If requireAll is true, returns boolean. If false, returns object with permission results
 */
const checkUserPermissions = (role, user, requiredPermissions, requireAll = true) => {
    let rolePermissions = [];

    switch (role) {
    case ROLES.ADMIN:
        rolePermissions = ROLE_PERMISSIONS.ADMIN;
        break;
    case ROLES.BOOKKEEPER:
        rolePermissions = ROLE_PERMISSIONS.BOOKKEEPER;
        break;
    case ROLES.FUNDER_MANAGER:
        rolePermissions = ROLE_PERMISSIONS.FUNDER_MANAGER;
        break;
    case ROLES.FUNDER_USER:
        rolePermissions = ROLE_PERMISSIONS.FUNDER_USER;
        break;
    case ROLES.ISO_MANAGER:
        rolePermissions = ROLE_PERMISSIONS.ISO_MANAGER;
        break;
    case ROLES.ISO_SALES:
        rolePermissions = ROLE_PERMISSIONS.ISO_SALES;
        break;
    case ROLES.SYNDICATOR:
        rolePermissions = ROLE_PERMISSIONS.SYNDICATOR;
        break;
    case ROLES.MERCHANT:
        rolePermissions = ROLE_PERMISSIONS.MERCHANT;
        break;
    case ROLES.PENDING_USER:
        rolePermissions = [];
        break;
    default:
        return requireAll ? false : {};
    }

    // Add extra permissions to the role permissions if the user is a funder user and has extra permission_list
    if (user && user.permission_list) {
        rolePermissions = [...rolePermissions, ...user.permission_list];
    }

    // Convert single permission to array for consistent handling
    const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

    if (requireAll) {
        // Check if user has all required permissions
        return permissions.every(permission => 
            rolePermissions.includes(permission)
        );
    } else {
        // Return results for each permission
        return permissions.reduce((acc, permission) => {
            acc[permission] = rolePermissions.includes(permission);
            return acc;
        }, {});
    }
};

module.exports = {
    RESOURCES,
    ACTIONS,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    ROLES,
    createPermission,
    checkUserPermissions
}; 