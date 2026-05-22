const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/WebhookController');

// STK Push (deposit) — existing
router.post('/mpesa', WebhookController.handleMpesaCallback);

// B2C (withdrawal) — 🆕 NEW — must match MpesaService ResultURL
router.post('/b2c/result', WebhookController.handleB2CCallback);

// B2C timeout — optional but recommended
router.post('/b2c/timeout', (req, res) => {
  console.error('[B2C Timeout] Request timed out:', req.body);
  res.status(200).send('Timeout received');
});

module.exports = router;