# Word Template Implementation for Application Offers

## Overview

This implementation extends the application offer document system to support Word (.docx) templates with placeholder replacement. Word templates are automatically processed, populated with application offer data, converted to PDF, and then integrated into the existing PDF signing workflow.

## How It Works

1. **Upload**: User uploads a Word (.docx) file containing placeholders in the format `{{FieldName}}`
2. **Validation**: System validates that the Word file contains at least one placeholder
3. **Data Mapping**: Application offer data is mapped to placeholder values
4. **Placeholder Replacement**: Placeholders in the Word document are replaced with actual values
5. **PDF Conversion**: The populated Word document is converted to PDF
6. **Storage**: The PDF is stored instead of the original Word file
7. **Integration**: The PDF flows through the existing RebitSign signature workflow

## Key Features

- ✅ Automatic placeholder detection and replacement
- ✅ Preserves Word document formatting, layout, headers, and footers
- ✅ Converts populated Word documents to PDF automatically
- ✅ Seamless integration with existing PDF preview and signing flow
- ✅ Validation to reject Word files without placeholders
- ✅ Comprehensive placeholder documentation

## Files Created/Modified

### Backend Files

1. **`src/services/wordTemplateService.js`** (NEW)
   - Handles Word template processing
   - Extracts placeholders from Word documents
   - Replaces placeholders with data
   - Converts Word to PDF using LibreOffice

2. **`src/utils/applicationOfferPlaceholders.js`** (NEW)
   - Maps application offer data to placeholder values
   - Provides list of available placeholders
   - Formats currency, dates, and addresses

3. **`src/controllers/documentController.js`** (MODIFIED)
   - Added Word template processing logic to `createDocument` endpoint
   - Added `getWordTemplatePlaceholders` endpoint
   - Accepts `application_offer_id` parameter for template processing

4. **`src/routes/documentRoutes.js`** (MODIFIED)
   - Added route for getting available placeholders

5. **`package.json`** (MODIFIED)
   - Added `docxtemplater` dependency for placeholder replacement
   - Added `pizzip` dependency (required by docxtemplater)

### Frontend Files

1. **`src/app/application-offer/[offer_id]/_components/documentTab/uploadDocumentModal.tsx`** (MODIFIED)
   - Updated to accept Word files (.docx, .doc)
   - Passes `application_offer_id` when uploading Word files

2. **`src/lib/api/documents.ts`** (MODIFIED)
   - Added `application_offer_id` parameter to `createDocument` function

## Installation

1. Install new dependencies:
```bash
cd mca-crm-api-master
npm install docxtemplater pizzip
```

2. Ensure LibreOffice is installed on the server:
   - Required for Word to PDF conversion
   - Installation instructions vary by OS
   - On Ubuntu/Debian: `sudo apt-get install libreoffice`
   - On CentOS/RHEL: `sudo yum install libreoffice`
   - On macOS: `brew install libreoffice`
   - On Windows: Download from https://www.libreoffice.org/

## API Usage

### Upload Word Template

When uploading a document for an application offer, include `application_offer_id` in the form data:

```javascript
const formData = new FormData();
formData.append('file', wordFile);
formData.append('application_offer_id', offerId);
formData.append('merchant', merchantId);
formData.append('funder', funderId);
// ... other fields

POST /api/v1/documents
```

### Get Available Placeholders

```javascript
GET /api/v1/documents/word-template-placeholders

Response:
{
  "success": true,
  "data": {
    "placeholders": ["MerchantName", "OfferedAmount", ...],
    "format": "{{FieldName}}",
    "description": "..."
  }
}
```

## Placeholder Format

Placeholders must use the exact format: `{{FieldName}}`

Examples:
- `{{MerchantName}}` - Will be replaced with merchant name
- `{{OfferedAmount}}` - Will be replaced with formatted currency
- `{{EffectiveDate}}` - Will be replaced with formatted date

See `WORD_TEMPLATE_PLACEHOLDERS.md` for complete list of available placeholders.

## Validation

- Word files without placeholders are rejected with a clear error message
- Only `.docx` and `.doc` files are processed as templates
- Files must contain at least one placeholder in `{{FieldName}}` format

## Error Handling

- Missing placeholders: Left as-is in the document (not replaced)
- Invalid Word format: Returns 400 error
- LibreOffice not available: Returns 500 error with helpful message
- Missing application offer: Returns 400 error

## Constraints

- ✅ No Word editing in frontend (as requested)
- ✅ No changes to existing PDF upload flow
- ✅ No changes to RebitSign integration
- ✅ Word files are converted to PDF before storage
- ✅ PDF preview and signing flow unchanged

## Testing

1. Create a Word template with placeholders like `{{MerchantName}}` and `{{OfferedAmount}}`
2. Upload it via the application offer document upload modal
3. Verify placeholders are replaced with actual values
4. Verify the document is converted to PDF
5. Verify the PDF can be previewed and signed using existing RebitSign flow

## Troubleshooting

### LibreOffice Not Found
- Error: "Failed to convert Word document to PDF"
- Solution: Install LibreOffice on the server

### Placeholders Not Replaced
- Check placeholder format: Must be `{{FieldName}}` (case-sensitive)
- Check placeholder name: Must match exactly from the available list
- Check application offer data: Some fields may be empty/null

### PDF Conversion Fails
- Ensure LibreOffice is properly installed
- Check file permissions
- Verify Word file is not corrupted
- Check server logs for detailed error messages
