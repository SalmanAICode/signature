# RabbitSign Integration - Standalone Code

This folder contains standalone RabbitSign integration code that can be copied directly into any Node.js/Express application.

## Files Included

1. **rabbitsignService.js** - Core service with all RabbitSign API calls
2. **rabbitsignController.js** - Express.js controller endpoints
3. **rabbitsignRoutes.js** - Express.js route definitions

## Quick Setup

### 1. Install Dependencies

```bash
npm install node-fetch
```

### 2. Set Environment Variables

Add to your `.env` file:

```env
RABBITSIGN_API_KEY=your_api_key_id
RABBITSIGN_API_SECRET=your_api_secret
RABBITSIGN_API_BASE_URL=https://www.rabbitsign.com
RABBITSIGN_WEBHOOK_SECRET=your_webhook_secret  # Optional
```

### 3. Copy Files

Copy the three files to your project:
- `rabbitsignService.js` → `src/services/rabbitsignService.js`
- `rabbitsignController.js` → `src/controllers/rabbitsignController.js`
- `rabbitsignRoutes.js` → `src/routes/rabbitsignRoutes.js`

### 4. Add Routes to Server

In your main server file (e.g., `server.js`):

```javascript
const rabbitsignRoutes = require('./routes/rabbitsignRoutes');
app.use('/api/v1/rabbitsign', rabbitsignRoutes);
```

### 5. Use in Frontend

```javascript
// Send document for signature
const response = await fetch('/api/v1/rabbitsign/documents/123/sign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    signers: [{
      email: 'signer@example.com',
      name: 'John Doe',
      role: 'signer',
      fields: [{
        id: 1,
        type: 'SIGNATURE',
        position: {
          docNumber: 0,
          pageIndex: 0,
          x: 100,
          y: 200,
          width: 200,
          height: 50
        }
      }]
    }],
    file_content: 'base64EncodedPdfString',
    title: 'Contract Agreement'
  })
});

const result = await response.json();
console.log('Signing URL:', result.data.signing_url);
```

## API Endpoints

### 1. Get Upload URL
```
GET /api/v1/rabbitsign/documents/:id/upload-url
```

### 2. Upload File
```
POST /api/v1/rabbitsign/documents/:id/upload-file
Body: { upload_url, file_content (base64), content_type }
```

### 3. Initiate Signature
```
POST /api/v1/rabbitsign/documents/:id/sign
Body: { signers, file_content (base64) OR file_url, message, title }
```

### 4. Get Status
```
GET /api/v1/rabbitsign/documents/:id/signature-status?folder_id=xxx
```

### 5. Webhook
```
POST /api/v1/rabbitsign/webhook
Body: { folderId, eventName, signerEmail }
```

## Complete Integration Guide

See `RABBITSIGN_INTEGRATION_GUIDE.md` in the parent directory for detailed documentation, examples, and explanations.
