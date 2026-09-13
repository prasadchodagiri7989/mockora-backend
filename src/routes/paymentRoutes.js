const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Validate promotional coupon code
router.post('/validate-coupon', paymentController.validateCoupon);

// Create Cashfree payment order
router.post('/create-order', paymentController.createOrder);

// Cashfree server-to-server webhook
router.post('/webhook', paymentController.handleWebhook);

// Check order status by orderId
router.get('/status/:orderId', paymentController.getOrderStatus);

// Resend credentials email for an order
router.post('/resend-credentials/:orderId', paymentController.resendCredentialsEmail);

// Admin: Get all transactions with summary stats
router.get('/transactions', verifyToken, requireAdmin, paymentController.getAllTransactions);

module.exports = router;

