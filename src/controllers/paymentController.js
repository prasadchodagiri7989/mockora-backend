const crypto = require('crypto');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const cashfreeService = require('../utils/cashfreeService');
const emailService = require('../utils/emailService');

const BASE_PRICE = 999;

/**
 * Generate a random temporary password for student account
 */
const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let pass = 'Mock@';
  for (let i = 0; i < 6; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

/**
 * Helper: Provision user and dispatch welcome email once payment is confirmed
 */
const provisionUserAndSendEmail = async (order) => {
  if (order.userProvisioned && order.userId) {
    return { alreadyProvisioned: true };
  }

  const email = order.email.toLowerCase().trim();
  let user = await User.findOne({ email });
  let temporaryPassword = null;

  if (user) {
    // User already exists in database: link order and update purchased stream
    user.purchasedCategory = order.category;
    user.purchasedOrder = order._id;
    if (order.mobile && !user.phone) user.phone = order.mobile;
    await user.save();
    console.log(`[Provisioning] Existing user account updated: ${email}`);
  } else {
    // New user: auto-create account with temporary password
    temporaryPassword = generateTemporaryPassword();
    user = new User({
      name: order.name,
      email,
      password: temporaryPassword, // will be hashed by pre('save') hook
      phone: order.mobile,
      occupation: order.occupation || 'Student',
      role: 'user',
      status: 'active',
      targetExam: order.category,
      purchasedCategory: order.category,
      purchasedOrder: order._id,
      passwordTemporary: true,
    });
    await user.save();
    console.log(`[Provisioning] New user created: ${email} with temp password: ${temporaryPassword}`);
  }

  // Update order record
  order.userProvisioned = true;
  order.userId = user._id;

  // Dispatch confirmation & credentials email
  try {
    const emailResult = await emailService.sendWelcomeEmail({
      toEmail: email,
      customerName: order.name,
      temporaryPassword: temporaryPassword || '(Your existing password remains active)',
      category: order.category,
      orderId: order.cashfreeOrderId,
      amountPaid: order.amount,
    });
    order.credentialsSent = emailResult.success;
  } catch (err) {
    console.error('[Provisioning Email Error]', err);
  }

  // Increment coupon usedCount if applicable
  if (order.couponCode) {
    await Coupon.findOneAndUpdate(
      { code: order.couponCode.toUpperCase() },
      { $inc: { usedCount: 1 } }
    );
  }

  await order.save();
  return { success: true, user, temporaryPassword };
};

/**
 * 1. Validate Coupon Code
 * POST /api/payments/validate-coupon
 */
exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (!coupon || !coupon.isValid()) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Invalid, expired, or depleted coupon code',
      });
    }

    let discount = 0;
    if (coupon.discountType === 'flat') {
      discount = coupon.discountValue;
    } else if (coupon.discountType === 'percent') {
      discount = Math.round(BASE_PRICE * (coupon.discountValue / 100));
    }

    const finalAmount = Math.max(1, BASE_PRICE - discount);

    res.json({
      success: true,
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: discount,
      finalAmount,
    });
  } catch (err) {
    console.error('Coupon validation error:', err);
    res.status(500).json({ success: false, message: 'Failed to validate coupon' });
  }
};

/**
 * 2. Create Order & Cashfree Session
 * POST /api/payments/create-order
 */
