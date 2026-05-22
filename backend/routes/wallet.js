const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const WalletController = require('../controllers/WalletController');

// POST /api/wallet/deposit
// Protected route: requires valid JWT
router.post('/deposit', protect, WalletController.initiateDeposit);

// GET /api/wallet/balance
// Protected route: fetches the logged-in user's current balance
router.get('/balance', protect, WalletController.getBalance);

module.exports = router;