const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/WebhookController');

// POST /api/webhooks/mpesa
// CRITICAL: Must remain completely public — no auth middleware.
// Safaricom Daraja sends callbacks to this endpoint.
router.post('/mpesa', WebhookController.handleMpesaCallback);

module.exports = router;