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
  if (order.userProvisioned && order.userId && order.credentialsSent && order.temporaryPassword) {
    return { alreadyProvisioned: true };
  }

  const email = order.email.toLowerCase().trim();
  let user = await User.findOne({ email });
  let temporaryPassword = order.temporaryPassword || null;

  if (user) {
    // User already exists in database: link order and update purchased stream
    user.purchasedCategory = order.category;
    user.purchasedOrder = order._id;
    if (order.mobile && !user.phone) user.phone = order.mobile;
    if (!temporaryPassword) {
      temporaryPassword = generateTemporaryPassword();
      user.password = temporaryPassword; // pre-save hook will hash it
      user.passwordTemporary = true;
    }
    await user.save();
    console.log(`[Provisioning] Existing user account updated: ${email} with temp password: ${temporaryPassword}`);
  } else {
    // New user: auto-create account with temporary password
    if (!temporaryPassword) {
      temporaryPassword = generateTemporaryPassword();
    }
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
  order.temporaryPassword = temporaryPassword;

  // Dispatch confirmation & credentials email
  try {
    const emailResult = await emailService.sendWelcomeEmail({
      toEmail: email,
      customerName: order.name,
      temporaryPassword,
      category: order.category,
      orderId: order.cashfreeOrderId,
      transactionId: order.transactionId || order.cfPaymentId || order.cashfreeOrderId,
      amountPaid: order.amount,
      paymentDate: order.paidAt ? new Date(order.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : undefined,
    });
    order.credentialsSent = emailResult.success;
    console.log(`[Provisioning] Email sent status for ${email}: ${emailResult.success}`);
  } catch (err) {
    console.error('[Provisioning Email Error]', err);
    order.credentialsSent = false;
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

    let landingBase = process.env.LANDING_BASE_URL || 'http://localhost:5175';
    // Cashfree Production mode strictly enforces https:// in order_meta.return_url
    if ((process.env.CASHFREE_ENV || '').toUpperCase() === 'PRODUCTION' && !landingBase.startsWith('https://')) {
      landingBase = 'https://mockora.neuvexa.in';
    }
    const returnUrl = `${landingBase.replace(/\/$/, '')}/payment/status?order_id=${orderId}`;

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
      environment: (process.env.CASHFREE_ENV || 'SANDBOX').toLowerCase(),
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
        const paymentObj = eventData.data?.payment || {};
        order.status = 'paid';
        order.paymentMethod = paymentObj.payment_method?.type || paymentObj.payment_group || (typeof paymentObj.payment_method === 'string' ? paymentObj.payment_method : 'Online');
        order.cfPaymentId = paymentObj.cf_payment_id ? String(paymentObj.cf_payment_id) : '';
        order.transactionId = order.cfPaymentId || paymentObj.payment_id || `TXN_${Date.now()}`;
        order.bankReference = paymentObj.bank_reference || '';
        order.paidAt = paymentObj.payment_time ? new Date(paymentObj.payment_time) : new Date();
        order.paymentDetails = eventData.data || eventData;
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
      const hasCashfreeKeys = Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);

      // Simulation ONLY allowed if explicitly requested AND real Cashfree credentials are NOT configured
      if (!hasCashfreeKeys && req.query.simulate === 'true' && process.env.NODE_ENV !== 'production') {
        order.status = 'paid';
        order.paidAt = new Date();
        order.paymentMethod = 'Simulated UPI';
        order.transactionId = `SIM_TXN_${Date.now()}`;
        order.cfPaymentId = `CF_SIM_${Date.now()}`;
        order.bankReference = `REF_${Date.now().toString().slice(-6)}`;
        await order.save();
        await provisionUserAndSendEmail(order);
      } else if (hasCashfreeKeys) {
        try {
          const cashfreeStatus = await cashfreeService.getCashfreeOrderStatus(orderId);
          console.log(`[Order Status Check] Cashfree order_status for ${orderId}:`, cashfreeStatus.order_status);

          if (cashfreeStatus.order_status === 'PAID') {
            order.status = 'paid';
            order.paidAt = order.paidAt || new Date();
            if (!order.transactionId) {
              order.transactionId = cashfreeStatus.cf_order_id ? `CF_${cashfreeStatus.cf_order_id}` : `TXN_${Date.now()}`;
            }
            order.paymentDetails = cashfreeStatus;
            await order.save();
            // Ensure user is provisioned
            await provisionUserAndSendEmail(order);
          } else if (cashfreeStatus.order_status === 'EXPIRED') {
            order.status = 'expired';
            await order.save();
          } else if (cashfreeStatus.order_status === 'TERMINATED' || cashfreeStatus.order_status === 'CANCELLED') {
            order.status = 'failed';
            await order.save();
          } else {
            // Order is still ACTIVE; check if any payment attempt failed or was dropped
            try {
              const payments = await cashfreeService.getCashfreeOrderPayments(orderId);
              if (payments && payments.length > 0) {
                const latestPayment = payments[0];
                console.log(`[Order Status Check] Latest payment for ${orderId}: ${latestPayment.payment_status} - ${latestPayment.payment_message || ''}`);
                if (latestPayment.payment_status === 'SUCCESS') {
                  order.status = 'paid';
                  order.paidAt = latestPayment.payment_time ? new Date(latestPayment.payment_time) : new Date();
                  order.transactionId = String(latestPayment.cf_payment_id || latestPayment.payment_id || `TXN_${Date.now()}`);
                  order.paymentMethod = latestPayment.payment_method?.type || 'Online';
                  order.paymentDetails = latestPayment;
                  await order.save();
                  await provisionUserAndSendEmail(order);
                } else if (latestPayment.payment_status === 'FAILED' || latestPayment.payment_status === 'CANCELLED' || latestPayment.payment_status === 'USER_DROPPED') {
                  order.status = 'failed';
                  order.paymentDetails = latestPayment;
                  await order.save();
                }
              }
            } catch (pErr) {
              console.warn('[Payments Check Warning]', pErr.message);
            }
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
        transactionId: order.transactionId || order.cfPaymentId || order.cashfreeOrderId,
        name: order.name,
        email: order.email,
        mobile: order.mobile,
        category: order.category,
        occupation: order.occupation,
        amount: order.amount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt,
        userProvisioned: order.userProvisioned,
        credentialsSent: order.credentialsSent,
        temporaryPassword: order.temporaryPassword || '',
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error('Get order status error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch order status' });
  }
};

/**
 * 5. Admin: Get all transactions & order payments with summary stats
 * GET /api/payments/transactions
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search && search.trim()) {
      const s = search.trim();
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { mobile: { $regex: s, $options: 'i' } },
        { cashfreeOrderId: { $regex: s, $options: 'i' } },
        { transactionId: { $regex: s, $options: 'i' } },
        { couponCode: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, totalCount, allPaidOrders, statusStats] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
      Order.find({ status: 'paid' }, 'amount'),
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            revenue: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const totalRevenue = allPaidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const paidCount = allPaidOrders.length;

    const statsMap = {
      paid: { count: 0, revenue: 0 },
      created: { count: 0, revenue: 0 },
      failed: { count: 0, revenue: 0 },
      expired: { count: 0, revenue: 0 },
    };

    statusStats.forEach(st => {
      if (statsMap[st._id]) {
        statsMap[st._id] = { count: st.count, revenue: st.revenue };
      }
    });

    res.json({
      success: true,
      orders,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCount / Number(limit)),
      },
      stats: {
        totalRevenue,
        paidCount,
        createdCount: statsMap.created.count,
        failedCount: statsMap.failed.count + statsMap.expired.count,
        averageOrderValue: paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0,
      },
    });
  } catch (err) {
    console.error('Get all transactions error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch transactions' });
  }
};

/**
 * 6. Resend Candidate Credentials Email
 * POST /api/payments/resend-credentials/:orderId
 */
exports.resendCredentialsEmail = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ cashfreeOrderId: orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Cannot dispatch credentials for an unpaid order' });
    }

    // Ensure order has user and temporaryPassword
    let passwordToSend = order.temporaryPassword;
    if (!passwordToSend) {
      passwordToSend = generateTemporaryPassword();
      order.temporaryPassword = passwordToSend;
      if (order.userId) {
        const user = await User.findById(order.userId);
        if (user) {
          user.password = passwordToSend;
          user.passwordTemporary = true;
          await user.save();
        }
      }
    }

    const emailResult = await emailService.sendWelcomeEmail({
      toEmail: order.email,
      customerName: order.name,
      temporaryPassword: passwordToSend,
      category: order.category,
      orderId: order.cashfreeOrderId,
      transactionId: order.transactionId || order.cfPaymentId || order.cashfreeOrderId,
      amountPaid: order.amount,
      paymentDate: order.paidAt ? new Date(order.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : undefined,
    });

    order.credentialsSent = emailResult.success;
    await order.save();

    if (emailResult.success) {
      return res.json({
        success: true,
        message: `Credentials successfully dispatched to ${order.email}`,
        temporaryPassword: passwordToSend,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: `Failed to dispatch email: ${emailResult.error || 'SMTP delivery issue'}`,
        temporaryPassword: passwordToSend,
      });
    }
  } catch (err) {
    console.error('Resend credentials error:', err);
    res.status(500).json({ success: false, message: 'Internal server error while dispatching email' });
  }
};

