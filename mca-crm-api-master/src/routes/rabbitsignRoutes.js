const express = require('express');
const router = express.Router();
const { webhook } = require('../controllers/rabbitsignWebhookController');

router.post('/webhook', webhook);

module.exports = router;
