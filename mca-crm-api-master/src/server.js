const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const http = require('http');
const WebSocket = require('ws');
const webSocketProcessor = require('./middleware/websocket/webSocketProcessor');
// const { Server } = require('socket.io');
// const { socketHandler } = require('./socket');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
const authRoutes = require('./routes/authRoutes');
const importRoutes = require('./routes/importRoutes');
const syncRoutes = require('./routes/syncRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const adminRoutes = require('./routes/adminRoutes');
const bookkeeperRoutes = require('./routes/bookkeeperRoutes');
const userRoutes = require('./routes/userRoutes');
const syndicatorRoutes = require('./routes/syndicatorRoutes');
const representativeRoutes = require('./routes/representativeRoutes');
const contactRoutes = require('./routes/contactRoutes');

const funderRoutes = require('./routes/funderRoutes');
const funderSettingRoutes = require('./routes/funderSettingRoutes');
const lenderRoutes = require('./routes/lenderRoutes');
const isoRoutes = require('./routes/isoRoutes');
const merchantRoutes = require('./routes/merchantRoutes');

const formulaRoutes = require('./routes/formulaRoutes');

const syndicatorFunderRoutes = require('./routes/syndicatorFunderRoutes');
const syndicatorLenderRoutes = require('./routes/syndicatorLenderRoutes');
const isoFunderRoutes = require('./routes/isoFunderRoutes');
const merchantFunderRoutes = require('./routes/merchantFunderRoutes');
const isoMerchantRoutes = require('./routes/isoMerchantRoutes');

const applicationRoutes = require('./routes/applicationRoutes');
const applicationStatusRoutes = require('./routes/applicationStatusRoutes');
const applicationOfferRoutes = require('./routes/applicationOfferRoutes');

const fundingRoutes = require('./routes/fundingRoutes');
const fundingFeeRoutes = require('./routes/fundingFeeRoutes');
const fundingCreditRoutes = require('./routes/fundingCreditRoutes');
const fundingExpenseRoutes = require('./routes/fundingExpenseRoutes');
const fundingStatusRoutes = require('./routes/fundingStatusRoutes');
const funderAccountRoutes = require('./routes/funderAccountRoutes');
const lenderAccountRoutes = require('./routes/lenderAccountRoutes');
const feeTypeRoutes = require('./routes/feeTypeRoutes');
const expenseTypeRoutes = require('./routes/expenseTypeRoutes');
const isoAccountRoutes = require('./routes/isoAccountRoutes');
const merchantAccountRoutes = require('./routes/merchantAccountRoutes');
const syndicatorAccountRoutes = require('./routes/syndicatorAccountRoutes');
const commissionIntentRoutes = require('./routes/commissionIntentRoutes');
const disbursementIntentRoutes = require('./routes/disbursementIntentRoutes');
const documentRoutes = require('./routes/documentRoutes');
const rabbitsignRoutes = require('./routes/rabbitsignRoutes');
const paybackRoutes = require('./routes/paybackRoutes');
const paybackPlanRoutes = require('./routes/paybackPlanRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const participationRoutes = require('./routes/participationRoutes');
const syndicationOfferRoutes = require('./routes/syndicationOfferRoutes');
const syndicationRoutes = require('./routes/syndicationRoutes');
const syndicatorTransactionRoutes = require('./routes/syndicatorTransactionRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const transactionBreakdownRoutes = require('./routes/transactionBreakdownRoutes');

const stipulationTypeRoutes = require('./routes/stipulationTypeRoutes');

const app = express();

// Body parser
app.use(express.json());

// Set security headers
app.use(helmet());

// Enable CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Parse cookies
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Mount routers related to authorization
app.use('/api/v1/auth', authRoutes);

// Mount routers related to personnels (means can login/logout through authorization)
app.use('/api/v1/admins', adminRoutes);                     // Related to Role ROLES.ADMIN
app.use('/api/v1/bookkeepers', bookkeeperRoutes);           // Related to Role ROLES.BOOKKEEPER
app.use('/api/v1/users', userRoutes);                       // Related to Entity funder and Roles: ROLES.FUNDER_MANAGER, ROLES.FUNDER_USER
app.use('/api/v1/representatives', representativeRoutes);   // Related to Entity ISO and Role ROLES.ISO_MANAGER, ROLES.ISO_SALES
app.use('/api/v1/contacts', contactRoutes);                 // Related to Entity Merchant and Role ROLES.MERCHANT

// Mount routers related to entities, notice that syndicator is both a personnel and an entity
app.use('/api/v1/syndicators', syndicatorRoutes);           // Related to Role ROLES.SYNDICATOR

app.use('/api/v1/funders', funderRoutes);                   // Related to personnel user
app.use('/api/v1/lenders', lenderRoutes);                   // Related to personnel user
app.use('/api/v1/isos', isoRoutes);                         // Related to personnel representative
app.use('/api/v1/merchants', merchantRoutes);               // Related to personnel contact


// Mount routers related to relationships between entities
app.use('/api/v1/syndicator-funders', syndicatorFunderRoutes);
app.use('/api/v1/syndicator-lenders', syndicatorLenderRoutes);
app.use('/api/v1/iso-funders', isoFunderRoutes);
app.use('/api/v1/merchant-funders', merchantFunderRoutes);
app.use('/api/v1/iso-merchants', isoMerchantRoutes);

// Mount routers related to events, which means event happens among entities
app.use('/api/v1/applications', applicationRoutes);                 // Event happens among merchant, ISO and funder (includes stipulations)
app.use('/api/v1/application-offers', applicationOfferRoutes);      // Event happens among merchant, ISO and funder
app.use('/api/v1/fundings', fundingRoutes);                         // Event happens among merchant, ISO, funder
app.use('/api/v1/funding-fees', fundingFeeRoutes);                   // Event happens among merchant, ISO, funder, syndicator, bookkeeper
app.use('/api/v1/funding-credits', fundingCreditRoutes);             // Event happens among merchant, ISO, funder, syndicator, bookkeeper
app.use('/api/v1/funding-expenses', fundingExpenseRoutes);           // Event happens among merchant, ISO, funder, syndicator, bookkeeper
app.use('/api/v1/syndication-offers', syndicationOfferRoutes);      // Event happens among funder and syndicator
app.use('/api/v1/syndications', syndicationRoutes);                 // Event happens among funder and syndicator



// Mount routers related to entities' properties
// Related to Entity funder
app.use('/api/v1/funder-accounts', funderAccountRoutes);
app.use('/api/v1/funder-settings', funderSettingRoutes);
app.use('/api/v1/lender-accounts', lenderAccountRoutes);
app.use('/api/v1/formulas', formulaRoutes);
app.use('/api/v1/fee-types', feeTypeRoutes);
app.use('/api/v1/expense-types', expenseTypeRoutes);
app.use('/api/v1/stipulation-types', stipulationTypeRoutes);
app.use('/api/v1/application-statuses', applicationStatusRoutes);
app.use('/api/v1/funding-statuses', fundingStatusRoutes);

// Related to Entity ISO
app.use('/api/v1/iso-accounts', isoAccountRoutes);

// Related to Entity Merchant
app.use('/api/v1/merchant-accounts', merchantAccountRoutes);

// Related to Entity Syndicator
app.use('/api/v1/syndicator-accounts', syndicatorAccountRoutes);

// Mount routers related to events' properties
app.use('/api/v1/paybacks', paybackRoutes);
app.use('/api/v1/payback-plans', paybackPlanRoutes);                // Related to event funding
app.use('/api/v1/payouts', payoutRoutes);

app.use('/api/v1/participations', participationRoutes);
app.use('/api/v1/syndication-offers', syndicationOfferRoutes);
app.use('/api/v1/syndications', syndicationRoutes);
app.use('/api/v1/syndicator-transactions', syndicatorTransactionRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/transaction-breakdowns', transactionBreakdownRoutes);

app.use('/api/v1/stipulation-types', stipulationTypeRoutes);

app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/rabbitsign', rabbitsignRoutes);

app.use('/api/v1/commission-intents', commissionIntentRoutes);

app.use('/api/v1/disbursement-intents', disbursementIntentRoutes);

// Mount routers related to data import
app.use('/api/v1/import', importRoutes);
app.use('/api/v1/sync', syncRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/upload', uploadRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Not found route
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Check if the error is an instance of ErrorResponse
    if (err.toJSON) {
        return res.status(err.statusCode || 500).json(err.toJSON());
    }

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server Error',
        statusCode: err.statusCode || 500,
        data: null,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

const PORT = process.env.PORT || 5000;

// WebSocket
const server = http.createServer(app);

// const io = new Server(server, {
//     cors: {
//         origin: [process.env.FRONTEND_URL, '*'],
//         methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//     },
// });

// socketHandler(io);

const wss = new WebSocket.Server({ server });

// Import and register WebSocket routes
require('./routes/websocket');

wss.on('connection', (ws, request) => webSocketProcessor(ws, request));

// Start server with WebSocket support
server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

module.exports = server; 