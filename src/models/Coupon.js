const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['flat', 'percent'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true, // e.g. 200 for flat ₹200 off, or 20 for 20% off
  },
  expiryDate: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  },
  usageLimit: {
    type: Number,
    default: 500,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

couponSchema.methods.isValid = function () {
  if (!this.active) return false;
  if (this.expiryDate && new Date() > this.expiryDate) return false;
  if (this.usageLimit && this.usedCount >= this.usageLimit) return false;
  return true;
};

module.exports = mongoose.model('Coupon', couponSchema);
