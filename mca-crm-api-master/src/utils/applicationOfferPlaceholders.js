/**
 * Map application offer data to placeholder values for Word templates
 * @param {Object} offer - Application offer object with populated fields
 * @param {Object} merchantAccount - Merchant account object (optional)
 * @param {Object} syndicator - Syndicator object (optional)
 * @returns {Object} - Object with placeholder keys and values
 */
exports.mapApplicationOfferToPlaceholders = (offer, merchantAccount = null, syndicator = null) => {
    // Helper function to format currency
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '';
        return (typeof amount === 'number' ? amount : parseFloat(amount)).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Helper function to format date
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    // Helper function to format address
    const formatAddress = (address) => {
        if (!address) return '';
        if (typeof address === 'string') return address;
        const parts = [
            address.address_1,
            address.address_2,
            address.city,
            address.state,
            address.zip
        ].filter(Boolean);
        return parts.join(', ');
    };

    // Format merchant address data
    const merchantAddress = offer.merchant?.address_list?.[0] || {};
    const merchantMailingAddress = offer.merchant?.address_list?.[1] || offer.merchant?.address_list?.[0] || {};
    const merchantBusinessDetail = offer.merchant?.business_detail || {};
    const merchantPrimaryContact = offer.merchant?.primary_contact || offer.merchant?.primary_owner || {};

    // Format funder address
    const funderAddress = offer.funder?.address
        ? formatAddress(offer.funder.address)
        : '';

    // Format lender address
    const lenderAddress = offer.lender?.address_detail
        ? formatAddress(offer.lender.address_detail)
        : '';

    // Format ISO address
    const isoAddress = offer.iso?.address_list?.[0]
        ? formatAddress(offer.iso.address_list[0])
        : '';

    // Calculate financial details
    const purchasePrice = offer.offered_amount || 0;
    const purchasedAmount = offer.payback_amount || 0;
    const specifiedPercentage = offer.payment_amount && offer.offered_amount
        ? ((offer.payment_amount / offer.offered_amount) * 100).toFixed(2)
        : '';
    const frequency = offer.frequency || '';
    const initialPeriodicAmount = offer.payment_amount || 0;

    // Calculate fees
    const originationFee = offer.fee_list?.find(f => f.name?.toLowerCase().includes('origination'))?.amount || 0;
    const wireFee = offer.fee_list?.find(f => f.name?.toLowerCase().includes('wire'))?.amount || 0;
    const priorBalance = 0; // Default to 0

    // Calculate net amount funded
    const totalFees = (offer.fee_amount || 0) + (originationFee || 0);
    const netAmountFunded = purchasePrice - totalFees - (wireFee || 0) - priorBalance;

    // Build placeholder data object
    const placeholderData = {
        // Merchant Information
        'MerchantName': offer.merchant?.name || '',
        'MerchantDbaName': offer.merchant?.dba_name || '',
        'MerchantBusinessEntityType': merchantBusinessDetail.entity_type || '',
        'MerchantStateOfIncorporation': merchantBusinessDetail.state_of_incorporation || '',
        'MerchantStreetAddress': merchantAddress.address_1 || '',
        'MerchantCity': merchantAddress.city || '',
        'MerchantState': merchantAddress.state || '',
        'MerchantZip': merchantAddress.zip || '',
        'MerchantMailingStreet': merchantMailingAddress.address_1 || '',
        'MerchantMailingCity': merchantMailingAddress.city || '',
        'MerchantMailingState': merchantMailingAddress.state || '',
        'MerchantMailingZip': merchantMailingAddress.zip || '',
        'MerchantPrimaryContactName': merchantPrimaryContact.first_name && merchantPrimaryContact.last_name
            ? `${merchantPrimaryContact.first_name} ${merchantPrimaryContact.last_name}`
            : (merchantPrimaryContact.first_name || merchantPrimaryContact.last_name || ''),
        'MerchantPrimaryContactTitle': merchantPrimaryContact.title || '',
        'MerchantPrimaryContactEmail': merchantPrimaryContact.email || offer.merchant?.email || '',
        'MerchantPrimaryContactPhone': merchantPrimaryContact.phone_mobile || merchantPrimaryContact.phone || offer.merchant?.phone || '',
        'MerchantEmail': offer.merchant?.email || '',
        'MerchantPhone': offer.merchant?.phone || '',
        'MerchantBankName': merchantAccount?.bank_name || '',
        'MerchantRoutingNumber': merchantAccount?.routing_number || '',
        'MerchantAccountNumber': merchantAccount?.account_number || '',

        // ISO Information
        'IsoName': offer.iso?.name || '',
        'IsoEmail': offer.iso?.email || '',
        'IsoPhone': offer.iso?.phone || '',
        'IsoAddress': isoAddress,

        // Syndicator Information
        'SyndicatorName': syndicator?.name || '',
        'SyndicatorFirstName': syndicator?.first_name || '',
        'SyndicatorLastName': syndicator?.last_name || '',
        'SyndicatorEmail': syndicator?.email || '',
        'SyndicatorPhone': syndicator?.phone_mobile || '',

        // Funder Information
        'FunderName': offer.funder?.name || '',
        'FunderAddress': funderAddress,
        'FunderEmail': offer.funder?.email || '',
        'FunderPhone': offer.funder?.phone || '',

        // Lender Information
        'LenderName': offer.lender?.name || '',
        'LenderAddress': lenderAddress,
        'LenderEmail': offer.lender?.email || '',
        'LenderPhone': offer.lender?.phone || '',

        // Application Information
        'ApplicationName': offer.application?.name || '',
        'ApplicationId': offer.application?._id?.toString().substring(0, 8) || offer.application?.id?.toString().substring(0, 8) || '',
        'ApplicationRequestAmount': formatCurrency(offer.application?.request_amount || 0),

        // Offer Financial Information
        'OfferedAmount': formatCurrency(purchasePrice),
        'PaybackAmount': formatCurrency(purchasedAmount),
        'SpecifiedPercentage': specifiedPercentage,
        'Frequency': frequency.charAt(0) + frequency.slice(1).toLowerCase(),
        'InitialPeriodicAmount': formatCurrency(initialPeriodicAmount),
        'PriorBalance': formatCurrency(priorBalance),
        'WireFee': formatCurrency(wireFee),
        'OriginationFee': formatCurrency(originationFee),
        'NetAmountFunded': formatCurrency(netAmountFunded),
        'TotalFees': formatCurrency(offer.fee_amount || 0),
        'DisbursementAmount': formatCurrency(offer.disbursement_amount || 0),
        'PaymentAmount': formatCurrency(offer.payment_amount || 0),
        'TermLength': offer.term_length || '',
        'FactorRate': offer.factor_rate || '',
        'BuyRate': offer.buy_rate || '',
        'PaybackCount': offer.payback_count || '',
        'Installment': offer.installment || '',
        'CommissionAmount': formatCurrency(offer.commission_amount || 0),

        // Dates
        'OfferedDate': formatDate(offer.offered_date),
        'EffectiveDate': formatDate(new Date()),
        'GenerationDate': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),

        // Fee List (as formatted string)
        'FeeList': (offer.fee_list && offer.fee_list.length > 0)
            ? offer.fee_list.map(fee => `${fee.name || 'Fee'}: ${formatCurrency(fee.amount || 0)}`).join('\n')
            : '',

        // Expense List (as formatted string)
        'ExpenseList': (offer.expense_list && offer.expense_list.length > 0)
            ? offer.expense_list.map(expense => `${expense.name || 'Expense'}: ${formatCurrency(expense.amount || 0)}`).join('\n')
            : '',

        // Document ID
        'DocumentId': offer._id?.toString().substring(0, 8) || ''
    };

    return placeholderData;
};

