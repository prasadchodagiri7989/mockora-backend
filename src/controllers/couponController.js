const Coupon = require('../models/Coupon');

/**
 * Get all coupons (Admin)
 * GET /api/coupons
 */
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      coupons,
    });
  } catch (err) {
    console.error('Error fetching coupons:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
};

/**
 * Create a new coupon (Admin)
 * POST /api/coupons
 */
exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType = 'flat', discountValue, expiryDate, usageLimit = 500, active = true } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const cleanCode = code.trim().toUpperCase();

    if (discountValue === undefined || discountValue === null || Number(discountValue) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid discount amount or percentage is required' });
    }

    if (!['flat', 'percent'].includes(discountType)) {
      return res.status(400).json({ success: false, message: 'Discount type must be flat or percent' });
    }

    if (discountType === 'percent' && (Number(discountValue) < 1 || Number(discountValue) > 100)) {
      return res.status(400).json({ success: false, message: 'Percentage discount must be between 1 and 100' });
    }

    // Check duplicate
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon code '${cleanCode}' already exists` });
    }

    const newCoupon = new Coupon({
      code: cleanCode,
      discountType,
      discountValue: Number(discountValue),
      expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      usageLimit: Number(usageLimit) || 500,
      active: active !== false,
    });

    await newCoupon.save();

    res.status(201).json({
      success: true,
      message: `Coupon '${cleanCode}' created successfully!`,
      coupon: newCoupon,
    });
  } catch (err) {
    console.error('Error creating coupon:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create coupon' });
  }
};

/**
 * Update an existing coupon (Admin)
 * PUT /api/coupons/:id
 */
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, expiryDate, usageLimit, active } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (code && code.trim()) {
      const cleanCode = code.trim().toUpperCase();
      if (cleanCode !== coupon.code) {
        const existing = await Coupon.findOne({ code: cleanCode });
        if (existing) {
          return res.status(400).json({ success: false, message: `Coupon code '${cleanCode}' is already taken` });
        }
        coupon.code = cleanCode;
      }
    }

    if (discountType && ['flat', 'percent'].includes(discountType)) {
      coupon.discountType = discountType;
    }

    if (discountValue !== undefined && Number(discountValue) > 0) {
      coupon.discountValue = Number(discountValue);
    }

    if (expiryDate) {
      coupon.expiryDate = new Date(expiryDate);
    }

    if (usageLimit !== undefined) {
      coupon.usageLimit = Number(usageLimit);
    }

    if (active !== undefined) {
      coupon.active = Boolean(active);
    }

    await coupon.save();

    res.json({
      success: true,
      message: `Coupon '${coupon.code}' updated successfully!`,
      coupon,
    });
  } catch (err) {
    console.error('Error updating coupon:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to update coupon' });
  }
};

/**
 * Toggle active status of a coupon (Admin)
 * PATCH /api/coupons/:id/toggle
 */
exports.toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    coupon.active = !coupon.active;
    await coupon.save();

    res.json({
      success: true,
      message: `Coupon '${coupon.code}' is now ${coupon.active ? 'active' : 'inactive'}`,
      coupon,
    });
  } catch (err) {
    console.error('Error toggling coupon status:', err);
    res.status(500).json({ success: false, message: 'Failed to update coupon status' });
  }
};

/**
 * Delete a coupon (Admin)
 * DELETE /api/coupons/:id
 */
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.json({
      success: true,
      message: `Coupon '${coupon.code}' deleted successfully`,
    });
  } catch (err) {
    console.error('Error deleting coupon:', err);
    res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
};
