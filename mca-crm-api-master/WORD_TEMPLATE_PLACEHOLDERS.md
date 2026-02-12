# Word Template Placeholders for Application Offers

This document lists all available placeholders that can be used in Word (.docx) templates for application offers.

## Format

Placeholders must be in the exact format: `{{FieldName}}`

Example: `{{MerchantName}}` will be replaced with the merchant's name.

## Available Placeholders

### Merchant Information

- `{{MerchantName}}` - Merchant business name
- `{{MerchantDbaName}}` - Merchant DBA (Doing Business As) name
- `{{MerchantBusinessEntityType}}` - Business entity type (e.g., LLC, Corporation)
- `{{MerchantStateOfIncorporation}}` - State of incorporation
- `{{MerchantStreetAddress}}` - Street address (address_1)
- `{{MerchantCity}}` - City
- `{{MerchantState}}` - State
- `{{MerchantZip}}` - ZIP code
- `{{MerchantMailingStreet}}` - Mailing street address
- `{{MerchantMailingCity}}` - Mailing city
- `{{MerchantMailingState}}` - Mailing state
- `{{MerchantMailingZip}}` - Mailing ZIP code
- `{{MerchantPrimaryContactName}}` - Primary contact full name
- `{{MerchantPrimaryContactTitle}}` - Primary contact title
- `{{MerchantPrimaryContactEmail}}` - Primary contact email
- `{{MerchantPrimaryContactPhone}}` - Primary contact phone
- `{{MerchantEmail}}` - Merchant email
- `{{MerchantPhone}}` - Merchant phone
- `{{MerchantBankName}}` - Bank name (from merchant account)
- `{{MerchantRoutingNumber}}` - Bank routing number
- `{{MerchantAccountNumber}}` - Bank account number

### ISO Information

- `{{IsoName}}` - ISO name
- `{{IsoEmail}}` - ISO email
- `{{IsoPhone}}` - ISO phone
- `{{IsoAddress}}` - ISO full address (formatted)

### Syndicator Information

- `{{SyndicatorName}}` - Syndicator name
- `{{SyndicatorFirstName}}` - Syndicator first name
- `{{SyndicatorLastName}}` - Syndicator last name
- `{{SyndicatorEmail}}` - Syndicator email
- `{{SyndicatorPhone}}` - Syndicator phone

### Funder Information

- `{{FunderName}}` - Funder name
- `{{FunderAddress}}` - Funder full address (formatted)
- `{{FunderEmail}}` - Funder email
- `{{FunderPhone}}` - Funder phone

### Lender Information

- `{{LenderName}}` - Lender name
- `{{LenderAddress}}` - Lender full address (formatted)
- `{{LenderEmail}}` - Lender email
- `{{LenderPhone}}` - Lender phone

### Application Information

- `{{ApplicationName}}` - Application name
- `{{ApplicationId}}` - Application ID (first 8 characters)
- `{{ApplicationRequestAmount}}` - Requested amount (formatted as currency)

### Offer Financial Information

- `{{OfferedAmount}}` - Offered amount (formatted as currency)
- `{{PaybackAmount}}` - Payback amount (formatted as currency)
- `{{SpecifiedPercentage}}` - Specified percentage
- `{{Frequency}}` - Payment frequency (Daily, Weekly, Monthly)
- `{{InitialPeriodicAmount}}` - Initial periodic payment amount (formatted as currency)
- `{{PriorBalance}}` - Prior balance (formatted as currency)
- `{{WireFee}}` - Wire fee (formatted as currency)
- `{{OriginationFee}}` - Origination fee (formatted as currency)
- `{{NetAmountFunded}}` - Net amount funded (formatted as currency)
- `{{TotalFees}}` - Total fees (formatted as currency)
- `{{DisbursementAmount}}` - Disbursement amount (formatted as currency)
- `{{PaymentAmount}}` - Payment amount (formatted as currency)
- `{{TermLength}}` - Term length
- `{{FactorRate}}` - Factor rate
- `{{BuyRate}}` - Buy rate
- `{{PaybackCount}}` - Number of payback periods
- `{{Installment}}` - Installment number
- `{{CommissionAmount}}` - Commission amount (formatted as currency)

### Dates

- `{{OfferedDate}}` - Offer date (MM/DD/YYYY format)
- `{{EffectiveDate}}` - Effective date (MM/DD/YYYY format)
- `{{GenerationDate}}` - Document generation date (Month Day, Year format)

### Lists

- `{{FeeList}}` - List of fees (formatted as "Fee Name: Amount" per line)
- `{{ExpenseList}}` - List of expenses (formatted as "Expense Name: Amount" per line)

### Document Information

- `{{DocumentId}}` - Document ID (first 8 characters of offer ID)

## Usage Notes

1. **Placeholder Format**: Placeholders must use double curly braces: `{{FieldName}}`
2. **Case Sensitive**: Placeholder names are case-sensitive. Use exact names as listed above.
3. **Missing Values**: If a placeholder value is not available, it will be replaced with an empty string.
4. **Currency Formatting**: All currency fields are automatically formatted with 2 decimal places and thousand separators (e.g., "1,234.56").
5. **Date Formatting**: Dates are formatted according to US standards (MM/DD/YYYY or Month Day, Year).
6. **Address Formatting**: Address fields are automatically formatted with commas separating address components.

## Example Template

```
MERCHANT CASH ADVANCE AGREEMENT

This agreement is entered into between {{FunderName}} and {{MerchantName}}.

Merchant Information:
Name: {{MerchantName}}
DBA: {{MerchantDbaName}}
Address: {{MerchantStreetAddress}}, {{MerchantCity}}, {{MerchantState}} {{MerchantZip}}
Contact: {{MerchantPrimaryContactName}}
Email: {{MerchantPrimaryContactEmail}}
Phone: {{MerchantPrimaryContactPhone}}

Offer Details:
Offered Amount: {{OfferedAmount}}
Payback Amount: {{PaybackAmount}}
Payment Frequency: {{Frequency}}
Payment Amount: {{PaymentAmount}}
Term Length: {{TermLength}} periods

Fees:
{{FeeList}}

Effective Date: {{EffectiveDate}}
Document ID: {{DocumentId}}
```

## API Endpoint

To get the list of available placeholders programmatically:

```
GET /api/v1/documents/word-template-placeholders
```

This endpoint returns a JSON object with all available placeholders and their descriptions.