/**
 * Get list of all available placeholders for documentation
 * @returns {Array} - Array of placeholder names
 */
exports.getAvailablePlaceholders = () => {
    return [
        // Merchant Information
        'MerchantName', 'MerchantDbaName', 'MerchantBusinessEntityType', 'MerchantStateOfIncorporation',
        'MerchantStreetAddress', 'MerchantCity', 'MerchantState', 'MerchantZip',
        'MerchantMailingStreet', 'MerchantMailingCity', 'MerchantMailingState', 'MerchantMailingZip',
        'MerchantPrimaryContactName', 'MerchantPrimaryContactTitle', 'MerchantPrimaryContactEmail', 'MerchantPrimaryContactPhone',
        'MerchantEmail', 'MerchantPhone',
        'MerchantBankName', 'MerchantRoutingNumber', 'MerchantAccountNumber',

        // ISO Information
        'IsoName', 'IsoEmail', 'IsoPhone', 'IsoAddress',

        // Syndicator Information
        'SyndicatorName', 'SyndicatorFirstName', 'SyndicatorLastName', 'SyndicatorEmail', 'SyndicatorPhone',

        // Funder Information
        'FunderName', 'FunderAddress', 'FunderEmail', 'FunderPhone',

        // Lender Information
        'LenderName', 'LenderAddress', 'LenderEmail', 'LenderPhone',

        // Application Information
        'ApplicationName', 'ApplicationId', 'ApplicationRequestAmount',

        // Offer Financial Information
        'OfferedAmount', 'PaybackAmount', 'SpecifiedPercentage', 'Frequency', 'InitialPeriodicAmount',
        'PriorBalance', 'WireFee', 'OriginationFee', 'NetAmountFunded', 'TotalFees',
        'DisbursementAmount', 'PaymentAmount', 'TermLength', 'FactorRate', 'BuyRate',
        'PaybackCount', 'Installment', 'CommissionAmount',

        // Dates
        'OfferedDate', 'EffectiveDate', 'GenerationDate',

        // Lists
        'FeeList', 'ExpenseList',

        // Document ID
        'DocumentId'
    ];
};
