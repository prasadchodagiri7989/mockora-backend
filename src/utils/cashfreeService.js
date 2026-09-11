const axios = require('axios');
const crypto = require('crypto');

const getBaseUrl = () => {
  const env = (process.env.CASHFREE_ENV || 'SANDBOX').toUpperCase();
  return env === 'PRODUCTION'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
};

const getHeaders = () => ({
  'x-client-id': process.env.CASHFREE_APP_ID || '',
  'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
  'x-api-version': process.env.CASHFREE_API_VERSION || '2023-08-01',
  'Content-Type': 'application/json',
});

/**
 * Creates an order in Cashfree Payment Gateway
 */
const createCashfreeOrder = async ({
  orderId,
  orderAmount,
  customerName,
  customerEmail,
  customerPhone,
  returnUrl,
}) => {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  // Sanitize phone (ensure 10 digits without +91)
  const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
  const cleanCustomerId = `cust_${customerEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}_${Date.now()}`;

  // If credentials are not yet supplied by user, provide transparent development sandbox mock session
  if (!appId || !secretKey) {
    console.warn('[CashfreeService] CASHFREE_APP_ID or CASHFREE_SECRET_KEY not set in .env. Providing sandbox simulated session.');
    return {
      success: true,
      simulated: true,
      paymentSessionId: `session_sandbox_demo_${orderId}`,
      orderId,
    };
  }

  const payload = {
    order_id: orderId,
    order_amount: Number(orderAmount),
    order_currency: 'INR',
    customer_details: {
      customer_id: cleanCustomerId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: cleanPhone,
    },
    order_meta: {
      return_url: returnUrl,
    },
  };

  try {
    const res = await axios.post(`${getBaseUrl()}/orders`, payload, {
      headers: getHeaders(),
    });

    return {
      success: true,
      simulated: false,
      paymentSessionId: res.data.payment_session_id,
      orderId: res.data.order_id,
      data: res.data,
    };
  } catch (err) {
    console.error('[Cashfree Error]', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Cashfree Order creation failed');
  }
};

/**
 * Fetch Order Status from Cashfree
 */
const getCashfreeOrderStatus = async (orderId) => {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    // In simulated sandbox without credentials, return PAID so testing flow completes
    return {
      order_id: orderId,
      order_status: 'PAID',
      simulated: true,
    };
  }

  try {
    const res = await axios.get(`${getBaseUrl()}/orders/${orderId}`, {
      headers: getHeaders(),
    });
    return res.data;
  } catch (err) {
    console.error('[Cashfree Fetch Status Error]', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Failed to fetch Cashfree order status');
  }
};

/**
 * Verify Webhook Signature (HMAC SHA-256)
 */
const verifyWebhookSignature = (signature, timestamp, rawBody) => {
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!secretKey) return true; // dev fallback

  if (!signature || !timestamp || !rawBody) return false;

  const data = timestamp + rawBody;
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(data)
    .digest('base64');

  return signature === expectedSignature;
};

module.exports = {
  createCashfreeOrder,
  getCashfreeOrderStatus,
  verifyWebhookSignature,
};
