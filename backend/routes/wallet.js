const express = require('express');
const router = express.Router();
const WalletController = require('../controllers/WalletController');
const { protect } = require('../middleware/auth'); // Adjust path if your auth middleware is named differently

// Explicitly route the GET request to the getBalance controller
router.get('/balance', protect, WalletController.getBalance);

// Your existing withdrawal route
router.post('/withdraw', protect, WalletController.initiateWithdrawal);

module.exports = router;