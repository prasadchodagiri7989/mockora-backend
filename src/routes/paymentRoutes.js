const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Validate promotional coupon code
router.post('/validate-coupon', paymentController.validateCoupon);

// Create Cashfree payment order
router.post('/create-order', paymentController.createOrder);

// Cashfree server-to-server webhook
router.post('/webhook', paymentController.handleWebhook);

// Check order status by orderId
router.get('/status/:orderId', paymentController.getOrderStatus);

module.exports = router;
