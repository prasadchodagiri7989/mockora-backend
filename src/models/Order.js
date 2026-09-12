const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  occupation: {
    type: String,
    trim: true,
    default: 'Student',
  },
  couponCode: {
    type: String,
    trim: true,
    default: '',
  },
  amount: {
    type: Number,
    required: true, // in INR
  },
  originalAmount: {
    type: Number,
    default: 999,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['created', 'paid', 'failed', 'expired'],
    default: 'created',
  },
  cashfreeOrderId: {
    type: String,
    unique: true,
    sparse: true,
  },
  paymentSessionId: {
    type: String,
    default: '',
  },
  paymentMethod: {
    type: String,
    default: '',
  },
  transactionId: {
    type: String,
    trim: true,
    default: '',
  },
  cfPaymentId: {
    type: String,
    trim: true,
    default: '',
  },
  bankReference: {
    type: String,
    trim: true,
    default: '',
  },
  paidAt: {
    type: Date,
  },
  paymentDetails: {
    type: mongoose.Schema.Types.Mixed,
  },
  userProvisioned: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  credentialsSent: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
