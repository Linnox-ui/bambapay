const express = require('express');
const router = express.Router();
const WalletController = require('../controllers/WalletController');
// Import your auth middleware if you have it to protect the route
const { protect } = require('../middleware/auth'); 

// Add this exact line:
router.post('/withdraw', protect, WalletController.initiateWithdrawal); 
// Note: If you don't use 'protect' middleware, just remove it from the line above.

module.exports = router;