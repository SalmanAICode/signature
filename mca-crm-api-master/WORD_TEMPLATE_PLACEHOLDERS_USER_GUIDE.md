# Word Template Placeholders - User Guide

Use these placeholders in your Word (.docx) template files. The system will automatically replace them with actual data when you upload the template.

## How to Use

1. Open your Word document
2. Type placeholders exactly as shown: `{{FieldName}}`
3. Upload the Word file through the application offer document upload
4. The system will automatically replace placeholders with actual values
5. The document will be converted to PDF for signing

---

## Complete Placeholder List

### Merchant Information

```
{{MerchantName}}                    - Merchant business name
{{MerchantDbaName}}                - Merchant DBA (Doing Business As) name
{{MerchantBusinessEntityType}}      - Business entity type (e.g., LLC, Corporation)
{{MerchantStateOfIncorporation}}    - State of incorporation
{{MerchantStreetAddress}}           - Street address
{{MerchantCity}}                    - City
{{MerchantState}}                   - State
{{MerchantZip}}                     - ZIP code
{{MerchantMailingStreet}}            - Mailing street address
{{MerchantMailingCity}}             - Mailing city
{{MerchantMailingState}}            - Mailing state
{{MerchantMailingZip}}              - Mailing ZIP code
{{MerchantPrimaryContactName}}      - Primary contact full name
{{MerchantPrimaryContactTitle}}     - Primary contact title
{{MerchantPrimaryContactEmail}}     - Primary contact email
{{MerchantPrimaryContactPhone}}     - Primary contact phone
{{MerchantEmail}}                   - Merchant email
{{MerchantPhone}}                   - Merchant phone
{{MerchantBankName}}                - Bank name
{{MerchantRoutingNumber}}           - Bank routing number
{{MerchantAccountNumber}}           - Bank account number
```

### ISO Information

```
{{IsoName}}                         - ISO name
{{IsoEmail}}                        - ISO email
{{IsoPhone}}                        - ISO phone
{{IsoAddress}}                      - ISO full address
```

### Syndicator Information

```
{{SyndicatorName}}                 - Syndicator name
{{SyndicatorFirstName}}            - Syndicator first name
{{SyndicatorLastName}}             - Syndicator last name
{{SyndicatorEmail}}                - Syndicator email
{{SyndicatorPhone}}                - Syndicator phone
```

### Funder Information

```
{{FunderName}}                     - Funder name
{{FunderAddress}}                  - Funder full address
{{FunderEmail}}                    - Funder email
{{FunderPhone}}                    - Funder phone
```

### Lender Information

```
{{LenderName}}                     - Lender name
{{LenderAddress}}                  - Lender full address
{{LenderEmail}}                    - Lender email
{{LenderPhone}}                    - Lender phone
```

### Application Information

```
{{ApplicationName}}                - Application name
{{ApplicationId}}                  - Application ID (first 8 characters)
{{ApplicationRequestAmount}}       - Requested amount (formatted as currency)
```

### Offer Financial Information

```
{{OfferedAmount}}                 - Offered amount (formatted as currency)
{{PaybackAmount}}                 - Payback amount (formatted as currency)
{{SpecifiedPercentage}}           - Specified percentage
{{Frequency}}                     - Payment frequency (Daily, Weekly, Monthly)
{{InitialPeriodicAmount}}         - Initial periodic payment amount (formatted as currency)
{{PriorBalance}}                  - Prior balance (formatted as currency)
{{WireFee}}                       - Wire fee (formatted as currency)
{{OriginationFee}}                - Origination fee (formatted as currency)
{{NetAmountFunded}}              - Net amount funded (formatted as currency)
{{TotalFees}}                     - Total fees (formatted as currency)
{{DisbursementAmount}}            - Disbursement amount (formatted as currency)
{{PaymentAmount}}                 - Payment amount (formatted as currency)
{{TermLength}}                     - Term length
{{FactorRate}}                     - Factor rate
{{BuyRate}}                        - Buy rate
{{PaybackCount}}                   - Number of payback periods
{{Installment}}                    - Installment number
{{CommissionAmount}}               - Commission amount (formatted as currency)
```

### Dates

```
{{OfferedDate}}                    - Offer date (MM/DD/YYYY format)
{{EffectiveDate}}                  - Effective date (MM/DD/YYYY format)
{{GenerationDate}}                 - Document generation date (Month Day, Year format)
```

### Lists

```
{{FeeList}}                        - List of all fees (formatted as "Fee Name: Amount" per line)
{{ExpenseList}}                    - List of all expenses (formatted as "Expense Name: Amount" per line)
```

### Document Information

```
{{DocumentId}}                     - Document ID (first 8 characters of offer ID)
```

---

## Important Notes

✅ **Format**: Use double curly braces exactly as shown: `{{FieldName}}`

✅ **Case Sensitive**: Placeholder names are case-sensitive. Use exact capitalization.

✅ **Currency Fields**: Automatically formatted with 2 decimal places (e.g., "1,234.56")

✅ **Date Fields**: Automatically formatted (MM/DD/YYYY or Month Day, Year)

✅ **Missing Values**: If data is not available, placeholder will be replaced with empty string

✅ **No Spaces**: Do not add spaces inside the braces (use `{{FieldName}}` not `{{ FieldName }}`)

---

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

---

## Quick Reference - Copy & Paste List

Copy these placeholders directly into your Word document:

**Merchant:**
{{MerchantName}} {{MerchantDbaName}} {{MerchantBusinessEntityType}} {{MerchantStateOfIncorporation}} {{MerchantStreetAddress}} {{MerchantCity}} {{MerchantState}} {{MerchantZip}} {{MerchantMailingStreet}} {{MerchantMailingCity}} {{MerchantMailingState}} {{MerchantMailingZip}} {{MerchantPrimaryContactName}} {{MerchantPrimaryContactTitle}} {{MerchantPrimaryContactEmail}} {{MerchantPrimaryContactPhone}} {{MerchantEmail}} {{MerchantPhone}} {{MerchantBankName}} {{MerchantRoutingNumber}} {{MerchantAccountNumber}}

**ISO:**
{{IsoName}} {{IsoEmail}} {{IsoPhone}} {{IsoAddress}}

**Syndicator:**
{{SyndicatorName}} {{SyndicatorFirstName}} {{SyndicatorLastName}} {{SyndicatorEmail}} {{SyndicatorPhone}}

**Funder:**
{{FunderName}} {{FunderAddress}} {{FunderEmail}} {{FunderPhone}}

**Lender:**
{{LenderName}} {{LenderAddress}} {{LenderEmail}} {{LenderPhone}}

**Application:**
{{ApplicationName}} {{ApplicationId}} {{ApplicationRequestAmount}}

**Financial:**
{{OfferedAmount}} {{PaybackAmount}} {{SpecifiedPercentage}} {{Frequency}} {{InitialPeriodicAmount}} {{PriorBalance}} {{WireFee}} {{OriginationFee}} {{NetAmountFunded}} {{TotalFees}} {{DisbursementAmount}} {{PaymentAmount}} {{TermLength}} {{FactorRate}} {{BuyRate}} {{PaybackCount}} {{Installment}} {{CommissionAmount}}

**Dates:**
{{OfferedDate}} {{EffectiveDate}} {{GenerationDate}}

**Lists:**
{{FeeList}} {{ExpenseList}}

**Document:**
{{DocumentId}}

---

**Total: 60+ Available Placeholders**