exports.createOrder = async (req, res) => {
  try {
    const { name, email, mobile, category, occupation, couponCode } = req.body;

    // Server-side validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }
    const cleanPhone = (mobile || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number is required' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Examination category is required' });
    }

    // Re-validate coupon server-side (never trust client-calculated price)
    let discountAmount = 0;
    let validCouponCode = '';

    if (couponCode && couponCode.trim()) {
      const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
      if (coupon && coupon.isValid()) {
        validCouponCode = coupon.code;
        if (coupon.discountType === 'flat') {
          discountAmount = coupon.discountValue;
        } else if (coupon.discountType === 'percent') {
          discountAmount = Math.round(BASE_PRICE * (coupon.discountValue / 100));
        }
      }
    }

    const finalAmount = Math.max(1, BASE_PRICE - discountAmount);
    const orderId = `ORD_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const returnUrl = `${process.env.LANDING_BASE_URL || 'http://localhost:5175'}/payment/status?order_id=${orderId}`;

    // Create Cashfree order
    const cashfreeRes = await cashfreeService.createCashfreeOrder({
      orderId,
      orderAmount: finalAmount,
      customerName: name.trim(),
      customerEmail: email.toLowerCase().trim(),
      customerPhone: cleanPhone,
      returnUrl,
    });

    // Save Order in local MongoDB
    const newOrder = await Order.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      mobile: cleanPhone,
      category: category.trim(),
      occupation: (occupation || 'Student').trim(),
      couponCode: validCouponCode,
      amount: finalAmount,
      originalAmount: BASE_PRICE,
      discountAmount,
      status: 'created',
      cashfreeOrderId: orderId,
      paymentSessionId: cashfreeRes.paymentSessionId,
    });

    res.json({
      success: true,
      orderId,
      paymentSessionId: cashfreeRes.paymentSessionId,
      amount: finalAmount,
      simulated: cashfreeRes.simulated || false,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create payment order' });
  }
};

/**
 * 3. Cashfree Server-to-Server Webhook
 * POST /api/payments/webhook
 */
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);

    const isVerified = cashfreeService.verifyWebhookSignature(signature, timestamp, rawBody);
    if (!isVerified) {
      console.warn('[Webhook] Invalid Cashfree signature');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const eventData = req.body;
    const type = eventData.type;
    const orderData = eventData.data?.order || eventData.order || {};
    const cashfreeOrderId = orderData.order_id;

    console.log(`[Webhook Received] Type: ${type} for Order: ${cashfreeOrderId}`);

    if (type === 'PAYMENT_SUCCESS_WEBHOOK' || type === 'ORDER_PAID_WEBHOOK' || orderData.order_status === 'PAID') {
      const order = await Order.findOne({ cashfreeOrderId });
      if (order) {
        order.status = 'paid';
        order.paymentMethod = eventData.data?.payment?.payment_method || 'Online';
        await order.save();

        // Auto-provision user account & send credentials
        await provisionUserAndSendEmail(order);
      }
    } else if (type === 'PAYMENT_FAILED_WEBHOOK') {
      await Order.findOneAndUpdate({ cashfreeOrderId }, { status: 'failed' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ success: false, message: 'Webhook handling error' });
  }
};

/**
 * 4. Get Payment & Order Status (used by frontend return_url polling)
 * GET /api/payments/status/:orderId
 */
exports.getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ cashfreeOrderId: orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // If order is not yet marked paid, verify directly with Cashfree
    if (order.status !== 'paid') {
      if (req.query.simulate === 'true' && process.env.NODE_ENV !== 'production') {
        order.status = 'paid';
        await order.save();
        await provisionUserAndSendEmail(order);
      } else {
        try {
          const cashfreeStatus = await cashfreeService.getCashfreeOrderStatus(orderId);
          if (cashfreeStatus.order_status === 'PAID') {
            order.status = 'paid';
            await order.save();
            // Ensure user is provisioned
            await provisionUserAndSendEmail(order);
          } else if (cashfreeStatus.order_status === 'EXPIRED') {
            order.status = 'expired';
            await order.save();
          }
        } catch (checkErr) {
          console.warn('[Status Check Warning]', checkErr.message);
        }
      }
    }

    res.json({
      success: true,
      order: {
        orderId: order.cashfreeOrderId,
        name: order.name,
        email: order.email,
        category: order.category,
        occupation: order.occupation,
        amount: order.amount,
        status: order.status,
        userProvisioned: order.userProvisioned,
        credentialsSent: order.credentialsSent,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error('Get order status error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch order status' });
  }
};
